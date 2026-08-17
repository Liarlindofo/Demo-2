export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

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

/**
 * GET /api/tarefas/grupos
 * Lista grupos de templates do tenant.
 */
export async function GET() {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const grupos = await prisma.tarefaGrupo.findMany({
      where: { userId: rh.userId },
      include: includeGrupo,
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    });

    return NextResponse.json(grupos);
  } catch (err) {
    console.error('[GET /api/tarefas/grupos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/tarefas/grupos
 * Body: { nome, descricao?, templateIds: string[], ativo? }
 */
export async function POST(req: Request) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { nome, descricao, templateIds, ativo = true } = body as {
      nome?: string;
      descricao?: string;
      templateIds?: string[];
      ativo?: boolean;
    };

    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome do grupo é obrigatório.' }, { status: 400 });
    }
    const uniqueIds = Array.isArray(templateIds)
      ? [...new Set(templateIds.filter((id) => typeof id === 'string' && id))]
      : [];
    if (uniqueIds.length > 0) {
      const owned = await prisma.tarefaTemplate.findMany({
        where: { userId: rh.userId, id: { in: uniqueIds } },
        select: { id: true },
      });
      if (owned.length !== uniqueIds.length) {
        return NextResponse.json(
          { error: 'Um ou mais templates são inválidos ou de outra conta.' },
          { status: 400 },
        );
      }
    }

    const grupo = await prisma.tarefaGrupo.create({
      data: {
        userId: rh.userId,
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        ativo: !!ativo,
        itens: {
          create: uniqueIds.map((templateId, ordem) => ({ templateId, ordem })),
        },
      },
      include: includeGrupo,
    });

    return NextResponse.json(grupo, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tarefas/grupos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
