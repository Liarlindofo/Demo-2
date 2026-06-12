import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';

async function verifyPosicaoOwner(posicaoId: string, userId: string) {
  return prisma.rhPosicaoIdeal.findFirst({
    where: { id: posicaoId, setor: { quadroIdeal: { userId } } },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const posicao = await verifyPosicaoOwner(id, rh!.userId);
    if (!posicao) return NextResponse.json({ error: 'Posição não encontrada' }, { status: 404 });

    const { cargoId, turno, quantidadeIdeal, observacoes } = await req.json();

    const updated = await prisma.rhPosicaoIdeal.update({
      where: { id },
      data: {
        ...(cargoId !== undefined && { cargoId }),
        ...(turno !== undefined && { turno }),
        ...(quantidadeIdeal !== undefined && { quantidadeIdeal: Number(quantidadeIdeal) }),
        ...(observacoes !== undefined && { observacoes: observacoes || null }),
      },
      include: { cargo: { select: { id: true, nome: true } } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PUT /api/rh/quadro-ideal/posicoes/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const posicao = await verifyPosicaoOwner(id, rh!.userId);
    if (!posicao) return NextResponse.json({ error: 'Posição não encontrada' }, { status: 404 });

    await prisma.rhPosicaoIdeal.update({ where: { id }, data: { ativo: false } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/rh/quadro-ideal/posicoes/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
