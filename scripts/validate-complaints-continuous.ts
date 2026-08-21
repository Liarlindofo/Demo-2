import { prisma } from '../src/lib/prisma';
import {
  clusterIfoodMessages,
  ifoodSettleMs,
} from '../src/lib/complaints/ifood-group';
import { isClusterSettled } from '../src/lib/complaints/process-ifood-cron';
import { clientCooldownMs } from '../src/lib/complaints/continuous';

const now = new Date();
const mk = (minsAgo: number, id: string) => ({
  id,
  direction: 'OUT',
  messageType: 'text',
  textContent: 'pedido 12 veio errado',
  sentByAgent: true,
  timestamp: new Date(now.getTime() - minsAgo * 60_000),
});

const near = clusterIfoodMessages([
  mk(10, 'a'),
  {
    ...mk(10, 'b'),
    timestamp: new Date(now.getTime() - 10 * 60_000 + 30_000),
  },
]);
const far = clusterIfoodMessages([mk(10, 'a'), mk(7, 'b')]);
const settled = isClusterSettled([mk(5, 'x')], now, 4 * 60_000);
const unsettled = isClusterSettled([mk(1, 'y')], now, 4 * 60_000);

console.log(
  JSON.stringify(
    {
      helpers: {
        nearClusters: near.length,
        farClusters: far.length,
        settled5min: settled,
        unsettled1min: unsettled,
        ifoodSettleMs: ifoodSettleMs(),
        clientCooldownMs: clientCooldownMs(),
      },
    },
    null,
    2,
  ),
);

const groups = await prisma.iFoodComplaintGroup.count({ where: { ativo: true } });
const unprocIfood = await prisma.whatsAppMessage.count({
  where: {
    complaintProcessedAt: null,
    contactId: { contains: '@g.us' },
    direction: 'OUT',
  },
});
const unprocClient = await prisma.whatsAppMessage.count({
  where: {
    complaintProcessedAt: null,
    NOT: { contactId: { contains: '@g.us' } },
  },
});
const openRuns = await prisma.complaintReviewRun.findMany({
  where: { status: { in: ['EM_ANDAMENTO', 'PROCESSANDO'] } },
  select: {
    id: true,
    status: true,
    totalReclamacoes: true,
    periodStart: true,
    userId: true,
  },
  take: 10,
});

console.log(JSON.stringify({ db: { groups, unprocIfood, unprocClient, openRuns } }, null, 2));
await prisma.$disconnect();
