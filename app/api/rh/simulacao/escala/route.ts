import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';
import { calcularComposicaoSalarial, calcularEncargosPatronais } from '@/lib/calculos-rh';

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

const FATOR_6x1_PARA_5x2 = 6 / 5;

function custoMensalFuncionario(f: {
  salarioBase: number;
  cargoResponsabilidade: boolean;
  bonificacaoAssiduidade: number;
  valorAlimentacao: number;
  valorVT: number;
  cargo: { ratPct: number };
  fap: number;
}) {
  const composicao = calcularComposicaoSalarial(f);
  const enc = calcularEncargosPatronais(composicao.baseCalculoEncargos, f.cargo.ratPct, f.fap);
  return (
    composicao.baseCalculoEncargos +
    enc.totalEncargos +
    composicao.valorAlimentacao +
    composicao.valorVT
  );
}

export async function POST(req: Request) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { lojaId, minimosPorTurno } = body as {
      lojaId?: string | null;
      minimosPorTurno: { manha: number; tarde: number; noite: number };
    };

    const where: Record<string, unknown> = { userId: dbUser.id, ativo: true, escala: '6x1' };
    if (lojaId) where.lojaId = lojaId;

    const funcionarios = await prisma.rhFuncionario.findMany({
      where,
      select: {
        turno: true,
        salarioBase: true,
        cargoResponsabilidade: true,
        bonificacaoAssiduidade: true,
        valorAlimentacao: true,
        valorVT: true,
        cargo: { select: { ratPct: true } },
        loja: { select: { fap: true } },
      },
    });

    const turnosMap: Record<string, { count: number; totalCusto: number }> = {
      manha: { count: 0, totalCusto: 0 },
      tarde: { count: 0, totalCusto: 0 },
      noite: { count: 0, totalCusto: 0 },
    };

    for (const f of funcionarios) {
      const turnoKey = f.turno === 'manhã' ? 'manha' : f.turno === 'integral' ? 'manha' : f.turno;
      if (turnosMap[turnoKey]) {
        turnosMap[turnoKey].count += 1;
        turnosMap[turnoKey].totalCusto += custoMensalFuncionario({
          ...f,
          fap: f.loja.fap,
        });
      }
    }

    const salarioMedioReferencia =
      funcionarios.length > 0
        ? funcionarios.reduce(
            (s, f) =>
              s +
              custoMensalFuncionario({ ...f, fap: f.loja.fap }),
            0
          ) / funcionarios.length
        : 1518;

    const turnosResult = (['manha', 'tarde', 'noite'] as const).map((turno) => {
      const atual6x1 = turnosMap[turno].count;
      const necessario5x2 = Math.ceil(atual6x1 * FATOR_6x1_PARA_5x2);
      const delta = necessario5x2 - atual6x1;
      const custoMedioTurno =
        atual6x1 > 0 ? turnosMap[turno].totalCusto / atual6x1 : salarioMedioReferencia;
      const minimoNecessario =
        minimosPorTurno[turno] > 0
          ? Math.max(necessario5x2, minimosPorTurno[turno])
          : necessario5x2;
      const deltaReal = Math.max(0, minimoNecessario - atual6x1);
      const impactoMensal = deltaReal * custoMedioTurno;

      return {
        turno,
        atual6x1,
        necessario5x2: minimoNecessario,
        delta: deltaReal,
        impactoMensal,
      };
    });

    const totalContratar = turnosResult.reduce((s, t) => s + t.delta, 0);
    const custoAdicionalMensal = turnosResult.reduce((s, t) => s + t.impactoMensal, 0);
    const custoAdicionalAnual = custoAdicionalMensal * 14.33;

    return NextResponse.json({
      turnos: turnosResult,
      totalContratar,
      custoAdicionalMensal,
      custoAdicionalAnual,
      salarioMedioReferencia,
    });
  } catch (err) {
    console.error('[POST /api/rh/simulacao/escala]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
