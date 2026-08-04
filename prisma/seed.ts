// prisma/seed.ts — seed principal do projeto
// Adicione novos seeds aqui importando e chamando a função correspondente.

import { PrismaClient } from '@prisma/client';
import { seedSaiposFieldCatalog } from './seeds/seedSaiposFieldCatalog';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...\n');

  await seedSaiposFieldCatalog(prisma);

  console.log('\n🌱 Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
