export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';

/** PUT /api/checklist/admin/categories/[id] — edita nome/ordem da categoria */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.nome !== undefined) data.nome  = String(body.nome).trim();
    if (body.ordem !== undefined) data.ordem = Number(body.ordem);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    const updated = await prisma.checklistCategory.update({
      where: { id },
      data,
      include: { itens: { where: { ativo: true }, orderBy: { ordem: 'asc' } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
