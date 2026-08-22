import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReportsTenantUserId } from '@/lib/reports-tenant-auth';
import { ReportEscopoLoja, ReportFonte } from '@prisma/client';

export const dynamic = 'force-dynamic';

const ESCOPOS = new Set<string>(Object.values(ReportEscopoLoja));

function validarHorario(h: unknown): h is string {
  return typeof h === 'string' && /^\d{2}:\d{2}$/.test(h);
}

/**
 * GET /api/admin/reports
 * Lista ReportDefinition do tenant (empresa — dono + equipe RH).
 */
export async function GET() {
  try {
    const tenantUserId = await getReportsTenantUserId();
    if (!tenantUserId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const reports = await prisma.reportDefinition.findMany({
      where: { userId: tenantUserId },
      include: {
        campos: { orderBy: { ordem: 'asc' }, select: { campoKey: true, ordem: true } },
        execucoes: {
          orderBy: { executadoEm: 'desc' },
          take: 1,
          select: { id: true, status: true, executadoEm: true, erro: true },
        },
      },
      orderBy: [{ ativo: 'desc' }, { horario: 'asc' }, { nome: 'asc' }],
    });

    const result = reports.map(({ execucoes, ...rest }) => ({
      ...rest,
      ultimaExecucao: execucoes[0] ?? null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/admin/reports]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/admin/reports
 * Cria ReportDefinition + ReportField[].
 */
export async function POST(req: Request) {
  try {
    const tenantUserId = await getReportsTenantUserId();
    if (!tenantUserId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const {
      nome,
      horario,
      escopoLoja,
      destinoWhatsapp,
      sessionSlot,
      ativo = true,
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

    const report = await prisma.reportDefinition.create({
      data: {
        userId: tenantUserId,
        nome: nome.trim(),
        fonte: ReportFonte.SAIPOS_DASHBOARD,
        horario,
        escopoLoja: escopoLoja as ReportEscopoLoja,
        destinoWhatsapp: destinoWhatsapp.trim(),
        sessionSlot: slot,
        ativo: !!ativo,
        campos: {
          create: uniqueKeys.map((campoKey, ordem) => ({ campoKey, ordem })),
        },
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

    const { execucoes, ...rest } = report;
    return NextResponse.json(
      { ...rest, ultimaExecucao: execucoes[0] ?? null },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/admin/reports]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
