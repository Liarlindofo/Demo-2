export type Unidade = 'g' | 'ml' | 'un';
export type Categoria = 'tradicional' | 'especial';

// ── Tamanhos disponíveis ───────────────────────────────────────────────────────
export type Tamanho = 'broto' | 'pequena' | 'media' | 'grande' | 'gigante' | 'calzone' | 'bebidas';
export type PizzaTamanho = Exclude<Tamanho, 'bebidas'>;

export const TAMANHOS: readonly Tamanho[] = [
  'broto', 'pequena', 'media', 'grande', 'gigante', 'calzone', 'bebidas',
] as const;

export const TAMANHOS_PIZZA: readonly PizzaTamanho[] = [
  'broto', 'pequena', 'media', 'grande', 'gigante', 'calzone',
] as const;

export const TAMANHO_LABELS: Record<Tamanho, string> = {
  broto: 'Broto',
  pequena: 'Pequena',
  media: 'Média',
  grande: 'Grande',
  gigante: 'Gigante',
  calzone: 'Calzone',
  bebidas: 'Bebidas',
};

// ── Categorias de preço (matriz: categoria × tamanho) ─────────────────────────
export interface CategoriaPreco {
  id: string;
  nome: string;    // Ex: "TRADICIONAL I", "ESPECIAL II", "DOCE"
  grupo?: string;  // Agrupamento visual: "TRADICIONAL", "ESPECIAL", "DOCE", "BORDA"
  /**
   * `pizza` (padrão): matriz com tamanhos de pizza (broto…calzone).
   * `bebidas`: um único preço em `precos.bebidas`, sem colunas de tamanho de pizza.
   */
  tipoPrecificacao?: 'pizza' | 'bebidas';
  /** Preço por tamanho — célula vazia = tamanho não disponível para esta categoria */
  precos: Partial<Record<Tamanho, number>>;
  /** @deprecated use precos[tamanho] — mantido para migração de dados antigos */
  precoVenda?: number;
}

/** Categorias da matriz de pizza (exclui modo bebidas). */
export const isCategoriaPrecoPizza = (c: CategoriaPreco): boolean =>
  (c.tipoPrecificacao ?? 'pizza') === 'pizza';

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
  /** ID da CategoriaPreco — o preço de venda vem de categoria.precos[tamanho_detectado] */
  categoriaId?: string;
  /** @deprecated mantido para compatibilidade com dados antigos sem categoriaId */
  precoVenda: number;
  itens: SaborItem[];
  /** @deprecated mantido para leitura de dados antigos, migrado automaticamente */
  ingredientes?: IngredienteSabor[];
}

// ── Combos / Agrupamentos de produtos ─────────────────────────────────────────

/**
 * Um slot de pizza no combo: definido por TAMANHO + quais CATEGORIAS são elegíveis.
 * O preço e custo são calculados como MÉDIA entre as categorias elegíveis para aquele tamanho.
 * categoriaIds vazio = usa TODAS as categorias.
 * `tipo` é opcional para compatibilidade com dados existentes (undefined = 'pizza').
 */
export interface ComboItemPizza {
  id: string;
  tipo?: 'pizza';
  tamanho: PizzaTamanho;
  quantidade: number;
  categoriaIds: string[]; // categorias elegíveis (vazio = todas)
}

/**
 * Um slot de bebida/outro no combo.
 * Fluxo atual: preferencialmente aponta para produto (sabor) para resolver custo e venda.
 * Fluxo legado: ainda pode apontar para ingrediente com preço manual.
 */
export interface ComboItemIngrediente {
  id: string;
  tipo: 'ingrediente';
  /**
   * Mantido por compatibilidade.
   * Agora pode apontar para ID de produto (sabor) quando o item vem de "Bebida/Outro".
   */
  ingredienteId: string;
  /** Novo campo preferencial para itens vindos de produtos (opcional para compatibilidade). */
  produtoId?: string;
  quantidade: number;    // quantidade de unidades incluídas no combo
  /** fallback legado quando não há produto resolvido */
  precoVenda: number;
}

export type ComboItem = ComboItemPizza | ComboItemIngrediente;

export interface Combo {
  id: string;
  nome: string;
  descricao?: string;
  precoVenda: number;
  itens: ComboItem[];
}

export interface ComboCMVItemPizza {
  id: string;
  tipo: 'pizza';
  tamanho: Tamanho;
  quantidade: number;
  /** Categorias resolvidas usadas no cálculo */
  categorias: CategoriaPreco[];
  /** Média dos preços de venda entre as categorias elegíveis para este tamanho */
  precoMedioUnitario: number;
  /** Média dos custos médios entre as categorias elegíveis para este tamanho */
  custoMedioUnitario: number;
  precoItem: number;
  custoItem: number;
  /** Total de produtos cadastrados nas categorias/tamanho */
  numProdutos: number;
}

export interface ComboCMVItemIngrediente {
  id: string;
  tipo: 'ingrediente';
  ingredienteId: string;
  nomeIngrediente: string;
  quantidade: number;
  precoUnitario: number;
  custoUnitario: number;
  precoItem: number;
  custoItem: number;
}

export type ComboCMVItem = ComboCMVItemPizza | ComboCMVItemIngrediente;

export interface ComboCMV {
  id: string;
  nome: string;
  descricao?: string;
  custoTotal: number;
  /** Soma das médias de preço de categoria × quantidade */
  precoRegular: number;
  /** Preço definido para o combo */
  precoVenda: number;
  /** precoRegular - precoVenda (positivo = desconto para o cliente) */
  economia: number;
  cmvPercent: number;
  margem: number;
  status: 'otimo' | 'atencao' | 'critico';
  itens: ComboCMVItem[];
}

export interface StoreData {
  ingredientes: Ingrediente[];
  receitas: Receita[];
  sabores: Sabor[];
  categorias: CategoriaPreco[];
  combos: Combo[];
}

export interface ProductCMV {
  id: string;
  nome: string;
  categoria: string;        // nome da categoria (ex: "TRADICIONAL I")
  categoriaGrupo?: string;  // grupo da categoria (ex: "TRADICIONAL")
  tamanho?: Tamanho;        // tamanho detectado do nome do produto
  custo: number;
  precoVenda: number;       // resolvido de categoria.precos[tamanho]
  cmvPercent: number;
  margem: number;
  status: 'otimo' | 'atencao' | 'critico';
  numIngredientes: number;
}

export interface StoreMetrics {
  cmvMedio: number;
  melhorSabor: { nome: string; cmv: number };
  /** Sabor/combo com maior CMV médio (pior margem). */
  piorSabor: { nome: string; cmv: number };
  totalProdutos: number;
  totalCategorias: number;
}

export type StoreId = 'ahu' | 'pilarzinho' | 'portao' | 'uberaba';
