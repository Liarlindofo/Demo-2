import type { StoreData, Sabor, Ingrediente, ProductCMV, StoreMetrics } from './types';
import { getCMVStatus, CMV_META } from './constants';

export const calcularCustoSabor = (sabor: Sabor, ingredientes: Ingrediente[]): number => {
  return sabor.ingredientes.reduce((total, ing) => {
    const ingrediente = ingredientes.find(i => i.id === ing.ingredienteId);
    if (!ingrediente || ingrediente.precoPorKg <= 0) return total;

    let custo = 0;
    if (ingrediente.unidade === 'g' || ingrediente.unidade === 'ml') {
      // precoPorKg = preço por 1000g ou 1000ml
      custo = (ingrediente.precoPorKg / 1000) * ing.quantidade;
    } else {
      // 'un' → precoPorKg é preço por unidade
      custo = ingrediente.precoPorKg * ing.quantidade;
    }
    return total + custo;
  }, 0);
};

export const calcularCMVSabor = (sabor: Sabor, ingredientes: Ingrediente[]): ProductCMV => {
  const custo = calcularCustoSabor(sabor, ingredientes);
  const cmvPercent = sabor.precoVenda > 0 ? (custo / sabor.precoVenda) * 100 : 0;
  const margem = 100 - cmvPercent;
  const status = getCMVStatus(cmvPercent);

  return {
    id: sabor.id,
    nome: sabor.nome,
    categoria: sabor.categoria,
    custo,
    precoVenda: sabor.precoVenda,
    cmvPercent,
    margem,
    status,
    numIngredientes: sabor.ingredientes.length,
  };
};

export const calcularTodosCMV = (data: StoreData): ProductCMV[] => {
  return data.sabores.map(sabor => calcularCMVSabor(sabor, data.ingredientes));
};

export const calcularMetricasLoja = (data: StoreData): StoreMetrics => {
  const products = calcularTodosCMV(data);

  if (products.length === 0) {
    return {
      cmvMedio: 0,
      melhorSabor: { nome: '-', cmv: 0 },
      totalProdutos: 0,
      totalAcimaMeta: 0,
      totalCategorias: 0,
    };
  }

  const cmvMedio = products.reduce((sum, p) => sum + p.cmvPercent, 0) / products.length;
  const melhorSabor = products.reduce((best, cur) => cur.cmvPercent < best.cmvPercent ? cur : best);
  const totalAcimaMeta = products.filter(p => p.status === 'critico').length;
  const categorias = new Set(data.sabores.map(s => s.categoria)).size;

  return {
    cmvMedio,
    melhorSabor: { nome: melhorSabor.nome, cmv: melhorSabor.cmvPercent },
    totalProdutos: products.length,
    totalAcimaMeta,
    totalCategorias: categorias,
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Parsear CSV de receitas
// Formato esperado (separado por ; ou ,):
// Nome do Sabor;Categoria;Preço Venda;Ingrediente;Quantidade;Unidade
export const parseCSVReceitas = (content: string): Array<{
  nome: string;
  categoria: 'tradicional' | 'especial';
  precoVenda: number;
  ingrediente: string;
  quantidade: number;
  unidade: 'g' | 'ml' | 'un';
}> => {
  const lines = content.trim().split('\n');
  const results: Array<{
    nome: string;
    categoria: 'tradicional' | 'especial';
    precoVenda: number;
    ingrediente: string;
    quantidade: number;
    unidade: 'g' | 'ml' | 'un';
  }> = [];

  // Detectar separador
  const sep = lines[0]?.includes(';') ? ';' : ',';

  // Pular cabeçalho
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 6) continue;

    const unidadeRaw = cols[5].toLowerCase();
    const unidade: 'g' | 'ml' | 'un' =
      unidadeRaw === 'g' ? 'g' :
      unidadeRaw === 'ml' ? 'ml' : 'un';

    results.push({
      nome: cols[0],
      categoria: cols[1].toLowerCase().includes('especial') ? 'especial' : 'tradicional',
      precoVenda: parseFloat(cols[2].replace(',', '.')) || 0,
      ingrediente: cols[3],
      quantidade: parseFloat(cols[4].replace(',', '.')) || 0,
      unidade,
    });
  }

  return results;
};

// CMV_META exportado para uso nos componentes
export { CMV_META };
