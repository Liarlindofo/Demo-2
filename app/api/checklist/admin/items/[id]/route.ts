export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';

const VALID_WEIGHTS = [10, 15, 20];

/** PUT /api/checklist/admin/items/[id] — edita item ou faz soft-delete (ativo=false) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.checklistItemTemplate.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });

    const data: Record<string, unknown> = {};

    if (body.nome !== undefined)            data.nome            = String(body.nome).trim();
    if (body.fotoObrigatoria !== undefined) data.fotoObrigatoria = Boolean(body.fotoObrigatoria);
    if (body.ativo !== undefined)           data.ativo           = Boolean(body.ativo);
    if (body.ordem !== undefined)           data.ordem           = Number(body.ordem);

    if (body.weight !== undefined) {
      if (!VALID_WEIGHTS.includes(Number(body.weight))) {
        return NextResponse.json({ error: 'Peso deve ser 10, 15 ou 20' }, { status: 400 });
      }
      data.weight = Number(body.weight);
    }

    if (body.categoriaId !== undefined) {
      const cat = await prisma.checklistCategory.findUnique({ where: { id: body.categoriaId } });
      if (!cat) return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
      data.categoriaId = body.categoriaId;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    const updated = await prisma.checklistItemTemplate.update({
      where: { id },
      data,
      include: { categoria: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
