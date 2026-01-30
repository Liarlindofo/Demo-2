import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

// PUT /api/etiquetagem/produtos/[id] - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const produto = await prisma.etiquetagemProduto.findUnique({
      where: { id: params.id },
    });

    if (!produto || produto.userId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { nome, categoriaId, pesoPadrao, unidadeMedida, marcaFornecedor, tipoArmazenamentoPadrao } = body;

    const produtoAtualizado = await prisma.etiquetagemProduto.update({
      where: { id: params.id },
      data: {
        nome: nome || produto.nome,
        categoriaId: categoriaId || produto.categoriaId,
        pesoPadrao: pesoPadrao !== undefined ? pesoPadrao : produto.pesoPadrao,
        unidadeMedida: unidadeMedida !== undefined ? unidadeMedida : produto.unidadeMedida,
        marcaFornecedor: marcaFornecedor !== undefined ? marcaFornecedor : produto.marcaFornecedor,
        tipoArmazenamentoPadrao: tipoArmazenamentoPadrao !== undefined ? tipoArmazenamentoPadrao : produto.tipoArmazenamentoPadrao,
      },
      include: {
        categoria: true,
      },
    });

    return NextResponse.json(produtoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/etiquetagem/produtos/[id] - Inativar produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const produto = await prisma.etiquetagemProduto.findUnique({
      where: { id: params.id },
    });

    if (!produto || produto.userId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    await prisma.etiquetagemProduto.update({
      where: { id: params.id },
      data: { isAtivo: 0 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao inativar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
