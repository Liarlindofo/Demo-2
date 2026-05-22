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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');
    const mes = searchParams.get('mes');
    const ano = searchParams.get('ano');

    const func = await prisma.rhFuncionario.findFirst({
      where: { id, userId: dbUser.id },
    });
    if (!func) return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const where: Record<string, unknown> = {
      funcionarioId: id,
      userId: dbUser.id,
      ativo: true,
    };
    if (tipo) where.tipo = tipo;
    if (mes && ano) {
      const inicio = new Date(Number(ano), Number(mes) - 1, 1);
      const fim = new Date(Number(ano), Number(mes), 0, 23, 59, 59);
      where.data = { gte: inicio, lte: fim };
    }

    const ocorrencias = await prisma.rhOcorrencia.findMany({
      where,
      orderBy: { data: 'desc' },
    });

    // Resumo
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const faltasMes = ocorrencias.filter(
      (o) =>
        (o.tipo === 'falta_justificada' || o.tipo === 'falta_injustificada') &&
        o.data >= inicioMes
    ).length;
    const totalAdvertencias = ocorrencias.filter(
      (o) => o.tipo === 'advertencia_verbal' || o.tipo === 'advertencia_escrita'
    ).length;

    return NextResponse.json({
      ocorrencias,
      resumo: {
        faltasMes,
        totalAdvertencias,
        ultimaOcorrencia: ocorrencias[0] ?? null,
      },
    });
  } catch (err) {
    console.error('[GET /api/rh/funcionarios/[id]/ocorrencias]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
