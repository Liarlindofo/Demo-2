import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';

// GET /api/checklist/stores/[id]/evaluations - Buscar avaliações de uma loja
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;

    // Buscar usuário no banco
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { stackUserId: stackUser.id },
          { email: stackUser.primaryEmail || undefined }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se a loja pertence ao usuário
    const store = await prisma.store.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Buscar avaliações da loja
    const evaluations = await prisma.evaluation.findMany({
      where: {
        storeId: id,
        userId: user.id
      },
      orderBy: [
        { evaluationDate: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        topicScores: true,
        itemScores: true
      }
    });

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error('Erro ao buscar avaliações da loja:', error);
    return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 });
  }
}

