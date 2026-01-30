import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

// GET /api/etiquetagem/produtos - Listar produtos do usuário com categoria
export async function GET() {
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

    const body = await request.json();
    const { nome, categoriaId, pesoPadrao, unidadeMedida, marcaFornecedor, tipoArmazenamentoPadrao } = body;

    // Validar todos os campos obrigatórios
    if (!nome || !categoriaId || !pesoPadrao || !unidadeMedida || !marcaFornecedor || !tipoArmazenamentoPadrao) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios: nome, categoriaId, pesoPadrao, unidadeMedida, marcaFornecedor, tipoArmazenamentoPadrao' },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(pesoPadrao)) || parseFloat(pesoPadrao) <= 0) {
      return NextResponse.json(
        { error: 'Peso padrão deve ser um número maior que zero' },
        { status: 400 }
      );
    }

    const produto = await prisma.etiquetagemProduto.create({
      data: {
        userId: dbUser.id,
        nome,
        categoriaId,
        pesoPadrao: parseFloat(pesoPadrao),
        unidadeMedida: unidadeMedida,
        marcaFornecedor: marcaFornecedor,
        tipoArmazenamentoPadrao: tipoArmazenamentoPadrao,
        isAtivo: 1,
      },
      include: {
        categoria: true,
      },
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
