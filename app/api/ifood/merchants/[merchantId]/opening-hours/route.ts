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

    const data = await res.json() as { shifts?: { id?: string; dayOfWeek?: string; start?: string; duration?: number }[] };

    // iFood retorna { shifts: [{ id, dayOfWeek, start, duration }] }
    // Agrupar por dayOfWeek, ignorando o campo id
    const flatShifts = data.shifts ?? [];
    const grouped: Record<string, { start: string; duration: number }[]> = {};
    for (const shift of flatShifts) {
      if (shift.dayOfWeek && shift.start !== undefined && shift.duration !== undefined) {
        if (!grouped[shift.dayOfWeek]) grouped[shift.dayOfWeek] = [];
        grouped[shift.dayOfWeek].push({ start: shift.start, duration: shift.duration });
      }
    }
    const openingHours = Object.entries(grouped).map(([dayOfWeek, shifts]) => ({ dayOfWeek, shifts }));

    return NextResponse.json({ openingHours });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET opening-hours]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/ifood/merchants/[merchantId]/opening-hours
// Atualiza horários de funcionamento — envia todos os 7 dias (fechados com shifts:[])
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

    type DayEntry = { dayOfWeek?: string; shifts?: { start?: string; duration?: number }[] };
    const openingHours = body.openingHours as DayEntry[];

    const formatStart = (s: string) => s.length === 5 ? `${s}:00` : s;

    // Converter formato agrupado por dia para formato flat esperado pelo iFood
    const flatShifts = openingHours.flatMap((day) =>
      (day.shifts ?? []).map((shift) => ({
        dayOfWeek: day.dayOfWeek,
        start: shift.start ? formatStart(shift.start) : shift.start,
        duration: shift.duration,
      })),
    );

    const res = await fetch(
      `https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${merchantId}/opening-hours`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ shifts: flatShifts }),
      },
    );

    if (!res.ok && res.status !== 204) {
      const text = await res.text();
      console.error('[PUT opening-hours] iFood error:', res.status, text);
      // Expõe a mensagem real do iFood para facilitar depuração
      let ifoodMessage = `Erro HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(text) as { message?: string; details?: string; description?: string };
        ifoodMessage = parsed.message ?? parsed.details ?? parsed.description ?? ifoodMessage;
      } catch { /* não era JSON */ }
      return NextResponse.json(
        { error: `Erro ao salvar horários no iFood: ${ifoodMessage}` },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[PUT opening-hours]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
