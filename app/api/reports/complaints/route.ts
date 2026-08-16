export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionDbUser } from '@/lib/rh-api-auth';

/**
 * GET /api/reports/complaints
 *
 * Lista ComplaintReviewRun do tenant logado (sessão Stack Auth).
 * Usado pela Central de Relatórios → aba Reclamações.
 */
export async function GET() {
  const dbUser = await getSessionDbUser();
  if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const runs = await prisma.complaintReviewRun.findMany({
    where: { userId: dbUser.id },
    orderBy: { executadoEm: 'desc' },
    take: 50,
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      totalConversas: true,
      totalReclamacoes: true,
      ataStoragePath: true,
      executadoEm: true,
      erro: true,
    },
  });

  return NextResponse.json(runs);
}
