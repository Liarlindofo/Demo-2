import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRhPermission } from '@/lib/rh-auth';
import { P } from '@/lib/rh-permissions';
import { Decimal } from '@prisma/client/runtime/library';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/pontos/fechamento/[id]/linhas/[linhaId]
 * Atualiza campos editáveis e/ou status de uma FechamentoLinha.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; linhaId: string } },
) {
  const { error } = await requireRhPermission(P.EMPLOYEES_VIEW);
  if (error) return error;

  const { id: fechamentoId, linhaId } = params;

  let body: Record<string, string | null | undefined>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  // Garante que a linha pertence ao fechamento informado
  const linha = await prisma.fechamentoLinha.findFirst({
    where: { id: linhaId, fechamentoId },
  });
  if (!linha) {
    return NextResponse.json({ error: 'Linha não encontrada' }, { status: 404 });
  }

  const toDecimal = (v: string | null | undefined) =>
    v !== undefined && v !== null && v !== '' ? new Decimal(v.replace(',', '.')) : undefined;

  const updated = await prisma.fechamentoLinha.update({
    where: { id: linhaId },
    data: {
      ...(body.ex60 !== undefined ? { ex60: body.ex60 || null } : {}),
      ...(body.ex100 !== undefined ? { ex100: body.ex100 || null } : {}),
      ...(body.en60 !== undefined ? { en60: body.en60 || null } : {}),
      ...(body.en100 !== undefined ? { en100: body.en100 || null } : {}),
      ...(body.atraso !== undefined ? { atraso: body.atraso || null } : {}),
      ...(body.faltas !== undefined ? { faltas: body.faltas || null } : {}),
      ...(body.faltaDsr !== undefined ? { faltaDsr: body.faltaDsr || null } : {}),
      ...(body.valeTransporte !== undefined ? { valeTransporte: toDecimal(body.valeTransporte) ?? null } : {}),
      ...(body.descDiversos !== undefined ? { descDiversos: toDecimal(body.descDiversos) ?? null } : {}),
      ...(body.descRefeicao !== undefined ? { descRefeicao: toDecimal(body.descRefeicao) ?? null } : {}),
      ...(body.descCompras !== undefined ? { descCompras: toDecimal(body.descCompras) ?? null } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.observacao !== undefined ? { observacao: body.observacao || null } : {}),
    },
    include: {
      funcionario: {
        select: { id: true, nome: true, loja: { select: { nome: true } } },
      },
    },
  });

  return NextResponse.json(updated);
}
