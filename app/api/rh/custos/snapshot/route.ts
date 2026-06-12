import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import {
  calcularComposicaoSalarial,
  calcularEncargosPatronais,
  FATOR_ANUAL,
} from '@/lib/calculos-rh';

export const dynamic = 'force-dynamic';


export async function POST() {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const agora = new Date();
    const mes = agora.getMonth() + 1;
    const ano = agora.getFullYear();

    const lojas = await prisma.rhLoja.findMany({
      where: { userId: rh!.userId, ativo: true },
      include: {
        funcionarios: {
          where: { userId: rh!.userId, ativo: true },
          include: { cargo: { select: { ratPct: true } } },
        },
      },
    });

    const upserts = lojas.map((loja) => {
      const funcs = loja.funcionarios;
      let totalSalarioBruto = 0;
      let totalEncargos = 0;
      let totalCustoReal = 0;
      for (const f of funcs) {
        const comp = calcularComposicaoSalarial(f);
        const enc = calcularEncargosPatronais(comp.baseCalculoEncargos, f.cargo?.ratPct ?? 1.0, loja.fap);
        totalSalarioBruto += comp.totalBruto;
        totalEncargos += enc.totalEncargos;
        totalCustoReal +=
          comp.baseCalculoEncargos + enc.totalEncargos + comp.valorAlimentacao + comp.valorVT;
      }

      return prisma.rhSnapshotCustoMensal.upsert({
        where: { lojaId_mes_ano_userId: { lojaId: loja.id, mes, ano, userId: rh!.userId } },
        create: {
          lojaId: loja.id, userId: rh!.userId, mes, ano,
          totalFuncionarios: funcs.length,
          totalSalarioBruto, totalEncargos, totalCustoReal,
          custoAnualizado: totalCustoReal * FATOR_ANUAL,
        },
        update: {
          totalFuncionarios: funcs.length,
          totalSalarioBruto, totalEncargos, totalCustoReal,
          custoAnualizado: totalCustoReal * FATOR_ANUAL,
          geradoEm: new Date(),
        },
      });
    });

    await prisma.$transaction(upserts);

    return NextResponse.json({ ok: true, mes, ano, lojas: lojas.length });
  } catch (err) {
    console.error('[POST /api/rh/custos/snapshot]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
