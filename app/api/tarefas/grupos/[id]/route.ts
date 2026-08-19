export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { propagarTemplatesNovosNoGrupo } from '@/lib/tarefas-propagar-grupo';

const includeGrupo = {
  itens: {
    orderBy: { ordem: 'asc' as const },
    include: {
      template: {
        select: {
          id: true,
          titulo: true,
          descricao: true,
          ativo: true,
          exigeFoto: true,
          exigeConfirmacaoTexto: true,
          exigeLocalizacao: true,
          exigeArquivo: true,
          lojaId: true,
          cargoId: true,
        },
      },
    },
  },
};

async function findOwnedGrupo(id: string, userId: string) {
  return prisma.tarefaGrupo.findFirst({
    where: { id, userId },
    include: includeGrupo,
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const grupo = await findOwnedGrupo(id, rh.userId);
    if (!grupo) return NextResponse.json({ error: 'Grupo não encontrado.' }, { status: 404 });
    return NextResponse.json(grupo);
  } catch (err) {
    console.error('[GET /api/tarefas/grupos/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * PUT /api/tarefas/grupos/:id
 * Body: { nome?, descricao?, ativo?, templateIds?: string[] }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const existing = await prisma.tarefaGrupo.findFirst({
      where: { id, userId: rh.userId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Grupo não encontrado.' }, { status: 404 });
    }

    const body = await req.json();
    const { nome, descricao, ativo, templateIds } = body as {
      nome?: string;
      descricao?: string | null;
      ativo?: boolean;
      templateIds?: string[];
    };

    if (nome !== undefined && !nome.trim()) {
      return NextResponse.json({ error: 'Nome do grupo é obrigatório.' }, { status: 400 });
    }

    if (Array.isArray(templateIds)) {
      const uniqueIds = [...new Set(templateIds.filter((x) => typeof x === 'string' && x))];
      if (uniqueIds.length > 0) {
        const owned = await prisma.tarefaTemplate.count({
          where: { userId: rh.userId, id: { in: uniqueIds } },
        });
        if (owned !== uniqueIds.length) {
          return NextResponse.json(
            { error: 'Um ou mais templates são inválidos ou de outra conta.' },
            { status: 400 },
          );
        }
      }

      const itensAntes = await prisma.tarefaGrupoItem.findMany({
        where: { grupoId: id },
        select: { templateId: true },
      });
      const idsAntes = new Set(itensAntes.map((i) => i.templateId));
      const idsNovos = uniqueIds.filter((tid) => !idsAntes.has(tid));

      await prisma.$transaction([
        prisma.tarefaGrupoItem.deleteMany({ where: { grupoId: id } }),
        prisma.tarefaGrupo.update({
          where: { id },
          data: {
            ...(nome !== undefined ? { nome: nome.trim() } : {}),
            ...(descricao !== undefined
              ? { descricao: descricao?.trim() ? descricao.trim() : null }
              : {}),
            ...(typeof ativo === 'boolean' ? { ativo } : {}),
            itens: {
              create: uniqueIds.map((templateId, ordem) => ({ templateId, ordem })),
            },
          },
        }),
      ]);

      if (idsNovos.length > 0) {
        await propagarTemplatesNovosNoGrupo(rh.userId, id, idsNovos);
      }
    } else {
      await prisma.tarefaGrupo.update({
        where: { id },
        data: {
          ...(nome !== undefined ? { nome: nome.trim() } : {}),
          ...(descricao !== undefined
            ? { descricao: descricao?.trim() ? descricao.trim() : null }
            : {}),
          ...(typeof ativo === 'boolean' ? { ativo } : {}),
        },
      });
    }

    const grupo = await findOwnedGrupo(id, rh.userId);
    return NextResponse.json(grupo);
  } catch (err) {
    console.error('[PUT /api/tarefas/grupos/[id]]', err);
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

    const existing = await prisma.tarefaGrupo.findFirst({
      where: { id, userId: rh.userId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Grupo não encontrado.' }, { status: 404 });
    }

    await prisma.tarefaGrupo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/tarefas/grupos/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
