import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

// 🎯 GET - Recuperar rascunho específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Sincronizar StackUser com User do banco
    const dbUser = await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail || undefined,
      displayName: stackUser.displayName || undefined,
      profileImageUrl: stackUser.profileImageUrl || undefined,
      primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
    });

    const { id } = await params;

    const draft = await prisma.checklistDraft.findFirst({
      where: {
        id,
        userId: dbUser.id,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Sincronizar StackUser com User do banco
    const dbUser = await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail || undefined,
      displayName: stackUser.displayName || undefined,
      profileImageUrl: stackUser.profileImageUrl || undefined,
      primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
    });

    const { id } = await params;

    // Verificar se o rascunho pertence ao usuário antes de deletar
    const draft = await prisma.checklistDraft.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Rascunho não encontrado' }, { status: 404 });
    }

    await prisma.checklistDraft.delete({
      where: { id },
    });

    console.log(`🗑️ Rascunho deletado: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao deletar rascunho:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar rascunho', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
