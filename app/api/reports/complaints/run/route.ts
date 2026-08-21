export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServiceApiKey } from '@/lib/auth/service-api-key';
import {
  currentMonthPeriod,
  monthPeriod,
  previousMonthPeriod,
  type MonthPeriod,
} from '@/lib/complaints/period';
import {
  enqueueComplaintsTick,
  listPeriodContacts,
  newComplaintsJobToken,
} from '@/lib/complaints/process-run';
import { buildAndSaveComparison } from '@/lib/complaints/compare';

type RunBody = {
  /** "previous" (default, n8n dia 1) | "current" (teste do mês incompleto) */
  period?: string;
  year?: number;
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

/**
 * POST /api/reports/complaints/run
 *
 * Cria o ComplaintReviewRun e retorna na hora (status PROCESSANDO).
 * A classificação roda em batches via /run/tick.
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
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Tenant não encontrado.' }, { status: 404 });
  }

  const contacts = await listPeriodContacts({
    userId,
    periodStart: period.start,
    periodEnd: period.end,
  });

  const needsWork = contacts.withIn.length > 0;
  const jobToken = newComplaintsJobToken();

  const existingOpen = await prisma.complaintReviewRun.findFirst({
    where: {
      userId,
      periodStart: period.start,
      status: { in: ['EM_ANDAMENTO', 'PROCESSANDO'] },
    },
    orderBy: { executadoEm: 'desc' },
  });

  if (existingOpen) {
    const pendingMerged = [
      ...new Set([
        ...existingOpen.pendingContactIds,
        ...contacts.withIn.filter((id) => !existingOpen.processedContactIds.includes(id)),
      ]),
    ].filter((id) => !existingOpen.processedContactIds.includes(id));

    const processedMerged = [
      ...new Set([
        ...existingOpen.processedContactIds,
        ...(needsWork ? contacts.outOnly : contacts.all),
      ]),
    ];

    if (!needsWork && pendingMerged.length === 0) {
      const counted = await prisma.complaint.count({
        where: { reviewRunId: existingOpen.id, userId },
      });
      await prisma.complaintReviewRun.update({
        where: { id: existingOpen.id },
        data: {
          status: 'CONCLUIDO',
          totalConversas: Math.max(existingOpen.totalConversas ?? 0, contacts.all.length),
          conversasProcessadas: processedMerged.length,
          totalReclamacoes: counted,
          pendingContactIds: [],
          processedContactIds: processedMerged,
          jobToken: null,
          batchLockAt: null,
        },
      });
      const comparison = await buildAndSaveComparison({
        userId,
        reviewRunId: existingOpen.id,
        period,
      });
      return NextResponse.json({
        reviewRunId: existingOpen.id,
        status: 'CONCLUIDO',
        periodStart: existingOpen.periodStart,
        periodEnd: existingOpen.periodEnd,
        totalConversas: contacts.all.length,
        conversasProcessadas: processedMerged.length,
        totalReclamacoes: counted,
        mensagem: 'Run do mês já existia (iFood contínuo); nada pendente — concluído.',
        comparison: {
          previousRunId: comparison.previousRunId,
          resumoTexto: comparison.resumoTexto,
        },
      });
    }

    const run = await prisma.complaintReviewRun.update({
      where: { id: existingOpen.id },
      data: {
        status: 'PROCESSANDO',
        totalConversas: Math.max(existingOpen.totalConversas ?? 0, contacts.all.length),
        pendingContactIds: pendingMerged,
        processedContactIds: processedMerged,
        conversasProcessadas: processedMerged.length,
        jobToken,
        batchLockAt: null,
        erro: null,
      },
    });

    after(() =>
      enqueueComplaintsTick({
        runId: run.id,
        jobToken,
        origin: req.nextUrl.origin,
      }).catch((err) => {
        console.error('[complaints/run] falha ao disparar tick (reuse):', err);
      }),
    );

    return NextResponse.json({
      reviewRunId: run.id,
      status: 'PROCESSANDO',
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      totalConversas: run.totalConversas,
      conversasProcessadas: run.conversasProcessadas,
      totalReclamacoes: run.totalReclamacoes ?? 0,
      mensagem: `Reaproveitando run EM_ANDAMENTO do mês (${pendingMerged.length} conversas para classificar).`,
    });
  }

  const run = await prisma.complaintReviewRun.create({
    data: {
      userId,
      periodStart: period.start,
      periodEnd: period.end,
      status: needsWork ? 'PROCESSANDO' : 'CONCLUIDO',
      totalConversas: contacts.all.length,
      conversasProcessadas: needsWork ? contacts.outOnly.length : contacts.all.length,
      totalReclamacoes: 0,
      pendingContactIds: contacts.withIn,
      processedContactIds: needsWork ? contacts.outOnly : contacts.all,
      jobToken: needsWork ? jobToken : null,
    },
  });

  if (!needsWork) {
    const comparison = await buildAndSaveComparison({
      userId,
      reviewRunId: run.id,
      period,
    });
    return NextResponse.json({
      reviewRunId: run.id,
      status: 'CONCLUIDO',
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      totalConversas: contacts.all.length,
      conversasProcessadas: contacts.all.length,
      totalReclamacoes: 0,
      mensagem:
        contacts.all.length === 0
          ? 'Nenhuma conversa no período (ou nenhuma sessão monitorada).'
          : 'Nenhuma conversa com mensagem do cliente no período.',
      comparison: {
        previousRunId: comparison.previousRunId,
        resumoTexto: comparison.resumoTexto,
      },
    });
  }

  after(() =>
    enqueueComplaintsTick({
      runId: run.id,
      jobToken,
      origin: req.nextUrl.origin,
    }).catch((err) => {
      console.error('[complaints/run] falha ao disparar primeiro tick:', err);
    }),
  );

  return NextResponse.json({
    reviewRunId: run.id,
    status: 'PROCESSANDO',
    periodStart: run.periodStart,
    periodEnd: run.periodEnd,
    totalConversas: contacts.all.length,
    conversasProcessadas: contacts.outOnly.length,
    totalReclamacoes: 0,
    mensagem: `Processamento iniciado em background (${contacts.withIn.length} conversas para classificar).`,
  });
}
