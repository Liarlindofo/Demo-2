export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { tickStaleComplaintRuns } from '@/lib/complaints/process-run';

/**
 * GET /api/cron/complaints-tick
 * Retoma runs PROCESSANDO travados (cadeia de batches interrompida).
 * Chamado pelo Vercel Cron a cada 5 minutos.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await tickStaleComplaintRuns();
  return NextResponse.json({ ok: true, ...result });
}
