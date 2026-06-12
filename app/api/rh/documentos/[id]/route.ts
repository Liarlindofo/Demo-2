import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';


export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;

    const doc = await prisma.rhDocumentoFuncionario.findFirst({
      where: { id, userId: rh!.userId },
    });
    if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });

    await prisma.rhDocumentoFuncionario.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/rh/documentos/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
