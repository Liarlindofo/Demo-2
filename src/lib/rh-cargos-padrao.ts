import { prisma } from '@/lib/prisma';

interface CargoPadrao {
  nome: string;
  ratPct: number;
}

function niveis(nome: string, ratPct: number): CargoPadrao[] {
  return [
    { nome: `${nome} I`,   ratPct },
    { nome: `${nome} II`,  ratPct },
    { nome: `${nome} III`, ratPct },
  ];
}

/** Cargos pré-definidos com hierarquia de 3 níveis (I, II, III) */
export const RH_CARGOS_PADRAO: CargoPadrao[] = [
  // Operacional de salão / atendimento
  ...niveis('Atendente',          1.0),
  ...niveis('Atendente Central',  1.0),
  // Cozinha / produção
  ...niveis('Pizzaiolo',          2.0),
  ...niveis('Produção',           2.0),
  ...niveis('Coordenador de Cozinha', 2.0),
  // Logística / suporte
  ...niveis('Expedição',          2.0),
  ...niveis('Serviços Gerais',    2.0),
  // Gestão
  ...niveis('Gerente',            1.0),
  // Administrativo / corporativo
  ...niveis('Tecnologias',        1.0),
  ...niveis('Auxiliar de Marketing', 1.0),
];

/**
 * Garante que o usuário tenha todos os cargos padrão (cria apenas os que faltam).
 */
export async function ensureRhCargosPadrao(userId: string) {
  const existentes = await prisma.rhCargo.findMany({
    where: { userId },
    select: { nome: true },
  });

  const nomesExistentes = new Set(existentes.map((c) => c.nome));
  const faltantes = RH_CARGOS_PADRAO.filter((c) => !nomesExistentes.has(c.nome));

  if (faltantes.length === 0) return;

  await prisma.rhCargo.createMany({
    data: faltantes.map((c) => ({
      userId,
      nome: c.nome,
      ratPct: c.ratPct,
    })),
  });
}
