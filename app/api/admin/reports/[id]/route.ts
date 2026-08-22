import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReportsTenantUserIds } from '@/lib/reports-tenant-auth';
import { ReportEscopoLoja } from '@prisma/client';

export const dynamic = 'force-dynamic';

const ESCOPOS = new Set<string>(Object.values(ReportEscopoLoja));

function validarHorario(h: unknown): h is string {
  return typeof h === 'string' && /^\d{2}:\d{2}$/.test(h);
}

/**
 * PUT /api/admin/reports/:id
 * Atualiza ReportDefinition e sincroniza ReportField.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userIds = await getReportsTenantUserIds();
    if (!userIds) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.reportDefinition.findFirst({
      where: { id, userId: { in: userIds } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Relatório não encontrado.' }, { status: 404 });
    }

    const body = await req.json();
    const {
      nome,
      horario,
      escopoLoja,
      destinoWhatsapp,
      sessionSlot,
      ativo,
      campos,
    } = body as {
      nome?: string;
      horario?: string;
      escopoLoja?: string;
      destinoWhatsapp?: string;
      sessionSlot?: number | null;
      ativo?: boolean;
      campos?: string[];
    };

    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 });
    }
    if (!validarHorario(horario)) {
      return NextResponse.json({ error: 'Horário inválido. Use HH:mm.' }, { status: 400 });
    }
    if (!escopoLoja || !ESCOPOS.has(escopoLoja)) {
      return NextResponse.json(
        { error: 'escopoLoja inválido. Use POR_LOJA, CONSOLIDADO ou AMBOS.' },
        { status: 400 },
      );
    }
    if (!destinoWhatsapp?.trim()) {
      return NextResponse.json({ error: 'destinoWhatsapp é obrigatório.' }, { status: 400 });
    }
    const slot = sessionSlot == null ? null : parseInt(String(sessionSlot), 10);
    if (slot != null && (!Number.isFinite(slot) || slot < 1)) {
      return NextResponse.json({ error: 'sessionSlot inválido.' }, { status: 400 });
    }
    if (!Array.isArray(campos) || campos.length === 0) {
      return NextResponse.json({ error: 'Selecione ao menos um campo.' }, { status: 400 });
    }

    const uniqueKeys = [...new Set(campos.map(String))];
    const catalog = await prisma.saiposFieldCatalog.findMany({
      where: { key: { in: uniqueKeys } },
      select: { key: true },
    });
    const validKeys = new Set(catalog.map((c) => c.key));
    const invalid = uniqueKeys.filter((k) => !validKeys.has(k));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Campos inválidos no catálogo: ${invalid.join(', ')}` },
        { status: 400 },
      );
    }

    const report = await prisma.$transaction(async (tx) => {
      await tx.reportField.deleteMany({ where: { reportDefinitionId: id } });
      await tx.reportField.createMany({
        data: uniqueKeys.map((campoKey, ordem) => ({
          reportDefinitionId: id,
          campoKey,
          ordem,
        })),
      });

      return tx.reportDefinition.update({
        where: { id },
        data: {
          nome: nome.trim(),
          horario,
          escopoLoja: escopoLoja as ReportEscopoLoja,
          destinoWhatsapp: destinoWhatsapp.trim(),
          sessionSlot: slot,
          ...(ativo !== undefined && { ativo: !!ativo }),
        },
        include: {
          campos: { orderBy: { ordem: 'asc' }, select: { campoKey: true, ordem: true } },
          execucoes: {
            orderBy: { executadoEm: 'desc' },
            take: 1,
            select: { id: true, status: true, executadoEm: true, erro: true },
          },
        },
      });
    });

    const { execucoes, ...rest } = report;
    return NextResponse.json({
      ...rest,
      ultimaExecucao: execucoes[0] ?? null,
    });
  } catch (err) {
    console.error('[PUT /api/admin/reports/:id]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
