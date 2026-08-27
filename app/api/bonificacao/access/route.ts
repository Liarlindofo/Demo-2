import { NextResponse } from 'next/server';
import { getBonificacaoAuth } from '@/lib/bonificacao-auth';

/** GET /api/bonificacao/access — gate de UI alinhado ao auth das APIs. */
export async function GET() {
  const ctx = await getBonificacaoAuth();
  if (!ctx) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
