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
  numeroPedido: string | null;
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

function looksLikeInternalLog(msg: ConversationMessage): boolean {
  if (msg.direction === 'IN') return false;
  const raw = msg.textContent?.trim() || '';
  if (!raw) return false;
  if (/^\{[\s\S]*"(level|timestamp|message|stack)"[\s\S]*\}$/.test(raw)) return true;
  if (/^\[?(ERROR|INFO|DEBUG|WARN|TRACE)/i.test(raw)) return true;
  if (/print de log|console\.(log|error|warn)|stack trace/i.test(raw)) return true;
  return false;
}

function bodyForTranscript(msg: ConversationMessage): string {
  if (looksLikeInternalLog(msg)) {
    return '[sistema interno — NÃO usar como evidência de reclamação]';
  }
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

/** IDs de mensagens IN válidas como evidência de reclamação. */
export function filterClientEvidenceIds(
  messages: ConversationMessage[],
  ids: string[],
): string[] {
  const inIds = new Set(
    messages.filter((m) => m.direction === 'IN').map((m) => m.id),
  );
  return [...new Set(ids.filter((id) => inIds.has(id)))];
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

REGRAS CRÍTICAS SOBRE MENSAGENS:
- Mensagens CLIENTE (IN) são a ÚNICA fonte válida para decidir se há reclamação e para evidenciaMessageIds.
- Mensagens ATENDENTE ou IA (OUT) servem APENAS como contexto para interpretar o que o cliente quis dizer — NUNCA conte como reclamação algo que só o atendente ou a IA disse.
- NUNCA inclua mensagens OUT em evidenciaMessageIds — somente IDs de mensagens IN (cliente).
- Prints de log interno, mensagens de sistema ou respostas automáticas do atendente NÃO são reclamação nem evidência.
- Se o cliente apenas disse que "quer fazer uma reclamação" mas não detalhou o problema em mensagens IN, NÃO é reclamação classificável (eReclamacao=false).

Considere RECLAMAÇÃO quando o cliente (em mensagens IN):
- expressa insatisfação ou frustração explícita;
- relata problema com o pedido (errado, atrasado, com defeito, item faltando, qualidade ruim, etc.);
- aponta cobrança incorreta;
- pede reembolso, cancelamento ou troca por causa de problema no pedido/atendimento.

NÃO conte como reclamação:
- perguntas neutras;
- elogios;
- dúvidas comuns sobre cardápio, horário, entrega, status do pedido sem tom de insatisfação;
- conversas puramente operacionais sem queixa.

Se for reclamação:
- Escreva "resumo" como UM parágrafo corrido (3 a 6 frases) com base na TRANSCRIÇÃO COMPLETA — todas as mensagens IN e OUT, em ordem. Inclua contexto do atendimento quando for relevante (ex.: o atendente pediu foto de confirmação, o cliente confirmou/enviou, e só depois reclamou). NÃO resuma apenas as mensagens isoladas de evidência; não invente fatos fora da transcrição.
- Indique dataOcorrencia (YYYY-MM-DD) se identificável; senão use a data da mensagem IN principal da queixa.
- evidenciaMessageIds: SOMENTE IDs de mensagens IN. Se o cliente enviou foto do produto/comida com problema, inclua esse id. NÃO use comprovante de Pix, print de tela ou documento como evidência.
- numeroPedido: o número do pedido que o CLIENTE citou (ex.: "pedido 48", "pedido 150"). Se não aparecer nas mensagens IN, use null. NUNCA invente.

Responda APENAS JSON válido, sem markdown:
{"eReclamacao":true|false,"resumo":string|null,"dataOcorrencia":"YYYY-MM-DD"|null,"evidenciaMessageIds":string[],"numeroPedido":string|null}${reforco}`;
}

function inMessagesText(messages: ConversationMessage[]): string {
  return messages
    .filter((m) => m.direction === 'IN')
    .map((m) => m.textContent || '')
    .join('\n');
}

/** Só aceita número que o cliente realmente escreveu. Nunca inventa. */
export function resolveNumeroPedido(
  extracted: unknown,
  messages: ConversationMessage[],
): string | null {
  const inText = inMessagesText(messages);
  const fromIa =
    extracted == null
      ? null
      : String(extracted)
          .trim()
          .match(/(\d{1,8})/)?.[1] ?? null;
  if (fromIa && inText.includes(fromIa)) return fromIa;

  const matches = [...inText.matchAll(/pedido\s*#?\s*(\d{1,8})/gi)];
  if (matches.length === 0) return null;
  return matches[matches.length - 1][1];
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
    user: `Classifique a conversa COMPLETA abaixo (todas as mensagens, em ordem).\n\n${transcript}`,
    maxTokens: 900,
    temperature: 0.1,
  });

  const parsed = extractJsonObject(content) as {
    eReclamacao?: unknown;
    resumo?: unknown;
    dataOcorrencia?: unknown;
    evidenciaMessageIds?: unknown;
    numeroPedido?: unknown;
  };

  const eReclamacao = parsed.eReclamacao === true;
  if (!eReclamacao) {
    return {
      eReclamacao: false,
      resumo: null,
      dataOcorrencia: null,
      evidenciaMessageIds: [],
      numeroPedido: null,
    };
  }

  const rawIds = Array.isArray(parsed.evidenciaMessageIds)
    ? parsed.evidenciaMessageIds.filter((id): id is string => typeof id === 'string')
    : [];
  const knownIds = rawIds.filter((id) => validIds.has(id));
  let evidenciaMessageIds = filterClientEvidenceIds(messages, knownIds);

  // Fallback: últimas mensagens IN com conteúdo substantivo (nunca OUT)
  if (evidenciaMessageIds.length === 0) {
    evidenciaMessageIds = messages
      .filter(
        (m) =>
          m.direction === 'IN' &&
          (m.messageType !== 'text' ||
            (m.textContent?.trim().length ?? 0) > 0),
      )
      .slice(-3)
      .map((m) => m.id);
  }

  if (evidenciaMessageIds.length === 0) {
    return {
      eReclamacao: false,
      resumo: null,
      dataOcorrencia: null,
      evidenciaMessageIds: [],
      numeroPedido: null,
    };
  }

  const resumo =
    typeof parsed.resumo === 'string' && parsed.resumo.trim()
      ? parsed.resumo.trim().slice(0, 4000)
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
    numeroPedido: resolveNumeroPedido(parsed.numeroPedido, messages),
  };
}

/**
 * Reescreve o parágrafo da ata a partir da transcrição COMPLETA (IN+OUT).
 */
export async function writeAtaNarrative(params: {
  transcript: string;
  fallbackResumo: string;
  messages: ConversationMessage[];
  fallbackNumeroPedido: string | null;
}): Promise<{ resumo: string; numeroPedido: string | null }> {
  const { transcript, fallbackResumo, messages, fallbackNumeroPedido } = params;

  try {
    const content = await callComplaintsOpenRouter({
      system: `Você redige o parágrafo de uma ata de reclamações de restaurante/delivery.

REGRAS:
- Leia a TRANSCRIÇÃO COMPLETA (mensagens IN e OUT, em ordem). O resumo NÃO pode se basear só em trechos isolados de evidência.
- Escreva UM parágrafo corrido em português (3 a 6 frases) explicando o porquê da reclamação e o que aconteceu no atendimento.
- Inclua contexto relevante do atendente/IA quando ajudar a entender (ex.: pedido de foto de confirmação, resposta positiva do cliente, e a reclamação em seguida).
- A queixa em si é o que o CLIENTE disse ou mostrou (IN). Não invente fatos fora da transcrição.
- Sem lista, bullets ou citações entre aspas de mensagens isoladas.
- numeroPedido: só o número que o CLIENTE citou (ex. "pedido 48"). Se não houver, null. Nunca invente.

Responda APENAS JSON:
{"resumo":"parágrafo...","numeroPedido":"48"|null}`,
      user: `Transcrição completa:\n\n${transcript}`,
      maxTokens: 900,
      temperature: 0.2,
    });

    const parsed = extractJsonObject(content) as {
      resumo?: unknown;
      numeroPedido?: unknown;
    };

    const resumo =
      typeof parsed.resumo === 'string' && parsed.resumo.trim()
        ? parsed.resumo.trim().slice(0, 4000)
        : fallbackResumo;

    return {
      resumo,
      numeroPedido:
        resolveNumeroPedido(parsed.numeroPedido, messages) ?? fallbackNumeroPedido,
    };
  } catch (err) {
    console.warn('[complaints/narrative] falha ao reescrever resumo:', err);
    return {
      resumo: fallbackResumo,
      numeroPedido: fallbackNumeroPedido,
    };
  }
}
