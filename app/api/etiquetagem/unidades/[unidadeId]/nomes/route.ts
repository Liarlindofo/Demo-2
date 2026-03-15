import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

// GET /api/etiquetagem/unidades/[unidadeId]/nomes - Listar nomes recentes da unidade
export async function GET(
  request: Request,
  { params }: { params: Promise<{ unidadeId: string }> }
) {
  try {
    const { unidadeId } = await params;
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

    // Verificar se a unidade pertence ao usuário
    const unidade = await prisma.etiquetagemUnidade.findFirst({
      where: {
        id: unidadeId,
        userId: dbUser.id,
      },
    });

    if (!unidade) {
      return NextResponse.json(
        { error: 'Unidade não encontrada' },
        { status: 404 }
      );
    }

    // Buscar todos os nomes da unidade (compartilhados entre todos os usuários)
    // Isso permite que todos vejam os nomes mais usados na unidade
    const nomes = await prisma.etiquetagemNomeResponsavel.findMany({
      where: {
        unidadeId: unidadeId,
        isAtivo: 1,
      },
      orderBy: {
        ultimaUtilizacao: 'desc',
      },
      take: 20,
    });

    return NextResponse.json(nomes);
  } catch (error) {
    console.error('Erro ao buscar nomes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
