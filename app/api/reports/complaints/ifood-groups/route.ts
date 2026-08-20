export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionDbUser } from '@/lib/rh-api-auth';

function slugifyLoja(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

function normalizeGroupJid(raw: string): string | null {
  const s = String(raw || '').trim();
  if (!s) return null;
  if (s.includes('@g.us')) {
    const m = s.match(/[\w.-]+@g\.us/i);
    return m ? m[0] : null;
  }
  const digits = s.replace(/\D/g, '');
  return digits ? `${digits}@g.us` : null;
}

/**
 * GET /api/reports/complaints/ifood-groups
 * Lista grupos iFood cadastrados do tenant.
 */
export async function GET() {
  const dbUser = await getSessionDbUser();
  if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const groups = await prisma.iFoodComplaintGroup.findMany({
    where: { userId: dbUser.id },
    orderBy: [{ lojaNome: 'asc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json({ groups });
}

/**
 * POST /api/reports/complaints/ifood-groups
 * Body: { groupWhatsAppId, lojaNome, lojaSlug?, sessionSlot, ativo? }
 */
export async function POST(req: NextRequest) {
  const dbUser = await getSessionDbUser();
  if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  let body: {
    groupWhatsAppId?: string;
    lojaNome?: string;
    lojaSlug?: string;
    sessionSlot?: number;
    ativo?: boolean;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 });
  }

  const groupWhatsAppId = normalizeGroupJid(body.groupWhatsAppId || '');
  const lojaNome = String(body.lojaNome || '').trim();
  const sessionSlot = Number(body.sessionSlot);
  const lojaSlug =
    String(body.lojaSlug || '').trim() || (lojaNome ? slugifyLoja(lojaNome) : '');

  if (!groupWhatsAppId) {
    return NextResponse.json({ error: 'groupWhatsAppId inválido.' }, { status: 400 });
  }
  if (!lojaNome || !lojaSlug) {
    return NextResponse.json({ error: 'Informe lojaNome (e opcionalmente lojaSlug).' }, { status: 400 });
  }
  if (!Number.isFinite(sessionSlot) || sessionSlot < 1) {
    return NextResponse.json({ error: 'sessionSlot inválido.' }, { status: 400 });
  }

  try {
    const group = await prisma.iFoodComplaintGroup.upsert({
      where: {
        userId_groupWhatsAppId: {
          userId: dbUser.id,
          groupWhatsAppId,
        },
      },
      create: {
        userId: dbUser.id,
        groupWhatsAppId,
        lojaNome,
        lojaSlug,
        sessionSlot: Math.trunc(sessionSlot),
        ativo: body.ativo !== false,
      },
      update: {
        lojaNome,
        lojaSlug,
        sessionSlot: Math.trunc(sessionSlot),
        ativo: body.ativo !== false,
      },
    });
    return NextResponse.json({ group }, { status: 201 });
  } catch (err) {
    console.error('[ifood-groups] POST', err);
    return NextResponse.json({ error: 'Falha ao salvar grupo.' }, { status: 500 });
  }
}
