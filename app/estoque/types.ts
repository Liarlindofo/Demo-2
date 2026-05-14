export interface StockItem {
  insumoId: string;
  nome: string;
  unidade: string;
  quantidadeContada: number | null; // null = não contado, 0 = contado como zero; sempre em kg
  estoqueMinimo?: number;           // sempre em kg
  observacao?: string;
  modoContagem?: 'kg' | 'unidade';  // como o usuário digita a quantidade
  kgPorUnidade?: number;            // fator de conversão: 1 un = N kg
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
