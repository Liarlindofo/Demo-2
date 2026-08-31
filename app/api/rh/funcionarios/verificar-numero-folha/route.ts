import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRhPermission } from '@/lib/rh-auth';
import { P } from '@/lib/rh-permissions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { ctx, error } = await requireRhPermission(P.EMPLOYEES_VIEW);
    if (error) return error;

    const { searchParams } = req.nextUrl;
    const numeroFolha = searchParams.get('numeroFolha')?.trim();
    const excludeId = searchParams.get('excludeId');

    if (!numeroFolha) {
      return NextResponse.json({ disponivel: true });
    }

    const existing = await prisma.rhFuncionario.findFirst({
      where: {
        userId: ctx.userId,
        numeroFolha,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    return NextResponse.json({ disponivel: !existing });
  } catch (err) {
    console.error('[GET /api/rh/funcionarios/verificar-numero-folha]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
