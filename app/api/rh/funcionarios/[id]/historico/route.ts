import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const funcionario = await prisma.rhFuncionario.findFirst({
      where: { id, userId: rh!.userId },
    });
    if (!funcionario)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const historico = await prisma.rhHistoricoFuncionario.findMany({
      where: { funcionarioId: id, userId: rh!.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(historico);
  } catch (err) {
    console.error('[GET /api/rh/funcionarios/[id]/historico]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
