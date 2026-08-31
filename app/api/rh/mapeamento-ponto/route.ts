import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRhPermission } from '@/lib/rh-auth';
import { P } from '@/lib/rh-permissions';

export const dynamic = 'force-dynamic';

/** GET — lista pendências agrupadas por numeroFolhaOrigem (não resolvidas) */
export async function GET(_req: NextRequest) {
  try {
    const { ctx, error } = await requireRhPermission(P.EMPLOYEES_VIEW);
    if (error) return error;

    const pendencias = await prisma.pontoPendencia.findMany({
      where: { resolvida: false },
      orderBy: { createdAt: 'desc' },
    });

    // Agrupa por numeroFolhaOrigem
    const grouped = pendencias.reduce<
      Record<string, { numeroFolhaOrigem: string; nomeSugerido: string | null; registros: typeof pendencias }>
    >((acc, p) => {
      if (!acc[p.numeroFolhaOrigem]) {
        acc[p.numeroFolhaOrigem] = {
          numeroFolhaOrigem: p.numeroFolhaOrigem,
          nomeSugerido: p.nomeSugerido,
          registros: [],
        };
      }
      acc[p.numeroFolhaOrigem].registros.push(p);
      return acc;
    }, {});

    const funcionarios = await prisma.rhFuncionario.findMany({
      where: { userId: ctx.userId, ativo: true },
      select: { id: true, nome: true, numeroFolha: true },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json({ grupos: Object.values(grouped), funcionarios });
  } catch (err) {
    console.error('[GET /api/rh/mapeamento-ponto]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST — confirma o match entre um numeroFolhaOrigem e um funcionário existente.
 * Grava numeroFolha no funcionário, marca as pendências como resolvidas,
 * e reprocessa os registros criando PontoRegistro.
 */
export async function POST(req: NextRequest) {
  try {
    const { ctx, error } = await requireRhPermission(P.EMPLOYEES_VIEW);
    if (error) return error;

    const { numeroFolhaOrigem, funcionarioId } = await req.json();

    if (!numeroFolhaOrigem || !funcionarioId) {
      return NextResponse.json({ error: 'numeroFolhaOrigem e funcionarioId são obrigatórios' }, { status: 400 });
    }

    const funcionario = await prisma.rhFuncionario.findFirst({
      where: { id: funcionarioId, userId: ctx.userId },
    });
    if (!funcionario)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    // Garante que nenhum outro funcionário já tem esse numeroFolha
    const conflito = await prisma.rhFuncionario.findFirst({
      where: { userId: ctx.userId, numeroFolha: numeroFolhaOrigem, id: { not: funcionarioId } },
    });
    if (conflito)
      return NextResponse.json({ error: 'N° da folha já usado por outro funcionário' }, { status: 409 });

    const pendencias = await prisma.pontoPendencia.findMany({
      where: { numeroFolhaOrigem, resolvida: false },
    });

    await prisma.$transaction(async (tx) => {
      // Grava numeroFolha no funcionário
      await tx.rhFuncionario.update({
        where: { id: funcionarioId },
        data: { numeroFolha: numeroFolhaOrigem },
      });

      // Reprocessa cada pendência
      for (const p of pendencias) {
        const payload = p.payloadBruto as Record<string, unknown>;
        await tx.pontoRegistro.upsert({
          where: { batidaIdSecullum: Number(payload.batidaId) },
          update: {
            funcionarioId,
            data: new Date(String(payload.data)),
            entrada1: (payload.entrada1 as string | null) ?? null,
            saida1: (payload.saida1 as string | null) ?? null,
            entrada2: (payload.entrada2 as string | null) ?? null,
            saida2: (payload.saida2 as string | null) ?? null,
            entrada3: (payload.entrada3 as string | null) ?? null,
            saida3: (payload.saida3 as string | null) ?? null,
            compensado: Boolean(payload.compensado),
            neutro: Boolean(payload.neutro),
            folga: Boolean(payload.folga),
            observacoes: (payload.observacoes as string | null) ?? null,
          },
          create: {
            funcionarioId,
            data: new Date(String(payload.data)),
            batidaIdSecullum: Number(payload.batidaId),
            entrada1: (payload.entrada1 as string | null) ?? null,
            saida1: (payload.saida1 as string | null) ?? null,
            entrada2: (payload.entrada2 as string | null) ?? null,
            saida2: (payload.saida2 as string | null) ?? null,
            entrada3: (payload.entrada3 as string | null) ?? null,
            saida3: (payload.saida3 as string | null) ?? null,
            compensado: Boolean(payload.compensado),
            neutro: Boolean(payload.neutro),
            folga: Boolean(payload.folga),
            observacoes: (payload.observacoes as string | null) ?? null,
          },
        });

        await tx.pontoPendencia.update({
          where: { id: p.id },
          data: { resolvida: true },
        });
      }
    });

    return NextResponse.json({ ok: true, processados: pendencias.length });
  } catch (err) {
    console.error('[POST /api/rh/mapeamento-ponto]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
