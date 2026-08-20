/**
 * Extração de reclamações registradas por atendentes em grupos iFood (por loja).
 * Toda mensagem/cluster nesses grupos já é, por definição, um relato de reclamação.
 */

import { callComplaintsOpenRouter, extractJsonObject } from '@/lib/complaints/openrouter';
import type { ConversationMessage } from '@/lib/complaints/classify';

export const IFOOD_CLUSTER_GAP_MS = 90_000;

export type IfoodGroupExtract = {
  resumo: string;
  numeroPedido: string | null;
  dataOcorrencia: Date;
  evidenciaMessageIds: string[];
};

function formatTs(d: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(d);
}

function bodyForCluster(msg: ConversationMessage): string {
  const raw = msg.textContent?.trim() || '';
  if (raw.length > 500 || /^\/9j\//.test(raw) || raw.startsWith('data:')) {
    return msg.messageType !== 'text' ? `[mídia: ${msg.messageType}]` : '[conteúdo longo omitido]';
  }
  if (raw) return raw;
  return msg.messageType !== 'text' ? `[mídia: ${msg.messageType}]` : '[sem texto]';
}

/** Agrupa mensagens do atendente próximas no tempo (foto + legenda). */
export function clusterIfoodMessages(
  messages: ConversationMessage[],
  gapMs = IFOOD_CLUSTER_GAP_MS,
): ConversationMessage[][] {
  const ordered = [...messages].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );
  const clusters: ConversationMessage[][] = [];
  let current: ConversationMessage[] = [];

  for (const m of ordered) {
    if (current.length === 0) {
      current = [m];
      continue;
    }
    const last = current[current.length - 1]!;
    if (m.timestamp.getTime() - last.timestamp.getTime() <= gapMs) {
      current.push(m);
    } else {
      clusters.push(current);
      current = [m];
    }
  }
  if (current.length > 0) clusters.push(current);
  return clusters;
}

export function clusterHasContent(cluster: ConversationMessage[]): boolean {
  return cluster.some((m) => {
    const text = m.textContent?.trim();
    if (text) return true;
    return m.messageType === 'image' || m.messageType === 'sticker' || m.messageType === 'video';
  });
}

/** Evidência = mídias do cluster + legendas de texto (mensagens do atendente). */
export function ifoodEvidenceIds(cluster: ConversationMessage[]): string[] {
  const ids = cluster
    .filter((m) => {
      const text = m.textContent?.trim();
      if (text) return true;
      return (
        m.messageType === 'image' ||
        m.messageType === 'sticker' ||
        m.messageType === 'video' ||
        m.messageType === 'document'
      );
    })
    .map((m) => m.id);
  return [...new Set(ids)];
}

function extractPedidoFromText(text: string): string | null {
  const m = text.match(/pedido\s*#?\s*(\d{1,8})/i) || text.match(/\b(\d{1,5})\b/);
  return m?.[1] ?? null;
}

function fallbackResumo(cluster: ConversationMessage[]): string {
  const texts = cluster
    .map((m) => m.textContent?.trim())
    .filter((t): t is string => Boolean(t));
  if (texts.length > 0) return texts.join(' — ');
  return 'Reclamação registrada no grupo iFood (foto/mídia sem legenda de texto).';
}

/**
 * Extrai numeroPedido + resumo de um cluster do grupo iFood.
 * Não filtra "se é reclamação" — o canal já define que é.
 */
export async function extractIfoodGroupComplaint(
  cluster: ConversationMessage[],
): Promise<IfoodGroupExtract> {
  const evidenciaMessageIds = ifoodEvidenceIds(cluster);
  const fallbackDate = cluster[0]?.timestamp ?? new Date();
  const joinedText = cluster.map((m) => m.textContent || '').join('\n');
  const pedidoHint = extractPedidoFromText(joinedText);

  const transcript = cluster
    .map(
      (m) =>
        `[id=${m.id}] [${formatTs(m.timestamp)}] ATENDENTE (${m.messageType}): ${bodyForCluster(m)}`,
    )
    .join('\n');

  try {
    const content = await callComplaintsOpenRouter({
      system: `Você lê registros de reclamações que ATENDENTES postam em um grupo WhatsApp de loja iFood.
Cada post (foto do produto + legenda) JÁ É uma reclamação — não julgue se "é ou não é".

Extraia:
- resumo: um parágrafo curto (2–4 frases) do problema relatado na legenda
- numeroPedido: só o número se aparecer na legenda (ex: "pedido 48"); senão null — NUNCA invente
- dataOcorrencia: YYYY-MM-DD da mensagem principal

Responda APENAS JSON:
{"resumo":string,"numeroPedido":string|null,"dataOcorrencia":"YYYY-MM-DD"}`,
      user: `Extraia os dados deste registro:\n\n${transcript}`,
      maxTokens: 400,
      temperature: 0.1,
    });

    const parsed = extractJsonObject(content) as {
      resumo?: unknown;
      numeroPedido?: unknown;
      dataOcorrencia?: unknown;
    };

    const resumo =
      typeof parsed.resumo === 'string' && parsed.resumo.trim()
        ? parsed.resumo.trim()
        : fallbackResumo(cluster);

    let numeroPedido: string | null = null;
    if (parsed.numeroPedido != null) {
      const n = String(parsed.numeroPedido).trim().match(/(\d{1,8})/)?.[1] ?? null;
      if (n && joinedText.includes(n)) numeroPedido = n;
    }
    if (!numeroPedido) numeroPedido = pedidoHint;

    let dataOcorrencia = fallbackDate;
    if (typeof parsed.dataOcorrencia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.dataOcorrencia)) {
      const d = new Date(`${parsed.dataOcorrencia}T12:00:00.000-03:00`);
      if (!Number.isNaN(d.getTime())) dataOcorrencia = d;
    }

    return { resumo, numeroPedido, dataOcorrencia, evidenciaMessageIds };
  } catch (err) {
    console.warn('[complaints/ifood-group] IA falhou, usando fallback:', err);
    return {
      resumo: fallbackResumo(cluster),
      numeroPedido: pedidoHint,
      dataOcorrencia: fallbackDate,
      evidenciaMessageIds,
    };
  }
}
