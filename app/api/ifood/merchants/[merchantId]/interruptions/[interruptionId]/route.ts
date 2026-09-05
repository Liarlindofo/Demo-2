export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';
import { getValidIfoodToken } from '@/lib/ifood-token';

function parseIfoodError(text: string, status: number): string {
  if (!text?.trim()) {
    if (status === 401) return 'Token iFood inválido ou expirado';
    if (status === 403) return 'Sem permissão para remover esta pausa no iFood';
    if (status === 404) return 'Pausa não encontrada (já removida)';
    if (status === 429) return 'Limite de requisições do iFood — tente em instantes';
    if (status >= 500) return `iFood indisponível (${status}) — tente novamente`;
    return `Erro iFood HTTP ${status}`;
  }
  try {
    const json = JSON.parse(text) as {
      message?: string;
      error?: string;
      code?: string;
      errorCode?: string;
    };
    const msg = json.message || json.error || text;
    const code = json.code || json.errorCode;
    return code ? `${msg} (${code})` : msg;
  } catch {
    return text.slice(0, 300);
  }
}

async function deleteOnIfood(
  merchantId: string,
  interruptionId: string,
  token: string,
): Promise<Response> {
  return fetch(
    `https://merchant-api.ifood.com.br/merchant/v1.0/merchants/${encodeURIComponent(merchantId)}/interruptions/${encodeURIComponent(interruptionId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    },
  );
}

// ---------------------------------------------------------------------------
// DELETE /api/ifood/merchants/[merchantId]/interruptions/[interruptionId]
// Remove uma interrupção (pausa) ativa ou futura da loja
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ merchantId: string; interruptionId: string }> },
) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await db.user.findFirst({ where: { stackUserId: stackUser.id } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { merchantId, interruptionId } = await params;

    if (!merchantId?.trim() || !interruptionId?.trim()) {
      return NextResponse.json({ error: 'merchantId e interruptionId são obrigatórios' }, { status: 400 });
    }

    const connection = await db.ifoodConnection.findFirst({
      where: { userId: user.id, merchantId },
    });
    if (!connection) {
      return NextResponse.json({ error: 'Loja não encontrada ou sem permissão' }, { status: 404 });
    }

    let token = await getValidIfoodToken();
    let res = await deleteOnIfood(merchantId, interruptionId, token);

    // Token expirado no iFood mas ainda em cache local → renova e tenta de novo
    if (res.status === 401) {
      token = await getValidIfoodToken(true);
      res = await deleteOnIfood(merchantId, interruptionId, token);
    }

    // 5xx transitório do iFood → uma nova tentativa
    if (res.status >= 500 && res.status <= 504) {
      await new Promise((r) => setTimeout(r, 800));
      res = await deleteOnIfood(merchantId, interruptionId, token);
    }

    // Já removida / inexistente → sucesso idempotente
    if (res.status === 404 || res.status === 410) {
      return new NextResponse(null, { status: 204 });
    }

    if (!res.ok) {
      const text = await res.text();
      const detail = parseIfoodError(text, res.status);
      console.error('[DELETE interruption] iFood error:', res.status, text);
      return NextResponse.json(
        {
          error: detail || 'Erro ao remover pausa no iFood',
          ifoodStatus: res.status,
        },
        { status: res.status === 403 ? 403 : res.status === 429 ? 429 : 502 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[DELETE interruption]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
