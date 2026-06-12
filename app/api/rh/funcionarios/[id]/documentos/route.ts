import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';


export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    const func = await prisma.rhFuncionario.findFirst({
      where: { id, userId: rh!.userId },
    });
    if (!func) return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const documentos = await prisma.rhDocumentoFuncionario.findMany({
      where: { funcionarioId: id, userId: rh!.userId, ativo: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documentos);
  } catch (err) {
    console.error('[GET /api/rh/funcionarios/[id]/documentos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
