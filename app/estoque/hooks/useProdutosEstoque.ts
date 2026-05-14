'use client';

import { useState, useEffect } from 'react';
import type { StockCategory, StockItem } from '../types';
import { criarSessoesPadrao } from '../data/mockInsumos';

// Campos que nos interessam do modelo EtiquetagemProduto
interface ProdutoAPI {
  id: string;
  nome: string;
  unidadeMedida: string | null;
  tipoArmazenamentoPadrao: string | null;
  isAtivo: number;
  categoria?: {
    nome: string;
    temperaturaArmazenamento: string;
  } | null;
}

// Mapeamento de tipoArmazenamentoPadrao → sessão de estoque
const TIPO_SESSAO_MAP: Record<string, { id: string; nome: string; icone: string }> = {
  CONGELADO:           { id: 'congelados',    nome: 'Congelados',              icone: '🧊' },
  CONGELADO_MEDIO:     { id: 'congelados',    nome: 'Congelados',              icone: '🧊' },
  CONGELADO_PROFUNDO:  { id: 'congelados',    nome: 'Congelados',              icone: '🧊' },
  RESFRIADO:           { id: 'resfriados',    nome: 'Resfriados',              icone: '❄️' },
  FRIO:                { id: 'resfriados',    nome: 'Resfriados',              icone: '❄️' },
  AMBIENTE:            { id: 'ambiente',      nome: 'Temperatura Ambiente',    icone: '🌿' },
  TEMPERATURA_AMBIENTE:{ id: 'ambiente',      nome: 'Temperatura Ambiente',    icone: '🌿' },
  SECO:                { id: 'ambiente',      nome: 'Temperatura Ambiente',    icone: '🌿' },
};

// Mesma lógica para temperaturaArmazenamento da categoria (fallback)
const TEMP_CATEGORIA_MAP: Record<string, { id: string; nome: string; icone: string }> = {
  CONGELADO:    { id: 'congelados', nome: 'Congelados',           icone: '🧊' },
  RESFRIADO:    { id: 'resfriados', nome: 'Resfriados',           icone: '❄️' },
  AMBIENTE:     { id: 'ambiente',   nome: 'Temperatura Ambiente', icone: '🌿' },
};

function resolverSessao(produto: ProdutoAPI): { id: string; nome: string; icone: string } {
  // 1. Usar tipoArmazenamentoPadrao do próprio produto
  if (produto.tipoArmazenamentoPadrao) {
    const key = produto.tipoArmazenamentoPadrao.toUpperCase().replace(/\s+/g, '_');
    if (TIPO_SESSAO_MAP[key]) return TIPO_SESSAO_MAP[key];
    // valor desconhecido → criar sessão dinâmica com o nome do campo
    return {
      id: `tipo-${key.toLowerCase()}`,
      nome: produto.tipoArmazenamentoPadrao,
      icone: '📦',
    };
  }

  // 2. Usar temperatura da categoria como fallback
  if (produto.categoria?.temperaturaArmazenamento) {
    const key = produto.categoria.temperaturaArmazenamento.toUpperCase().replace(/\s+/g, '_');
    if (TEMP_CATEGORIA_MAP[key]) return TEMP_CATEGORIA_MAP[key];
  }

  // 3. Sem mapeamento → "Outros"
  return { id: 'outros', nome: 'Outros', icone: '📋' };
}

export function construirSessoesFromProdutos(
  produtos: ProdutoAPI[],
  config: import('./useEstoqueConfig').EstoqueConfigMap = {},
): StockCategory[] {
  const ativos = produtos.filter(p => {
    if (p.isAtivo !== 1) return false;
    const cfg = config[p.id];
    return cfg === undefined || cfg.ativo !== false; // padrão = ativo
  });

  // Agrupar por sessão
  const sessoesMap = new Map<string, { config: { id: string; nome: string; icone: string }; itens: StockItem[] }>();

  ativos.forEach(produto => {
    const sessaoConfig = resolverSessao(produto);
    const key = sessaoConfig.id;

    if (!sessoesMap.has(key)) {
      sessoesMap.set(key, { config: sessaoConfig, itens: [] });
    }

    const cfg = config[produto.id];
    sessoesMap.get(key)!.itens.push({
      insumoId: produto.id,
      nome: produto.nome,
      unidade: produto.unidadeMedida ?? 'un',
      quantidadeContada: null,
      estoqueMinimo: cfg?.estoqueMinimo,
      observacao: undefined,
      modoContagem: cfg?.modoContagem ?? 'kg',
      kgPorUnidade: cfg?.kgPorUnidade,
    });
  });

  // Ordenar: sessões conhecidas primeiro, depois dinâmicas, "outros" por último
  const ORDER = ['congelados', 'resfriados', 'ambiente'];
  const entries = Array.from(sessoesMap.entries());

  entries.sort(([idA], [idB]) => {
    const ia = ORDER.indexOf(idA);
    const ib = ORDER.indexOf(idB);
    if (idA === 'outros') return 1;
    if (idB === 'outros') return -1;
    if (ia === -1 && ib === -1) return idA.localeCompare(idB);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return entries.map(([, { config, itens }]) => ({
    id: config.id,
    nome: config.nome,
    icone: config.icone,
    status: 'pendente' as const,
    itens: itens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
  }));
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface ProdutosEstoqueState {
  produtos: ProdutoAPI[];
  sessoes: StockCategory[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProdutosEstoque(
  config: import('./useEstoqueConfig').EstoqueConfigMap = {},
): ProdutosEstoqueState {
  const [produtos, setProdutos] = useState<ProdutoAPI[]>([]);
  const [sessoes, setSessoes] = useState<StockCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch('/api/etiquetagem/produtos')
      .then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json() as Promise<ProdutoAPI[]>;
      })
      .then(prods => {
        if (cancelled) return;
        setProdutos(prods);
        const built = construirSessoesFromProdutos(prods, config);
        setSessoes(built.length > 0 ? built : criarSessoesPadrao());
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('[Estoque] Falha ao carregar produtos, usando mock:', err.message);
        setError(err.message);
        setProdutos([]);
        setSessoes(criarSessoesPadrao());
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [tick]);

  return { produtos, sessoes, isLoading, error, refetch: () => setTick(t => t + 1) };
}
