import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';

// GET /api/checklist/evaluations/[id] - Buscar avaliação específica
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

    // Buscar avaliação
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id,
        userId: user.id
      },
      include: {
        topicScores: true,
        itemScores: true,
        store: {
          select: {
            id: true,
            name: true,
            abbreviation: true
          }
        }
      }
    });

    if (!evaluation) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 });
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Erro ao buscar avaliação:', error);
    return NextResponse.json({ error: 'Erro ao buscar avaliação' }, { status: 500 });
  }
}

// DELETE /api/checklist/evaluations/[id] - Deletar avaliação
export async function DELETE(
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

    // Verificar se a avaliação pertence ao usuário
    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existingEvaluation) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 });
    }

    // Deletar avaliação (cascata deleta topicScores e itemScores)
    await prisma.evaluation.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error);
    return NextResponse.json({ error: 'Erro ao deletar avaliação' }, { status: 500 });
  }
}

