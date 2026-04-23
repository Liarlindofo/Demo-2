import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

const MAX_CONNECTIONS = 5;

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

// ---------------------------------------------------------------------------
// GET /api/ifood/connections — lista as lojas conectadas do usuário
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await getPrismaUser(stackUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const connections = await db.ifoodConnection.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        merchantId: true,
        merchantName: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ connections });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET ifood/connections]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/ifood/connections — conecta uma loja iFood
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await getPrismaUser(stackUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await req.json() as { merchantId?: string };
    const merchantId = body.merchantId?.trim();

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId é obrigatório' }, { status: 400 });
    }

    // Verifica limite de lojas
    const count = await db.ifoodConnection.count({ where: { userId: user.id } });
    if (count >= MAX_CONNECTIONS) {
      return NextResponse.json(
        { error: `Limite de ${MAX_CONNECTIONS} lojas atingido` },
        { status: 422 },
      );
    }

    // Verifica duplicata
    const duplicate = await db.ifoodConnection.findUnique({
      where: { userId_merchantId: { userId: user.id, merchantId } },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: 'Esta loja já está conectada à sua conta' },
        { status: 409 },
      );
    }

    // Valida o merchantId na API iFood e busca o nome da loja
    const token = await getValidIfoodToken();
    const merchantRes = await fetch(
      `https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${merchantId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!merchantRes.ok) {
      return NextResponse.json(
        { error: 'Merchant ID não encontrado na API iFood. Verifique o ID e tente novamente.' },
        { status: 422 },
      );
    }

    const merchantData = (await merchantRes.json()) as {
      name?: string;
      corporateName?: string;
    };

    const merchantName =
      merchantData.name ?? merchantData.corporateName ?? `Loja ${merchantId.slice(0, 8)}`;

    const connection = await db.ifoodConnection.create({
      data: {
        userId: user.id,
        merchantId,
        merchantName,
        status: 'active',
      },
    });

    return NextResponse.json({ connection }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[POST ifood/connections]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
