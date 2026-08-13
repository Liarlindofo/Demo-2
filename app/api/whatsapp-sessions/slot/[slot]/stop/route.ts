export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { callWhatsAppVpsSession } from '@/lib/whatsapp-vps';

function parseSlot(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ slot: string }> },
) {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) {
    return NextResponse.json({ success: false, message: 'Não autenticado' }, { status: 401 });
  }

  const { slot: raw } = await ctx.params;
  const slot = parseSlot(raw);
  if (!slot) return NextResponse.json({ success: false, message: 'Slot inválido' }, { status: 400 });

  const result = await callWhatsAppVpsSession(stackUser.id, slot, 'stop');
  return NextResponse.json(
    {
      success: result.ok || result.data.success === true,
      slot,
      message: result.data.message,
      ...result.data,
    },
    { status: result.ok ? 200 : result.status >= 400 ? result.status : 502 },
  );
}
