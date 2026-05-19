import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

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
  // Tabela INSS 2024 (progressiva)
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
  // Tabela IRRF 2024
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

function calcularEncargos(salarioBruto: number, ratPct: number) {
  // Patronal
  const inssPatronal = salarioBruto * 0.2;
  const rat = salarioBruto * (ratPct / 100);
  const fgts = salarioBruto * 0.08;
  const sistemaS = salarioBruto * 0.0558; // aprox. Sistema S (SESC/SENAC/SEBRAE etc.)
  const custoPatronalTotal = inssPatronal + rat + fgts + sistemaS;

  // Empregado
  const inssEmpregado = calcularINSSEmpregado(salarioBruto);
  const irrf = calcularIRRF(salarioBruto, inssEmpregado);
  const salarioLiquido = salarioBruto - inssEmpregado - irrf;

  // Custo total mensal para a empresa
  const custoTotalMensal = salarioBruto + custoPatronalTotal;

  // Custo anual (12 meses + 13° salário + 1/3 férias + FGTS sobre 13° e férias)
  const decimoTerceiro = salarioBruto + custoPatronalTotal;
  const ferias = salarioBruto * (4 / 3) + inssPatronal + rat + sistemaS + salarioBruto * 0.08;
  const custoAnual = custoTotalMensal * 12 + decimoTerceiro + ferias;

  return {
    salarioBruto,
    inssPatronal,
    rat,
    fgts,
    sistemaS,
    custoPatronalTotal,
    inssEmpregado,
    irrf,
    salarioLiquido,
    custoTotalMensal,
    custoAnual,
  };
}

export async function POST(req: Request) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { funcionarioId, salarioBruto: salarioParam, ratPct: ratParam } = body;

    let salario = salarioParam;
    let rat = ratParam ?? 2.0;

    // Se informou funcionarioId, busca os dados do banco
    if (funcionarioId) {
      const f = await prisma.rhFuncionario.findFirst({
        where: { id: funcionarioId, userId: dbUser.id },
        include: { cargo: { select: { ratPct: true } } },
      });
      if (!f) return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });
      salario = f.salarioBruto;
      rat = f.cargo.ratPct;
    }

    if (!salario || salario <= 0) {
      return NextResponse.json({ error: 'Salário inválido' }, { status: 400 });
    }

    return NextResponse.json(calcularEncargos(salario, rat));
  } catch (err) {
    console.error('[POST /api/rh/calculos/impostos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
