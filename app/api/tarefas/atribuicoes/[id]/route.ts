export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { mapEvidenciasComUrlsAssinadas } from '@/lib/tarefas-evidencia-url';

type SiblingBase = {
  userId: string;
  templateId: string;
  funcionarioId: string;
  lojaId: string;
  id: string;
  dataAgendada: Date;
};

/** Outras ocorrências AGENDADAS da mesma série (mesmo template + funcionário + loja). */
function siblingsWhere(base: SiblingBase, fromDate: Date) {
  return {
    userId: base.userId,
    templateId: base.templateId,
    funcionarioId: base.funcionarioId,
    lojaId: base.lojaId,
    status: 'AGENDADA' as const,
    id: { not: base.id },
    dataAgendada: { gte: fromDate },
  };
}

function startOfTodaySp(): Date {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    new Date(),
  );
  return new Date(`${ymd}T00:00:00-03:00`);
}

/** Mantém o dia civil da ocorrência e troca só o horário (HH:mm) em America/Sao_Paulo. */
function applyHorarioToDate(original: Date, horarioHHmm: string): Date {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    original,
  );
  return new Date(`${ymd}T${horarioHHmm}:00-03:00`);
}

function horarioFromDate(d: Date): string {
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  });
}

// ── GET — detalhe com evidências (foto, texto, localização) ───────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const atribuicao = await prisma.tarefaAtribuida.findFirst({
      where: { id, userId: rh.userId },
      include: {
        template: { select: { id: true, titulo: true, descricao: true } },
        funcionario: {
          select: {
            id: true,
            nome: true,
            cargo: { select: { id: true, nome: true } },
          },
        },
        loja: { select: { id: true, nome: true } },
        evidencias: {
          select: {
            id: true,
            tipo: true,
            conteudoTexto: true,
            urlArquivo: true,
            latitude: true,
            longitude: true,
            analiseIA: true,
            recebidaEm: true,
          },
          orderBy: { recebidaEm: 'asc' },
        },
      },
    });

    if (!atribuicao) {
      return NextResponse.json({ error: 'Atribuição não encontrada.' }, { status: 404 });
    }

    const evidencias = await mapEvidenciasComUrlsAssinadas(atribuicao.evidencias);

    // Conta irmãos futuros AGENDADOS (pra UI mostrar “X outros dias”)
    const outrosDias = await prisma.tarefaAtribuida.count({
      where: siblingsWhere(atribuicao, startOfTodaySp()),
    });

    return NextResponse.json({ ...atribuicao, evidencias, outrosDias });
  } catch (err) {
    console.error('[GET /api/tarefas/atribuicoes/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// ── PATCH — reagendar (data/hora); opcionalmente outros dias da série ─────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const atribuicao = await prisma.tarefaAtribuida.findFirst({
      where: { id, userId: rh.userId },
    });
    if (!atribuicao) {
      return NextResponse.json({ error: 'Atribuição não encontrada.' }, { status: 404 });
    }

    const body = await req.json();
    const { dataAgendada, aplicarOutrosDias } = body as {
      dataAgendada?: string;
      aplicarOutrosDias?: boolean;
    };

    if (!dataAgendada) {
      return NextResponse.json({ error: 'dataAgendada é obrigatório.' }, { status: 400 });
    }

    const novaData = new Date(dataAgendada);
    if (isNaN(novaData.getTime())) {
      return NextResponse.json({ error: 'Data inválida.' }, { status: 400 });
    }
    const limitePassado = new Date(Date.now() - 60_000);
    if (novaData <= limitePassado) {
      return NextResponse.json(
        { error: 'A nova data/hora não pode estar no passado.' },
        { status: 400 },
      );
    }

    const updated = await prisma.tarefaAtribuida.update({
      where: { id },
      data: { dataAgendada: novaData },
      include: {
        template: { select: { id: true, titulo: true } },
        funcionario: {
          select: {
            id: true,
            nome: true,
            cargo: { select: { id: true, nome: true } },
          },
        },
        loja: { select: { id: true, nome: true } },
      },
    });

    let atualizadosOutros = 0;
    if (aplicarOutrosDias === true) {
      const horario = horarioFromDate(novaData);
      const siblings = await prisma.tarefaAtribuida.findMany({
        where: siblingsWhere(atribuicao, startOfTodaySp()),
        select: { id: true, dataAgendada: true },
      });

      for (const sib of siblings) {
        const next = applyHorarioToDate(sib.dataAgendada, horario);
        if (next <= limitePassado) continue;
        await prisma.tarefaAtribuida.update({
          where: { id: sib.id },
          data: { dataAgendada: next },
        });
        atualizadosOutros += 1;
      }
    }

    return NextResponse.json({ ...updated, atualizadosOutros });
  } catch (err) {
    console.error('[PATCH /api/tarefas/atribuicoes/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// ── DELETE — cancelar; opcionalmente outros dias AGENDADOS da série ───────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const atribuicao = await prisma.tarefaAtribuida.findFirst({
      where: { id, userId: rh.userId },
    });
    if (!atribuicao) {
      return NextResponse.json({ error: 'Atribuição não encontrada.' }, { status: 404 });
    }

    if (atribuicao.status !== 'AGENDADA') {
      return NextResponse.json(
        { error: 'Apenas atribuições com status AGENDADA podem ser canceladas.' },
        { status: 409 },
      );
    }

    let aplicarOutrosDias = false;
    try {
      const body = await req.json();
      aplicarOutrosDias = body?.aplicarOutrosDias === true;
    } catch {
      // body opcional
    }

    let excluidosOutros = 0;
    if (aplicarOutrosDias) {
      const result = await prisma.tarefaAtribuida.deleteMany({
        where: siblingsWhere(atribuicao, startOfTodaySp()),
      });
      excluidosOutros = result.count;
    }

    await prisma.tarefaAtribuida.delete({ where: { id } });
    return NextResponse.json({ ok: true, excluidosOutros });
  } catch (err) {
    console.error('[DELETE /api/tarefas/atribuicoes/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
