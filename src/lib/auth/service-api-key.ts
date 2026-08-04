import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Retorna o hash SHA-256 de uma string (hex). */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

export interface ServiceKeyContext {
  userId: string;
  keyId: string;
}

/**
 * Lê o header `x-api-key`, valida contra ServiceApiKey no banco e retorna
 * o contexto `{ userId, keyId }` ou um NextResponse 401/500 em caso de falha.
 *
 * Uso numa route handler:
 *   const result = await requireServiceApiKey(req);
 *   if (result instanceof NextResponse) return result;
 *   const { userId } = result;
 */
export async function requireServiceApiKey(
  req: NextRequest,
): Promise<ServiceKeyContext | NextResponse> {
  const rawKey = req.headers.get('x-api-key');

  if (!rawKey) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  let record: { id: string; userId: string } | null;

  try {
    record = await prisma.serviceApiKey.findUnique({
      where: { key: hashApiKey(rawKey), ativo: true },
      select: { id: true, userId: true },
    });
  } catch (err) {
    console.error('[service-api-key] Erro ao verificar key:', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }

  if (!record) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  return { userId: record.userId, keyId: record.id };
}
