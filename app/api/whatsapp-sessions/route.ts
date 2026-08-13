export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';
import { getRhContext } from '@/lib/rh-auth';
import { callWhatsAppVpsSession } from '@/lib/whatsapp-vps';
import {
  listSessionsForActor,
  listSessionsForStackUser,
  nextAvailableSlot,
} from '@/lib/whatsapp-sessions';

/**
 * GET /api/whatsapp-sessions
 *   ?scope=tenant → sessões do tenant (relatórios/tarefas)
 *   default → sessões do usuário logado (tela /connections)
 */
export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get('scope');

  if (scope === 'tenant') {
    const ctx = await getRhContext();
    if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const sessions = await listSessionsForActor({
      tenantUserId: ctx.userId,
      stackUserId: ctx.stackUserId,
    });
    return NextResponse.json({ sessions, stackUserId: ctx.stackUserId });
  }

  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const sessions = await listSessionsForStackUser(stackUser.id);
  return NextResponse.json({ sessions });
}

/**
 * POST /api/whatsapp-sessions
 * Cria o próximo slot e inicia o worker (QR).
 */
export async function POST() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const existing = await prisma.stackUser.findUnique({ where: { id: stackUser.id } });
  if (!existing) {
    return NextResponse.json(
      { error: 'Usuário Stack ainda não sincronizado. Recarregue a página.' },
      { status: 400 },
    );
  }

  const slot = await nextAvailableSlot(stackUser.id);
  if (slot > 12) {
    return NextResponse.json({ error: 'Limite de 12 sessões por usuário.' }, { status: 400 });
  }

  await prisma.whatsAppBot.upsert({
    where: { userId_slot: { userId: stackUser.id, slot } },
    update: {},
    create: {
      userId: stackUser.id,
      slot,
      label: `Sessão ${slot}`,
      iaAtiva: false,
      iaPrompt: null,
      isConnected: false,
    },
  });

  const result = await callWhatsAppVpsSession(stackUser.id, slot, 'start');

  return NextResponse.json({
    success: result.ok || result.data.success === true,
    slot,
    message: result.data.message,
    qrCode: result.data.qrCode ?? null,
    ...result.data,
  }, { status: result.ok ? 200 : result.status >= 400 ? result.status : 502 });
}
