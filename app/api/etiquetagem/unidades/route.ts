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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
