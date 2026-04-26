export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

// GET /api/etiquetagem/unidades - Listar todas as unidades do usuário
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

    const unidades = await prisma.etiquetagemUnidade.findMany({
      where: {
        userId: dbUser.id,
        isAtivo: 1,
      },
      orderBy: {
        nomeExibicao: 'asc',
      },
    });

    return NextResponse.json(unidades);
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Verificar se é erro de tabela não existente
    if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('table')) {
      return NextResponse.json(
        { error: 'Tabelas do banco de dados não foram criadas. Execute: GET /api/admin/sync-database?secret=YOUR_ADMIN_SECRET' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/etiquetagem/unidades - Criar nova unidade
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
    const { nomeExibicao, cnpj, cnpjFormatado, cidade, codigoInterno } = body;

    if (!nomeExibicao || !cnpj || !cidade || !codigoInterno) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nomeExibicao, cnpj, cidade, codigoInterno' },
        { status: 400 }
      );
    }

    const unidade = await prisma.etiquetagemUnidade.create({
      data: {
        userId: dbUser.id,
        nomeExibicao,
        cnpj,
        cnpjFormatado: cnpjFormatado || cnpj,
        cidade,
        codigoInterno,
        isAtivo: 1,
      },
    });

    return NextResponse.json(unidade, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar unidade:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Detalhes do erro:', errorMessage);
    console.error('Stack:', errorStack);
    
    // Verificar se é erro de tabela não existente
    if (
      errorMessage.includes('does not exist') || 
      errorMessage.includes('relation') || 
      errorMessage.includes('table') ||
      errorMessage.includes('etiquetagem_unidades') ||
      errorMessage.includes('Unknown table')
    ) {
      return NextResponse.json(
        { 
          error: 'Tabelas do banco de dados não foram criadas. Execute: npx prisma db push ou acesse /api/admin/sync-database?secret=YOUR_ADMIN_SECRET',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: errorMessage || 'Erro interno do servidor',
        details: errorStack ? errorStack.substring(0, 200) : undefined
      },
      { status: 500 }
    );
  }
}
