import { NextRequest, NextResponse } from 'next/server';

/**
 * Verifica a autenticação servidor-servidor do bot WhatsApp.
 * Compara o header X-API-Key com process.env.BOT_API_KEY.
 * Retorna NextResponse de erro ou null se autenticado.
 */
export function requireBotAuth(req: NextRequest): NextResponse | null {
  const expected = process.env.BOT_API_KEY;

  if (!expected) {
    console.error('[bot-auth] BOT_API_KEY não configurada');
    return NextResponse.json(
      { error: 'Configuração de API key ausente no servidor.' },
      { status: 500 },
    );
  }

  const provided = req.headers.get('x-api-key');
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  return null;
}
