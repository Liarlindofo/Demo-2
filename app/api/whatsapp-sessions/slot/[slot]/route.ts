export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';
import { mapBotToDto } from '@/lib/whatsapp-sessions';
import { callWhatsAppVpsSession } from '@/lib/whatsapp-vps';

function parseSlot(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

/**
 * PATCH /api/whatsapp-sessions/slot/:slot
 * Atualiza label / iaAtiva / iaPrompt / monitorarReclamacoes sem mexer na conexão.
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ slot: string }> },
) {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { slot: raw } = await ctx.params;
  const slot = parseSlot(raw);
  if (!slot) return NextResponse.json({ error: 'Slot inválido' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const data: {
    label?: string;
    iaAtiva?: boolean;
    iaPrompt?: string | null;
    monitorarReclamacoes?: boolean;
  } = {};

  if (typeof body.label === 'string') {
    const label = body.label.trim();
    if (!label) return NextResponse.json({ error: 'Label não pode ser vazio.' }, { status: 400 });
    data.label = label.slice(0, 80);
  }
  if (typeof body.iaAtiva === 'boolean') {
    data.iaAtiva = body.iaAtiva;
    if (!body.iaAtiva) data.iaPrompt = null;
  }
  if (body.iaPrompt !== undefined) {
    data.iaPrompt = typeof body.iaPrompt === 'string' ? body.iaPrompt : null;
  }
  if (typeof body.monitorarReclamacoes === 'boolean') {
    data.monitorarReclamacoes = body.monitorarReclamacoes;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 });
  }

  const existing = await prisma.whatsAppBot.findUnique({
    where: { userId_slot: { userId: stackUser.id, slot } },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 404 });
  }

  const bot = await prisma.whatsAppBot.update({
    where: { userId_slot: { userId: stackUser.id, slot } },
    data,
  });

  return NextResponse.json({ session: mapBotToDto(bot) });
}

/**
 * DELETE /api/whatsapp-sessions/slot/:slot
 * Para a sessão na VPS, apaga tokens e remove o card do banco.
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ slot: string }> },
) {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  const { slot: raw } = await ctx.params;
  const slot = parseSlot(raw);
  if (!slot) {
    return NextResponse.json({ success: false, error: 'Slot inválido' }, { status: 400 });
  }

  const existing = await prisma.whatsAppBot.findUnique({
    where: { userId_slot: { userId: stackUser.id, slot } },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Sessão não encontrada.' }, { status: 404 });
  }

  const vps = await callWhatsAppVpsSession(stackUser.id, slot, 'delete');

  // Garante remoção no banco mesmo se a VPS estiver fora / já tiver apagado.
  await prisma.whatsAppBot
    .delete({ where: { userId_slot: { userId: stackUser.id, slot } } })
    .catch(() => null);

  return NextResponse.json(
    {
      success: true,
      slot,
      message: 'Sessão apagada',
      vpsOk: vps.ok || vps.data.success === true,
      vpsMessage: vps.data.message,
    },
    { status: 200 },
  );
}
