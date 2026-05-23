import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhDbUser } from '@/lib/rh-api-auth';
import { seedAssiduidadeMes, mesAnoAtual } from '@/lib/seed-assiduidade';

export const dynamic = 'force-dynamic';

const MESES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export async function GET(req: NextRequest) {
  try {
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const atual = mesAnoAtual();
    const mes = Number(searchParams.get('mes') || atual.mes);
    const ano = Number(searchParams.get('ano') || atual.ano);
    const lojaId = searchParams.get('lojaId');

    const count = await prisma.rhBonificacaoAssiduidade.count({
      where: {
        mes,
        ano,
        funcionario: { userId: dbUser.id, ativo: true },
      },
    });

    if (count === 0) {
      await seedAssiduidadeMes(dbUser.id, mes, ano);
    }

    const registros = await prisma.rhBonificacaoAssiduidade.findMany({
      where: {
        mes,
        ano,
        funcionario: {
          userId: dbUser.id,
          ativo: true,
          ...(lojaId ? { lojaId } : {}),
        },
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            loja: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: { funcionario: { nome: 'asc' } },
    });

    const comAssiduidade = registros.filter((r) => r.recebeu).length;
    const semAssiduidade = registros.filter((r) => !r.recebeu).length;

    return NextResponse.json({
      mes,
      ano,
      mesLabel: MESES[mes],
      resumo: {
        total: registros.length,
        comAssiduidade,
        semAssiduidade,
      },
      registros: registros.map((r) => ({
        id: r.id,
        funcionarioId: r.funcionarioId,
        nome: r.funcionario.nome,
        loja: r.funcionario.loja,
        valorDireito: r.valorDireito,
        recebeu: r.recebeu,
        motivo: r.motivo,
        viaIA: r.viaIA,
        registradoPor: r.registradoPor,
      })),
    });
  } catch (err) {
    console.error('[GET assiduidade]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const {
      funcionarioIds,
      recebeu,
      motivo,
      mes: mesParam,
      ano: anoParam,
      viaIA = false,
      registradoPor,
    } = body;

    const atual = mesAnoAtual();
    const mes = Number(mesParam ?? atual.mes);
    const ano = Number(anoParam ?? atual.ano);

    if (!Array.isArray(funcionarioIds) || funcionarioIds.length === 0) {
      return NextResponse.json({ error: 'funcionarioIds é obrigatório' }, { status: 400 });
    }
    if (typeof recebeu !== 'boolean') {
      return NextResponse.json({ error: 'recebeu é obrigatório' }, { status: 400 });
    }

    const funcionarios = await prisma.rhFuncionario.findMany({
      where: { userId: dbUser.id, id: { in: funcionarioIds }, ativo: true },
      select: { id: true, nome: true },
    });

    if (funcionarios.length === 0) {
      return NextResponse.json({ error: 'Nenhum funcionário encontrado' }, { status: 404 });
    }

    const alteradoPor = registradoPor || dbUser.fullName || dbUser.email || dbUser.id;

    const resultados = await Promise.all(
      funcionarios.map((f) =>
        prisma.rhBonificacaoAssiduidade.upsert({
          where: {
            funcionarioId_mes_ano: { funcionarioId: f.id, mes, ano },
          },
          create: {
            funcionarioId: f.id,
            mes,
            ano,
            valorDireito: 200,
            recebeu,
            motivo: recebeu ? null : motivo || null,
            registradoPor: alteradoPor,
            viaIA: Boolean(viaIA),
          },
          update: {
            recebeu,
            motivo: recebeu ? null : motivo || null,
            registradoPor: alteradoPor,
            viaIA: Boolean(viaIA),
          },
        })
      )
    );

    return NextResponse.json({
      sucesso: true,
      mes,
      ano,
      atualizados: funcionarios.map((f) => f.nome),
      registros: resultados.length,
      mensagem: recebeu
        ? `Assiduidade confirmada para ${funcionarios.length} funcionário(s) em ${MESES[mes]}/${ano}.`
        : `${funcionarios.length} funcionário(s) sem assiduidade em ${MESES[mes]}/${ano}.`,
    });
  } catch (err) {
    console.error('[POST assiduidade]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
