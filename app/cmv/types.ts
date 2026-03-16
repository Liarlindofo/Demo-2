export interface Insumo {
  id: string;
  nome: string;
  unidade: string; // 'g', 'ml', 'un', etc.
  precoPorUnidade: number;
}

export interface Ingrediente {
  insumoId: string;
  quantidade: number;
}

export interface FichaTecnica {
  id: string;
  produto: string;
  precoVenda: number;
  ingredientes: Ingrediente[];
}

export interface StoreState {
  insumos: Insumo[];
  fichas: FichaTecnica[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CMVCalculation {
  custo: number;
  cmvPercent: number;
  margem: number;
}

export interface ProductCMV {
  produto: string;
  custo: number;
  precoVenda: number;
  cmvPercent: number;
  margem: number;
  status: 'otimo' | 'atencao' | 'critico';
}

export interface StoreMetrics {
  cmvMedio: number;
  melhorProduto: { nome: string; cmv: number };
  piorProduto: { nome: string; cmv: number };
  totalProdutos: number;
}

export type StoreId = 'ahu' | 'pilarzinho' | 'portao' | 'uberaba';

export interface OpenRouterResponse {
  message: string;
  state: StoreState;
}
