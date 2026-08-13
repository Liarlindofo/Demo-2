import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import {
  callWhatsAppVps,
  normalizeSessionPayload,
  type WhatsAppSessionKind,
} from '@/lib/whatsapp-vps';

export function parseKind(raw: string | undefined): WhatsAppSessionKind | null {
  if (raw === 'atendimento' || raw === 'relatorios') return raw;
  return null;
}

export async function requireSessionUser() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) {
    return { error: NextResponse.json({ success: false, message: 'Não autenticado' }, { status: 401 }) };
  }
  return { userId: stackUser.id };
}

export async function proxySessionAction(
  kind: WhatsAppSessionKind,
  action: 'start' | 'stop' | 'qr' | 'status',
  userId: string,
  search?: string,
) {
  if (action === 'status') {
    let result = await callWhatsAppVps(kind, action, userId, { search });

    // VPS antiga sem /send-only/.../status: cai no /qr
    if (!result.ok && kind === 'relatorios' && (result.status === 404 || String(result.data.message || '').includes('não encontrada'))) {
      result = await callWhatsAppVps(kind, 'qr', userId);
    }

    const session = normalizeSessionPayload(
      result.data.session
        ? result.data
        : {
            ...result.data,
            session: {
              status: result.data.isConnected
                ? 'CONNECTED'
                : result.data.qrCode
                  ? 'QRCODE'
                  : 'DISCONNECTED',
              qrCode: result.data.qrCode ?? null,
              isActive: Boolean(result.data.isConnected || result.data.qrCode),
              isConnected: Boolean(result.data.isConnected),
              connectedNumber: result.data.connectedNumber ?? null,
            },
          },
    );

    return NextResponse.json(
      {
        success: result.ok || result.data.success !== false,
        kind,
        userId,
        session,
        message: result.data.message,
      },
      { status: result.ok ? 200 : result.status >= 400 && result.status < 600 ? result.status : 502 },
    );
  }

  if (action === 'qr') {
    const result = await callWhatsAppVps(kind, action, userId, { search });
    const session = normalizeSessionPayload({
      ...result.data,
      session: {
        status: result.data.isConnected ? 'CONNECTED' : result.data.qrCode ? 'QRCODE' : 'DISCONNECTED',
        qrCode: result.data.qrCode ?? null,
        isActive: true,
        isConnected: Boolean(result.data.isConnected),
        connectedNumber: result.data.connectedNumber ?? null,
      },
    });

    return NextResponse.json(
      {
        success: result.ok || result.data.success !== false,
        kind,
        qrCode: (result.data.qrCode as string) || session.qrCode,
        isConnected: session.isConnected,
        message: result.data.message,
        session,
      },
      { status: result.ok ? 200 : result.status || 502 },
    );
  }

  // start / stop
  const result = await callWhatsAppVps(kind, action, userId, { search });
  return NextResponse.json(
    {
      success: result.ok || result.data.success === true,
      kind,
      message: result.data.message,
      qrCode: result.data.qrCode ?? null,
      ...result.data,
    },
    { status: result.ok ? 200 : result.status || 502 },
  );
}
