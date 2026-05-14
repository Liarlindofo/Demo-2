// ── Constantes base (atualizadas via IA/cache) ─────────────────────────────

export const ENCARGOS_PATRONAIS = {
  inssPatronal: 0.20,     // 20%
  fgts: 0.08,             // 8%
  // Sistema S (comércio/alimentação)
  senac: 0.010,
  sesc: 0.015,
  sebrae: 0.006,
  incra: 0.002,
  salarioEducacao: 0.025,
};

// INSS Empregado — tabela progressiva 2025
export const TABELA_INSS_2025 = [
  { de: 0,       ate: 1518.00,  aliquota: 0.075 },
  { de: 1518.01, ate: 2793.88,  aliquota: 0.09  },
  { de: 2793.89, ate: 4190.83,  aliquota: 0.12  },
  { de: 4190.84, ate: 8157.41,  aliquota: 0.14  },
];

// IRRF — tabela progressiva 2025
export const TABELA_IRRF_2025 = [
  { ate: 2259.20,   aliquota: 0,      deducao: 0       },
  { ate: 2826.65,   aliquota: 0.075,  deducao: 169.44  },
  { ate: 3751.05,   aliquota: 0.15,   deducao: 381.44  },
  { ate: 4664.68,   aliquota: 0.225,  deducao: 662.77  },
  { ate: Infinity,  aliquota: 0.275,  deducao: 896.00  },
];

export const SALARIO_MINIMO_2025 = 1518.00;
export const FAP_DEFAULT = 1.0;

// ── Cálculos ───────────────────────────────────────────────────────────────

export function calcularINSSEmpregado(salario: number): number {
  let inss = 0;
  let baseAnterior = 0;

  for (const faixa of TABELA_INSS_2025) {
    if (salario <= baseAnterior) break;
    const teto = Math.min(salario, faixa.ate);
    inss += (teto - baseAnterior) * faixa.aliquota;
    baseAnterior = faixa.ate;
    if (salario <= faixa.ate) break;
  }

  return parseFloat(inss.toFixed(2));
}

export function calcularIRRF(baseCalculo: number): number {
  for (const faixa of TABELA_IRRF_2025) {
    if (baseCalculo <= faixa.ate) {
      const irrf = baseCalculo * faixa.aliquota - faixa.deducao;
      return parseFloat(Math.max(0, irrf).toFixed(2));
    }
  }
  return 0;
}

export interface EncargosResult {
  // Patronais
  inssPatronal: number;
  rat: number;
  fgts: number;
  sistemaS: {
    senac: number;
    sesc: number;
    sebrae: number;
    incra: number;
    salarioEducacao: number;
    total: number;
  };
  totalEncargosPatronais: number;
  custoMensal: number;
  custoAnual: number; // inclui 13o e férias+1/3
  // Empregado
  inssEmpregado: number;
  irrf: number;
  salarioLiquido: number;
}

export function calcularEncargosCompletos(
  salarioBruto: number,
  ratPct: number = 1.0,
  fap: number = FAP_DEFAULT
): EncargosResult {
  // Patronais
  const inssPatronal = parseFloat((salarioBruto * ENCARGOS_PATRONAIS.inssPatronal).toFixed(2));
  const rat = parseFloat((salarioBruto * (ratPct / 100) * fap).toFixed(2));
  const fgts = parseFloat((salarioBruto * ENCARGOS_PATRONAIS.fgts).toFixed(2));

  const sistemaS = {
    senac: parseFloat((salarioBruto * ENCARGOS_PATRONAIS.senac).toFixed(2)),
    sesc: parseFloat((salarioBruto * ENCARGOS_PATRONAIS.sesc).toFixed(2)),
    sebrae: parseFloat((salarioBruto * ENCARGOS_PATRONAIS.sebrae).toFixed(2)),
    incra: parseFloat((salarioBruto * ENCARGOS_PATRONAIS.incra).toFixed(2)),
    salarioEducacao: parseFloat((salarioBruto * ENCARGOS_PATRONAIS.salarioEducacao).toFixed(2)),
    total: 0,
  };
  sistemaS.total = parseFloat(
    (sistemaS.senac + sistemaS.sesc + sistemaS.sebrae + sistemaS.incra + sistemaS.salarioEducacao).toFixed(2)
  );

  const totalEncargosPatronais = parseFloat((inssPatronal + rat + fgts + sistemaS.total).toFixed(2));
  const custoMensal = parseFloat((salarioBruto + totalEncargosPatronais).toFixed(2));

  // 13o = salário bruto + encargos patronais sobre ele
  // Férias = salário bruto * 4/3 (com 1/3) + encargos patronais
  const decimoTerceiro = custoMensal;
  const ferias = parseFloat((salarioBruto * (4 / 3) + totalEncargosPatronais).toFixed(2));
  const custoAnual = parseFloat((custoMensal * 12 + decimoTerceiro + ferias).toFixed(2));

  // Empregado
  const inssEmpregado = calcularINSSEmpregado(salarioBruto);
  const baseIRRF = parseFloat((salarioBruto - inssEmpregado).toFixed(2));
  const irrf = calcularIRRF(baseIRRF);
  const salarioLiquido = parseFloat((salarioBruto - inssEmpregado - irrf).toFixed(2));

  return {
    inssPatronal, rat, fgts, sistemaS,
    totalEncargosPatronais, custoMensal, custoAnual,
    inssEmpregado, irrf, salarioLiquido,
  };
}

// ── Simulador de Escala ───────────────────────────────────────────────────

export function simularMudancaEscala(
  qtdAtual6x1: number,
  qtdAtual5x2: number,
  minimoNecessarioPorDia: number
): {
  atual: number;
  necessario5x2: number;
  delta: number;
} {
  const atual = qtdAtual6x1 + qtdAtual5x2;
  const coberturaAtual = qtdAtual6x1 * (6 / 7) + qtdAtual5x2 * (5 / 7);
  const necessario5x2 = Math.ceil(minimoNecessarioPorDia * (7 / 5));
  const delta = Math.max(0, necessario5x2 - atual);

  return { atual, necessario5x2, delta };
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatarPorcentagem(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(valor);
}
