import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const lojas = await prisma.rhLoja.findMany({
      where: { userId: rh!.userId },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(lojas);
  } catch (err) {
    console.error('[GET /api/rh/lojas]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { nome, cnpj, endereco } = body;

    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const loja = await prisma.rhLoja.create({
      data: {
        userId: rh!.userId,
        nome: nome.trim(),
        cnpj: cnpj || null,
        endereco: endereco || null,
      },
    });

    return NextResponse.json(loja, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rh/lojas]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
