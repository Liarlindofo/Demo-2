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
    const lojaParam = searchParams.get('loja'); // lojaId ou vazio (todas)
    const dataParam = searchParams.get('data');  // YYYY-MM-DD

    // Monta filtro de data — se não informado, usa hoje (horário UTC)
    const dataSelecionada = dataParam ? new Date(`${dataParam}T00:00:00.000Z`) : (() => {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      return d;
    })();
    const dataFim = new Date(dataSelecionada.getTime() + 24 * 60 * 60 * 1000);

    const registros = await prisma.pontoRegistro.findMany({
      where: {
        data: { gte: dataSelecionada, lt: dataFim },
        funcionario: {
          userId: ctx.userId,
          ativo: true,
          ...(lojaParam ? { lojaId: lojaParam } : {}),
        },
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            lojaId: true,
            loja: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: [{ funcionario: { nome: 'asc' } }],
    });

    const pendencias = await prisma.pontoPendencia.findMany({
      where: { resolvida: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        numeroFolhaOrigem: true,
        nomeSugerido: true,
        data: true,
        createdAt: true,
      },
    });

    // Agrupa pendências por matrícula (para contar)
    const pendenciasGrupo = pendencias.reduce<Record<string, number>>((acc, p) => {
      acc[p.numeroFolhaOrigem] = (acc[p.numeroFolhaOrigem] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      registros,
      pendencias: Object.entries(pendenciasGrupo).map(([nf, count]) => ({
        numeroFolhaOrigem: nf,
        count,
        nomeSugerido: pendencias.find((p) => p.numeroFolhaOrigem === nf)?.nomeSugerido ?? null,
      })),
      dataSelecionada: dataSelecionada.toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/pontos]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
