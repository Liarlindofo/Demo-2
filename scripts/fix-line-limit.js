/**
 * Script one-time: atualiza todos os BotSettings com lineLimit <= 5
 * para o novo padrão de 20 linhas.
 *
 * Uso na VPS:
 *   node scripts/fix-line-limit.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const result = await prisma.botSettings.updateMany({
    where: { lineLimit: { lte: 5 } },
    data:  { lineLimit: 20 },
  });

  console.log(`✅ ${result.count} registro(s) atualizado(s): lineLimit → 20`);

  const todos = await prisma.botSettings.findMany({
    select: { userId: true, lineLimit: true },
  });
  console.table(todos);
} finally {
  await prisma.$disconnect();
}
