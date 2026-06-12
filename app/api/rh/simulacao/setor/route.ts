import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { calcularComposicaoSalarial } from '@/lib/calculos-rh';
import { cargoFamilia } from '@/lib/rh-cargo-familia';

function baseEncargos(f: {
  salarioBase: number;
  cargoResponsabilidade: boolean;
  bonificacaoAssiduidade: number;
  valorAlimentacao: number;
  valorVT: number;
}) {
  return calcularComposicaoSalarial(f).baseCalculoEncargos;
}

export const dynamic = 'force-dynamic';


export async function GET(req: Request) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const lojaId = searchParams.get('lojaId');

    if (!lojaId) {
      return NextResponse.json({ error: 'lojaId obrigatório' }, { status: 400 });
    }

    // Busca o quadro ideal da loja com setores e posições ativas
    const quadro = await prisma.rhQuadroIdeal.findFirst({
      where: { lojaId, userId: rh!.userId },
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

    // Carregar todos os cargos do usuário para montar mapa de família
    const todosCargos = await prisma.rhCargo.findMany({
      where: { userId: rh!.userId },
      select: { id: true, nome: true },
    });
    // familia → [cargoId, ...]
    const familiaMap = new Map<string, string[]>();
    for (const c of todosCargos) {
      const f = cargoFamilia(c.nome);
      if (!familiaMap.has(f)) familiaMap.set(f, []);
      familiaMap.get(f)!.push(c.id);
    }

    // Para cada posição, busca os funcionários de toda a família de cargo
    const setoresComDados = await Promise.all(
      quadro.setores.map(async (setor) => {
        const posicoesComDados = await Promise.all(
          setor.posicoes.map(async (pos) => {
            // Família do cargo da posição (ex: "Pizzaiolo I" → "Pizzaiolo")
            const familia = cargoFamilia(pos.cargo?.nome ?? '');
            const familiaIds = familiaMap.get(familia) ?? [pos.cargoId];

            // Busca funcionários de qualquer nível da família no mesmo turno
            const funcionarios = await prisma.rhFuncionario.findMany({
              where: {
                userId: rh!.userId,
                lojaId,
                cargoId: { in: familiaIds },
                turno: pos.turno ?? undefined,
                ativo: true,
              },
              select: {
                escala: true,
                salarioBase: true,
                cargoResponsabilidade: true,
                bonificacaoAssiduidade: true,
                valorAlimentacao: true,
                valorVT: true,
              },
            });

            const f6x1 = funcionarios.filter((f) => f.escala === '6x1');
            const f5x2 = funcionarios.filter((f) => f.escala !== '6x1');

            const salarioMedio6x1 =
              f6x1.length > 0
                ? f6x1.reduce((s, f) => s + baseEncargos(f), 0) / f6x1.length
                : 0;
            const salarioMedio5x2 =
              f5x2.length > 0
                ? f5x2.reduce((s, f) => s + baseEncargos(f), 0) / f5x2.length
                : 0;
            const salarioMedioGeral =
              funcionarios.length > 0
                ? funcionarios.reduce((s, f) => s + baseEncargos(f), 0) / funcionarios.length
                : 1518;

            return {
              id: pos.id,
              cargo: pos.cargo,
              turno: pos.turno,
              idealMin: pos.quantidadeIdeal,
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
