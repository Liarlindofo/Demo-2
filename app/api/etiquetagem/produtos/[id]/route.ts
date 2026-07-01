export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';
import { getEffectiveDbUser } from '@/lib/effective-user';

// PUT /api/etiquetagem/produtos/[id] - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verificar permissão de ferramenta (PRODUTOS ou ETIQUETAGEM)
    const { checkToolPermission } = await import('@/lib/auth/toolPermissions');
    const { SystemTool } = await import('@/types/admin');
    
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    // Verificar se tem permissão para PRODUTOS ou ETIQUETAGEM
    const hasProdutosPermission = await checkToolPermission(stackUser.id, SystemTool.PRODUTOS);
    const hasEtiquetagemPermission = await checkToolPermission(stackUser.id, SystemTool.ETIQUETAGEM);
    
    if (!hasProdutosPermission && !hasEtiquetagemPermission) {
      return NextResponse.json(
        {
          error: 'Acesso negado',
          message: 'Você não tem permissão para editar produtos. Entre em contato com o administrador.',
        },
        { status: 403 }
      );
    }

    const dbUser = await getEffectiveDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const produto = await prisma.etiquetagemProduto.findUnique({
      where: { id },
    });

    if (!produto || produto.userId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { nome, categoriaId, pesoPadrao, unidadeMedida, tipoArmazenamentoPadrao } = body;

    // Validar categoria se fornecida
    if (categoriaId !== undefined && categoriaId !== null && categoriaId !== '') {
      const categoriaExiste = await prisma.etiquetagemCategoria.findFirst({
        where: {
          id: categoriaId,
          isAtivo: 1,
        },
      });
      if (!categoriaExiste) {
        return NextResponse.json(
          { error: 'Categoria não encontrada ou inativa' },
          { status: 400 }
        );
      }
    }

    const produtoAtualizado = await prisma.etiquetagemProduto.update({
      where: { id },
      data: {
        nome: nome || produto.nome,
        categoriaId: categoriaId !== undefined ? (categoriaId || null) : produto.categoriaId,
        pesoPadrao: pesoPadrao !== undefined ? pesoPadrao : produto.pesoPadrao,
        unidadeMedida: unidadeMedida !== undefined ? unidadeMedida : produto.unidadeMedida,
        marcaFornecedor: null,
        tipoArmazenamentoPadrao: tipoArmazenamentoPadrao !== undefined ? (tipoArmazenamentoPadrao || null) : produto.tipoArmazenamentoPadrao,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verificar permissão de ferramenta (PRODUTOS ou ETIQUETAGEM)
    const { checkToolPermission } = await import('@/lib/auth/toolPermissions');
    const { SystemTool } = await import('@/types/admin');
    
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    // Verificar se tem permissão para PRODUTOS ou ETIQUETAGEM
    const hasProdutosPermission = await checkToolPermission(stackUser.id, SystemTool.PRODUTOS);
    const hasEtiquetagemPermission = await checkToolPermission(stackUser.id, SystemTool.ETIQUETAGEM);
    
    if (!hasProdutosPermission && !hasEtiquetagemPermission) {
      return NextResponse.json(
        {
          error: 'Acesso negado',
          message: 'Você não tem permissão para excluir produtos. Entre em contato com o administrador.',
        },
        { status: 403 }
      );
    }

    const dbUser = await getEffectiveDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const produto = await prisma.etiquetagemProduto.findUnique({
      where: { id },
    });

    if (!produto || produto.userId !== dbUser.id) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    await prisma.etiquetagemProduto.update({
      where: { id },
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
