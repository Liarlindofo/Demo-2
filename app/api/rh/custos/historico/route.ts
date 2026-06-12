import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const snapshots = await prisma.rhSnapshotCustoMensal.findMany({
      where: { userId: rh!.userId },
      include: { loja: { select: { nome: true } } },
      orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
    });

    return NextResponse.json(snapshots);
  } catch (err) {
    console.error('[GET /api/rh/custos/historico]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
