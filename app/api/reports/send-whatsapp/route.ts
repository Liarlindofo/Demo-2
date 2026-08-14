export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServiceApiKey } from '@/lib/auth/service-api-key';
import { getTenantStackUserId } from '@/lib/whatsapp-sessions';
import { callWhatsAppVps, callWhatsAppVpsSession } from '@/lib/whatsapp-vps';

/**
 * POST /api/reports/send-whatsapp
 *
 * Envia texto por uma sessão WhatsApp do tenant da API key (n8n / service).
 * Autenticação: header x-api-key (ServiceApiKey) — igual /api/reports/due.
 *
 * Body: { sessionSlot: number, to: string, message: string }
 */
export async function POST(req: NextRequest) {
  const auth = await requireServiceApiKey(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  let body: { sessionSlot?: unknown; to?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body JSON inválido.' }, { status: 400 });
  }

  const sessionSlot = parseInt(String(body.sessionSlot), 10);
  const to = typeof body.to === 'string' ? body.to.trim() : '';
  const message = typeof body.message === 'string' ? body.message : '';

  if (!Number.isFinite(sessionSlot) || sessionSlot < 1) {
    return NextResponse.json({ success: false, error: 'sessionSlot inválido.' }, { status: 400 });
  }
  if (!to) {
    return NextResponse.json({ success: false, error: 'Campo "to" é obrigatório.' }, { status: 400 });
  }
  if (!message.trim()) {
    return NextResponse.json({ success: false, error: 'Campo "message" é obrigatório.' }, { status: 400 });
  }

  const stackUserId = await getTenantStackUserId(userId);
  if (!stackUserId) {
    return NextResponse.json(
      { success: false, error: 'Sessão WhatsApp não encontrada.', sessionSlot },
      { status: 404 },
    );
  }

  // Mesma regra de /log: o recurso tem que pertencer ao userId da key.
  const bot = await prisma.whatsAppBot.findFirst({
    where: { userId: stackUserId, slot: sessionSlot },
    select: { slot: true, isConnected: true, label: true },
  });

  if (!bot) {
    return NextResponse.json(
      { success: false, error: 'Sessão WhatsApp não encontrada.', sessionSlot },
      { status: 404 },
    );
  }

  const result = await callWhatsAppVpsSession(stackUserId, sessionSlot, 'send', {
    body: { to, message, slot: sessionSlot },
    timeoutMs: 90_000,
  });

  // VPS ainda sem POST /api/sessions/:id/send: cai no send-only (mesmo worker).
  const vpsResult =
    !result.ok && result.status === 404
      ? await callWhatsAppVps('relatorios', 'send', stackUserId, {
          search: `slot=${sessionSlot}`,
          body: { to, message, slot: sessionSlot },
          timeoutMs: 90_000,
        })
      : result;

  const sendOk = vpsResult.ok && vpsResult.data.success !== false;
  const rawError = String(vpsResult.data.error || vpsResult.data.message || '');
  const mapped = mapSendError(rawError, sessionSlot, bot.isConnected, sendOk);

  if (mapped) {
    return NextResponse.json(
      {
        success: false,
        error: mapped.error,
        code: mapped.code,
        sessionSlot,
      },
      { status: mapped.status },
    );
  }

  return NextResponse.json({
    success: true,
    sessionSlot,
    to: vpsResult.data.to ?? to,
    label: bot.label,
  });
}

function mapSendError(
  raw: string,
  sessionSlot: number,
  dbConnected: boolean,
  ok: boolean,
): { error: string; code: string; status: number } | null {
  if (ok) return null;

  const lower = raw.toLowerCase();

  if (
    lower.includes('ainda não está conectada') ||
    lower.includes('not connected')
  ) {
    return {
      error: `Sessão do slot ${sessionSlot} não está conectada ao WhatsApp.`,
      code: 'SESSION_NOT_CONNECTED',
      status: 409,
    };
  }

  if (
    lower.includes('não encontrada em memória') ||
    lower.includes('não restaurou o client') ||
    lower.includes('não está acessível') ||
    lower.includes('fetch failed') ||
    lower.includes('econnrefused')
  ) {
    return {
      error: dbConnected
        ? `Sessão do slot ${sessionSlot} aparece conectada no banco, mas o worker WhatsApp não está no ar. Religue a sessão em /connections sem reescanear o QR (sem force).`
        : `Sessão do slot ${sessionSlot} não está conectada ao WhatsApp.`,
      code: dbConnected ? 'SESSION_WORKER_DOWN' : 'SESSION_NOT_CONNECTED',
      status: dbConnected ? 503 : 409,
    };
  }

  if (lower.includes('timeout')) {
    return {
      error: `Timeout ao enviar pela sessão do slot ${sessionSlot}.`,
      code: 'SEND_TIMEOUT',
      status: 504,
    };
  }

  return {
    error: raw.trim() || `Falha ao enviar pela sessão do slot ${sessionSlot}.`,
    code: 'SEND_FAILED',
    status: 502,
  };
}
