/**
 * Seed one-time: popula ChecklistCategory + ChecklistItemTemplate
 * a partir do array estático CHECKLIST_TOPICS (src/lib/checklist-data.ts).
 *
 * Uso na VPS (após git pull):
 *   npx tsx scripts/seed-checklist-categorias.ts
 *
 * O script é idempotente: se já existirem categorias no banco, aborta
 * para não duplicar dados.
 */

import { PrismaClient } from '@prisma/client';
import { CHECKLIST_TOPICS } from '../src/lib/checklist-data.js';

const prisma = new PrismaClient();

async function main() {
  const existentes = await prisma.checklistCategory.count();

  if (existentes > 0) {
    console.log(`ℹ️  Já existem ${existentes} categorias no banco. Seed ignorado (não duplica).`);
    console.log('   Se quiser re-rodar, apague as linhas das tabelas primeiro.');
    return;
  }

  console.log('🌱 Iniciando seed do catálogo de checklist...');

  for (let catIdx = 0; catIdx < CHECKLIST_TOPICS.length; catIdx++) {
    const topic = CHECKLIST_TOPICS[catIdx];

    const categoria = await prisma.checklistCategory.create({
      data: {
        nome:    topic.name,
        ordem:   catIdx + 1,
        itens: {
          create: topic.items.map((item, itemIdx) => ({
            nome:            item.name,
            weight:          item.weight,
            fotoObrigatoria: false,
            ativo:           true,
            ordem:           itemIdx + 1,
          })),
        },
      },
      include: { itens: true },
    });

    console.log(`  ✅ ${categoria.nome} → ${categoria.itens.length} itens`);
  }

  const totalItens = await prisma.checklistItemTemplate.count();
  console.log(`\n✅ Seed concluído! ${CHECKLIST_TOPICS.length} categorias, ${totalItens} itens.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
