export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { requireServiceApiKey } from '@/lib/auth/service-api-key';
import { tickStaleComplaintRuns } from '@/lib/complaints/process-run';

/**
 * POST /api/reports/complaints/resume
 *
 * Retoma ComplaintReviewRun PROCESSANDO travados ou com batches pendentes
 * do tenant da API key. Alternativa manual/n8n; o mecanismo principal é
 * GET /api/cron/complaints-tick (Vercel Cron a cada 5 min).
 *
 * Auth: header x-api-key (ServiceApiKey) — mesmo padrão de GET /api/reports/due
 */
export async function POST(req: NextRequest) {
  const auth = await requireServiceApiKey(req);
  if (auth instanceof NextResponse) return auth;

  const result = await tickStaleComplaintRuns(auth.userId);
  return NextResponse.json({ ok: true, ...result });
}
