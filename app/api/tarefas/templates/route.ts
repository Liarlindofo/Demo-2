import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { parseDiasSemana } from '@/lib/tarefas-dias';

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
      diasSemana: diasSemanaRaw,
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
    const diasSemana = parseDiasSemana(diasSemanaRaw);
    if (!diasSemana || diasSemana.length === 0) {
      return NextResponse.json(
        { error: 'Selecione pelo menos um dia da semana em que a tarefa deve ser feita.' },
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
        diasSemana,
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

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tarefas/templates]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
