import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhDbUser } from '@/lib/rh-api-auth';
import { mesAnoAtual } from '@/lib/seed-assiduidade';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ funcionarioId: string }> }
) {
  try {
    const { funcionarioId } = await params;
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const funcionario = await prisma.rhFuncionario.findFirst({
      where: { id: funcionarioId, userId: dbUser.id },
    });
    if (!funcionario)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const body = await req.json();
    const { recebeu, motivo, mes: mesParam, ano: anoParam, valorDireito } = body;
    const atual = mesAnoAtual();
    const mes = Number(mesParam ?? atual.mes);
    const ano = Number(anoParam ?? atual.ano);

    if (typeof recebeu !== 'boolean') {
      return NextResponse.json({ error: 'recebeu é obrigatório' }, { status: 400 });
    }

    const alteradoPor = dbUser.fullName || dbUser.email || dbUser.id;

    const registro = await prisma.rhBonificacaoAssiduidade.upsert({
      where: { funcionarioId_mes_ano: { funcionarioId, mes, ano } },
      create: {
        funcionarioId,
        mes,
        ano,
        valorDireito: valorDireito ?? 200,
        recebeu,
        motivo: recebeu ? null : motivo || null,
        registradoPor: alteradoPor,
      },
      update: {
        recebeu,
        motivo: recebeu ? null : motivo || null,
        ...(valorDireito !== undefined && { valorDireito: Number(valorDireito) }),
        registradoPor: alteradoPor,
      },
    });

    return NextResponse.json(registro);
  } catch (err) {
    console.error('[PATCH assiduidade funcionario]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
