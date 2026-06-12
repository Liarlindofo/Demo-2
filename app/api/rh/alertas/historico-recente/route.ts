import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const historico = await prisma.rhHistoricoFuncionario.findMany({
      where: { userId: rh!.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        funcionario: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json(historico);
  } catch (err) {
    console.error('[GET /api/rh/alertas/historico-recente]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
