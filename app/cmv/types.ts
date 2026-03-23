export type Unidade = 'g' | 'ml' | 'un';
export type Categoria = 'tradicional' | 'especial';

// ── Etapa 1: Ingredientes ─────────────────────────────────────────────────────
export interface Ingrediente {
  id: string;
  nome: string;
  unidade: Unidade;
  precoPorKg: number; // preço por kg (ou por unidade se unidade='un')
}

// ── Etapa 2: Receitas ─────────────────────────────────────────────────────────
export interface ReceitaItem {
  ingredienteId: string;
  quantidade: number; // em gramas, ml ou unidades
}

export interface Receita {
  id: string;
  nome: string;
  rendimento: number; // quantidade produzida (ex: 1000 para 1kg de massa)
  unidade: Unidade;   // unidade do rendimento (g → custo/kg, ml → custo/L, un → custo/un)
  itens: ReceitaItem[];
}

// ── Etapa 3: Sabores / Produtos ───────────────────────────────────────────────
export type SaborItemTipo = 'ingrediente' | 'receita';

export interface SaborItem {
  id: string;
  tipo: SaborItemTipo;
  referenciaId: string; // ingredienteId ou receitaId
  quantidade: number;   // em gramas, ml ou unidades
}

/** @deprecated mantido para compatibilidade com dados antigos */
export interface IngredienteSabor {
  ingredienteId: string;
  quantidade: number;
}

export interface Sabor {
  id: string;
  nome: string;
  categoria: Categoria;
  precoVenda: number;
  itens: SaborItem[];
  /** @deprecated mantido para leitura de dados antigos, migrado automaticamente */
  ingredientes?: IngredienteSabor[];
}

export interface StoreData {
  ingredientes: Ingrediente[];
  receitas: Receita[];
  sabores: Sabor[];
}

export interface ProductCMV {
  id: string;
  nome: string;
  categoria: Categoria;
  custo: number;
  precoVenda: number;
  cmvPercent: number;
  margem: number;
  status: 'otimo' | 'atencao' | 'critico';
  numIngredientes: number;
}

export interface StoreMetrics {
  cmvMedio: number;
  melhorSabor: { nome: string; cmv: number };
  totalProdutos: number;
  totalAcimaMeta: number;
  totalCategorias: number;
}

export type StoreId = 'ahu' | 'pilarzinho' | 'portao' | 'uberaba';
