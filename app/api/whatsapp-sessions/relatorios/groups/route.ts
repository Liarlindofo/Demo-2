export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { callWhatsAppVps, callWhatsAppVpsSession } from '@/lib/whatsapp-vps';

/**
 * GET /api/whatsapp-sessions/relatorios/groups
 * Legado: lista grupos do slot 2 (ou ?slot=N).
 * Preferir GET /api/whatsapp-sessions/slot/:slot/groups
 */
export async function GET(req: NextRequest) {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) {
    return NextResponse.json({ success: false, message: 'Não autenticado', groups: [] }, { status: 401 });
  }

  const slotParam = req.nextUrl.searchParams.get('slot');
  const slot = slotParam ? parseInt(slotParam, 10) : 2;

  if (Number.isFinite(slot) && slot >= 1) {
    const result = await callWhatsAppVpsSession(stackUser.id, slot, 'groups', {
      timeoutMs: 60_000,
    });
    return NextResponse.json(
      {
        success: result.ok || result.data.success === true,
        slot,
        ...result.data,
        groups: Array.isArray(result.data.groups) ? result.data.groups : [],
        note:
          (result.data.note as string) ||
          'Só aparecem grupos em que este número já participa.',
      },
      { status: result.ok ? 200 : result.status || 502 },
    );
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
