export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';
import { mapBotToDto } from '@/lib/whatsapp-sessions';

function parseSlot(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

export async function GET(
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

  const bot = await prisma.whatsAppBot.findUnique({
    where: { userId_slot: { userId: stackUser.id, slot } },
  });

  if (!bot) {
    return NextResponse.json({
      success: true,
      qrCode: null,
      isConnected: false,
      slot,
      session: null,
    });
  }

  const session = mapBotToDto(bot);
  return NextResponse.json({
    success: true,
    qrCode: session.qrCode,
    isConnected: session.isConnected,
    connectedNumber: session.connectedNumber,
    slot,
    session,
  });
}
