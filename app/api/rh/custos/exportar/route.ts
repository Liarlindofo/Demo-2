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
      },
      orderBy: { nome: 'asc' },
    });

    const linhas: string[] = [
      'Loja;Funcionário;Cargo;Salário Bruto;Encargos (R$);Encargos (%);Custo Total/Mês;Custo Anualizado',
    ];

    for (const loja of lojas) {
      for (const f of loja.funcionarios) {
        const comp = calcularComposicaoSalarial(f);
        const enc = calcularEncargosPatronais(comp.baseCalculoEncargos, f.cargo?.ratPct ?? 1.0, loja.fap);
        const custoMensal =
          comp.baseCalculoEncargos + enc.totalEncargos + comp.valorAlimentacao + comp.valorVT;
        linhas.push(
          [
            loja.nome,
            f.nome,
            f.cargo?.nome ?? '—',
            comp.totalBruto.toFixed(2).replace('.', ','),
            enc.totalEncargos.toFixed(2).replace('.', ','),
            enc.percentualSobreBase.toFixed(2).replace('.', ',') + '%',
            custoMensal.toFixed(2).replace('.', ','),
            (custoMensal * FATOR_ANUAL).toFixed(2).replace('.', ','),
          ].join(';')
        );
      }
    }

    const csv = '\uFEFF' + linhas.join('\n'); // BOM para Excel reconhecer UTF-8
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="custos-rh-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error('[GET /api/rh/custos/exportar]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
