export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { parseKind, proxySessionAction, requireSessionUser } from '../../_lib';

/**
 * POST /api/whatsapp-sessions/[kind]/start
 * kind = atendimento | relatorios
 * Query: ?force=1 para resetar e gerar QR fresco
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ kind: string }> },
) {
  const auth = await requireSessionUser();
  if ('error' in auth) return auth.error;

  const { kind: raw } = await ctx.params;
  const kind = parseKind(raw);
  if (!kind) {
    return NextResponse.json(
      { success: false, message: 'kind inválido (use atendimento ou relatorios)' },
      { status: 400 },
    );
  }

  const force = req.nextUrl.searchParams.get('force');
  const search = force === '1' || force === 'true' ? 'force=1' : undefined;

  return proxySessionAction(kind, 'start', auth.userId, search);
}
