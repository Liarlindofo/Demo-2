export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Operação longa: várias conversas × chamada OpenRouter. */
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServiceApiKey } from '@/lib/auth/service-api-key';
import { resolveStackUserIdsForTenant } from '@/lib/whatsapp-sessions';
import {
  classifyConversation,
  type ConversationMessage,
} from '@/lib/complaints/classify';
import { buildAndSaveComparison } from '@/lib/complaints/compare';
import {
  currentMonthPeriod,
  monthPeriod,
  previousMonthPeriod,
  type MonthPeriod,
} from '@/lib/complaints/period';

type RunBody = {
  /** "previous" (default, n8n dia 1) | "current" (teste do mês incompleto) */
  period?: string;
  /** Alternativa explícita: ano civil (ex: 2026) */
  year?: number;
  /** Alternativa explícita: mês 1–12 */
  month?: number;
};

function resolvePeriod(body: RunBody): MonthPeriod {
  if (
    typeof body.year === 'number' &&
    typeof body.month === 'number' &&
    Number.isFinite(body.year) &&
    Number.isFinite(body.month)
  ) {
    return monthPeriod(Math.trunc(body.year), Math.trunc(body.month));
  }

  const period = (body.period || 'previous').toLowerCase();
  if (period === 'current') return currentMonthPeriod();
  if (period === 'previous') return previousMonthPeriod();
  throw new Error('period deve ser "previous" ou "current" (ou informe year+month).');
}

async function finishWithComparison(params: {
  userId: string;
  runId: string;
  period: MonthPeriod;
  totalConversas: number;
  totalReclamacoes: number;
  mensagem?: string;
}) {
  const updated = await prisma.complaintReviewRun.update({
    where: { id: params.runId },
    data: {
      status: 'CONCLUIDO',
      totalConversas: params.totalConversas,
      totalReclamacoes: params.totalReclamacoes,
    },
  });

  const comparison = await buildAndSaveComparison({
    userId: params.userId,
    reviewRunId: updated.id,
    period: params.period,
  });

  return NextResponse.json({
    reviewRunId: updated.id,
    status: updated.status,
    periodStart: updated.periodStart,
    periodEnd: updated.periodEnd,
    totalConversas: updated.totalConversas,
    totalReclamacoes: updated.totalReclamacoes,
    comparison: {
      previousRunId: comparison.previousRunId,
      recorrentes: comparison.recorrentes,
      novos: comparison.novos,
      resolvidos: comparison.resolvidos,
      resumoTexto: comparison.resumoTexto,
    },
    ...(params.mensagem ? { mensagem: params.mensagem } : {}),
  });
}

/**
 * POST /api/reports/complaints/run
 *
 * Classifica conversas WhatsApp do período (padrão: mês anterior completo)
 * usando IA. Só sessões com monitorarReclamacoes=true.
 * Ao concluir, gera ComplaintComparison vs. mês imediatamente anterior.
 *
 * Auth: header x-api-key (ServiceApiKey)
 *
 * Body opcional:
 *   { "period": "previous" | "current" }
 *   { "year": 2026, "month": 8 }
 */
export async function POST(req: NextRequest) {
  const auth = await requireServiceApiKey(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  let body: RunBody = {};
  try {
    const text = await req.text();
    if (text.trim()) body = JSON.parse(text) as RunBody;
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 });
  }

  let period: MonthPeriod;
  try {
    period = resolvePeriod(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Período inválido.' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, palavrasChaveReclamacao: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
  }

  const stackIds = await resolveStackUserIdsForTenant(userId);
  const monitoredBots =
    stackIds.length > 0
      ? await prisma.whatsAppBot.findMany({
          where: { userId: { in: stackIds }, monitorarReclamacoes: true },
          select: { slot: true },
        })
      : [];
  const monitoredSlots = [...new Set(monitoredBots.map((b) => b.slot))];

  const run = await prisma.complaintReviewRun.create({
    data: {
      userId,
      periodStart: period.start,
      periodEnd: period.end,
      status: 'PROCESSANDO',
    },
  });

  if (monitoredSlots.length === 0) {
    return finishWithComparison({
      userId,
      runId: run.id,
      period,
      totalConversas: 0,
      totalReclamacoes: 0,
      mensagem: 'Nenhuma sessão com monitorarReclamacoes=true.',
    });
  }

  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      userId,
      sessionSlot: { in: monitoredSlots },
      timestamp: { gte: period.start, lte: period.end },
    },
    select: {
      id: true,
      contactId: true,
      contactName: true,
      direction: true,
      messageType: true,
      textContent: true,
      sentByAgent: true,
      timestamp: true,
    },
    orderBy: { timestamp: 'asc' },
  });

  /** Agrupa por contactId (uma conversa = um contato). */
  const byContact = new Map<
    string,
    { contactName: string | null; messages: ConversationMessage[] }
  >();

  for (const msg of messages) {
    const existing = byContact.get(msg.contactId);
    const entry: ConversationMessage = {
      id: msg.id,
      direction: msg.direction,
      messageType: msg.messageType,
      textContent: msg.textContent,
      sentByAgent: msg.sentByAgent,
      timestamp: msg.timestamp,
    };
    if (existing) {
      existing.messages.push(entry);
      if (!existing.contactName && msg.contactName) {
        existing.contactName = msg.contactName;
      }
    } else {
      byContact.set(msg.contactId, {
        contactName: msg.contactName,
        messages: [entry],
      });
    }
  }

  const palavrasChave = user.palavrasChaveReclamacao ?? [];
  let totalReclamacoes = 0;
  const totalConversas = byContact.size;

  try {
    for (const [contactId, conv] of byContact) {
      // Pula conversas sem mensagem do cliente
      if (!conv.messages.some((m) => m.direction === 'IN')) continue;

      const result = await classifyConversation({
        messages: conv.messages,
        palavrasChave,
      });

      if (!result.eReclamacao || !result.resumo || !result.dataOcorrencia) {
        continue;
      }

      await prisma.complaint.create({
        data: {
          reviewRunId: run.id,
          userId,
          contactId,
          contactName: conv.contactName,
          resumo: result.resumo,
          dataOcorrencia: result.dataOcorrencia,
          evidenciaMessageIds: result.evidenciaMessageIds,
        },
      });
      totalReclamacoes += 1;
    }

    return finishWithComparison({
      userId,
      runId: run.id,
      period,
      totalConversas,
      totalReclamacoes,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[complaints/run] Falha no meio do processamento:', message);

    const updated = await prisma.complaintReviewRun.update({
      where: { id: run.id },
      data: {
        status: 'ERRO',
        totalConversas,
        totalReclamacoes,
        erro: message.slice(0, 2000),
      },
    });

    return NextResponse.json(
      {
        reviewRunId: updated.id,
        status: updated.status,
        periodStart: updated.periodStart,
        periodEnd: updated.periodEnd,
        totalConversas: updated.totalConversas,
        totalReclamacoes: updated.totalReclamacoes,
        erro: updated.erro,
      },
      { status: 500 },
    );
  }
}
