import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhDbUser } from '@/lib/rh-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const plr = await prisma.rhPLRTrimestral.findFirst({
      where: { id, loja: { userId: dbUser.id } },
      include: {
        loja: { select: { id: true, nome: true } },
        pagamentos: {
          include: {
            funcionario: { select: { id: true, nome: true } },
          },
          orderBy: { funcionario: { nome: 'asc' } },
        },
      },
    });

    if (!plr) return NextResponse.json({ error: 'PLR não encontrado' }, { status: 404 });

    return NextResponse.json(plr);
  } catch (err) {
    console.error('[GET plr id]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
