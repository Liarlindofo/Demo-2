export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 180;

import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  enqueueComplaintsTick,
  processComplaintsBatch,
} from '@/lib/complaints/process-run';

/**
 * POST /api/reports/complaints/run/tick
 *
 * Processa um batch de conversas de um run PROCESSANDO e encadeia o próximo.
 * Auth: { runId, jobToken } do próprio run.
 */
export async function POST(req: NextRequest) {
  let body: { runId?: string; jobToken?: string } = {};
  try {
    const text = await req.text();
    if (text.trim()) body = JSON.parse(text) as { runId?: string; jobToken?: string };
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 });
  }

  const runId = body.runId?.trim() || '';
  const jobToken = body.jobToken?.trim() || '';
  if (!runId || !jobToken) {
    return NextResponse.json({ error: 'Informe runId e jobToken.' }, { status: 400 });
  }

  const run = await prisma.complaintReviewRun.findFirst({
    where: { id: runId, jobToken },
    select: { id: true, status: true, jobToken: true },
  });
  if (!run) {
    return NextResponse.json({ error: 'Run não encontrado.' }, { status: 404 });
  }

  try {
    const result = await processComplaintsBatch(run.id);

    if (!result.done && !result.skipped && result.remaining > 0 && run.jobToken) {
      const token = run.jobToken;
      const origin = req.nextUrl.origin;
      after(() =>
        enqueueComplaintsTick({ runId: run.id, jobToken: token, origin }).catch((err) => {
          console.error('[complaints/tick] falha ao encadear próximo batch:', err);
        }),
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[complaints/tick] batch falhou:', message);
    return NextResponse.json({ error: message, status: 'ERRO' }, { status: 500 });
  }
}
