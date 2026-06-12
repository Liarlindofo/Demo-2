import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';


export async function GET(req: Request) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const lojaId = searchParams.get('lojaId');

    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    const where: Record<string, unknown> = { userId: rh!.userId, ativo: true };

    // Filtra por loja se informado (via funcionários)
    if (lojaId) {
      const funcIds = (
        await prisma.rhFuncionario.findMany({
          where: { userId: rh!.userId, lojaId, ativo: true },
          select: { id: true },
        })
      ).map((f) => f.id);
      where.funcionarioId = { in: funcIds };
    }

    const totalMes = await prisma.rhOcorrencia.count({
      where: { ...where, data: { gte: inicioMes } },
    });

    const totalAdvertencias = await prisma.rhOcorrencia.count({
      where: {
        ...where,
        tipo: { in: ['advertencia_verbal', 'advertencia_escrita', 'suspensao'] },
      },
    });

    const totalFaltas = await prisma.rhOcorrencia.count({
      where: {
        ...where,
        tipo: { in: ['falta_justificada', 'falta_injustificada'] },
        data: { gte: inicioMes },
      },
    });

    return NextResponse.json({
      totalMes,
      totalAdvertencias,
      totalFaltasMes: totalFaltas,
    });
  } catch (err) {
    console.error('[GET /api/rh/ocorrencias/resumo]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
