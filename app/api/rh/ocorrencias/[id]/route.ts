import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';


export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const existente = await prisma.rhOcorrencia.findFirst({
      where: { id, userId: rh!.userId },
    });
    if (!existente) return NextResponse.json({ error: 'Ocorrência não encontrada' }, { status: 404 });

    const updated = await prisma.rhOcorrencia.update({
      where: { id },
      data: {
        tipo: body.tipo ?? existente.tipo,
        data: body.data ? new Date(body.data) : existente.data,
        descricao: body.descricao ?? existente.descricao,
        gravidade: body.gravidade ?? existente.gravidade,
        testemunhas: body.testemunhas ?? existente.testemunhas,
        providencia: body.providencia ?? existente.providencia,
        cidAfastamento: body.cidAfastamento ?? existente.cidAfastamento,
        dataInicioAfastamento: body.dataInicioAfastamento
          ? new Date(body.dataInicioAfastamento)
          : existente.dataInicioAfastamento,
        dataFimAfastamento: body.dataFimAfastamento
          ? new Date(body.dataFimAfastamento)
          : existente.dataFimAfastamento,
        registradoPor: body.registradoPor ?? existente.registradoPor,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PUT /api/rh/ocorrencias/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    const existente = await prisma.rhOcorrencia.findFirst({
      where: { id, userId: rh!.userId },
    });
    if (!existente) return NextResponse.json({ error: 'Ocorrência não encontrada' }, { status: 404 });

    await prisma.rhOcorrencia.update({ where: { id }, data: { ativo: false } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/rh/ocorrencias/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
