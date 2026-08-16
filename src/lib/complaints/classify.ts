import { callComplaintsOpenRouter, extractJsonObject } from '@/lib/complaints/openrouter';

/**
 * Classificação de conversas WhatsApp como reclamação via OpenRouter.
 * Critério principal: julgamento de contexto (igual revisão humana).
 * palavrasChaveReclamacao = reforço opcional, nunca filtro rígido.
 */

export type ConversationMessage = {
  id: string;
  direction: string;
  messageType: string;
  textContent: string | null;
  sentByAgent: boolean;
  timestamp: Date;
};

export type ClassificationResult = {
  eReclamacao: boolean;
  resumo: string | null;
  dataOcorrencia: Date | null;
  evidenciaMessageIds: string[];
};

function speakerLabel(msg: ConversationMessage): string {
  if (msg.direction === 'IN') return 'CLIENTE';
  if (msg.sentByAgent) return 'ATENDENTE';
  return 'IA';
}

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

function bodyForTranscript(msg: ConversationMessage): string {
  const raw = msg.textContent?.trim() || '';
  // Evita despejar base64 de imagem no prompt
  if (raw.length > 500 || /^\/9j\//.test(raw) || raw.startsWith('data:')) {
    return msg.messageType !== 'text'
      ? `[mídia: ${msg.messageType}]`
      : '[conteúdo longo omitido]';
  }
  if (raw) return raw;
  return msg.messageType !== 'text' ? `[mídia: ${msg.messageType}]` : '[sem texto]';
}

/** Transcript ordenado com IDs reais pra a IA apontar evidências. */
export function buildTranscript(messages: ConversationMessage[]): string {
  return messages
    .map((m) => {
      const speaker = speakerLabel(m);
      const body = bodyForTranscript(m);
      return `[id=${m.id}] [${formatTs(m.timestamp)}] ${speaker} (${m.messageType}): ${body}`;
    })
    .join('\n');
}

function buildSystemPrompt(palavrasChave: string[]): string {
  const reforco =
    palavrasChave.length > 0
      ? `\n\nReforço opcional desta conta (NÃO é lista exclusiva — use só como pista de atenção extra quando aparecerem): ${palavrasChave
          .map((p) => `"${p}"`)
          .join(', ')}.`
      : '';

  return `Você revisa conversas de atendimento (WhatsApp) de um restaurante/delivery e decide se há RECLAMAÇÃO do cliente — com o mesmo julgamento de contexto que um humano experiente usaria. Não existe lista fixa de palavras-chave da empresa; a decisão é por contexto.

Considere RECLAMAÇÃO quando o cliente:
- expressa insatisfação ou frustração explícita;
- relata problema com o pedido (errado, atrasado, com defeito, item faltando, qualidade ruim, etc.);
- aponta cobrança incorreta;
- pede reembolso, cancelamento ou troca por causa de problema no pedido/atendimento.

NÃO conte como reclamação:
- perguntas neutras;
- elogios;
- dúvidas comuns sobre cardápio, horário, entrega, status do pedido sem tom de insatisfação;
- conversas puramente operacionais sem queixa.

Se for reclamação, resuma em 1–2 frases objetivas e indique a data aproximada do problema relatado (YYYY-MM-DD), se identificável no transcript; senão use a data da mensagem de evidência principal.
Liste evidenciaMessageIds com os IDs reais das mensagens (campo id=...) que comprovam a reclamação — priorize imagens/mídia do cliente e trechos de texto relevantes do cliente.

Responda APENAS JSON válido, sem markdown:
{"eReclamacao":true|false,"resumo":string|null,"dataOcorrencia":"YYYY-MM-DD"|null,"evidenciaMessageIds":string[]}${reforco}`;
}

function parseOccurrenceDate(
  value: unknown,
  fallback: Date,
): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return fallback;
  }
  const d = new Date(`${value}T12:00:00.000-03:00`);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

/**
 * Classifica uma conversa. Lança em falha de API/parse — o caller decide se aborta o run.
 */
export async function classifyConversation(params: {
  messages: ConversationMessage[];
  palavrasChave: string[];
}): Promise<ClassificationResult> {
  const { messages, palavrasChave } = params;
  const validIds = new Set(messages.map((m) => m.id));
  const transcript = buildTranscript(messages);

  const content = await callComplaintsOpenRouter({
    system: buildSystemPrompt(palavrasChave),
    user: `Classifique a conversa abaixo.\n\n${transcript}`,
    maxTokens: 600,
    temperature: 0.1,
  });

  const parsed = extractJsonObject(content) as {
    eReclamacao?: unknown;
    resumo?: unknown;
    dataOcorrencia?: unknown;
    evidenciaMessageIds?: unknown;
  };

  const eReclamacao = parsed.eReclamacao === true;
  if (!eReclamacao) {
    return {
      eReclamacao: false,
      resumo: null,
      dataOcorrencia: null,
      evidenciaMessageIds: [],
    };
  }

  const rawIds = Array.isArray(parsed.evidenciaMessageIds)
    ? parsed.evidenciaMessageIds.filter((id): id is string => typeof id === 'string')
    : [];
  const evidenciaMessageIds = [...new Set(rawIds.filter((id) => validIds.has(id)))];

  // Se a IA não apontou IDs válidos, usa mensagens IN (texto/imagem) como fallback mínimo
  if (evidenciaMessageIds.length === 0) {
    const fallback = messages
      .filter((m) => m.direction === 'IN')
      .slice(-5)
      .map((m) => m.id);
    evidenciaMessageIds.push(...fallback);
  }

  const resumo =
    typeof parsed.resumo === 'string' && parsed.resumo.trim()
      ? parsed.resumo.trim().slice(0, 2000)
      : 'Reclamação identificada (sem resumo detalhado da IA).';

  const anchor =
    messages.find((m) => evidenciaMessageIds.includes(m.id))?.timestamp ??
    messages[messages.length - 1]?.timestamp ??
    new Date();

  return {
    eReclamacao: true,
    resumo,
    dataOcorrencia: parseOccurrenceDate(parsed.dataOcorrencia, anchor),
    evidenciaMessageIds,
  };
}
