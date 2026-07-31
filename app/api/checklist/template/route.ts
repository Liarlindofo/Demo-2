export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';
import { CHECKLIST_TOPICS } from '@/lib/checklist-data';

/**
 * GET /api/checklist/template
 *
 * Retorna o catálogo de categorias + itens ativos ordenados.
 * Se o banco ainda não tiver dados (seed não rodado), cai no fallback
 * com o array estático original — sem quebrar o fluxo de avaliação.
 *
 * Shape de retorno (compatível com ChecklistTopic + fotoObrigatoria):
 * [{ id, name, items: [{ id, name, weight, fotoObrigatoria }] }]
 */
export async function GET() {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const categories = await prisma.checklistCategory.findMany({
      orderBy: { ordem: 'asc' },
      include: {
        itens: {
          where:   { ativo: true },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    // Fallback: banco vazio → usa array estático (seed ainda não rodou)
    if (categories.length === 0) {
      const fallback = CHECKLIST_TOPICS.map((t) => ({
        id:    t.id,
        name:  t.name,
        items: t.items.map((i) => ({
          id:              i.id,
          name:            i.name,
          weight:          i.weight,
          fotoObrigatoria: false,
        })),
      }));
      return NextResponse.json(fallback);
    }

    const result = categories.map((cat) => ({
      id:    cat.id,
      name:  cat.nome,
      items: cat.itens.map((item) => ({
        id:              item.id,
        name:            item.nome,
        weight:          item.weight,
        fotoObrigatoria: item.fotoObrigatoria,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar template do checklist:', error);
    // Em caso de erro de DB, retorna o fallback estático
    const fallback = CHECKLIST_TOPICS.map((t) => ({
      id:    t.id,
      name:  t.name,
      items: t.items.map((i) => ({
        id:              i.id,
        name:            i.name,
        weight:          i.weight,
        fotoObrigatoria: false,
      })),
    }));
    return NextResponse.json(fallback);
  }
}
