export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

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
      include: {
        loja: { select: { id: true, nome: true } },
        cargo: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/tarefas/templates/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
