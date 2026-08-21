export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { processSettledIfoodClusters } from '@/lib/complaints/process-ifood-cron';
import { processCooledClientConversations } from '@/lib/complaints/process-client-cron';

/**
 * GET /api/cron/complaints-ifood
 * Pipeline contínuo: clusters iFood assentados + conversas cliente esfriadas.
 * Anexa ao ComplaintReviewRun EM_ANDAMENTO do mês.
 * Vercel Cron: a cada 5 minutos.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ifood = await processSettledIfoodClusters();
    const client = await processCooledClientConversations();
    return NextResponse.json({ ok: true, ifood, client });
  } catch (err) {
    console.error('[cron/complaints-ifood]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Falha no cron contínuo' },
      { status: 500 },
    );
  }
}
