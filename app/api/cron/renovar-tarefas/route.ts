export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { renovarSeriesTarefas } from '@/lib/tarefas-renovar-series';

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

/** GET /api/cron/renovar-tarefas — estende séries abertas (horizonte de 90 dias). */
export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const result = await renovarSeriesTarefas();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[cron/renovar-tarefas]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao renovar séries' },
      { status: 500 },
    );
  }
}
