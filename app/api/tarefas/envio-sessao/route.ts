export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { getTenantStackUserId, listSessionsForStackUser } from '@/lib/whatsapp-sessions';

/**
 * GET /api/tarefas/envio-sessao
 * PUT /api/tarefas/envio-sessao  { sessionSlot: number }
 *
 * Config única por tenant: qual sessão WhatsApp envia digest/pendentes.
 */
export async function GET() {
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: rh.userId },
    select: { tarefasSessionSlot: true },
  });

  const stackUserId = await getTenantStackUserId(rh.userId);
  const sessions = stackUserId ? await listSessionsForStackUser(stackUserId) : [];

  return NextResponse.json({
    sessionSlot: user?.tarefasSessionSlot ?? 1,
    sessions,
  });
}

export async function PUT(req: Request) {
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sessionSlot = parseInt(String(body.sessionSlot), 10);
  if (!Number.isFinite(sessionSlot) || sessionSlot < 1) {
    return NextResponse.json({ error: 'sessionSlot inválido.' }, { status: 400 });
  }

  const stackUserId = await getTenantStackUserId(rh.userId);
  if (stackUserId) {
    const bot = await prisma.whatsAppBot.findUnique({
      where: { userId_slot: { userId: stackUserId, slot: sessionSlot } },
    });
    if (!bot) {
      return NextResponse.json({ error: 'Sessão WhatsApp não encontrada.' }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: rh.userId },
    data: { tarefasSessionSlot: sessionSlot },
  });

  return NextResponse.json({ ok: true, sessionSlot });
}
