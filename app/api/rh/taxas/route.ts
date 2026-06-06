import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

export const dynamic = 'force-dynamic';

async function getDbUser() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;
  return syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    profileImageUrl: stackUser.profileImageUrl || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });
}

export async function GET(req: NextRequest) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const lojaId = req.nextUrl.searchParams.get('lojaId');
    const taxas = await prisma.rhTaxaLoja.findMany({
      where: {
        userId: dbUser.id,
        ativo: true,
        ...(lojaId ? { lojaId } : {}),
      },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(taxas);
  } catch (err) {
    console.error('[GET /api/rh/taxas]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json() as {
      lojaId: string;
      nome: string;
      valorDiaria: number;
      diasPorMes: number;
      quantidadeIdeal: number;
      observacoes?: string;
    };

    if (!body.lojaId || !body.nome || body.valorDiaria == null) {
      return NextResponse.json({ error: 'lojaId, nome e valorDiaria são obrigatórios' }, { status: 400 });
    }

    const taxa = await prisma.rhTaxaLoja.create({
      data: {
        userId: dbUser.id,
        lojaId: body.lojaId,
        nome: body.nome,
        valorDiaria: body.valorDiaria,
        diasPorMes: body.diasPorMes ?? 1,
        quantidadeIdeal: body.quantidadeIdeal ?? 1,
        observacoes: body.observacoes,
      },
    });

    return NextResponse.json(taxa, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rh/taxas]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
