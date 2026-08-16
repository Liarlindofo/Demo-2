/**
 * Cliente OpenRouter compartilhado pelo módulo de reclamações.
 * Fallback RH quando a key principal falha no chat (401/403).
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export function complaintsOpenRouterModel(): string {
  return (process.env.COMPLAINTS_OPENROUTER_MODEL || 'openai/gpt-4o-mini').trim();
}

export async function callComplaintsOpenRouter(params: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const primaryKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const fallbackKey = (process.env.RH_OPENROUTER_API_KEY || '').trim();
  const apiKey = primaryKey || fallbackKey;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY não configurada.');
  }

  const model = complaintsOpenRouterModel();
  const body = JSON.stringify({
    model,
    temperature: params.temperature ?? 0.2,
    max_tokens: params.maxTokens ?? 1500,
    messages: [
      { role: 'system', content: params.system },
      { role: 'user', content: params.user },
    ],
  });

  async function once(key: string) {
    return fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Platefull - Reclamações',
      },
      body,
    });
  }

  let res = await once(apiKey);
  if (
    (res.status === 401 || res.status === 403) &&
    fallbackKey &&
    fallbackKey !== apiKey
  ) {
    res = await once(fallbackKey);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenRouter HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter retornou resposta vazia.');
  }
  return content;
}

export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Resposta da IA sem JSON.');
    return JSON.parse(match[0]);
  }
}
