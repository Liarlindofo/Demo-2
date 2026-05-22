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
      funcionarioId, tipo, data, descricao, gravidade,
      testemunhas, providencia, registradoPor,
      cidAfastamento, dataInicioAfastamento, dataFimAfastamento,
    } = body as {
      funcionarioId: string; tipo: string; data: string; descricao: string;
      gravidade?: string; testemunhas?: string; providencia?: string;
      registradoPor: string; cidAfastamento?: string;
      dataInicioAfastamento?: string; dataFimAfastamento?: string;
    };

    if (!funcionarioId || !tipo || !data || !descricao || !registradoPor)
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });

    const func = await prisma.rhFuncionario.findFirst({
      where: { id: funcionarioId, userId: dbUser.id },
    });
    if (!func) return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const ocorrencia = await prisma.rhOcorrencia.create({
      data: {
        funcionarioId, userId: dbUser.id, tipo,
        data: new Date(data),
        descricao, registradoPor,
        gravidade: gravidade ?? null,
        testemunhas: testemunhas ?? null,
        providencia: providencia ?? null,
        cidAfastamento: cidAfastamento ?? null,
        dataInicioAfastamento: dataInicioAfastamento ? new Date(dataInicioAfastamento) : null,
        dataFimAfastamento: dataFimAfastamento ? new Date(dataFimAfastamento) : null,
        ativo: true,
      },
    });

    return NextResponse.json(ocorrencia, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rh/ocorrencias]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
