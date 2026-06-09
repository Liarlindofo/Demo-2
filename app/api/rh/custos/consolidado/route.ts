import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';
import {
  calcularComposicaoSalarial,
  calcularEncargosPatronais,
  FATOR_ANUAL,
} from '@/lib/calculos-rh';

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

export async function GET() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const lojas = await prisma.rhLoja.findMany({
      where: { userId: dbUser.id, ativo: true },
      include: {
        funcionarios: {
          where: { userId: dbUser.id, ativo: true },
          include: { cargo: { select: { nome: true, ratPct: true } } },
        },
        taxas: {
          where: { ativo: true },
          select: { id: true, nome: true, valorDiaria: true, diasPorMes: true, quantidadeIdeal: true },
        },
      },
      orderBy: { nome: 'asc' },
    });

    const consolidado = lojas.map((loja) => {
      const funcs = loja.funcionarios;
      const funcionariosDetalhes = funcs.map((f) => {
        const composicao = calcularComposicaoSalarial(f);
        const enc = calcularEncargosPatronais(
          composicao.baseCalculoEncargos,
          f.cargo?.ratPct ?? 1.0,
          loja.fap
        );
        const custoTotal =
          composicao.baseCalculoEncargos +
          enc.totalEncargos +
          composicao.valorAlimentacao +
          composicao.valorVT +
          (composicao.bonificacaoAssiduidade ?? 0);
        return {
          id: f.id,
          nome: f.nome,
          cargo: f.cargo?.nome ?? '—',
          salarioBruto: composicao.totalBruto,
          baseCalculoEncargos: composicao.baseCalculoEncargos,
          composicaoSalarial: composicao,
          encargos: enc.totalEncargos,
          percentualEncargos: enc.percentualSobreBase,
          custoTotal,
          custoAnual: custoTotal * FATOR_ANUAL,
        };
      });

      const totalFolhaBruta = funcionariosDetalhes.reduce((s, f) => s + f.salarioBruto, 0);
      const totalBaseEncargos = funcionariosDetalhes.reduce(
        (s, f) => s + f.baseCalculoEncargos,
        0
      );
      const totalEncargos = funcionariosDetalhes.reduce((s, f) => s + f.encargos, 0);
      const totalCustoReal = funcionariosDetalhes.reduce((s, f) => s + f.custoTotal, 0);
      const custoAnualizado = totalCustoReal * FATOR_ANUAL;

      const taxasDetalhes = loja.taxas.map((t) => ({
        id: t.id,
        nome: t.nome,
        valorDiaria: t.valorDiaria,
        diasPorMes: t.diasPorMes,
        quantidadeIdeal: t.quantidadeIdeal,
        custoMensal: t.valorDiaria * t.diasPorMes * t.quantidadeIdeal,
      }));
      const totalTaxas = taxasDetalhes.reduce((s, t) => s + t.custoMensal, 0);
      const totalCustoComTaxas = totalCustoReal + totalTaxas;

      return {
        lojaId: loja.id,
        lojaNome: loja.nome,
        fap: loja.fap,
        totalFuncionarios: funcs.length,
        totalFolhaBruta,
        totalBaseEncargos,
        totalSalarioBruto: totalFolhaBruta,
        totalEncargos,
        totalCustoReal,
        custoAnualizado,
        totalTaxas,
        totalCustoComTaxas,
        taxas: taxasDetalhes,
        funcionarios: funcionariosDetalhes,
      };
    });

    const rede = {
      totalFuncionarios: consolidado.reduce((s, l) => s + l.totalFuncionarios, 0),
      totalFolhaBruta: consolidado.reduce((s, l) => s + l.totalFolhaBruta, 0),
      totalBaseEncargos: consolidado.reduce((s, l) => s + l.totalBaseEncargos, 0),
      totalSalarioBruto: consolidado.reduce((s, l) => s + l.totalFolhaBruta, 0),
      totalEncargos: consolidado.reduce((s, l) => s + l.totalEncargos, 0),
      totalCustoReal: consolidado.reduce((s, l) => s + l.totalCustoReal, 0),
      custoAnualizado: consolidado.reduce((s, l) => s + l.custoAnualizado, 0),
      totalTaxas: consolidado.reduce((s, l) => s + l.totalTaxas, 0),
      totalCustoComTaxas: consolidado.reduce((s, l) => s + l.totalCustoComTaxas, 0),
    };

    return NextResponse.json({ lojas: consolidado, rede });
  } catch (err) {
    console.error('[GET /api/rh/custos/consolidado]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json() as { lojaId?: string; fap?: number; cargoId?: string; ratPct?: number };

    if (body.lojaId && body.fap !== undefined) {
      await prisma.rhLoja.updateMany({
        where: { id: body.lojaId, userId: dbUser.id },
        data: { fap: body.fap },
      });
    }
    if (body.cargoId && body.ratPct !== undefined) {
      await prisma.rhCargo.updateMany({
        where: { id: body.cargoId, userId: dbUser.id },
        data: { ratPct: body.ratPct },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/rh/custos/consolidado]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
