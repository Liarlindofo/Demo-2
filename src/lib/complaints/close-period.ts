/**
 * Fechamento leve do mês: processa resíduos (sem esperar settle/cooldown),
 * roda comparação com o mês anterior e marca o run como CONCLUIDO.
 */

import { prisma } from '@/lib/prisma';
import { buildAndSaveComparison } from '@/lib/complaints/compare';
import type { MonthPeriod } from '@/lib/complaints/period';
import {
  ensureRunForClose,
  recountRunComplaints,
} from '@/lib/complaints/continuous';
import { processSettledIfoodClusters } from '@/lib/complaints/process-ifood-cron';
import { processCooledClientConversations } from '@/lib/complaints/process-client-cron';

const CLOSE_IFOOD_BUDGET = 40;
const CLOSE_CLIENT_BUDGET = 24;
const CLOSE_PASSES = 3;

export type ClosePeriodResult = {
  reviewRunId: string;
  status: string;
  totalReclamacoes: number;
  ifood: Awaited<ReturnType<typeof processSettledIfoodClusters>>;
  client: Awaited<ReturnType<typeof processCooledClientConversations>>;
  comparison: {
    previousRunId: string | null;
    resumoTexto: string;
  };
  mensagem: string;
};

/**
 * Fecha o período: força processamento de pendências → comparação → CONCLUIDO.
 */
export async function closeComplaintPeriod(params: {
  userId: string;
  period: MonthPeriod;
}): Promise<ClosePeriodResult> {
  const { userId, period } = params;
  const runInfo = await ensureRunForClose(userId, period);

  await prisma.complaintReviewRun.update({
    where: { id: runInfo.id },
    data: {
      status: 'EM_ANDAMENTO',
      pendingContactIds: [],
      jobToken: null,
      batchLockAt: null,
      erro: null,
    },
  });

  let ifoodAcc = {
    groupsScanned: 0,
    clustersReady: 0,
    complaintsCreated: 0,
    messagesMarked: 0,
    skippedUnsettled: 0,
  };
  let clientAcc = {
    tenantsScanned: 0,
    contactsReady: 0,
    complaintsCreated: 0,
    messagesMarked: 0,
    skippedActive: 0,
  };

  for (let pass = 0; pass < CLOSE_PASSES; pass++) {
    const ifood = await processSettledIfoodClusters({
      userId,
      settleMs: 0,
      maxClusters: CLOSE_IFOOD_BUDGET,
      periodStart: period.start,
      periodEnd: period.end,
    });
    const client = await processCooledClientConversations({
      userId,
      cooldownMs: 0,
      maxContacts: CLOSE_CLIENT_BUDGET,
      periodStart: period.start,
      periodEnd: period.end,
    });

    ifoodAcc = {
      groupsScanned: Math.max(ifoodAcc.groupsScanned, ifood.groupsScanned),
      clustersReady: ifoodAcc.clustersReady + ifood.clustersReady,
      complaintsCreated: ifoodAcc.complaintsCreated + ifood.complaintsCreated,
      messagesMarked: ifoodAcc.messagesMarked + ifood.messagesMarked,
      skippedUnsettled: ifoodAcc.skippedUnsettled + ifood.skippedUnsettled,
    };
    clientAcc = {
      tenantsScanned: Math.max(clientAcc.tenantsScanned, client.tenantsScanned),
      contactsReady: clientAcc.contactsReady + client.contactsReady,
      complaintsCreated: clientAcc.complaintsCreated + client.complaintsCreated,
      messagesMarked: clientAcc.messagesMarked + client.messagesMarked,
      skippedActive: clientAcc.skippedActive + client.skippedActive,
    };

    if (ifood.clustersReady === 0 && client.contactsReady === 0) break;
  }

  const totalReclamacoes = await recountRunComplaints(runInfo.id, userId);

  const comparison = await buildAndSaveComparison({
    userId,
    reviewRunId: runInfo.id,
    period,
  });

  await prisma.complaintReviewRun.update({
    where: { id: runInfo.id },
    data: {
      status: 'CONCLUIDO',
      totalReclamacoes,
      pendingContactIds: [],
      jobToken: null,
      batchLockAt: null,
      erro: null,
    },
  });

  return {
    reviewRunId: runInfo.id,
    status: 'CONCLUIDO',
    totalReclamacoes,
    ifood: ifoodAcc,
    client: clientAcc,
    comparison: {
      previousRunId: comparison.previousRunId,
      resumoTexto: comparison.resumoTexto,
    },
    mensagem: `Fechamento concluído: ${totalReclamacoes} reclamação(ões); resíduos iFood=${ifoodAcc.complaintsCreated}, cliente=${clientAcc.complaintsCreated}.`,
  };
}
