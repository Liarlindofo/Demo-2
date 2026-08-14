export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { callWhatsAppVpsSession } from '@/lib/whatsapp-vps';

function parseSlot(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

/**
 * GET /api/whatsapp-sessions/slot/:slot/groups
 * Lista grupos em que ESTE número (sessão do slot) já participa.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slot: string }> },
) {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) {
    return NextResponse.json({ success: false, message: 'Não autenticado', groups: [] }, { status: 401 });
  }

  const { slot: raw } = await ctx.params;
  const slot = parseSlot(raw);
  if (!slot) {
    return NextResponse.json({ success: false, message: 'Slot inválido', groups: [] }, { status: 400 });
  }

  const result = await callWhatsAppVpsSession(stackUser.id, slot, 'groups', {
    timeoutMs: 90_000,
  });

  return NextResponse.json(
    {
      success: result.ok || result.data.success === true,
      slot,
      ...result.data,
      groups: Array.isArray(result.data.groups) ? result.data.groups : [],
      note:
        (result.data.note as string) ||
        'Só aparecem grupos em que este número já participa.',
    },
    { status: result.ok ? 200 : result.status || 502 },
  );
}
