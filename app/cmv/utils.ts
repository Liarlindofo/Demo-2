import { isCategoriaPrecoPizza } from './types';
import type {
  StoreData,
  Sabor,
  SaborItem,
  Ingrediente,
  Receita,
  CategoriaPreco,
  ProductCMV,
  StoreMetrics,
  Tamanho,
  Combo,
  ComboItemPizza,
  ComboCMV,
  ComboCMVItem,
  ComboCMVItemPizza,
  ComboCMVItemIngrediente,
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
 * Migra uma CategoriaPreco do formato antigo (precoVenda único) para o novo (precos por tamanho).
 */
const migrarCategoria = (cat: CategoriaPreco): CategoriaPreco => {
  const precos =
    cat.precos && typeof cat.precos === 'object' ? cat.precos : {};
  return {
    ...cat,
    precos,
    tipoPrecificacao: cat.tipoPrecificacao ?? 'pizza',
  };
};

/**
 * Migra o StoreData inteiro para o novo formato, convertendo sabores e categorias antigas.
 */
export const migrarStoreData = (data: Partial<StoreData>): StoreData => ({
  ingredientes: data.ingredientes ?? [],
  receitas: data.receitas ?? [],
  categorias: (data.categorias ?? []).map(migrarCategoria),
  sabores: (data.sabores ?? []).map(s => ({
    ...s,
    itens: migrarSaborItens(s),
  })),
  combos: data.combos ?? [],
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

// ── Detecção de tamanho a partir do nome do produto ───────────────────────────

/** Mapa de palavras (sem acento, maiúsculas) → Tamanho */
const TAMANHO_MAP: Record<string, Tamanho> = {
  // Nomes completos
  BROTO: 'broto',
  BROTA: 'broto',
  PEQUENA: 'pequena',
  PEQUENO: 'pequena',
  MEDIA: 'media',
  MEDIO: 'media',
  MEDIAS: 'media',
  MEIO: 'media',
  GRANDE: 'grande',
  GIGANTE: 'gigante',
  GG: 'gigante',
  CALZONE: 'calzone',
  // Abreviações comuns
  B: 'broto',
  P: 'pequena',
  M: 'media',
  G: 'grande',
};

/**
 * Detecta o tamanho de um produto a partir do último "token" do nome.
 * Ex: "AMERICANA Grande" → 'grande'
 * Ex: "AMERICANA BROTO" → 'broto'
 */
export const detectarTamanho = (nome: string): Tamanho | null => {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 0) return null;
  const lastWord = parts[parts.length - 1]
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remove acentos
  return TAMANHO_MAP[lastWord] ?? null;
};

/**
 * Preço de venda resolvido a partir da categoria e do nome do produto (tamanho no sufixo).
 */
export const resolverPrecoVendaCategoria = (
  categoria: CategoriaPreco,
  nomeProduto: string,
): number => {
  const tipo = categoria.tipoPrecificacao ?? 'pizza';
  if (tipo === 'bebidas') {
    if (categoria.precos.bebidas != null) return categoria.precos.bebidas;
    if (categoria.precoVenda) return categoria.precoVenda;
    return 0;
  }
  if (tipo === 'entradas') {
    if (categoria.precos.entradas != null) return categoria.precos.entradas;
    if (categoria.precoVenda) return categoria.precoVenda;
    return 0;
  }
  const tamanho = detectarTamanho(nomeProduto);
  if (tamanho && categoria.precos[tamanho] != null) {
    return categoria.precos[tamanho]!;
  }
  if (!tamanho && categoria.precos.bebidas != null) {
    return categoria.precos.bebidas;
  }
  if (categoria.precoVenda) return categoria.precoVenda;
  return 0;
};

export const calcularCMVSabor = (
  sabor: Sabor,
  ingredientes: Ingrediente[],
  receitas: Receita[] = [],
  categorias: CategoriaPreco[] = [],
): ProductCMV => {
  const custo = calcularCustoSabor(sabor, ingredientes, receitas);

  const tamanhoNome = detectarTamanho(sabor.nome);
  const categoria = categorias.find(c => c.id === sabor.categoriaId);

  let precoVenda = 0;
  if (categoria) {
    precoVenda = resolverPrecoVendaCategoria(categoria, sabor.nome);
  } else {
    precoVenda = sabor.precoVenda ?? 0;
  }

  const cmvPercent = precoVenda > 0 ? (custo / precoVenda) * 100 : 0;
  const margem = 100 - cmvPercent;
  const status = getCMVStatus(cmvPercent);
  const numIngredientes = migrarSaborItens(sabor).length;

  const tamanhoExibir =
    (categoria?.tipoPrecificacao === 'bebidas' || categoria?.tipoPrecificacao === 'entradas')
      ? undefined
      : (tamanhoNome ?? undefined);

  return {
    id: sabor.id,
    nome: sabor.nome,
    categoria: categoria?.nome || sabor.categoria || 'Sem Categoria',
    categoriaGrupo: categoria?.grupo,
    tipoPrecificacao: categoria?.tipoPrecificacao ?? 'pizza',
    tamanho: tamanhoExibir,
    custo,
    precoVenda,
    cmvPercent,
    margem,
    status,
    numIngredientes,
    fotoUrl: sabor.fotoUrl,
    fotos:   sabor.fotos ?? (sabor.fotoUrl ? [sabor.fotoUrl] : undefined),
    descricao: sabor.descricao,
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
      piorSabor: { nome: '-', cmv: 0 },
      totalProdutos: 0,
      totalCategorias: 0,
    };
  }

  const cmvMedio =
    products.reduce((sum, p) => sum + p.cmvPercent, 0) / products.length;

  const grupos = agruparPorSabor(products);

  // Melhor/pior margem só considera grupos que NÃO são de bebidas nem entradas
  const gruposPizza = grupos.filter(g =>
    g.produtos.some(p => p.tipoPrecificacao !== 'bebidas' && p.tipoPrecificacao !== 'entradas'),
  );

  const gruposParaMelhorPior = gruposPizza.length > 0 ? gruposPizza : grupos;

  const melhorGrupo = gruposParaMelhorPior.reduce((best, g) =>
    g.cmvMedio < best.cmvMedio ? g : best,
  );
  const piorGrupo = gruposParaMelhorPior.reduce((worst, g) =>
    g.cmvMedio > worst.cmvMedio ? g : worst,
  );

  const categorias = new Set(data.sabores.map(s => s.categoria)).size;

  return {
    cmvMedio,
    melhorSabor: { nome: melhorGrupo.nome, cmv: melhorGrupo.cmvMedio },
    piorSabor: { nome: piorGrupo.nome, cmv: piorGrupo.cmvMedio },
    totalProdutos: products.length,
    totalCategorias: categorias,
  };
};

// ── Formatação ─────────────────────────────────────────────────────────────────

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

// ── Sugestão de preço de venda ─────────────────────────────────────────────────

/**
 * Targets de CMV por tipo de produto:
 * - Pizzas: [28%, 31%]  — dois cenários: meta ideal e meta conservadora
 * - Bebidas / Entradas: [50%]
 */
const CMV_ALVO_TARGETS: Record<string, number[]> = {
  pizza: [28, 31],
  bebidas: [50],
  entradas: [50],
};

export interface SugestaoPreco {
  precoSugerido: number;
  targetCMV: number;
}

/**
 * Retorna todas as sugestões de preço de venda para um produto.
 * Cada sugestão corresponde a um target de CMV menor que o CMV atual,
 * e apenas quando o preço sugerido é maior que o preço atual.
 */
export const getSugestoesPreco = (product: ProductCMV): SugestaoPreco[] => {
  if (product.custo <= 0) return [];
  const tipo = product.tipoPrecificacao ?? 'pizza';
  const targets = CMV_ALVO_TARGETS[tipo] ?? [28];
  return targets
    .filter(targetCMV => product.cmvPercent > targetCMV)
    .map(targetCMV => ({
      precoSugerido: product.custo / (targetCMV / 100),
      targetCMV,
    }))
    .filter(s => s.precoSugerido > product.precoVenda);
};

/** @deprecated Use getSugestoesPreco */
export const getSugestaoPreco = (product: ProductCMV): SugestaoPreco | null => {
  const sugestoes = getSugestoesPreco(product);
  return sugestoes.length > 0 ? sugestoes[0] : null;
};

// ── Agrupamento de produtos por sabor ─────────────────────────────────────────

/**
 * Palavras que indicam tamanho/variação de produto.
 * Se o produto terminar com uma dessas palavras, ela é removida para obter o nome do grupo.
 */
const SIZE_WORDS = new Set([
  'BROTO', 'BROTA',
  'PEQUENA', 'PEQUENO', 'P',
  'MEDIA', 'MÉDIO', 'MÉDIA', 'MEDIO',
  'GRANDE', 'G',
  'GIGANTE', 'GG',
  'CALZONE',
  'EXTRA', 'XL', 'XXL',
  'FAMILIA', 'FAMÍLIA', 'FAM',
  'INDIVIDUAL', 'IND',
  'KIDS',
]);

/** Extrai o nome do grupo removendo o sufixo de tamanho, se houver. */
export const getFlavorGroupName = (productName: string): string => {
  const parts = productName.trim().split(/\s+/);
  if (parts.length <= 1) return productName;
  const lastWord = parts[parts.length - 1].toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove acentos para comparar
  if (SIZE_WORDS.has(lastWord)) {
    return parts.slice(0, -1).join(' ');
  }
  return productName;
};

export interface FlavorGroup {
  nome: string;           // Nome do grupo/sabor (ex: "AMERICANA")
  produtos: ProductCMV[]; // Todos os tamanhos/variações
  cmvMedio: number;
  cmvMin: number;
  cmvMax: number;
  statusGeral: 'otimo' | 'atencao' | 'critico';
}

/** Agrupa produtos pelo sabor base, ordenando variações pelo CMV. */
export const agruparPorSabor = (products: ProductCMV[]): FlavorGroup[] => {
  const map = new Map<string, ProductCMV[]>();

  products.forEach(p => {
    const group = getFlavorGroupName(p.nome);
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push(p);
  });

  // Ordenação por tamanho padrão
  const SIZE_ORDER = ['BROTO', 'BROTA', 'PEQUENA', 'PEQUENO', 'P', 'MEDIA', 'MÉDIO', 'MÉDIAS', 'MÉDIO', 'MEIO', 'M', 'GRANDE', 'G', 'GIGANTE', 'GG', 'CALZONE', 'EXTRA', 'XL', 'XXL', 'FAMILIA', 'FAMÍLIA', 'FAM'];
  const sizeRank = (name: string) => {
    const last = name.trim().split(/\s+/).pop()?.toUpperCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') ?? '';
    const idx = SIZE_ORDER.indexOf(last);
    return idx >= 0 ? idx : 999;
  };

  return Array.from(map.entries())
    .map(([nome, produtos]) => {
      const sorted = [...produtos].sort((a, b) => sizeRank(a.nome) - sizeRank(b.nome));
      const cmvValues = sorted.map(p => p.cmvPercent);
      const cmvMedio = cmvValues.reduce((s, v) => s + v, 0) / cmvValues.length;
      const cmvMin = Math.min(...cmvValues);
      const cmvMax = Math.max(...cmvValues);
      const statusGeral = getCMVStatus(cmvMax); // pior caso do grupo
      return { nome, produtos: sorted, cmvMedio, cmvMin, cmvMax, statusGeral };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
};

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

// ── Combos ────────────────────────────────────────────────────────────────────

/**
 * Calcula o CMV de um combo a partir dos produtos (ProductCMV) já calculados.
 * Cascata automática: se o custo de um produto mudar, o combo é recalculado.
 */
/**
 * Calcula o CMV de um combo.
 * Cada item é um TAMANHO de pizza com categorias elegíveis.
 * Preço = média dos preços das categorias elegíveis para aquele tamanho.
 * Custo = média dos custos médios dos produtos em cada categoria elegível para aquele tamanho.
 */
export const calcularComboCMV = (combo: Combo, data: StoreData): ComboCMV => {
  const todasCategorias = data.categorias ?? [];

  const itens: ComboCMVItem[] = combo.itens.map(item => {
    // Slot de ingrediente (bebida, sobremesa, etc.)
    if (item.tipo === 'ingrediente') {
      const referenciaId = item.produtoId ?? item.ingredienteId;
      const produto = (data.sabores ?? []).find(s => s.id === referenciaId);

      // Novo fluxo: busca bebida/outro em produtos (sabores), com custo e venda calculados.
      if (produto) {
        const cmvProduto = calcularCMVSabor(
          produto,
          data.ingredientes,
          data.receitas,
          data.categorias,
        );

        const resultadoProduto: ComboCMVItemIngrediente = {
          id: item.id,
          tipo: 'ingrediente',
          ingredienteId: referenciaId,
          nomeIngrediente: produto.nome,
          quantidade: item.quantidade,
          precoUnitario: cmvProduto.precoVenda,
          custoUnitario: cmvProduto.custo,
          precoItem: cmvProduto.precoVenda * item.quantidade,
          custoItem: cmvProduto.custo * item.quantidade,
        };
        return resultadoProduto;
      }

      // Fallback legado: item antigo que ainda aponta para ingrediente.
      const ing = (data.ingredientes ?? []).find(i => i.id === referenciaId);
      const custoUnitario = ing ? ing.precoPorKg : 0;
      const resultado: ComboCMVItemIngrediente = {
        id: item.id,
        tipo: 'ingrediente',
        ingredienteId: referenciaId,
        nomeIngrediente: ing?.nome ?? '—',
        quantidade: item.quantidade,
        precoUnitario: item.precoVenda,
        custoUnitario,
        precoItem: item.precoVenda * item.quantidade,
        custoItem: custoUnitario * item.quantidade,
      };
      return resultado;
    }

    // Slot de pizza (tipo === 'pizza' ou undefined — compat com dados antigos)
    const pizzaItem = item as ComboItemPizza;

    const categoriasPizza = todasCategorias.filter(isCategoriaPrecoPizza);

    // Resolve quais categorias participam deste slot (apenas categorias de pizza)
    const categoriasItem =
      (pizzaItem.categoriaIds ?? []).length > 0
        ? todasCategorias.filter(
            c =>
              (pizzaItem.categoriaIds ?? []).includes(c.id) &&
              isCategoriaPrecoPizza(c),
          )
        : categoriasPizza;

    // Categorias que têm preço definido para este tamanho
    const categoriasComPreco = categoriasItem.filter(
      c => c.precos[pizzaItem.tamanho] != null,
    );

    // Média dos preços de venda entre as categorias elegíveis
    const precoMedioUnitario =
      categoriasComPreco.length > 0
        ? categoriasComPreco.reduce(
            (sum, c) => sum + (c.precos[pizzaItem.tamanho] ?? 0),
            0,
          ) / categoriasComPreco.length
        : 0;

    // Para cada categoria elegível, calcula o custo médio dos produtos naquela categoria+tamanho
    // Depois tira a média entre as categorias
    let somaCustosCategorias = 0;
    let numCategoriasCusto = 0;
    let numProdutosTotal = 0;

    for (const cat of categoriasItem) {
      const produtosCat = data.sabores.filter(
        s => s.categoriaId === cat.id && detectarTamanho(s.nome) === pizzaItem.tamanho,
      );
      numProdutosTotal += produtosCat.length;
      if (produtosCat.length > 0) {
        const custoCat =
          produtosCat.reduce(
            (sum, s) => sum + calcularCustoSabor(s, data.ingredientes, data.receitas),
            0,
          ) / produtosCat.length;
        somaCustosCategorias += custoCat;
        numCategoriasCusto++;
      }
    }

    const custoMedioUnitario =
      numCategoriasCusto > 0 ? somaCustosCategorias / numCategoriasCusto : 0;

    const resultado: ComboCMVItemPizza = {
      id: pizzaItem.id,
      tipo: 'pizza',
      tamanho: pizzaItem.tamanho,
      quantidade: pizzaItem.quantidade,
      categorias: categoriasItem,
      precoMedioUnitario,
      custoMedioUnitario,
      precoItem: precoMedioUnitario * pizzaItem.quantidade,
      custoItem: custoMedioUnitario * pizzaItem.quantidade,
      numProdutos: numProdutosTotal,
    };
    return resultado;
  });

  const custoTotal = itens.reduce((sum, i) => sum + i.custoItem, 0);
  const precoRegular = itens.reduce((sum, i) => sum + i.precoItem, 0);
  const cmvPercent = combo.precoVenda > 0 ? (custoTotal / combo.precoVenda) * 100 : 0;
  const margem = 100 - cmvPercent;
  const economia = precoRegular - combo.precoVenda;

  return {
    id: combo.id,
    nome: combo.nome,
    descricao: combo.descricao,
    fotoUrl: combo.fotoUrl,
    fotos:   combo.fotos ?? (combo.fotoUrl ? [combo.fotoUrl] : undefined),
    custoTotal,
    precoRegular,
    precoVenda: combo.precoVenda,
    economia,
    cmvPercent,
    margem,
    status: getCMVStatus(cmvPercent),
    itens,
  };
};

export const calcularTodosCombos = (data: StoreData): ComboCMV[] =>
  (data.combos ?? []).map(combo => calcularComboCMV(combo, data));

/** Métricas agregadas só dos combos (mesmo formato que StoreMetrics para reutilizar os cards). */
export const calcularMetricasCombos = (data: StoreData): StoreMetrics => {
  const combos = calcularTodosCombos(data);

  if (combos.length === 0) {
    return {
      cmvMedio: 0,
      melhorSabor: { nome: '-', cmv: 0 },
      piorSabor: { nome: '-', cmv: 0 },
      totalProdutos: 0,
      totalCategorias: 0,
    };
  }

  const cmvMedio =
    combos.reduce((sum, c) => sum + c.cmvPercent, 0) / combos.length;
  const melhorCombo = combos.reduce((best, cur) =>
    cur.cmvPercent < best.cmvPercent ? cur : best,
  );
  const piorCombo = combos.reduce((worst, cur) =>
    cur.cmvPercent > worst.cmvPercent ? cur : worst,
  );

  return {
    cmvMedio,
    melhorSabor: { nome: melhorCombo.nome, cmv: melhorCombo.cmvPercent },
    piorSabor: { nome: piorCombo.nome, cmv: piorCombo.cmvPercent },
    totalProdutos: combos.length,
    totalCategorias: 0,
  };
};

// CMV_META exportado para uso nos componentes
export { CMV_META };
