export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhContext } from '@/lib/rh-auth';
import {
  findWhatsAppBotForTenant,
  listSessionsForTenant,
} from '@/lib/whatsapp-sessions';

/**
 * GET /api/tarefas/envio-sessao
 * PUT /api/tarefas/envio-sessao  { sessionSlot: number }
 *
 * Config compartilhada do TENANT (empresa):
 * - `tarefasSessionSlot` fica em users.id do dono (tenantUserId via getRhContext)
 * - Cada pessoa mantém o próprio login/user id; só a escolha do número é compartilhada
 * - Lista sessões WhatsApp de todas as contas da equipe (números podem estar
 *   conectados em outra conta do mesmo tenant)
 */
export async function GET() {
  const ctx = await getRhContext();
  if (!ctx) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { tarefasSessionSlot: true },
  });

  const sessions = await listSessionsForTenant(ctx.userId);

  return NextResponse.json({
    sessionSlot: user?.tarefasSessionSlot ?? 1,
    sessions,
    shared: true,
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

  const bot = await findWhatsAppBotForTenant(ctx.userId, sessionSlot);
  if (!bot) {
    return NextResponse.json(
      { error: 'Sessão WhatsApp não encontrada no tenant (verifique conexões da equipe).' },
      { status: 400 },
    );
  }

  // Sempre grava no User do TENANT — todos os membros leem/escrevem a mesma config
  await prisma.user.update({
    where: { id: ctx.userId },
    data: { tarefasSessionSlot: sessionSlot },
  });

  return NextResponse.json({ ok: true, sessionSlot, shared: true });
}
