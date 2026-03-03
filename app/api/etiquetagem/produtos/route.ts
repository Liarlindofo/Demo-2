import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

// GET /api/etiquetagem/produtos - Listar produtos do usuário com categoria
export async function GET() {
  try {
    // Verificar permissão de ferramenta (PRODUTOS ou ETIQUETAGEM)
    const { checkToolPermission } = await import('@/lib/auth/toolPermissions');
    const { SystemTool } = await import('@/types/admin');
    const { stackServerApp } = await import('@/stack');
    
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
          message: 'Você não tem permissão para acessar produtos. Entre em contato com o administrador.',
        },
        { status: 403 }
      );
    }

    const dbUser = await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail || undefined,
      displayName: stackUser.displayName || undefined,
      profileImageUrl: stackUser.profileImageUrl || undefined,
      primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
    });

    const produtos = await prisma.etiquetagemProduto.findMany({
      where: {
        userId: dbUser.id,
        isAtivo: 1,
      },
      include: {
        categoria: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return NextResponse.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/etiquetagem/produtos - Criar novo produto
export async function POST(request: NextRequest) {
  try {
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
          message: 'Você não tem permissão para criar produtos. Entre em contato com o administrador.',
        },
        { status: 403 }
      );
    }

    const dbUser = await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail || undefined,
      displayName: stackUser.displayName || undefined,
      profileImageUrl: stackUser.profileImageUrl || undefined,
      primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
    });

    const body = await request.json();
    const { nome, categoriaId, pesoPadrao, unidadeMedida, tipoArmazenamentoPadrao } = body;

    // Validar apenas campos obrigatórios
    if (!nome || !pesoPadrao || !unidadeMedida) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, pesoPadrao, unidadeMedida' },
        { status: 400 }
      );
    }

    // Validar nome
    const nomeTrimmed = nome.toString().trim();
    if (nomeTrimmed.length < 2) {
      return NextResponse.json(
        { error: 'Nome do produto deve ter pelo menos 2 caracteres' },
        { status: 400 }
      );
    }

    // Validar peso
    const pesoNumero = parseFloat(pesoPadrao);
    if (isNaN(pesoNumero) || pesoNumero <= 0) {
      return NextResponse.json(
        { error: 'Peso padrão deve ser um número maior que zero' },
        { status: 400 }
      );
    }

    // Validar unidade de medida
    const unidadesValidas = ['kg', 'g', 'L', 'ml', 'un'];
    const unidadeTrimmed = unidadeMedida.toString().trim().toLowerCase();
    if (!unidadesValidas.includes(unidadeTrimmed)) {
      return NextResponse.json(
        { error: `Unidade de medida inválida. Use uma das: ${unidadesValidas.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar categoria se fornecida
    if (categoriaId) {
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

    // Verificar se produto já existe (mesmo nome para o mesmo usuário)
    const produtoExistente = await prisma.etiquetagemProduto.findFirst({
      where: {
        userId: dbUser.id,
        nome: nomeTrimmed,
        isAtivo: 1,
      },
    });

    if (produtoExistente) {
      return NextResponse.json(
        { error: `Produto "${nomeTrimmed}" já existe` },
        { status: 409 }
      );
    }

    const produto = await prisma.etiquetagemProduto.create({
      data: {
        userId: dbUser.id,
        nome: nomeTrimmed,
        categoriaId: categoriaId || null,
        pesoPadrao: pesoNumero,
        unidadeMedida: unidadeTrimmed,
        marcaFornecedor: null,
        tipoArmazenamentoPadrao: tipoArmazenamentoPadrao || null,
        isAtivo: 1,
      },
      include: {
        categoria: true,
      },
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    
    // Tratar erros específicos do Prisma
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Produto duplicado. Já existe um produto com este nome.' },
        { status: 409 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Categoria inválida ou não encontrada' },
        { status: 400 }
      );
    }

    // Retornar mensagem de erro mais específica se disponível
    const errorMessage = error.message || 'Erro interno do servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
