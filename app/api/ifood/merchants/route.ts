import { NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { getValidIfoodToken } from '@/lib/ifood-token';

export async function GET() {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const token = await getValidIfoodToken();

    const res = await fetch(
      'https://merchant-api.ifood.com.br/merchant/v1.0/merchants',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('[ifood/merchants] Erro iFood:', res.status, body);
      return NextResponse.json(
        { error: 'Erro ao buscar lojas no iFood' },
        { status: 502 },
      );
    }

    const merchants = await res.json();
    return NextResponse.json({ merchants });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[ifood/merchants]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
