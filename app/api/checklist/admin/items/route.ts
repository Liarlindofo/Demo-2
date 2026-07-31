export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';

const VALID_WEIGHTS = [10, 15, 20];

/** POST /api/checklist/admin/items — cria novo item */
export async function POST(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { nome, categoriaId, weight, fotoObrigatoria } = await request.json();

    if (!nome?.trim())    return NextResponse.json({ error: 'Campo "nome" é obrigatório' }, { status: 400 });
    if (!categoriaId)     return NextResponse.json({ error: 'Campo "categoriaId" é obrigatório' }, { status: 400 });
    if (!VALID_WEIGHTS.includes(Number(weight))) {
      return NextResponse.json({ error: 'Peso deve ser 10, 15 ou 20' }, { status: 400 });
    }

    const categoria = await prisma.checklistCategory.findUnique({ where: { id: categoriaId } });
    if (!categoria) return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });

    const maxOrdem = await prisma.checklistItemTemplate.aggregate({
      where:  { categoriaId, ativo: true },
      _max:   { ordem: true },
    });
    const ordem = (maxOrdem._max.ordem ?? 0) + 1;

    const item = await prisma.checklistItemTemplate.create({
      data: {
        categoriaId,
        nome:            nome.trim(),
        weight:          Number(weight),
        fotoObrigatoria: Boolean(fotoObrigatoria),
        ativo:           true,
        ordem,
      },
      include: { categoria: true },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar item:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
