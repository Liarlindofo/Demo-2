/**
 * Comparação mês atual × mês anterior (recorrentes / novos / resolvidos).
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { monthPeriod, type MonthPeriod } from '@/lib/complaints/period';
import { callComplaintsOpenRouter, extractJsonObject } from '@/lib/complaints/openrouter';

export type ComplaintSnapshot = {
  id: string;
  contactId: string;
  contactName: string | null;
  resumo: string;
};

export type ComparisonPayload = {
  previousRunId: string | null;
  recorrentes: Prisma.InputJsonValue;
  novos: Prisma.InputJsonValue;
  resolvidos: Prisma.InputJsonValue;
  resumoTexto: string;
};

const FIRST_MONTH_RESUMO =
  'Primeiro mês com dados coletados, sem histórico anterior para comparação.';

function previousCalendarPeriod(period: MonthPeriod): MonthPeriod {
  const prevMonth = period.month === 1 ? 12 : period.month - 1;
  const prevYear = period.month === 1 ? period.year - 1 : period.year;
  return monthPeriod(prevYear, prevMonth);
}

function formatComplaintList(items: ComplaintSnapshot[], label: string): string {
  if (items.length === 0) return `${label}: (nenhuma)`;
  const lines = items.map(
    (c, i) =>
      `${i + 1}. [id=${c.id}] contactId=${c.contactId} nome=${c.contactName || '—'} | ${c.resumo}`,
  );
  return `${label} (${items.length}):\n${lines.join('\n')}`;
}

const SYSTEM_PROMPT = `Você compara reclamações de atendimento (restaurante/delivery) entre dois meses consecutivos, para a ata da reunião de qualidade.

Regras rígidas de classificação (um tema entra em EXATAMENTE uma lista):
- RECORRENTES: o tema/problema aparece NOS DOIS meses (mesmo cliente de novo, OU tema muito parecido com clientes diferentes — ex.: "massa crua" nos dois meses = estrutural). contactIdsAtual E contactIdsAnterior devem ter pelo menos 1 id cada. Nunca coloque aqui algo que só existe em um dos meses.
- NOVAS: tema/problema SÓ no mês atual (nenhuma ocorrência parecida no mês anterior).
- RESOLVIDOS: tema/problema SÓ no mês anterior (sumiu neste mês — bom sinal). Se contactIdsAtual estaria vazio, vai em resolvidos, nunca em recorrentes.

Gere resumoTexto em português, 2–3 parágrafos, tom direto, como abertura de reunião ("Este mês tivemos X reclamações, sendo Y recorrentes do mês anterior — destaque para [tema]...").

Responda APENAS JSON válido, sem markdown:
{
  "recorrentes": [ { "tema": string, "detalhe": string, "contactIdsAtual": string[], "contactIdsAnterior": string[] } ],
  "novos": [ { "tema": string, "detalhe": string, "contactIds": string[] } ],
  "resolvidos": [ { "tema": string, "detalhe": string, "contactIdsAnterior": string[] } ],
  "resumoTexto": string
}`;

function asObjectArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (x): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x),
  );
}

function collectIds(items: Array<Record<string, unknown>>, keys: string[]): Set<string> {
  const out = new Set<string>();
  for (const item of items) {
    for (const key of keys) {
      const arr = item[key];
      if (Array.isArray(arr)) {
        for (const id of arr) {
          if (typeof id === 'string' && id) out.add(id);
        }
      }
    }
  }
  return out;
}

/** Garante cobertura e corrige recorrentes sem ocorrência no mês atual. */
function ensureCoverage(params: {
  current: ComplaintSnapshot[];
  previous: ComplaintSnapshot[];
  recorrentes: Array<Record<string, unknown>>;
  novos: Array<Record<string, unknown>>;
  resolvidos: Array<Record<string, unknown>>;
}) {
  const recorrentesIn = [...params.recorrentes];
  const novos = [...params.novos];
  const resolvidos = [...params.resolvidos];

  const cleanedRecorrentes: Array<Record<string, unknown>> = [];
  for (const r of recorrentesIn) {
    const atual = Array.isArray(r.contactIdsAtual)
      ? r.contactIdsAtual.filter((x): x is string => typeof x === 'string' && !!x)
      : [];
    const anterior = Array.isArray(r.contactIdsAnterior)
      ? r.contactIdsAnterior.filter((x): x is string => typeof x === 'string' && !!x)
      : [];
    if (atual.length === 0 && anterior.length > 0) {
      resolvidos.push({
        tema: typeof r.tema === 'string' ? r.tema : 'Tema do mês anterior',
        detalhe: typeof r.detalhe === 'string' ? r.detalhe : '',
        contactIdsAnterior: anterior,
      });
    } else {
      cleanedRecorrentes.push(r);
    }
  }

  const coveredPrev = new Set([
    ...collectIds(cleanedRecorrentes, ['contactIdsAnterior']),
    ...collectIds(resolvidos, ['contactIdsAnterior']),
  ]);
  const coveredAtual = new Set([
    ...collectIds(cleanedRecorrentes, ['contactIdsAtual']),
    ...collectIds(novos, ['contactIds']),
  ]);

  for (const c of params.previous) {
    if (coveredPrev.has(c.contactId)) continue;
    resolvidos.push({
      tema: c.resumo.slice(0, 80),
      detalhe: c.resumo,
      contactIdsAnterior: [c.contactId],
    });
    coveredPrev.add(c.contactId);
  }

  for (const c of params.current) {
    if (coveredAtual.has(c.contactId)) continue;
    novos.push({
      tema: c.resumo.slice(0, 80),
      detalhe: c.resumo,
      contactIds: [c.contactId],
    });
    coveredAtual.add(c.contactId);
  }

  return {
    recorrentes: cleanedRecorrentes as Prisma.InputJsonValue,
    novos: novos as Prisma.InputJsonValue,
    resolvidos: resolvidos as Prisma.InputJsonValue,
  };
}

async function compareWithAi(params: {
  current: ComplaintSnapshot[];
  previous: ComplaintSnapshot[];
}): Promise<ComparisonPayload> {
  const content = await callComplaintsOpenRouter({
    system: SYSTEM_PROMPT,
    user: [
      formatComplaintList(params.previous, 'MÊS ANTERIOR'),
      '',
      formatComplaintList(params.current, 'MÊS ATUAL'),
      '',
      'Compare os dois conjuntos e responda no JSON pedido.',
      'Checklist: cada reclamação do mês anterior deve aparecer em recorrentes (se o tema voltou) OU em resolvidos (se sumiu).',
      'Checklist: cada reclamação do mês atual deve aparecer em recorrentes (se já existia) OU em novos (se é inédita).',
      'Não deixe tema órfão fora das três listas.',
    ].join('\n'),
    maxTokens: 2000,
    temperature: 0.2,
  });

  const parsed = extractJsonObject(content) as {
    recorrentes?: unknown;
    novos?: unknown;
    resolvidos?: unknown;
    resumoTexto?: unknown;
  };

  const covered = ensureCoverage({
    current: params.current,
    previous: params.previous,
    recorrentes: asObjectArray(parsed.recorrentes),
    novos: asObjectArray(parsed.novos),
    resolvidos: asObjectArray(parsed.resolvidos),
  });

  const resumoTexto =
    typeof parsed.resumoTexto === 'string' && parsed.resumoTexto.trim()
      ? parsed.resumoTexto.trim().slice(0, 8000)
      : `Este mês tivemos ${params.current.length} reclamação(ões). Comparação automática sem texto detalhado da IA.`;

  return {
    previousRunId: null,
    recorrentes: covered.recorrentes,
    novos: covered.novos,
    resolvidos: covered.resolvidos,
    resumoTexto,
  };
}

/**
 * Busca o run CONCLUIDO do mês imediatamente anterior e gera ComplaintComparison
 * vinculado ao reviewRun atual. Idempotente: substitui comparison existente do run.
 */
export async function buildAndSaveComparison(params: {
  userId: string;
  reviewRunId: string;
  period: MonthPeriod;
}): Promise<ComparisonPayload> {
  const { userId, reviewRunId, period } = params;
  const prevPeriod = previousCalendarPeriod(period);

  const currentComplaints = await prisma.complaint.findMany({
    where: { reviewRunId, userId },
    select: { id: true, contactId: true, contactName: true, resumo: true },
    orderBy: { dataOcorrencia: 'asc' },
  });

  const previousRun = await prisma.complaintReviewRun.findFirst({
    where: {
      userId,
      status: 'CONCLUIDO',
      id: { not: reviewRunId },
      periodStart: prevPeriod.start,
    },
    orderBy: { executadoEm: 'desc' },
    include: {
      complaints: {
        select: { id: true, contactId: true, contactName: true, resumo: true },
        orderBy: { dataOcorrencia: 'asc' },
      },
    },
  });

  let payload: ComparisonPayload;

  if (!previousRun) {
    payload = {
      previousRunId: null,
      recorrentes: [],
      novos: [],
      resolvidos: [],
      resumoTexto: FIRST_MONTH_RESUMO,
    };
  } else {
    try {
      const ai = await compareWithAi({
        current: currentComplaints,
        previous: previousRun.complaints,
      });
      payload = { ...ai, previousRunId: previousRun.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[complaints/compare] Falha na IA:', message);
      payload = {
        previousRunId: previousRun.id,
        recorrentes: [],
        novos: [],
        resolvidos: [],
        resumoTexto: `Comparação com o mês anterior não pôde ser gerada automaticamente (${message.slice(0, 200)}). Este mês: ${currentComplaints.length} reclamação(ões); mês anterior: ${previousRun.complaints.length}.`,
      };
    }
  }

  await prisma.complaintComparison.upsert({
    where: { reviewRunId },
    create: {
      reviewRunId,
      previousRunId: payload.previousRunId,
      recorrentes: payload.recorrentes,
      novos: payload.novos,
      resolvidos: payload.resolvidos,
      resumoTexto: payload.resumoTexto,
    },
    update: {
      previousRunId: payload.previousRunId,
      recorrentes: payload.recorrentes,
      novos: payload.novos,
      resolvidos: payload.resolvidos,
      resumoTexto: payload.resumoTexto,
    },
  });

  return payload;
}
