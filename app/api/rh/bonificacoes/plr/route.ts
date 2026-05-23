import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhDbUser } from '@/lib/rh-api-auth';
import { trimestreAtual } from '@/lib/seed-assiduidade';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const lojaId = searchParams.get('lojaId');
    const trimestre = searchParams.get('trimestre');
    const ano = searchParams.get('ano');

    const where: Record<string, unknown> = {
      loja: { userId: dbUser.id },
    };
    if (lojaId) where.lojaId = lojaId;
    if (trimestre) where.trimestre = Number(trimestre);
    if (ano) where.ano = Number(ano);

    const plrs = await prisma.rhPLRTrimestral.findMany({
      where,
      include: {
        loja: { select: { id: true, nome: true } },
        _count: { select: { pagamentos: true } },
      },
      orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }],
    });

    return NextResponse.json(plrs);
  } catch (err) {
    console.error('[GET plr]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const dbUser = await getRhDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const {
      lojaId,
      valorTotal,
      valorPorFuncionario,
      trimestre: trimParam,
      ano: anoParam,
      observacao,
      metaBatida = true,
      viaIA = false,
      registradoPor,
    } = body;

    if (!lojaId) return NextResponse.json({ error: 'lojaId é obrigatório' }, { status: 400 });

    const loja = await prisma.rhLoja.findFirst({
      where: { id: lojaId, userId: dbUser.id, ativo: true },
    });
    if (!loja) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

    const trimestre = Number(trimParam ?? trimestreAtual());
    const ano = Number(anoParam ?? new Date().getFullYear());

    if (![1, 2, 3, 4].includes(trimestre)) {
      return NextResponse.json({ error: 'Trimestre inválido' }, { status: 400 });
    }

    const existente = await prisma.rhPLRTrimestral.findFirst({
      where: { lojaId, trimestre, ano },
    });
    if (existente) {
      return NextResponse.json(
        { error: `PLR Q${trimestre}/${ano} já lançado para esta loja` },
        { status: 409 }
      );
    }

    const funcionarios = await prisma.rhFuncionario.findMany({
      where: { userId: dbUser.id, lojaId, ativo: true },
      select: { id: true, nome: true },
    });

    if (funcionarios.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum funcionário ativo nesta loja' },
        { status: 400 }
      );
    }

    let total = Number(valorTotal);
    let porFuncionario = Number(valorPorFuncionario);

    if (porFuncionario > 0 && !total) {
      total = porFuncionario * funcionarios.length;
    } else if (total > 0 && !porFuncionario) {
      porFuncionario = total / funcionarios.length;
    } else if (!total || total <= 0) {
      return NextResponse.json({ error: 'valorTotal ou valorPorFuncionario inválido' }, { status: 400 });
    } else {
      porFuncionario = total / funcionarios.length;
    }

    const alteradoPor = registradoPor || dbUser.fullName || dbUser.email || dbUser.id;

    const resultado = await prisma.$transaction(async (tx) => {
      const plr = await tx.rhPLRTrimestral.create({
        data: {
          lojaId,
          trimestre,
          ano,
          valorTotal: total,
          valorPorFuncionario: porFuncionario,
          metaBatida: Boolean(metaBatida),
          observacao: observacao || null,
          registradoPor: alteradoPor,
          viaIA: Boolean(viaIA),
        },
        include: { loja: { select: { id: true, nome: true } } },
      });

      const pagamentos = await Promise.all(
        funcionarios.map((f) =>
          tx.rhPLRPagamento.create({
            data: {
              plrId: plr.id,
              funcionarioId: f.id,
              valor: porFuncionario,
            },
          })
        )
      );

      return { plr, pagamentos };
    });

    return NextResponse.json(
      {
        sucesso: true,
        plr: resultado.plr,
        totalFuncionarios: funcionarios.length,
        valorPorFuncionario: porFuncionario,
        valorTotal: total,
        contemplados: funcionarios.map((f) => f.nome),
        pagamentos: resultado.pagamentos.length,
        mensagem: `PLR Q${trimestre}/${ano} lançado para ${loja.nome}. ${funcionarios.length} funcionários receberão ${porFuncionario.toFixed(2)} cada (total ${total.toFixed(2)}).`,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return NextResponse.json({ error: 'PLR já existe para este trimestre/ano' }, { status: 409 });
    }
    console.error('[POST plr]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
