import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

export const dynamic = 'force-dynamic';

async function getDbUser() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;
  return syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { setorId, cargoId, turno, quantidadeIdeal, observacoes } = await req.json();

    if (!setorId || !cargoId || !turno || !quantidadeIdeal)
      return NextResponse.json({ error: 'setorId, cargoId, turno e quantidadeIdeal são obrigatórios' }, { status: 400 });

    // Verificar que o setor pertence ao usuário
    const setor = await prisma.rhSetorIdeal.findFirst({
      where: { id: setorId, ativo: true, quadroIdeal: { userId: dbUser.id } },
    });
    if (!setor) return NextResponse.json({ error: 'Setor não encontrado' }, { status: 404 });

    // Verificar que o cargo pertence ao usuário
    const cargo = await prisma.rhCargo.findFirst({ where: { id: cargoId, userId: dbUser.id } });
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
