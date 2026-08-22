export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { getRhContext } from '@/lib/rh-auth';
import { callWhatsAppVpsSession } from '@/lib/whatsapp-vps';
import { findWhatsAppBotForTenant } from '@/lib/whatsapp-sessions';

function parseSlot(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

/**
 * GET /api/whatsapp-sessions/slot/:slot/groups
 * Lista grupos em que ESTE número (sessão do slot) já participa.
 *
 * ?scope=tenant — usa sessão WhatsApp de qualquer conta da empresa (relatórios).
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slot: string }> },
) {
  const { slot: raw } = await ctx.params;
  const slot = parseSlot(raw);
  if (!slot) {
    return NextResponse.json({ success: false, message: 'Slot inválido', groups: [] }, { status: 400 });
  }

  const scope = req.nextUrl.searchParams.get('scope');
  let stackUserId: string | null = null;

  if (scope === 'tenant') {
    const rhCtx = await getRhContext();
    if (!rhCtx) {
      return NextResponse.json({ success: false, message: 'Não autenticado', groups: [] }, { status: 401 });
    }
    const bot = await findWhatsAppBotForTenant(rhCtx.userId, slot);
    if (!bot) {
      return NextResponse.json(
        {
          success: false,
          message: 'Sessão WhatsApp não encontrada para esta empresa neste slot.',
          groups: [],
        },
        { status: 404 },
      );
    }
    stackUserId = bot.userId;
  } else {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ success: false, message: 'Não autenticado', groups: [] }, { status: 401 });
    }
    stackUserId = stackUser.id;
  }

  const result = await callWhatsAppVpsSession(stackUserId, slot, 'groups', {
    timeoutMs: 90_000,
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
