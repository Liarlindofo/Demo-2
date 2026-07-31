export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

/**
 * POST /api/rh/lojas/[id]/geocode
 *
 * Geocodifica o endereço da loja via Nominatim (OpenStreetMap, gratuito)
 * e salva lat/lng no banco.
 *
 * Body opcional: { endereco: string } — se não enviado, usa o endereço já
 * cadastrado na loja.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const loja = await prisma.rhLoja.findFirst({ where: { id, userId: rh.userId } });
    if (!loja) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const endereco = body.endereco?.trim() || loja.endereco?.trim();

    if (!endereco) {
      return NextResponse.json(
        { error: 'A loja não possui endereço cadastrado.' },
        { status: 400 },
      );
    }

    const query = encodeURIComponent(endereco);
    const url   = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br`;

    const nominatimRes = await fetch(url, {
      headers: { 'User-Agent': 'Platefull/1.0 (contato@platefull.com.br)' },
    });

    if (!nominatimRes.ok) {
      return NextResponse.json(
        { error: 'Erro ao consultar serviço de geocoding.' },
        { status: 502 },
      );
    }

    const results: any[] = await nominatimRes.json();

    if (!results.length) {
      return NextResponse.json(
        { error: 'Endereço não encontrado. Tente um endereço mais completo (rua, número, cidade).' },
        { status: 404 },
      );
    }

    const lat = parseFloat(results[0].lat);
    const lng = parseFloat(results[0].lon);

    await prisma.rhLoja.update({
      where: { id },
      data:  { latitude: lat, longitude: lng },
    });

    return NextResponse.json({
      latitude:    lat,
      longitude:   lng,
      displayName: results[0].display_name,
    });
  } catch (err) {
    console.error('[POST /api/rh/lojas/[id]/geocode]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
