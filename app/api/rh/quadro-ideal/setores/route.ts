import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';


export async function POST(req: NextRequest) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { quadroIdealId, nome, descricao, ordem } = await req.json();
    if (!quadroIdealId || !nome?.trim())
      return NextResponse.json({ error: 'quadroIdealId e nome são obrigatórios' }, { status: 400 });

    // Verificar que o quadro pertence ao usuário
    const quadro = await prisma.rhQuadroIdeal.findFirst({
      where: { id: quadroIdealId, userId: rh!.userId },
    });
    if (!quadro) return NextResponse.json({ error: 'Quadro não encontrado' }, { status: 404 });

    const setor = await prisma.rhSetorIdeal.create({
      data: {
        quadroIdealId,
        nome: nome.trim(),
        descricao: descricao || null,
        ordem: ordem ?? 0,
      },
      include: {
        posicoes: { where: { ativo: true }, include: { cargo: { select: { id: true, nome: true } } } },
      },
    });

    return NextResponse.json(setor, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rh/quadro-ideal/setores]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
