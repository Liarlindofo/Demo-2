import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { generateInviteToken } from '@/lib/rider-auth';
import { buildInviteLink, buildWhatsAppLink } from '@/lib/rider-invite-email';

export const dynamic = 'force-dynamic';

const RESET_DAYS = 1; // link de redefinição expira em 24 h

/**
 * POST /api/rh/motoboys/[id]/reset-password
 *
 * Gera um novo token de setup mesmo quando o motoboy já criou sua senha,
 * permitindo que ele redefina a senha esquecida.
 * O link gerado aponta para /rider/setup?token=... (mesmo fluxo do convite inicial).
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    const rider = await prisma.deliveryRider.findFirst({
      where: { id, userId: rh.userId },
      include: { loja: { select: { nome: true } } },
    });

    if (!rider) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    // Gera token de redefinição com validade curta (24 h)
    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + RESET_DAYS * 24 * 60 * 60 * 1000);

    await prisma.deliveryRider.update({
      where: { id },
      data: { inviteToken: token, inviteTokenExpiresAt: expiresAt },
    });

    const link = buildInviteLink(token);

    return NextResponse.json({
      link,
      expiresAt: expiresAt.toISOString(),
      whatsappLink: buildWhatsAppLink(rider.phone, link),
      lojaNome: rider.loja.nome,
    });
  } catch (err) {
    console.error('[POST /api/rh/motoboys/[id]/reset-password]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
