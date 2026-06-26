import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhDbUser } from '@/lib/rh-api-auth';
import { generateInviteToken } from '@/lib/rider-auth';
import { buildInviteLink, buildWhatsAppLink, sendInviteEmail } from '@/lib/rider-invite-email';

export const dynamic = 'force-dynamic';

const INVITE_DAYS = 30;

type RouteContext = { params: Promise<{ id: string }> };

function buildResponse(token: string, expiresAt: Date, phone: string | null, lojaNome: string) {
  const link = buildInviteLink(token);
  return {
    inviteToken: token,
    link,
    expiresAt: expiresAt.toISOString(),
    whatsappLink: buildWhatsAppLink(phone, link),
    lojaNome,
  };
}

// GET — retorna token existente (se ainda válido) ou gera novo
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const rider = await prisma.deliveryRider.findFirst({
      where: { id, userId: dbUser.id },
      include: { loja: { select: { nome: true } } },
    });

    if (!rider) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    if (rider.passwordHash) return NextResponse.json({ error: 'Motoboy já definiu sua senha' }, { status: 400 });

    const tokenValido = rider.inviteToken &&
      rider.inviteTokenExpiresAt &&
      rider.inviteTokenExpiresAt > new Date();

    let token = rider.inviteToken!;
    let expiresAt = rider.inviteTokenExpiresAt!;

    if (!tokenValido) {
      token = generateInviteToken();
      expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);
      await prisma.deliveryRider.update({
        where: { id },
        data: { inviteToken: token, inviteTokenExpiresAt: expiresAt },
      });
    }

    return NextResponse.json(buildResponse(token, expiresAt, rider.phone, rider.loja.nome));
  } catch (err) {
    console.error('[GET /api/rh/motoboys/[id]/invite]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST — força geração de novo token e reenvia e-mail
export async function POST(_req: NextRequest, { params }: RouteContext) {
  try {
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const rider = await prisma.deliveryRider.findFirst({
      where: { id, userId: dbUser.id },
      include: { loja: { select: { nome: true } } },
    });

    if (!rider) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    if (rider.passwordHash) return NextResponse.json({ error: 'Motoboy já definiu sua senha' }, { status: 400 });

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);

    await prisma.deliveryRider.update({
      where: { id },
      data: { inviteToken: token, inviteTokenExpiresAt: expiresAt },
    });

    const inviteLink = buildInviteLink(token);

    // Reenviar e-mail — falha silenciosa
    sendInviteEmail({
      to: rider.email,
      riderName: rider.name,
      lojaNome: rider.loja.nome,
      inviteLink,
    }).catch(err => console.error('[POST /api/rh/motoboys/[id]/invite] falha ao reenviar e-mail:', err));

    return NextResponse.json(buildResponse(token, expiresAt, rider.phone, rider.loja.nome));
  } catch (err) {
    console.error('[POST /api/rh/motoboys/[id]/invite]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
