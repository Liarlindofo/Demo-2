import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';


export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bonificacaoId: string }> }
) {
  try {
    const { id, bonificacaoId } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const funcionario = await prisma.rhFuncionario.findFirst({
      where: { id, userId: rh!.userId },
    });
    if (!funcionario)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const existente = await prisma.rhBonificacaoTrimestral.findFirst({
      where: { id: bonificacaoId, funcionarioId: id, ativo: true },
    });
    if (!existente)
      return NextResponse.json({ error: 'Bonificação não encontrada' }, { status: 404 });

    const body = await req.json();
    const { valor, trimestre, ano, dataPagamento, motivo } = body;

    if (trimestre !== undefined && ano !== undefined) {
      const dup = await prisma.rhBonificacaoTrimestral.findFirst({
        where: {
          funcionarioId: id,
          trimestre: Number(trimestre),
          ano: Number(ano),
          ativo: true,
          id: { not: bonificacaoId },
        },
      });
      if (dup)
        return NextResponse.json(
          { error: 'Já existe bonificação para este trimestre/ano' },
          { status: 409 }
        );
    }

    const bonificacao = await prisma.rhBonificacaoTrimestral.update({
      where: { id: bonificacaoId },
      data: {
        ...(valor !== undefined && { valor: Number(valor) }),
        ...(trimestre !== undefined && { trimestre: Number(trimestre) }),
        ...(ano !== undefined && { ano: Number(ano) }),
        ...(dataPagamento !== undefined && { dataPagamento: new Date(dataPagamento) }),
        ...(motivo !== undefined && { motivo: motivo || null }),
      },
    });

    return NextResponse.json(bonificacao);
  } catch (err) {
    console.error('[PUT bonificacao]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; bonificacaoId: string }> }
) {
  try {
    const { id, bonificacaoId } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const funcionario = await prisma.rhFuncionario.findFirst({
      where: { id, userId: rh!.userId },
    });
    if (!funcionario)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const existente = await prisma.rhBonificacaoTrimestral.findFirst({
      where: { id: bonificacaoId, funcionarioId: id, ativo: true },
    });
    if (!existente)
      return NextResponse.json({ error: 'Bonificação não encontrada' }, { status: 404 });

    await prisma.rhBonificacaoTrimestral.update({
      where: { id: bonificacaoId },
      data: { ativo: false },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE bonificacao]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
