import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhDbUser } from '@/lib/rh-api-auth';

export const dynamic = 'force-dynamic';

async function getFuncionario(id: string, userId: string) {
  return prisma.rhFuncionario.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const funcionario = await getFuncionario(id, dbUser.id);
    if (!funcionario)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const bonificacoes = await prisma.rhBonificacaoTrimestral.findMany({
      where: { funcionarioId: id, ativo: true },
      orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }],
    });

    return NextResponse.json(bonificacoes);
  } catch (err) {
    console.error('[GET bonificacoes trimestrais]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const funcionario = await getFuncionario(id, dbUser.id);
    if (!funcionario)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const body = await req.json();
    const { valor, trimestre, ano, dataPagamento, motivo } = body;

    if (!valor || valor <= 0)
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    if (![1, 2, 3, 4].includes(Number(trimestre)))
      return NextResponse.json({ error: 'Trimestre inválido' }, { status: 400 });
    if (!ano || ano < 2000)
      return NextResponse.json({ error: 'Ano inválido' }, { status: 400 });
    if (!dataPagamento)
      return NextResponse.json({ error: 'Data de pagamento é obrigatória' }, { status: 400 });

    const existente = await prisma.rhBonificacaoTrimestral.findFirst({
      where: { funcionarioId: id, trimestre: Number(trimestre), ano: Number(ano), ativo: true },
    });
    if (existente)
      return NextResponse.json(
        { error: 'Já existe bonificação para este trimestre/ano' },
        { status: 409 }
      );

    const registradoPor = dbUser.fullName || dbUser.email || dbUser.id;

    const bonificacao = await prisma.rhBonificacaoTrimestral.create({
      data: {
        funcionarioId: id,
        valor: Number(valor),
        trimestre: Number(trimestre),
        ano: Number(ano),
        dataPagamento: new Date(dataPagamento),
        motivo: motivo || null,
        registradoPor,
      },
    });

    return NextResponse.json(bonificacao, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Já existe bonificação para este trimestre/ano' },
        { status: 409 }
      );
    }
    console.error('[POST bonificacoes trimestrais]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
