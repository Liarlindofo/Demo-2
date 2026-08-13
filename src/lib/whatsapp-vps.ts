/**
 * Cliente servidor→servidor para a API WhatsApp na VPS.
 *
 * NÃO use 127.0.0.1 daqui (no Vercel isso é o próprio serverless).
 * Use WHATSAPP_VPS_URL apontando para o host público (nginx/api.platefull.com.br
 * ou IP público com porta exposta).
 */

const DEFAULT_VPS_URL = 'https://api.platefull.com.br';

function getVpsBaseUrl(): string {
  const raw = (process.env.WHATSAPP_VPS_URL || DEFAULT_VPS_URL).trim().replace(/\/+$/, '');
  // Se alguém colar ".../api", removemos para montar paths limpos
  return raw.replace(/\/api$/i, '');
}

function getVpsApiKey(): string | undefined {
  // Preferir key dedicada Vercel→VPS; BOT_API_KEY só como fallback de env único
  return (
    process.env.WHATSAPP_VPS_API_KEY ||
    process.env.WHATSAPP_API_KEY ||
    undefined
  );
}

export type WhatsAppSessionKind = 'atendimento' | 'relatorios';

export interface NormalizedSession {
  status: string;
  qrCode: string | null;
  isActive: boolean;
  isConnected: boolean;
  connectedNumber: string | null;
  updatedAt: string | null;
}

function emptySession(): NormalizedSession {
  return {
    status: 'DISCONNECTED',
    qrCode: null,
    isActive: false,
    isConnected: false,
    connectedNumber: null,
    updatedAt: null,
  };
}

/** Normaliza respostas antigas (status.routes) e novas (api.getStatus / send-only). */
export function normalizeSessionPayload(data: Record<string, unknown> | null | undefined): NormalizedSession {
  if (!data) return emptySession();

  const session = data.session as Record<string, unknown> | undefined;
  if (session && typeof session === 'object') {
    const status = String(session.status || 'DISCONNECTED').toUpperCase();
    return {
      status,
      qrCode: (session.qrCode as string) || null,
      isActive: Boolean(session.isActive),
      isConnected: Boolean(session.isConnected) || status === 'CONNECTED',
      connectedNumber: (session.connectedNumber as string) || null,
      updatedAt: (session.updatedAt as string) || null,
    };
  }

  // Formato legado de status.routes.js
  const isConnected = Boolean(data.isConnected);
  const qrCode = (data.qrCode as string) || null;
  const legacyStatus = String(data.status || '').toLowerCase();

  let status = 'DISCONNECTED';
  if (isConnected || legacyStatus === 'connected') status = 'CONNECTED';
  else if (qrCode || legacyStatus === 'waiting_qr' || legacyStatus === 'qrcode') status = 'QRCODE';
  else if (legacyStatus === 'connecting') status = 'CONNECTING';
  else if (data.exists === false) status = 'DISCONNECTED';

  return {
    status,
    qrCode,
    isActive: Boolean(data.exists) || isConnected || Boolean(qrCode),
    isConnected,
    connectedNumber: (data.connectedNumber as string) || null,
    updatedAt: null,
  };
}

function buildPath(kind: WhatsAppSessionKind, action: string, userId: string, search = ''): string {
  const q = search ? (search.startsWith('?') ? search : `?${search}`) : '';
  if (kind === 'relatorios') {
    return `/api/send-only/${encodeURIComponent(userId)}/${action}${q}`;
  }
  // atendimento
  if (action === 'start' || action === 'stop') {
    return `/api/${action}/${encodeURIComponent(userId)}${q}`;
  }
  return `/api/${action}/${encodeURIComponent(userId)}${q}`;
}

export async function callWhatsAppVps(
  kind: WhatsAppSessionKind,
  action: 'start' | 'stop' | 'qr' | 'status' | 'groups',
  userId: string,
  options: { method?: string; search?: string; timeoutMs?: number } = {},
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const base = getVpsBaseUrl();
  const path = buildPath(kind, action, userId, options.search);
  const url = `${base}${path}`;
  const method = options.method || (action === 'start' || action === 'stop' ? 'POST' : 'GET');
  const timeoutMs = options.timeoutMs ?? (action === 'start' ? 120_000 : 30_000);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const apiKey = getVpsApiKey();
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers,
      signal: controller.signal,
      // start/stop não têm body obrigatório
      body: method === 'POST' ? JSON.stringify({}) : undefined,
      cache: 'no-store',
    });

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      data = { success: false, message: text.slice(0, 300) || `HTTP ${res.status}` };
    }

    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === 'AbortError'
          ? `Timeout ao falar com a VPS (${timeoutMs}ms): ${url}`
          : err.message
        : 'Erro desconhecido ao falar com a VPS';
    return {
      ok: false,
      status: 502,
      data: { success: false, message, url },
    };
  } finally {
    clearTimeout(timer);
  }
}
