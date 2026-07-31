export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';

/** GET /api/checklist/admin/categories — lista todas as categorias com itens ativos */
export async function GET() {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const categories = await prisma.checklistCategory.findMany({
      orderBy: { ordem: 'asc' },
      include: {
        itens: {
          where:   { ativo: true },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/** POST /api/checklist/admin/categories — cria nova categoria */
export async function POST(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { nome } = await request.json();
    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Campo "nome" é obrigatório' }, { status: 400 });
    }

    // Insere no final da lista
    const maxOrdem = await prisma.checklistCategory.aggregate({ _max: { ordem: true } });
    const ordem = (maxOrdem._max.ordem ?? 0) + 1;

    const category = await prisma.checklistCategory.create({
      data: { nome: nome.trim(), ordem },
      include: { itens: true },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
