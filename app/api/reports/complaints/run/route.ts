export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { requireServiceApiKey } from '@/lib/auth/service-api-key';
import { prisma } from '@/lib/prisma';
import {
  currentMonthPeriod,
  monthPeriod,
  previousMonthPeriod,
  type MonthPeriod,
} from '@/lib/complaints/period';
import { closeComplaintPeriod } from '@/lib/complaints/close-period';

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
 * Fechamento leve do mês: processa resíduos pendentes (iFood + cliente),
 * gera comparação com o mês anterior e marca EM_ANDAMENTO → CONCLUIDO.
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

  try {
    const result = await closeComplaintPeriod({ userId, period });
    return NextResponse.json({
      reviewRunId: result.reviewRunId,
      status: result.status,
      periodStart: period.start,
      periodEnd: period.end,
      totalReclamacoes: result.totalReclamacoes,
      ifood: result.ifood,
      client: result.client,
      comparison: result.comparison,
      mensagem: result.mensagem,
    });
  } catch (err) {
    console.error('[complaints/run] fechamento falhou:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Falha no fechamento.' },
      { status: 500 },
    );
  }
}
