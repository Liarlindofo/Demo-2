export type Unidade = 'g' | 'ml' | 'un';
export type Categoria = 'tradicional' | 'especial';

export interface Ingrediente {
  id: string;
  nome: string;
  unidade: Unidade;
  precoPorKg: number; // preço por kg (ou por unidade se unidade='un')
}

export interface IngredienteSabor {
  ingredienteId: string;
  quantidade: number; // em gramas, ml ou unidades
}

export interface Sabor {
  id: string;
  nome: string;
  categoria: Categoria;
  precoVenda: number;
  ingredientes: IngredienteSabor[];
}

export interface StoreData {
  sabores: Sabor[];
  ingredientes: Ingrediente[];
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
