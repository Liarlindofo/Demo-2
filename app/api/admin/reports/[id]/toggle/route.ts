import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionDbUser } from '@/lib/rh-api-auth';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/reports/:id/toggle
 * Alterna ativo/inativo do ReportDefinition.
 */
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const dbUser = await getSessionDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.reportDefinition.findFirst({
      where: { id, userId: dbUser.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Relatório não encontrado.' }, { status: 404 });
    }

    const report = await prisma.reportDefinition.update({
      where: { id },
      data: { ativo: !existing.ativo },
      include: {
        campos: { orderBy: { ordem: 'asc' }, select: { campoKey: true, ordem: true } },
        execucoes: {
          orderBy: { executadoEm: 'desc' },
          take: 1,
          select: { id: true, status: true, executadoEm: true, erro: true },
        },
      },
    });

    const { execucoes, ...rest } = report;
    return NextResponse.json({
      ...rest,
      ultimaExecucao: execucoes[0] ?? null,
    });
  } catch (err) {
    console.error('[PATCH /api/admin/reports/:id/toggle]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
