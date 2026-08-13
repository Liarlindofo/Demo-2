export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { parseKind, proxySessionAction, requireSessionUser } from '../../_lib';

/** GET /api/whatsapp-sessions/[kind]/qr */
export async function GET(
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

  return proxySessionAction(kind, 'qr', auth.userId);
}
