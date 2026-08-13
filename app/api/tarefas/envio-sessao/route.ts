export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhContext } from '@/lib/rh-auth';
import { getTenantStackUserId, listSessionsForActor } from '@/lib/whatsapp-sessions';

/**
 * GET /api/tarefas/envio-sessao
 * PUT /api/tarefas/envio-sessao  { sessionSlot: number }
 *
 * Config única por tenant: qual sessão WhatsApp envia digest/pendentes.
 */
export async function GET() {
  const ctx = await getRhContext();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { tarefasSessionSlot: true },
  });

  const sessions = await listSessionsForActor({
    tenantUserId: ctx.userId,
    stackUserId: ctx.stackUserId,
  });

  return NextResponse.json({
    sessionSlot: user?.tarefasSessionSlot ?? 1,
    sessions,
  });
}

export async function PUT(req: Request) {
  const ctx = await getRhContext();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const sessionSlot = parseInt(String(body.sessionSlot), 10);
  if (!Number.isFinite(sessionSlot) || sessionSlot < 1) {
    return NextResponse.json({ error: 'sessionSlot inválido.' }, { status: 400 });
  }

  const stackUserId = ctx.stackUserId;
  const tenantStack = await getTenantStackUserId(ctx.userId);
  const lookupIds = [...new Set([stackUserId, tenantStack].filter(Boolean))] as string[];

  let found = false;
  for (const id of lookupIds) {
    const bot = await prisma.whatsAppBot.findUnique({
      where: { userId_slot: { userId: id, slot: sessionSlot } },
    });
    if (bot) {
      found = true;
      break;
    }
  }
  if (lookupIds.length > 0 && !found) {
    return NextResponse.json({ error: 'Sessão WhatsApp não encontrada.' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: ctx.userId },
    data: { tarefasSessionSlot: sessionSlot },
  });

  return NextResponse.json({ ok: true, sessionSlot });
}
