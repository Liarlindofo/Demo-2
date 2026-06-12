import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json() as {
      nome?: string;
      valorDiaria?: number;
      diasPorMes?: number;
      quantidadeIdeal?: number;
      observacoes?: string;
    };

    const taxa = await prisma.rhTaxaLoja.updateMany({
      where: { id, userId: rh!.userId },
      data: {
        ...(body.nome !== undefined ? { nome: body.nome } : {}),
        ...(body.valorDiaria !== undefined ? { valorDiaria: body.valorDiaria } : {}),
        ...(body.diasPorMes !== undefined ? { diasPorMes: body.diasPorMes } : {}),
        ...(body.quantidadeIdeal !== undefined ? { quantidadeIdeal: body.quantidadeIdeal } : {}),
        ...(body.observacoes !== undefined ? { observacoes: body.observacoes } : {}),
      },
    });

    if (taxa.count === 0) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/rh/taxas/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const result = await prisma.rhTaxaLoja.updateMany({
      where: { id, userId: rh!.userId },
      data: { ativo: false },
    });

    if (result.count === 0) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/rh/taxas/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
