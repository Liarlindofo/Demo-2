export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

// ── PATCH — reagendar (atualiza dataAgendada) ────────────────────────────

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
    const { dataAgendada } = body as { dataAgendada?: string };

    if (!dataAgendada) {
      return NextResponse.json({ error: 'dataAgendada é obrigatório.' }, { status: 400 });
    }

    const novaData = new Date(dataAgendada);
    if (isNaN(novaData.getTime())) {
      return NextResponse.json({ error: 'Data inválida.' }, { status: 400 });
    }
    // Tolerância de 60s para acomodar latência entre browser e servidor
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

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/tarefas/atribuicoes/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// ── DELETE — cancelar (apenas status AGENDADA, delete físico auditável) ──

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

    await prisma.tarefaAtribuida.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/tarefas/atribuicoes/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
