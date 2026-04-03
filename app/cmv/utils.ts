import type {
  StoreData,
  Sabor,
  SaborItem,
  Ingrediente,
  Receita,
  CategoriaPreco,
  ProductCMV,
  StoreMetrics,
} from './types';
import { getCMVStatus, CMV_META } from './constants';

// ── Migração de dados antigos → novo formato ──────────────────────────────────

/**
 * Converte sabor antigo (sabor.ingredientes[]) para o novo formato (sabor.itens[]).
 * Se já possuir itens, retorna como está.
 */
export const migrarSaborItens = (sabor: Sabor): SaborItem[] => {
  if (sabor.itens && sabor.itens.length > 0) return sabor.itens;

  // Backward compat: ingredientes antigos viram itens do tipo 'ingrediente'
  if (sabor.ingredientes && sabor.ingredientes.length > 0) {
    return sabor.ingredientes.map((ing, idx) => ({
      id: `legacy-${sabor.id}-${idx}`,
      tipo: 'ingrediente' as const,
      referenciaId: ing.ingredienteId,
      quantidade: ing.quantidade,
    }));
  }

  return [];
};

/**
 * Migra o StoreData inteiro para o novo formato, convertendo sabores antigos.
 */
export const migrarStoreData = (data: Partial<StoreData>): StoreData => ({
  ingredientes: data.ingredientes ?? [],
  receitas: data.receitas ?? [],
  categorias: data.categorias ?? [],
  sabores: (data.sabores ?? []).map(s => ({
    ...s,
    itens: migrarSaborItens(s),
  })),
});

// ── Etapa 2: Custo por kg de uma Receita ──────────────────────────────────────

/**
 * Calcula o custo por kg (ou por unidade) de uma receita, com base nos
 * ingredientes da Etapa 1.
 * A cascata é automática: quando precoPorKg de um ingrediente muda,
 * basta chamar esta função novamente.
 */
export const calcularCustoPorKgReceita = (
  receita: Receita,
  ingredientes: Ingrediente[],
): number => {
  if (receita.rendimento <= 0) return 0;

  const custoTotal = receita.itens.reduce((total, item) => {
    const ing = ingredientes.find(i => i.id === item.ingredienteId);
    if (!ing || ing.precoPorKg <= 0) return total;

    const custo =
      ing.unidade === 'un'
        ? ing.precoPorKg * item.quantidade
        : (ing.precoPorKg / 1000) * item.quantidade;

    return total + custo;
  }, 0);

  // custoPorKg = custoTotal / (rendimento em kg); para 'un' = custo por unidade
  if (receita.unidade === 'un') {
    return custoTotal / receita.rendimento;
  }
  return custoTotal / (receita.rendimento / 1000);
};

// ── Etapa 3: Custo de cada item e do sabor completo ───────────────────────────

/**
 * Calcula o custo de um único item de sabor (ingrediente simples ou receita).
 */
export const calcularCustoItem = (
  item: SaborItem,
  ingredientes: Ingrediente[],
  receitas: Receita[],
): number => {
  if (item.tipo === 'ingrediente') {
    const ing = ingredientes.find(i => i.id === item.referenciaId);
    if (!ing || ing.precoPorKg <= 0) return 0;
    return ing.unidade === 'un'
      ? ing.precoPorKg * item.quantidade
      : (ing.precoPorKg / 1000) * item.quantidade;
  } else {
    // receita
    const receita = receitas.find(r => r.id === item.referenciaId);
    if (!receita) return 0;
    const custoPorKg = calcularCustoPorKgReceita(receita, ingredientes);
    return receita.unidade === 'un'
      ? custoPorKg * item.quantidade
      : (custoPorKg / 1000) * item.quantidade;
  }
};

/**
 * Custo total de um sabor. Aceita o formato novo (itens[]) e o legado.
 * Cascata automática: alterações em precoPorKg (Etapa 1) ou em receitas (Etapa 2)
 * são refletidas aqui sem nenhuma ação adicional.
 */
export const calcularCustoSabor = (
  sabor: Sabor,
  ingredientes: Ingrediente[],
  receitas: Receita[] = [],
): number => {
  const itens = migrarSaborItens(sabor);
  return itens.reduce(
    (total, item) => total + calcularCustoItem(item, ingredientes, receitas),
    0,
  );
};

export const calcularCMVSabor = (
  sabor: Sabor,
  ingredientes: Ingrediente[],
  receitas: Receita[] = [],
  categorias: CategoriaPreco[] = [],
): ProductCMV => {
  const custo = calcularCustoSabor(sabor, ingredientes, receitas);

  // Resolve preço de venda: categoria (nova) > precoVenda legado
  const precoVenda = sabor.categoriaId
    ? (categorias.find(c => c.id === sabor.categoriaId)?.precoVenda ?? sabor.precoVenda ?? 0)
    : (sabor.precoVenda ?? 0);

  const cmvPercent = precoVenda > 0 ? (custo / precoVenda) * 100 : 0;
  const margem = 100 - cmvPercent;
  const status = getCMVStatus(cmvPercent);
  const numIngredientes = migrarSaborItens(sabor).length;

  return {
    id: sabor.id,
    nome: sabor.nome,
    categoria: sabor.categoria,
    custo,
    precoVenda,
    cmvPercent,
    margem,
    status,
    numIngredientes,
  };
};

export const calcularTodosCMV = (data: StoreData): ProductCMV[] =>
  data.sabores.map(sabor =>
    calcularCMVSabor(sabor, data.ingredientes, data.receitas, data.categorias),
  );

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

  const cmvMedio =
    products.reduce((sum, p) => sum + p.cmvPercent, 0) / products.length;
  const melhorSabor = products.reduce((best, cur) =>
    cur.cmvPercent < best.cmvPercent ? cur : best,
  );
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

// ── Formatação ─────────────────────────────────────────────────────────────────

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

// ── Importação CSV (mantido) ───────────────────────────────────────────────────

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

  const sep = lines[0]?.includes(';') ? ';' : ',';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(sep).map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 6) continue;

    const unidadeRaw = cols[5].toLowerCase();
    const unidade: 'g' | 'ml' | 'un' =
      unidadeRaw === 'g' ? 'g' : unidadeRaw === 'ml' ? 'ml' : 'un';

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
