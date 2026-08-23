/**
 * Backfill de Tipos de Avaliação para registros existentes.
 * Rodar após db push/migrate: npx tsx scripts/backfill-tipos-avaliacao.ts
 */
import { PrismaClient } from '@prisma/client';
import { defaultTipoPayload } from '../src/lib/bonificacao-defaults';

const prisma = new PrismaClient();

function isCentralLoja(nome: string) {
  return nome.toLowerCase().includes('central');
}

async function main() {
  const userIds = await prisma.bonificacaoTrimestre.findMany({
    select: { userId: true },
    distinct: ['userId'],
  });

  console.log(`Usuários com planos existentes: ${userIds.length}`);

  for (const { userId } of userIds) {
    let tipoGerente = await prisma.tipoAvaliacao.findFirst({
      where: { userId, nome: 'Gerente' },
    });
    if (!tipoGerente) {
      const padrao = defaultTipoPayload('PADRAO');
      tipoGerente = await prisma.tipoAvaliacao.create({
        data: {
          userId,
          nome: 'Gerente',
          modoCalculo: 'PADRAO',
          metricas: padrao.metricas as object,
          descontos: padrao.descontos as object,
          faixas: padrao.faixas as object,
        },
      });
      console.log(`[${userId}] Criado tipo "Gerente"`);
    }

    let tipoCentral = await prisma.tipoAvaliacao.findFirst({
      where: { userId, nome: 'Central/Escritório' },
    });
    if (!tipoCentral) {
      const media = defaultTipoPayload('MEDIA');
      tipoCentral = await prisma.tipoAvaliacao.create({
        data: {
          userId,
          nome: 'Central/Escritório',
          modoCalculo: 'MEDIA',
          metricas: media.metricas as object,
          descontos: media.descontos as object,
          faixas: media.faixas as object,
        },
      });
      console.log(`[${userId}] Criado tipo "Central/Escritório"`);
    }

    const planos = await prisma.bonificacaoTrimestre.findMany({
      where: { userId },
    });

    for (const plano of planos) {
      const updates: { tipoAvaliacaoId?: string; dados?: object } = {};
      const central = isCentralLoja(plano.lojaNome);

      if (!plano.tipoAvaliacaoId) {
        updates.tipoAvaliacaoId = central ? tipoCentral.id : tipoGerente.id;
      }

      const dados = plano.dados as Record<string, unknown>;
      if (!dados.faixas || !dados.modoCalculo) {
        const snapshot = central
          ? { modoCalculo: 'MEDIA', ...defaultTipoPayload('MEDIA') }
          : { modoCalculo: 'PADRAO', ...defaultTipoPayload('PADRAO') };

        updates.dados = {
          modoCalculo: central ? 'MEDIA' : 'PADRAO',
          metricas: dados.metricas ?? snapshot.metricas.map(m => ({ ...m, pontos: (m as { pontos?: object }).pontos ?? {} })),
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
