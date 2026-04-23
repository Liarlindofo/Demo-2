import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/db';

async function getPrismaUser(stackUserId: string) {
  return db.user.findFirst({ where: { stackUserId } });
}

// ---------------------------------------------------------------------------
// DELETE /api/ifood/connections/:id — remove uma conexão de loja
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await getPrismaUser(stackUser.id);
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const { id } = await params;

    const connection = await db.ifoodConnection.findUnique({ where: { id } });

    if (!connection) {
      return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 });
    }

    if (connection.userId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    await db.ifoodConnection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[DELETE ifood/connections/:id]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
