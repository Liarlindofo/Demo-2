import { prisma } from '@/lib/prisma';

/** Cargos pré-definidos para novos cadastros de RH */
export const RH_CARGOS_PADRAO = [
  'Atendente',
  'Atendente Central',
  'Expedição',
  'Serviços Gerais',
  'Pizzaiolo',
  'Produção',
  'Gerente',
  'Coordenador de Cozinha',
  'Tecnologias',
] as const;

const RAT_PADRAO = 2.0;

/**
 * Garante que o usuário tenha todos os cargos padrão (cria apenas os que faltam).
 */
export async function ensureRhCargosPadrao(userId: string) {
  const existentes = await prisma.rhCargo.findMany({
    where: { userId },
    select: { nome: true },
  });

  const nomesExistentes = new Set(existentes.map((c) => c.nome));
  const faltantes = RH_CARGOS_PADRAO.filter((nome) => !nomesExistentes.has(nome));

  if (faltantes.length === 0) return;

  await prisma.rhCargo.createMany({
    data: faltantes.map((nome) => ({
      userId,
      nome,
      ratPct: RAT_PADRAO,
    })),
  });
}
