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
  dataCriacao: string; // ISO string
  status: 'em_andamento' | 'concluida';
  sessoes: StockCategory[];
  criadoPor: string;
}
