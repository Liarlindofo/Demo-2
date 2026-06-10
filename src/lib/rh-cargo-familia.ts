/**
 * Retorna o nome base de um cargo, removendo sufixo de hierarquia romano.
 * "Pizzaiolo I"   → "Pizzaiolo"
 * "Pizzaiolo II"  → "Pizzaiolo"
 * "Pizzaiolo III" → "Pizzaiolo"
 * "Gerente"       → "Gerente"    (sem sufixo — sem alteração)
 */
export function cargoFamilia(nome: string): string {
  return nome.replace(/\s+[IVX]+$/i, '').trim();
}
