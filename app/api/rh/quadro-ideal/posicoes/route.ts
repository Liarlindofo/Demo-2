import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { setorId, cargoId, turno, quantidadeIdeal, observacoes } = await req.json();

    if (!setorId || !cargoId || !turno || !quantidadeIdeal)
      return NextResponse.json({ error: 'setorId, cargoId, turno e quantidadeIdeal são obrigatórios' }, { status: 400 });

    // Verificar que o setor pertence ao usuário
    const setor = await prisma.rhSetorIdeal.findFirst({
      where: { id: setorId, ativo: true, quadroIdeal: { userId: rh!.userId } },
    });
    if (!setor) return NextResponse.json({ error: 'Setor não encontrado' }, { status: 404 });

    // Verificar que o cargo pertence ao usuário
    const cargo = await prisma.rhCargo.findFirst({ where: { id: cargoId, userId: rh!.userId } });
    if (!cargo) return NextResponse.json({ error: 'Cargo não encontrado' }, { status: 404 });

    const posicao = await prisma.rhPosicaoIdeal.create({
      data: {
        setorId,
        cargoId,
        turno,
        quantidadeIdeal: Number(quantidadeIdeal),
        observacoes: observacoes || null,
      },
      include: { cargo: { select: { id: true, nome: true } } },
    });

    return NextResponse.json(posicao, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rh/quadro-ideal/posicoes]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
