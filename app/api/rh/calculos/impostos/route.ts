import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';
import {
  calcularComposicaoSalarial,
  calcularEncargosPatronais,
  custoMensalEmpresaComBonificacoes,
  totalBrutoComBonificacoes,
} from '@/lib/calculos-rh';
import { carregarBonificacoesComposicao } from '@/lib/rh-bonificacoes-composicao';

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

function calcularINSSEmpregado(salario: number): number {
  const faixas = [
    { limite: 1412.0, aliquota: 0.075 },
    { limite: 2666.68, aliquota: 0.09 },
    { limite: 4000.03, aliquota: 0.12 },
    { limite: 7786.02, aliquota: 0.14 },
  ];

  let inss = 0;
  let base = salario;
  let anterior = 0;

  for (const { limite, aliquota } of faixas) {
    if (base <= 0) break;
    const faixa = Math.min(base, limite - anterior);
    inss += faixa * aliquota;
    base -= faixa;
    anterior = limite;
    if (salario <= limite) break;
  }

  return inss;
}

function calcularIRRF(salario: number, inss: number): number {
  const base = salario - inss;
  const faixas = [
    { limite: 2259.2, aliquota: 0, deducao: 0 },
    { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
    { limite: 3751.05, aliquota: 0.15, deducao: 381.44 },
    { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
    { limite: Infinity, aliquota: 0.275, deducao: 896.0 },
  ];

  for (const { limite, aliquota, deducao } of faixas) {
    if (base <= limite) {
      return Math.max(0, base * aliquota - deducao);
    }
  }
  return 0;
}

export async function POST(req: Request) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { funcionarioId, ratPct: ratParam } = body;

    let composicaoInput = {
      salarioBase: Number(body.salarioBase ?? 0),
      cargoResponsabilidade: Boolean(body.cargoResponsabilidade),
      bonificacaoAssiduidade: Number(body.bonificacaoAssiduidade ?? 0),
      valorAlimentacao: Number(body.valorAlimentacao ?? 0),
      valorVT: Number(body.valorVT ?? 0),
    };
    let rat = ratParam ?? 2.0;
    let fap = 1.0;

    if (funcionarioId) {
      const f = await prisma.rhFuncionario.findFirst({
        where: { id: funcionarioId, userId: dbUser.id },
        include: { cargo: { select: { ratPct: true } }, loja: { select: { fap: true } } },
      });
      if (!f) return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });
      composicaoInput = {
        salarioBase: f.salarioBase,
        cargoResponsabilidade: f.cargoResponsabilidade,
        bonificacaoAssiduidade: f.bonificacaoAssiduidade,
        valorAlimentacao: f.valorAlimentacao,
        valorVT: f.valorVT,
      };
      rat = f.cargo.ratPct;
      fap = f.loja.fap;
    }

    const composicao = calcularComposicaoSalarial(composicaoInput);
    const base = composicao.baseCalculoEncargos;

    if (!base || base <= 0) {
      return NextResponse.json({ error: 'Salário inválido' }, { status: 400 });
    }

    const enc = calcularEncargosPatronais(base, rat, fap);
    const inssEmpregado = calcularINSSEmpregado(base);
    const irrf = calcularIRRF(base, inssEmpregado);
    const salarioLiquido = base - inssEmpregado - irrf;

    const bonificacoesComposicao = funcionarioId
      ? await carregarBonificacoesComposicao(funcionarioId)
      : null;
    const bonificacoesVariaveis = bonificacoesComposicao?.totalVariavel ?? 0;

    const custoTotalMensal = bonificacoesComposicao
      ? custoMensalEmpresaComBonificacoes(composicao, enc.totalEncargos, bonificacoesComposicao)
      : composicao.baseCalculoEncargos +
        enc.totalEncargos +
        composicao.valorAlimentacao +
        composicao.valorVT;

    const decimoTerceiro = composicao.baseCalculoEncargos + enc.totalEncargos;
    const ferias =
      composicao.baseCalculoEncargos * (4 / 3) +
      enc.inssPatronal +
      enc.rat +
      enc.sistemaS +
      composicao.baseCalculoEncargos * 0.08;
    const custoAnual = custoTotalMensal * 12 + decimoTerceiro + ferias;

    const salarioBruto = bonificacoesComposicao
      ? totalBrutoComBonificacoes(composicao, bonificacoesComposicao)
      : composicao.totalBruto;

    return NextResponse.json({
      composicaoSalarial: composicao,
      salarioBruto,
      baseCalculoEncargos: base,
      bonificacoesVariaveis,
      bonificacoesComposicao,
      inssPatronal: enc.inssPatronal,
      rat: enc.rat,
      fgts: enc.fgts,
      sistemaS: enc.sistemaS,
      custoPatronalTotal: enc.totalEncargos,
      inssEmpregado,
      irrf,
      salarioLiquido,
      custoTotalMensal,
      custoAnual,
    });
  } catch (err) {
    console.error('[POST /api/rh/calculos/impostos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
