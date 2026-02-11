import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';

// 🎯 GET - Recuperar rascunho específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await stackServerApp.getUser({ or: 'return-null' });
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const draft = await prisma.checklistDraft.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Rascunho não encontrado' }, { status: 404 });
    }

    console.log(`✅ Rascunho recuperado: ${draft.id}`, {
      itens: draft.totalItems,
      fotos: draft.totalPhotos,
      comentarios: draft.totalComments,
    });

    return NextResponse.json(draft);
  } catch (error) {
    console.error('❌ Erro ao recuperar rascunho:', error);
    return NextResponse.json(
      { error: 'Erro ao recuperar rascunho', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// 🎯 DELETE - Deletar rascunho específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await stackServerApp.getUser({ or: 'return-null' });
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o rascunho pertence ao usuário antes de deletar
    const draft = await prisma.checklistDraft.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Rascunho não encontrado' }, { status: 404 });
    }

    await prisma.checklistDraft.delete({
      where: { id: params.id },
    });

    console.log(`🗑️ Rascunho deletado: ${params.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao deletar rascunho:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar rascunho', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
