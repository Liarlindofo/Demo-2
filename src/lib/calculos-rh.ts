export interface EncargosPatronais {
  inssPatronal: number;
  fgts: number;
  rat: number;
  sistemaS: number;
  totalEncargos: number;
  custoTotal: number;
  percentualSobreSalario: number;
}

/**
 * Calcula encargos patronais sobre o salário bruto.
 * @param salario  Salário bruto em R$
 * @param rat      RAT do cargo em % (ex: 2 = 2%)
 * @param fap      FAP da loja (multiplicador do RAT, ex: 1.0)
 */
export function calcularEncargosPatronais(
  salario: number,
  rat: number = 2,
  fap: number = 1.0
): EncargosPatronais {
  const inssPatronal    = salario * 0.20;
  const fgts            = salario * 0.08;
  const ratAjustado     = salario * (rat / 100) * fap;
  const senac           = salario * 0.01;
  const sesc            = salario * 0.015;
  const sebrae          = salario * 0.006;
  const incra           = salario * 0.002;
  const salarioEducacao = salario * 0.025;

  const sistemaS      = senac + sesc + sebrae + incra + salarioEducacao;
  const totalEncargos = inssPatronal + fgts + ratAjustado + sistemaS;

  return {
    inssPatronal,
    fgts,
    rat: ratAjustado,
    sistemaS,
    totalEncargos,
    custoTotal: salario + totalEncargos,
    percentualSobreSalario: (totalEncargos / salario) * 100,
  };
}

/** Custo anualizado: mensal × 13,33 (12 meses + 13º + férias proporcionais) */
export const FATOR_ANUAL = 14.33;

export function custoAnualizado(custoMensal: number): number {
  return custoMensal * FATOR_ANUAL;
}
