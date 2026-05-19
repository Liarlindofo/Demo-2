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

// 6x1 → 5x2: para manter o mesmo nível de cobertura diária, precisa de 20% mais funcionários
// (cada 6x1 trabalha 6/7 dias; cada 5x2 trabalha 5/7 dias → fator = 6/5 = 1.2)
const FATOR_6x1_PARA_5x2 = 6 / 5;

export async function POST(req: Request) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { lojaId, minimosPorTurno } = body as {
      lojaId?: string | null;
      minimosPorTurno: { manha: number; tarde: number; noite: number };
    };

    // Busca funcionários ativos em escala 6x1
    const where: Record<string, unknown> = { userId: dbUser.id, ativo: true, escala: '6x1' };
    if (lojaId) where.lojaId = lojaId;

    const funcionarios = await prisma.rhFuncionario.findMany({
      where,
      select: { turno: true, salarioBruto: true },
    });

    const turnosMap: Record<string, { count: number; totalSalario: number }> = {
      manha: { count: 0, totalSalario: 0 },
      tarde: { count: 0, totalSalario: 0 },
      noite: { count: 0, totalSalario: 0 },
    };

    for (const f of funcionarios) {
      const turnoKey = f.turno === 'manhã' ? 'manha' : f.turno === 'integral' ? 'manha' : f.turno;
      if (turnosMap[turnoKey]) {
        turnosMap[turnoKey].count += 1;
        turnosMap[turnoKey].totalSalario += f.salarioBruto;
      }
    }

    const salarioMedioReferencia =
      funcionarios.length > 0
        ? funcionarios.reduce((s, f) => s + f.salarioBruto, 0) / funcionarios.length
        : 1518; // salário mínimo como fallback

    const ENCARGOS_PATRONAIS = 1.44; // ~44% encargos sobre salário bruto

    const turnosResult = (['manha', 'tarde', 'noite'] as const).map((turno) => {
      const atual6x1 = turnosMap[turno].count;
      const necessario5x2 = Math.ceil(atual6x1 * FATOR_6x1_PARA_5x2);
      const delta = necessario5x2 - atual6x1;
      const salarioMedioTurno =
        atual6x1 > 0 ? turnosMap[turno].totalSalario / atual6x1 : salarioMedioReferencia;
      const minimoNecessario =
        minimosPorTurno[turno] > 0
          ? Math.max(necessario5x2, minimosPorTurno[turno])
          : necessario5x2;
      const deltaReal = Math.max(0, minimoNecessario - atual6x1);
      const impactoMensal = deltaReal * salarioMedioTurno * ENCARGOS_PATRONAIS;

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
    const custoAdicionalAnual = custoAdicionalMensal * 14.33; // 12 meses + 13° + férias

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
