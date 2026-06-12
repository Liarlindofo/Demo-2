import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { ensureRhCargosPadrao } from '@/lib/rh-cargos-padrao';

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    await ensureRhCargosPadrao(rh!.userId);

    const cargos = await prisma.rhCargo.findMany({
      where: { userId: rh!.userId },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(cargos);
  } catch (err) {
    console.error('[GET /api/rh/cargos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { nome, descricao, ratPct } = body;

    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const cargo = await prisma.rhCargo.create({
      data: {
        userId: rh!.userId,
        nome: nome.trim(),
        descricao: descricao || null,
        ratPct: typeof ratPct === 'number' ? ratPct : 2.0,
      },
    });

    return NextResponse.json(cargo, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rh/cargos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
