import { prisma } from '@/lib/prisma';

const VALOR_PADRAO = 200;

/**
 * Cria registros de assiduidade (recebeu=true) para funcionários ativos
 * que ainda não têm registro no mês/ano informado. Nunca sobrescreve existentes.
 */
export async function seedAssiduidadeMes(
  userId: string,
  mes: number,
  ano: number
): Promise<{ criados: number; total: number }> {
  const funcionarios = await prisma.rhFuncionario.findMany({
    where: { userId, ativo: true },
    select: { id: true },
  });

  if (funcionarios.length === 0) {
    return { criados: 0, total: 0 };
  }

  const existentes = await prisma.rhBonificacaoAssiduidade.findMany({
    where: {
      mes,
      ano,
      funcionarioId: { in: funcionarios.map((f) => f.id) },
    },
    select: { funcionarioId: true },
  });

  const idsComRegistro = new Set(existentes.map((e) => e.funcionarioId));
  const faltantes = funcionarios.filter((f) => !idsComRegistro.has(f.id));

  if (faltantes.length > 0) {
    await prisma.rhBonificacaoAssiduidade.createMany({
      data: faltantes.map((f) => ({
        funcionarioId: f.id,
        mes,
        ano,
        valorDireito: VALOR_PADRAO,
        recebeu: true,
      })),
    });
  }

  return { criados: faltantes.length, total: funcionarios.length };
}

export function mesAnoAtual() {
  const hoje = new Date();
  return { mes: hoje.getMonth() + 1, ano: hoje.getFullYear() };
}

export function trimestreAtual() {
  const mes = new Date().getMonth() + 1;
  return Math.ceil(mes / 3);
}
