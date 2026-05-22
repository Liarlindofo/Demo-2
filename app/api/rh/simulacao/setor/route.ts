import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

export const dynamic = 'force-dynamic';

async function getDbUser() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;
  return syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    profileImageUrl: stackUser.profileImageUrl || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });
}

export async function GET(req: Request) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const lojaId = searchParams.get('lojaId');

    if (!lojaId) {
      return NextResponse.json({ error: 'lojaId obrigatório' }, { status: 400 });
    }

    // Busca o quadro ideal da loja com setores e posições ativas
    const quadro = await prisma.rhQuadroIdeal.findFirst({
      where: { lojaId, userId: dbUser.id },
      include: {
        setores: {
          where: { ativo: true },
          orderBy: { ordem: 'asc' },
          include: {
            posicoes: {
              where: { ativo: true },
              orderBy: { createdAt: 'asc' },
              include: {
                cargo: { select: { id: true, nome: true } },
              },
            },
          },
        },
      },
    });

    if (!quadro) {
      return NextResponse.json({ setores: [] });
    }

    // Para cada posição, busca os funcionários reais na loja com aquele cargo+turno
    const setoresComDados = await Promise.all(
      quadro.setores.map(async (setor) => {
        const posicoesComDados = await Promise.all(
          setor.posicoes.map(async (pos) => {
            // Busca funcionários ativos na loja com o cargo desta posição
            const funcionarios = await prisma.rhFuncionario.findMany({
              where: {
                userId: dbUser.id,
                lojaId,
                cargoId: pos.cargoId,
                turno: pos.turno ?? undefined,
                ativo: true,
              },
              select: { escala: true, salarioBruto: true },
            });

            const f6x1 = funcionarios.filter((f) => f.escala === '6x1');
            const f5x2 = funcionarios.filter((f) => f.escala !== '6x1');

            const salarioMedio6x1 =
              f6x1.length > 0
                ? f6x1.reduce((s, f) => s + f.salarioBruto, 0) / f6x1.length
                : 0;
            const salarioMedio5x2 =
              f5x2.length > 0
                ? f5x2.reduce((s, f) => s + f.salarioBruto, 0) / f5x2.length
                : 0;
            const salarioMedioGeral =
              funcionarios.length > 0
                ? funcionarios.reduce((s, f) => s + f.salarioBruto, 0) / funcionarios.length
                : 1518;

            return {
              id: pos.id,
              cargo: pos.cargo,
              turno: pos.turno,
              idealMin: pos.quantidade,
              funcionarios6x1: f6x1.length,
              funcionarios5x2: f5x2.length,
              totalFuncionarios: funcionarios.length,
              salarioMedio6x1: Math.round(salarioMedio6x1),
              salarioMedio5x2: Math.round(salarioMedio5x2),
              salarioMedioGeral: Math.round(salarioMedioGeral),
            };
          })
        );

        return {
          id: setor.id,
          nome: setor.nome,
          posicoes: posicoesComDados,
        };
      })
    );

    return NextResponse.json({ setores: setoresComDados });
  } catch (err) {
    console.error('[GET /api/rh/simulacao/setor]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
