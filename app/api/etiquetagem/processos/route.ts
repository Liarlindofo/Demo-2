export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/etiquetagem/processos - Listar todos os processos (globais)
export async function GET() {
  try {
    const processos = await prisma.etiquetagemProcesso.findMany({
      where: {
        isAtivo: 1,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return NextResponse.json(processos);
  } catch (error) {
    console.error('Erro ao buscar processos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
