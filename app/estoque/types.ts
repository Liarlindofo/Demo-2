export type LojaId = 'ahu' | 'pilarzinho' | 'portao' | 'uberaba';

export interface StockItem {
  insumoId: string;
  nome: string;
  unidade: string;
  quantidadeContada: number | null; // null = não contado, 0 = contado como zero
  estoqueMinimo?: number;
  observacao?: string;
}

export interface StockCategory {
  id: string;
  nome: string;
  icone: string;
  status: 'pendente' | 'concluida';
  itens: StockItem[];
}

export interface StockSession {
  id: string;
  lojaId: LojaId;
  dataCriacao: string; // ISO string
  status: 'em_andamento' | 'concluida';
  sessoes: StockCategory[];
  criadoPor: string;
}

export const LOJA_LABELS: Record<LojaId, string> = {
  ahu: 'AHU',
  pilarzinho: 'Pilarzinho',
  portao: 'Portão',
  uberaba: 'Uberaba',
};

export const LOJA_CORES: Record<LojaId, string> = {
  ahu: '#3b82f6',
  pilarzinho: '#8b5cf6',
  portao: '#f97316',
  uberaba: '#22c55e',
};
