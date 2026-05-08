export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

async function resolveOwnership(merchantId: string) {
  const stackUser = await stackServerApp.getUser();
  if (!stackUser) {
    return { ok: false as const, response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
  }
  const user = await db.user.findFirst({ where: { stackUserId: stackUser.id } });
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 }) };
  }
  const connection = await db.ifoodConnection.findFirst({ where: { userId: user.id, merchantId } });
  if (!connection) {
    return { ok: false as const, response: NextResponse.json({ error: 'Loja não encontrada ou sem permissão' }, { status: 404 }) };
  }
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// GET /api/ifood/merchants/[merchantId]/opening-hours
// Retorna horários de funcionamento da loja
// Formato iFood: [{ dayOfWeek: "SATURDAY", shifts: [{ start: "10:00", duration: 540 }] }]
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> },
) {
  try {
    const { merchantId } = await params;
    const ownership = await resolveOwnership(merchantId);
    if (!ownership.ok) return ownership.response;

    const token = await getValidIfoodToken();

    const res = await fetch(
      `https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${merchantId}/opening-hours`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('[GET opening-hours] iFood error:', res.status, body);
      return NextResponse.json({ error: 'Erro ao buscar horários no iFood' }, { status: 502 });
    }

    const data = await res.json();

    // Normaliza qualquer formato que iFood retorne para:
    // [{ dayOfWeek: string, shifts: [{ start: string, duration: number }] }]
    const raw: unknown[] = Array.isArray(data)
      ? data
      : ((data as Record<string, unknown>).openingHours as unknown[] | undefined)
        ?? ((data as Record<string, unknown>).shifts as unknown[] | undefined)
        ?? [];

    type RawShift = { dayOfWeek?: string; start?: string; duration?: number; shifts?: RawShift[] };
    const typedRaw = raw as RawShift[];

    // Detecta formato "flat" (cada item é um turno com dayOfWeek, sem array .shifts)
    const isFlat = typedRaw.length > 0 && !('shifts' in typedRaw[0]);

    let openingHours;
    if (isFlat) {
      const grouped: Record<string, { start: string; duration: number }[]> = {};
      for (const item of typedRaw) {
        if (item.dayOfWeek && item.start !== undefined && item.duration !== undefined) {
          if (!grouped[item.dayOfWeek]) grouped[item.dayOfWeek] = [];
          grouped[item.dayOfWeek].push({ start: item.start, duration: item.duration });
        }
      }
      openingHours = Object.entries(grouped).map(([dayOfWeek, shifts]) => ({ dayOfWeek, shifts }));
    } else {
      openingHours = typedRaw.map((d) => ({
        dayOfWeek: d.dayOfWeek ?? '',
        shifts: (d.shifts ?? []).map((s) => ({ start: s.start ?? '', duration: s.duration ?? 0 })),
      }));
    }

    return NextResponse.json({ openingHours });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET opening-hours]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/ifood/merchants/[merchantId]/opening-hours
// Atualiza horários de funcionamento
// Body esperado: { openingHours: [{ dayOfWeek: string, shifts: [{ start: string, duration: number }] }] }
// ---------------------------------------------------------------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> },
) {
  try {
    const { merchantId } = await params;
    const ownership = await resolveOwnership(merchantId);
    if (!ownership.ok) return ownership.response;

    const body = await req.json() as { openingHours?: unknown[] };

    if (!body.openingHours || !Array.isArray(body.openingHours)) {
      return NextResponse.json({ error: 'Corpo inválido: openingHours é obrigatório' }, { status: 400 });
    }

    const token = await getValidIfoodToken();

    const res = await fetch(
      `https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${merchantId}/opening-hours`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body.openingHours),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('[PUT opening-hours] iFood error:', res.status, text);
      return NextResponse.json({ error: 'Erro ao salvar horários no iFood' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[PUT opening-hours]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
