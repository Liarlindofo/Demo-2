export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { callWhatsAppVps } from '@/lib/whatsapp-vps';

/**
 * GET /api/whatsapp-sessions/relatorios/groups
 * Proxy → GET /api/send-only/:userId/groups na VPS (lista grupos da sessão slot2).
 */
export async function GET() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) {
    return NextResponse.json({ success: false, message: 'Não autenticado', groups: [] }, { status: 401 });
  }

  const result = await callWhatsAppVps('relatorios', 'groups', stackUser.id, {
    method: 'GET',
    timeoutMs: 60_000,
  });

  return NextResponse.json(
    {
      success: result.ok || result.data.success === true,
      ...result.data,
      groups: Array.isArray(result.data.groups) ? result.data.groups : [],
      note:
        (result.data.note as string) ||
        'Só aparecem grupos em que o número de Relatórios já participa.',
    },
    { status: result.ok ? 200 : result.status || 502 },
  );
}
