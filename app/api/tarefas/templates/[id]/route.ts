export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import {
  excluirTemplateEAtribuicoes,
  syncSessoesAbertasDoTemplate,
} from '@/lib/tarefas-template';

const includeTemplate = {
  loja: { select: { id: true, nome: true } },
  cargo: { select: { id: true, nome: true } },
  grupoItens: {
    include: {
      grupo: { select: { id: true, nome: true, ativo: true } },
    },
  },
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const template = await prisma.tarefaTemplate.findFirst({
      where: { id, userId: rh.userId },
    });
    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

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
      ativo,
      grupoId,
    } = body;

    // Se está editando conteúdo (não apenas toggling ativo), validar campos obrigatórios
    if (ativo === undefined) {
      if (titulo !== undefined && !titulo?.trim()) {
        return NextResponse.json({ error: 'Título é obrigatório.' }, { status: 400 });
      }
      if (descricao !== undefined && !descricao?.trim()) {
        return NextResponse.json({ error: 'Descrição é obrigatória.' }, { status: 400 });
      }

      const ef = exigeFoto ?? template.exigeFoto;
      const ec = exigeConfirmacaoTexto ?? template.exigeConfirmacaoTexto;
      const el = exigeLocalizacao ?? template.exigeLocalizacao;
      const ea = exigeArquivo ?? template.exigeArquivo;
      if (!ef && !ec && !el && !ea) {
        return NextResponse.json(
          { error: 'Pelo menos um tipo de evidência deve ser selecionado.' },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.tarefaTemplate.update({
      where: { id },
      data: {
        ...(titulo !== undefined && { titulo: titulo.trim() }),
        ...(descricao !== undefined && { descricao: descricao.trim() }),
        ...(exigeFoto !== undefined && { exigeFoto }),
        ...(exigeConfirmacaoTexto !== undefined && { exigeConfirmacaoTexto }),
        ...(exigeLocalizacao !== undefined && { exigeLocalizacao }),
        ...(exigeArquivo !== undefined && { exigeArquivo }),
        ...(validacaoIA !== undefined && { validacaoIA }),
        ...(lojaId !== undefined && { lojaId: lojaId || null }),
        ...(cargoId !== undefined && { cargoId: cargoId || null }),
        ...(ativo !== undefined && { ativo }),
      },
      include: includeTemplate,
    });

    if (grupoId && typeof grupoId === 'string') {
      const grupo = await prisma.tarefaGrupo.findFirst({
        where: { id: grupoId, userId: rh.userId },
        select: { id: true },
      });
      if (!grupo) {
        return NextResponse.json({ error: 'Grupo não encontrado.' }, { status: 404 });
      }
      const jaNoGrupo = await prisma.tarefaGrupoItem.findFirst({
        where: { grupoId, templateId: id },
      });
      if (!jaNoGrupo) {
        const maxOrdem = await prisma.tarefaGrupoItem.aggregate({
          where: { grupoId },
          _max: { ordem: true },
        });
        await prisma.tarefaGrupoItem.create({
          data: { grupoId, templateId: id, ordem: (maxOrdem._max.ordem ?? -1) + 1 },
        });
      }
    }

    // Conteúdo novo vale para atribuições futuras (join) e sessões WhatsApp abertas
    if (ativo === undefined) {
      await syncSessoesAbertasDoTemplate(id, updated);
    }

    const result = await prisma.tarefaTemplate.findFirst({
      where: { id },
      include: includeTemplate,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[PATCH /api/tarefas/templates/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const template = await prisma.tarefaTemplate.findFirst({
      where: { id, userId: rh.userId },
      select: { id: true },
    });
    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    await excluirTemplateEAtribuicoes(id, rh.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/tarefas/templates/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
