import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';

const MESES_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

/**
 * GET /api/rh/aniversarios
 * Retorna funcionários com aniversário no mês atual e no próximo mês.
 */
export async function GET() {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const hoje = new Date();
    const mesAtual  = hoje.getMonth() + 1; // 1–12
    const mesProx   = mesAtual === 12 ? 1 : mesAtual + 1;
    const anoProx   = mesAtual === 12 ? hoje.getFullYear() + 1 : hoje.getFullYear();

    // Busca todos os funcionários ativos com data de nascimento
    const funcionarios = await prisma.rhFuncionario.findMany({
      where: { userId: rh.userId, ativo: true, dataNascimento: { not: null } },
      select: {
        id:             true,
        nome:           true,
        dataNascimento: true,
        loja:           { select: { nome: true } },
        cargo:          { select: { nome: true } },
      },
      orderBy: { nome: 'asc' },
    });

    const deste  = funcionarios.filter(f => new Date(f.dataNascimento!).getUTCMonth() + 1 === mesAtual);
    const proximo = funcionarios.filter(f => new Date(f.dataNascimento!).getUTCMonth() + 1 === mesProx);

    // Ordena pelo dia do aniversário dentro do mês
    const ordenarPorDia = (list: typeof funcionarios) =>
      [...list].sort((a, b) =>
        new Date(a.dataNascimento!).getUTCDate() - new Date(b.dataNascimento!).getUTCDate()
      );

    const mapear = (f: typeof funcionarios[0]) => ({
      id:             f.id,
      nome:           f.nome,
      dataNascimento: f.dataNascimento,
      diaMes:         new Date(f.dataNascimento!).getUTCDate(),
      lojaNome:       f.loja?.nome ?? null,
      cargoNome:      f.cargo?.nome ?? null,
    });

    return NextResponse.json({
      mesMes:  {
        label:        MESES_PT[mesAtual - 1],
        count:        deste.length,
        funcionarios: ordenarPorDia(deste).map(mapear),
      },
      mesProximo: {
        label:        `${MESES_PT[mesProx - 1]}${mesProx === 1 ? ` ${anoProx}` : ''}`,
        count:        proximo.length,
        funcionarios: ordenarPorDia(proximo).map(mapear),
      },
    });
  } catch (err) {
    console.error('[GET /api/rh/aniversarios]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
