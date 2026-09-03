import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRhPermission } from '@/lib/rh-auth';
import { P } from '@/lib/rh-permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pontos/fechamento?mes=8&ano=2026
 * Retorna o FechamentoMensal (com linhas) para o mês/ano informado, ou null.
 */
export async function GET(req: NextRequest) {
  const { ctx, error } = await requireRhPermission(P.EMPLOYEES_VIEW);
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const mes = Number(searchParams.get('mes'));
  const ano = Number(searchParams.get('ano'));

  if (!mes || !ano) {
    return NextResponse.json({ error: 'mes e ano são obrigatórios' }, { status: 400 });
  }

  const fechamento = await prisma.fechamentoMensal.findUnique({
    where: { mes_ano: { mes, ano } },
    include: {
      linhas: {
        include: {
          funcionario: {
            select: { id: true, nome: true, loja: { select: { nome: true } } },
          },
        },
        orderBy: { funcionario: { nome: 'asc' } },
      },
    },
  });

  // Funcionários com numeroFolha mas sem pisSecullum (para aviso na tela)
  const semPis = await prisma.rhFuncionario.findMany({
    where: { userId: ctx.userId, numeroFolha: { not: null }, pisSecullum: null, ativo: true },
    select: { id: true, nome: true },
  });

  return NextResponse.json({ fechamento, funcionariosSemPis: semPis });
}
