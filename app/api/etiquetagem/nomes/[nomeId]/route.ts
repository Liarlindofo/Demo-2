import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

// DELETE /api/etiquetagem/nomes/[nomeId] - Inativar nome responsável
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ nomeId: string }> }
) {
  try {
    const { nomeId } = await params;
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const dbUser = await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail || undefined,
      displayName: stackUser.displayName || undefined,
      profileImageUrl: stackUser.profileImageUrl || undefined,
      primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
    });

    const nome = await prisma.etiquetagemNomeResponsavel.findUnique({
      where: { id: nomeId },
      include: { unidade: true },
    });

    if (!nome || nome.userId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Nome não encontrado' },
        { status: 404 }
      );
    }

    await prisma.etiquetagemNomeResponsavel.update({
      where: { id: nomeId },
      data: { isAtivo: 0 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao inativar nome:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
