import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { parseHorarioHHmm } from '@/lib/tarefas-dias';
import { parseTemplateRecorrencia } from '@/lib/tarefas-template-recorrencia';
import { propagarTemplateNoGrupo } from '@/lib/tarefas-propagar-grupo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const templates = await prisma.tarefaTemplate.findMany({
      where: { userId: rh.userId },
      include: {
        loja: { select: { id: true, nome: true } },
        cargo: { select: { id: true, nome: true } },
        grupoItens: {
          include: {
            grupo: { select: { id: true, nome: true, ativo: true } },
          },
        },
      },
      orderBy: [{ ativo: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(templates);
  } catch (err) {
    console.error('[GET /api/tarefas/templates]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const {
      titulo,
      descricao,
      exigeFoto,
      exigeConfirmacaoTexto,
      exigeLocalizacao,
      exigeArquivo,
      validacaoIA,
      lojaId,
      cargoId,
      grupoId,
      horarioPadrao: horarioRaw,
    } = body;

    if (!titulo?.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório.' }, { status: 400 });
    }
    if (!descricao?.trim()) {
      return NextResponse.json({ error: 'Descrição é obrigatória.' }, { status: 400 });
    }
    if (!exigeFoto && !exigeConfirmacaoTexto && !exigeLocalizacao && !exigeArquivo) {
      return NextResponse.json(
        { error: 'Pelo menos um tipo de evidência deve ser selecionado.' },
        { status: 400 },
      );
    }

    const recorrencia = parseTemplateRecorrencia(body);
    if (recorrencia.ok === false) {
      return NextResponse.json({ error: recorrencia.error }, { status: 400 });
    }

    const horarioPadrao = parseHorarioHHmm(horarioRaw);
    if (!horarioPadrao) {
      return NextResponse.json(
        { error: 'Informe o horário da tarefa no formato HH:mm.' },
        { status: 400 },
      );
    }
    if (!grupoId || typeof grupoId !== 'string') {
      return NextResponse.json(
        { error: 'Selecione um grupo. Toda tarefa precisa pertencer a um grupo.' },
        { status: 400 },
      );
    }

    const grupo = await prisma.tarefaGrupo.findFirst({
      where: { id: grupoId, userId: rh.userId },
      select: { id: true },
    });
    if (!grupo) {
      return NextResponse.json({ error: 'Grupo não encontrado.' }, { status: 404 });
    }

    const maxOrdem = await prisma.tarefaGrupoItem.aggregate({
      where: { grupoId },
      _max: { ordem: true },
    });

    const template = await prisma.tarefaTemplate.create({
      data: {
        userId: rh.userId,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        exigeFoto: !!exigeFoto,
        exigeConfirmacaoTexto: !!exigeConfirmacaoTexto,
        exigeLocalizacao: !!exigeLocalizacao,
        exigeArquivo: !!exigeArquivo,
        validacaoIA: validacaoIA ?? null,
        lojaId: lojaId || null,
        cargoId: cargoId || null,
        recorrenciaTipo: recorrencia.data.recorrenciaTipo,
        diasSemana: recorrencia.data.diasSemana,
        mensalModo: recorrencia.data.mensalModo,
        diaDoMes: recorrencia.data.diaDoMes,
        nth: recorrencia.data.nth,
        weekday: recorrencia.data.weekday,
        horarioPadrao,
        criadoPor: rh.userId,
        grupoItens: {
          create: { grupoId, ordem: (maxOrdem._max.ordem ?? -1) + 1 },
        },
      },
      include: {
        loja: { select: { id: true, nome: true } },
        cargo: { select: { id: true, nome: true } },
        grupoItens: {
          include: {
            grupo: { select: { id: true, nome: true, ativo: true } },
          },
        },
      },
    });

    const propagacao = await propagarTemplateNoGrupo(rh.userId, grupoId, template.id);

    return NextResponse.json({ ...template, propagacao }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tarefas/templates]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
