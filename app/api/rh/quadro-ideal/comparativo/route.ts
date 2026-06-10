import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';
import { cargoFamilia } from '@/lib/rh-cargo-familia';

export const dynamic = 'force-dynamic';

async function getDbUser() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;
  return syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });
}

export async function GET(req: NextRequest) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const lojaId = req.nextUrl.searchParams.get('lojaId');
    if (!lojaId) return NextResponse.json({ error: 'lojaId é obrigatório' }, { status: 400 });

    const quadro = await prisma.rhQuadroIdeal.findFirst({
      where: { lojaId, userId: dbUser.id, ativo: true },
      include: {
        setores: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' },
          include: {
            posicoes: {
              where: { ativo: true },
              include: { cargo: { select: { id: true, nome: true } } },
            },
          },
        },
      },
    });

    if (!quadro) return NextResponse.json({ quadro: null, setores: [], resumo: null });

    // Carregar funcionários ativos da loja (com nome do cargo para família)
    const funcionarios = await prisma.rhFuncionario.findMany({
      where: { userId: dbUser.id, lojaId, ativo: true },
      select: { cargoId: true, turno: true, cargo: { select: { nome: true } } },
    });

    // Construir mapa família+turno → count real
    // "Pizzaiolo I", "Pizzaiolo II", "Pizzaiolo III" → todos contam como família "Pizzaiolo"
    const realMap = new Map<string, number>();
    for (const f of funcionarios) {
      const familia = f.cargo ? cargoFamilia(f.cargo.nome) : (f.cargoId ?? '');
      const key = `${familia}::${f.turno}`;
      realMap.set(key, (realMap.get(key) ?? 0) + 1);
    }

    let totalIdeal = 0;
    let totalOk = 0;
    let totalGaps = 0;

    const setoresComparativo = quadro.setores.map((setor) => ({
      id: setor.id,
      nome: setor.nome,
      posicoes: setor.posicoes.map((p) => {
        const key = `${cargoFamilia(p.cargo?.nome ?? '')}::${p.turno}`;
        const real = realMap.get(key) ?? 0;
        const diff = real - p.quantidadeIdeal;
        const situacao = diff >= 0 ? 'ok' : diff === -1 ? 'atencao' : 'critico';

        totalIdeal += p.quantidadeIdeal;
        if (situacao === 'ok') totalOk += p.quantidadeIdeal;
        else totalGaps += Math.abs(diff);

        return {
          id: p.id,
          cargo: p.cargo,
          turno: p.turno,
          quantidadeIdeal: p.quantidadeIdeal,
          quantidadeReal: real,
          diff,
          situacao,
          observacoes: p.observacoes,
        };
      }),
    }));

    return NextResponse.json({
      quadro: { id: quadro.id, nome: quadro.nome, lojaId: quadro.lojaId },
      setores: setoresComparativo,
      resumo: { totalIdeal, totalOk, totalGaps },
    });
  } catch (err) {
    console.error('[GET /api/rh/quadro-ideal/comparativo]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
