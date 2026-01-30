import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/etiquetagem/categorias - Listar todas as categorias (globais)
export async function GET() {
  try {
    const categorias = await prisma.etiquetagemCategoria.findMany({
      where: {
        isAtivo: 1,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
