export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { parseKind, proxySessionAction, requireSessionUser } from '../../_lib';

/** POST /api/whatsapp-sessions/[kind]/stop */
export async function POST(
  _req: Request,
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

  const search = kind === 'atendimento' ? 'forget=1' : undefined;
  return proxySessionAction(kind, 'stop', auth.userId, search);
}
