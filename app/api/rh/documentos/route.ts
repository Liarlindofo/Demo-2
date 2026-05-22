import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

export const dynamic = 'force-dynamic';

async function getDbUser() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;
  return syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    profileImageUrl: stackUser.profileImageUrl || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });
}

export async function POST(req: Request) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const {
      funcionarioId, tipo, nome, url, tamanhoBytes,
      dataVencimento, mesReferencia, anoReferencia, observacoes, uploadadoPor,
    } = body as {
      funcionarioId: string; tipo: string; nome: string; url: string;
      tamanhoBytes?: number; dataVencimento?: string; mesReferencia?: number;
      anoReferencia?: number; observacoes?: string; uploadadoPor: string;
    };

    if (!funcionarioId || !tipo || !nome || !url || !uploadadoPor)
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });

    // Verifica se o funcionário pertence ao usuário
    const func = await prisma.rhFuncionario.findFirst({
      where: { id: funcionarioId, userId: dbUser.id },
    });
    if (!func) return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const doc = await prisma.rhDocumentoFuncionario.create({
      data: {
        funcionarioId, userId: dbUser.id, tipo, nome, url,
        tamanhoBytes: tamanhoBytes ?? null,
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        mesReferencia: mesReferencia ?? null,
        anoReferencia: anoReferencia ?? null,
        observacoes: observacoes ?? null,
        uploadadoPor,
        ativo: true,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rh/documentos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
