import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInviteToken } from '@/lib/rider-auth';
import { buildInviteLink, sendInviteEmail } from '@/lib/rider-invite-email';

export const dynamic = 'force-dynamic';

const RESET_HOURS = 2; // link expira em 2 horas

/**
 * POST /api/rider/forgot-password
 *
 * Rota pública — o próprio motoboy solicita redefinição de senha.
 * Para evitar enumeração de e-mails, sempre retorna 200 (mesmo se não encontrar).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string };
    const email = (body.email ?? '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 });
    }

    const rider = await prisma.deliveryRider.findFirst({
      where: { email, status: 'active' },
      include: { loja: { select: { nome: true } } },
    });

    // Sempre retorna ok para não revelar se o e-mail existe
    if (!rider) {
      return NextResponse.json({ ok: true });
    }

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + RESET_HOURS * 60 * 60 * 1000);

    await prisma.deliveryRider.update({
      where: { id: rider.id },
      data: { inviteToken: token, inviteTokenExpiresAt: expiresAt },
    });

    const link = buildInviteLink(token);

    // Envio de e-mail — falha silenciosa para não vazar informação
    sendInviteEmail({
      to: rider.email,
      riderName: rider.name,
      lojaNome: rider.loja.nome,
      inviteLink: link,
    }).catch(err => console.error('[forgot-password] falha ao enviar e-mail:', err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/rider/forgot-password]', err);
    // Retorna 200 mesmo em erro para não revelar informação
    return NextResponse.json({ ok: true });
  }
}
