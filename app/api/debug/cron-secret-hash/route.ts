/**
 * GET /api/debug/cron-secret-hash
 *
 * ⚠️  ROTA TEMPORÁRIA DE DEBUG — remover após confirmar que o CRON_SECRET
 *     bate entre Vercel, .env local e crontab da VPS.
 *
 * Retorna APENAS os 8 primeiros caracteres do SHA-256 do CRON_SECRET.
 * O valor original jamais é retornado, logado ou exposto.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function GET() {
  const secret = process.env.CRON_SECRET ?? '';

  if (!secret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET não definido' }, { status: 500 });
  }

  const hash8 = createHash('sha256')
    .update(secret, 'utf8')
    .digest('hex')
    .slice(0, 8);

  return NextResponse.json({ ok: true, sha256_8: hash8 });
}
