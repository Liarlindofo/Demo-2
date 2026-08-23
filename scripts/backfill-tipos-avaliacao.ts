/**
 * Backfill: tipos de avaliação por loja + vínculo de planos trimestrais.
 * Rodar após db push/migrate: npx tsx scripts/backfill-tipos-avaliacao.ts
 */
import { PrismaClient } from '@prisma/client';
import { defaultTipoPayload } from '../src/lib/bonificacao-defaults';

const prisma = new PrismaClient();

function isCentralLoja(nome: string) {
  return nome.toLowerCase().includes('central');
}

async function ensureTipoLoja(
  userId: string,
  lojaId: string,
  lojaNome: string,
  globalTemplates: Map<string, { modoCalculo: string; metricas: object; descontos: object; faixas: object }>,
) {
  const central = isCentralLoja(lojaNome);
  const nomeTipo = central ? 'Central/Escritório' : 'Gerente';
  const modoCalculo = central ? 'MEDIA' : 'PADRAO';

  let tipo = await prisma.tipoAvaliacao.findFirst({
    where: { userId, lojaId, nome: nomeTipo },
  });

  if (!tipo) {
    const fromGlobal = globalTemplates.get(nomeTipo);
    const defaults = defaultTipoPayload(modoCalculo as 'PADRAO' | 'MEDIA');
    tipo = await prisma.tipoAvaliacao.create({
      data: {
        userId,
        lojaId,
        lojaNome,
        nome: nomeTipo,
        modoCalculo,
        metricas: (fromGlobal?.metricas ?? defaults.metricas) as object,
        descontos: (fromGlobal?.descontos ?? defaults.descontos) as object,
        faixas: (fromGlobal?.faixas ?? defaults.faixas) as object,
      },
    });
    console.log(`[${userId}] Criado tipo "${nomeTipo}" para loja ${lojaNome}`);
  }

  return tipo;
}

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { bonificacaoTrimestres: { some: {} } },
        { tiposAvaliacao: { some: {} } },
      ],
    },
    select: { id: true },
  });

  console.log(`Usuários a processar: ${users.length}`);

  for (const { id: userId } of users) {
    const globais = await prisma.tipoAvaliacao.findMany({
      where: { userId, lojaId: null },
    });

    const globalTemplates = new Map<string, { modoCalculo: string; metricas: object; descontos: object; faixas: object }>();
    for (const g of globais) {
      globalTemplates.set(g.nome, {
        modoCalculo: g.modoCalculo,
        metricas: g.metricas as object,
        descontos: g.descontos as object,
        faixas: g.faixas as object,
      });
    }

    const lojas = await prisma.rhLoja.findMany({
      where: { userId },
      orderBy: { nome: 'asc' },
    });

    const tipoPorLoja = new Map<string, string>();

    for (const loja of lojas) {
      const tipo = await ensureTipoLoja(userId, loja.id, loja.nome, globalTemplates);
      tipoPorLoja.set(loja.id, tipo.id);
      if (loja.nome) tipoPorLoja.set(loja.nome, tipo.id);
    }

    const planos = await prisma.bonificacaoTrimestre.findMany({ where: { userId } });

    for (const plano of planos) {
      const central = isCentralLoja(plano.lojaNome);
      const nomeTipo = central ? 'Central/Escritório' : 'Gerente';
      const lojaId = plano.lojaId ?? lojas.find(l => l.nome === plano.lojaNome)?.id ?? null;

      let tipoId = lojaId ? tipoPorLoja.get(lojaId) : tipoPorLoja.get(plano.lojaNome);
      if (!tipoId && lojaId) {
        const tipo = await ensureTipoLoja(userId, lojaId, plano.lojaNome, globalTemplates);
        tipoId = tipo.id;
        tipoPorLoja.set(lojaId, tipo.id);
        tipoPorLoja.set(plano.lojaNome, tipo.id);
      }

      const dados = plano.dados as Record<string, unknown>;
      const updates: { tipoAvaliacaoId?: string; lojaId?: string; dados?: object } = {};

      if (tipoId && plano.tipoAvaliacaoId !== tipoId) {
        updates.tipoAvaliacaoId = tipoId;
      }

      if (lojaId && plano.lojaId !== lojaId) {
        updates.lojaId = lojaId;
      }

      if (!dados.faixas || !dados.modoCalculo) {
        const modo = central ? 'MEDIA' : 'PADRAO';
        const snapshot = defaultTipoPayload(modo);
        updates.dados = {
          modoCalculo: modo,
          metricas: dados.metricas ?? snapshot.metricas.map(m => ({
            ...m,
            pontos: (m as { pontos?: object }).pontos ?? {},
          })),
          descontos: (dados.descontos as unknown[])?.map((d: unknown) => {
            const row = d as { id: string; nome: string; valor: number; pontos?: number };
            return {
              ...row,
              pontos: row.pontos ?? (row.valor > 0 ? row.valor : 20),
              valor: row.valor > 0 && row.valor <= 20 ? row.valor : 0,
            };
          }) ?? snapshot.descontos.map(d => ({ id: d.id, nome: d.nome, valor: 0, pontos: d.valor })),
          faixas: snapshot.faixas,
        };
      }

      if (Object.keys(updates).length > 0) {
        await prisma.bonificacaoTrimestre.update({
          where: { id: plano.id },
          data: updates,
        });
        console.log(`[${userId}] Plano ${plano.lojaNome} T${plano.trimestre}/${plano.ano} → tipo ${nomeTipo}`);
      }
    }

    if (globais.length > 0) {
      const vinculados = await prisma.bonificacaoTrimestre.count({
        where: { userId, tipoAvaliacaoId: { in: globais.map(g => g.id) } },
      });
      if (vinculados === 0) {
        await prisma.tipoAvaliacao.deleteMany({ where: { userId, lojaId: null } });
        console.log(`[${userId}] Removidos ${globais.length} tipo(s) global(is) obsoleto(s)`);
      }
    }
  }

  console.log('Backfill concluído.');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
