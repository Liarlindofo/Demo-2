import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionDbUser } from '@/lib/rh-api-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reports/catalog
 * Lista SaiposFieldCatalog ordenado por grupo + ordem.
 */
export async function GET() {
  try {
    const dbUser = await getSessionDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const campos = await prisma.saiposFieldCatalog.findMany({
      orderBy: [{ grupo: 'asc' }, { ordem: 'asc' }],
    });

    return NextResponse.json(campos);
  } catch (err) {
    console.error('[GET /api/admin/reports/catalog]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
