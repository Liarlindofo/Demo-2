/**
 * Força 1 contato cliente esfriado (cooldownMs=0) para validar o pipeline.
 */
import { prisma } from '../src/lib/prisma';
import { processCooledClientConversations } from '../src/lib/complaints/process-client-cron';

const tenantId = 'cmjhty6hu0001jy04sstknpdo';

const beforeRuns = await prisma.complaintReviewRun.count({
  where: { userId: tenantId, status: 'EM_ANDAMENTO' },
});

const result = await processCooledClientConversations({
  userId: tenantId,
  cooldownMs: 0,
  maxContacts: 1,
});

const afterRuns = await prisma.complaintReviewRun.findMany({
  where: { userId: tenantId, status: 'EM_ANDAMENTO' },
  select: {
    id: true,
    status: true,
    totalReclamacoes: true,
    periodStart: true,
    complaints: {
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: { id: true, origem: true, resumo: true, contactId: true, createdAt: true },
    },
  },
});

console.log(JSON.stringify({ beforeRuns, result, afterRuns }, null, 2));
await prisma.$disconnect();
