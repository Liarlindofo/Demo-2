import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhDbUser } from '@/lib/rh-api-auth';
import { generateInviteToken } from '@/lib/rider-auth';

export const dynamic = 'force-dynamic';

// GET — retorna token existente (se ainda válido) ou gera novo
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const rider = await prisma.deliveryRider.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!rider) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    if (rider.passwordHash) return NextResponse.json({ error: 'Motoboy já definiu sua senha' }, { status: 400 });

    // Se token ainda válido, reutiliza; senão gera novo
    const tokenValido = rider.inviteToken &&
      rider.inviteTokenExpiresAt &&
      rider.inviteTokenExpiresAt > new Date();

    let token = rider.inviteToken;
    if (!tokenValido) {
      token = generateInviteToken();
      await prisma.deliveryRider.update({
        where: { id },
        data: {
          inviteToken: token,
          inviteTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return NextResponse.json({ inviteToken: token });
  } catch (err) {
    console.error('[GET /api/rh/motoboys/[id]/invite]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST — força geração de novo token (reenviar convite)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const rider = await prisma.deliveryRider.findFirst({
      where: { id, userId: dbUser.id },
    });

    if (!rider) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    if (rider.passwordHash) return NextResponse.json({ error: 'Motoboy já definiu sua senha' }, { status: 400 });

    const token = generateInviteToken();
    await prisma.deliveryRider.update({
      where: { id },
      data: {
        inviteToken: token,
        inviteTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ inviteToken: token });
  } catch (err) {
    console.error('[POST /api/rh/motoboys/[id]/invite]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
