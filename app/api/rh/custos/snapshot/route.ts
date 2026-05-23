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

export async function POST() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const agora = new Date();
    const mes = agora.getMonth() + 1;
    const ano = agora.getFullYear();

    const lojas = await prisma.rhLoja.findMany({
      where: { userId: dbUser.id, ativo: true },
      include: {
        funcionarios: {
          where: { userId: dbUser.id, ativo: true },
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
        const enc = calcularEncargosPatronais(comp.baseCalculoEncargos, f.cargo.ratPct, loja.fap);
        totalSalarioBruto += comp.totalBruto;
        totalEncargos += enc.totalEncargos;
        totalCustoReal +=
          comp.baseCalculoEncargos + enc.totalEncargos + comp.valorAlimentacao + comp.valorVT;
      }

      return prisma.rhSnapshotCustoMensal.upsert({
        where: { lojaId_mes_ano_userId: { lojaId: loja.id, mes, ano, userId: dbUser.id } },
        create: {
          lojaId: loja.id, userId: dbUser.id, mes, ano,
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
