export type Unidade = 'g' | 'ml' | 'un';
export type Categoria = 'tradicional' | 'especial';

// ── Tamanhos disponíveis ───────────────────────────────────────────────────────
export type Tamanho = 'broto' | 'pequena' | 'media' | 'grande' | 'gigante' | 'calzone';

export const TAMANHOS: readonly Tamanho[] = [
  'broto', 'pequena', 'media', 'grande', 'gigante', 'calzone',
] as const;

export const TAMANHO_LABELS: Record<Tamanho, string> = {
  broto: 'Broto',
  pequena: 'Pequena',
  media: 'Média',
  grande: 'Grande',
  gigante: 'Gigante',
  calzone: 'Calzone',
};

// ── Categorias de preço (matriz: categoria × tamanho) ─────────────────────────
export interface CategoriaPreco {
  id: string;
  nome: string;    // Ex: "TRADICIONAL I", "ESPECIAL II", "DOCE"
  grupo?: string;  // Agrupamento visual: "TRADICIONAL", "ESPECIAL", "DOCE", "BORDA"
  /** Preço por tamanho — célula vazia = tamanho não disponível para esta categoria */
  precos: Partial<Record<Tamanho, number>>;
  /** @deprecated use precos[tamanho] — mantido para migração de dados antigos */
  precoVenda?: number;
}

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
 * Um item do combo é definido por categoria + tamanho (não por produto individual).
 * O custo é calculado como média dos produtos nessa categoria/tamanho.
 */
export interface ComboItem {
  categoriaId: string;
  tamanho: Tamanho;
  quantidade: number;
}

export interface Combo {
  id: string;
  nome: string;
  descricao?: string;
  precoVenda: number;
  itens: ComboItem[];
}

export interface ComboCMVItem {
  categoriaId: string;
  categoria: CategoriaPreco;
  tamanho: Tamanho;
  quantidade: number;
  /** Preço de venda unitário (categoria.precos[tamanho]) */
  precoUnitario: number;
  /** Custo médio dos produtos nessa categoria+tamanho */
  custoMedioUnitario: number;
  /** custoMedioUnitario × quantidade */
  custoItem: number;
  /** precoUnitario × quantidade */
  precoItem: number;
  /** Quantos produtos existem nessa categoria+tamanho */
  numProdutos: number;
}

export interface ComboCMV {
  id: string;
  nome: string;
  descricao?: string;
  custoTotal: number;
  /** Soma dos preços de categoria × quantidade */
  precoRegular: number;
  /** Preço definido para o combo (pode ser menor para desconto) */
  precoVenda: number;
  /** precoRegular - precoVenda (positivo = cliente economiza) */
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
  totalProdutos: number;
  totalAcimaMeta: number;
  totalCategorias: number;
}

export type StoreId = 'ahu' | 'pilarzinho' | 'portao' | 'uberaba';
