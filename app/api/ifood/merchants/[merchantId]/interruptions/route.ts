export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

async function resolveOwnership(merchantId: string) {
  const stackUser = await stackServerApp.getUser();
  if (!stackUser) return { ok: false as const, response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };

  const user = await db.user.findFirst({ where: { stackUserId: stackUser.id } });
  if (!user) return { ok: false as const, response: NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 }) };

  const connection = await db.ifoodConnection.findFirst({ where: { userId: user.id, merchantId } });
  if (!connection) return { ok: false as const, response: NextResponse.json({ error: 'Loja não encontrada ou sem permissão' }, { status: 404 }) };

  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// GET /api/ifood/merchants/[merchantId]/interruptions
// Lista interrupções (pausas) ativas da loja
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
      `https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${encodeURIComponent(merchantId)}/interruptions`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('[GET interruptions] iFood error:', res.status, body);
      return NextResponse.json({ error: 'Erro ao buscar interrupções no iFood' }, { status: 502 });
    }

    const data = await res.json();
    // iFood retorna array diretamente ou { interruptions: [] }
    const rawList: unknown[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.interruptions)
        ? data.interruptions
        : [];

    const interruptions = rawList
      .map((item) => {
        const row = (item ?? {}) as Record<string, unknown>;
        const id = String(row.id ?? row.interruptionId ?? '').trim();
        if (!id) return null;
        return {
          id,
          description: typeof row.description === 'string' ? row.description : undefined,
          start: String(row.start ?? ''),
          end: String(row.end ?? ''),
        };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null);

    return NextResponse.json({ interruptions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[GET interruptions]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/ifood/merchants/[merchantId]/interruptions
// Cria uma nova interrupção (pausa) na loja
// Body: { description: string, durationMinutes: number }
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> },
) {
  try {
    const { merchantId } = await params;
    const ownership = await resolveOwnership(merchantId);
    if (!ownership.ok) return ownership.response;

    const body = await req.json() as { description?: string; durationMinutes?: number };
    const description = body.description?.trim() || 'Pausa manual';
    const durationMinutes = Number(body.durationMinutes ?? 60);

    if (!durationMinutes || durationMinutes <= 0) {
      return NextResponse.json({ error: 'Duração inválida' }, { status: 400 });
    }

    const now = new Date();
    const end = new Date(now.getTime() + durationMinutes * 60 * 1000);

    // iFood prefere ISO-8601 sem milissegundos
    const toIfoodIso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z');

    const token = await getValidIfoodToken();

    const res = await fetch(
      `https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${encodeURIComponent(merchantId)}/interruptions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          description,
          start: toIfoodIso(now),
          end: toIfoodIso(end),
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error('[POST interruptions] iFood error:', res.status, text);
      let detail = 'Erro ao criar pausa no iFood';
      try {
        const json = JSON.parse(text) as { message?: string; error?: string; code?: string };
        detail = json.message || json.error || detail;
        if (json.code) detail = `${detail} (${json.code})`;
      } catch {
        if (text) detail = text.slice(0, 200);
      }
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    // iFood pode retornar 201 com o objeto criado ou sem body
    const text = await res.text();
    const data = text ? JSON.parse(text) : { description, start: now.toISOString(), end: end.toISOString() };
    return NextResponse.json({ interruption: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[POST interruptions]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
