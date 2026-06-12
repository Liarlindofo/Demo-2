import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { calcularComposicaoSalarial, calcularEncargosPatronais } from '@/lib/calculos-rh';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const lojaId = req.nextUrl.searchParams.get('lojaId');
    if (!lojaId) return NextResponse.json({ error: 'lojaId obrigatório' }, { status: 400 });

    // Funcionários ativos da loja com dados reais de folga e salário
    const funcionarios = await prisma.rhFuncionario.findMany({
      where: { userId: rh!.userId, lojaId, ativo: true },
      select: {
        id: true,
        nome: true,
        escala: true,
        turno: true,
        diasFolga: true,
        cargo: { select: { nome: true } },
        salarioBase: true,
        cargoResponsabilidade: true,
        bonificacaoAssiduidade: true,
        valorAlimentacao: true,
        valorVT: true,
      },
      orderBy: { nome: 'asc' },
    });

    // Mínimos por turno do Quadro Ideal (se configurado)
    const quadro = await prisma.rhQuadroIdeal.findFirst({
      where: { userId: rh!.userId, lojaId, ativo: true },
      include: {
        setores: {
          where: { ativo: true },
          include: { posicoes: { where: { ativo: true } } },
        },
      },
    });

    const ideaisPorTurno: Record<string, number> = {};
    if (quadro) {
      for (const setor of quadro.setores) {
        for (const pos of setor.posicoes) {
          if (pos.turno) {
            ideaisPorTurno[pos.turno] = (ideaisPorTurno[pos.turno] ?? 0) + pos.quantidadeIdeal;
          }
        }
      }
    }

    return NextResponse.json({
      funcionarios: funcionarios.map((f) => {
        const composicao = calcularComposicaoSalarial({
          salarioBase: f.salarioBase ?? 0,
          cargoResponsabilidade: f.cargoResponsabilidade ?? false,
          bonificacaoAssiduidade: f.bonificacaoAssiduidade ?? 0,
          valorAlimentacao: f.valorAlimentacao ?? 0,
          valorVT: f.valorVT ?? 0,
        });
        const encargos = calcularEncargosPatronais(composicao.baseCalculoEncargos);
        const custoMensal = Math.round(
          composicao.baseCalculoEncargos +
          encargos.totalEncargos +
          composicao.valorAlimentacao +
          composicao.valorVT
        );
        return {
          id: f.id,
          nome: f.nome,
          cargo: f.cargo?.nome ?? '—',
          escala: f.escala,
          turno: f.turno,
          diasFolga: Array.isArray(f.diasFolga) ? (f.diasFolga as string[]) : [],
          custoMensal,
        };
      }),
      ideais: ideaisPorTurno,
    });
  } catch (err) {
    console.error('[GET /api/rh/simulacao/cobertura]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
