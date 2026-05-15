'use client';

import { useState, useEffect, useCallback } from 'react';

const CONFIG_KEY = 'plateful_estoque_config';
const ORDER_KEY = 'plateful_estoque_produto_order';

export interface ProdutoConfig {
  ativo: boolean;
  estoqueMinimo?: number;
  modoContagem?: 'kg' | 'unidade';
  kgPorUnidade?: number;
}

export type EstoqueConfigMap = Record<string, ProdutoConfig>;

function carregar(): EstoqueConfigMap {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function salvar(config: EstoqueConfigMap) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch { /* quota */ }
}

function carregarOrdem(): string[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function salvarOrdem(order: string[]) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch { /* quota */ }
}

export function useEstoqueConfig() {
  const [config, setConfig] = useState<EstoqueConfigMap>({});
  const [productOrder, setProductOrderState] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConfig(carregar());
    setProductOrderState(carregarOrdem());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) salvar(config);
  }, [config, hydrated]);

  useEffect(() => {
    if (hydrated) salvarOrdem(productOrder);
  }, [productOrder, hydrated]);

  /** Retorna a config de um produto; padrão = ativo com mínimo indefinido */
  const getConfig = useCallback(
    (insumoId: string): ProdutoConfig =>
      config[insumoId] ?? { ativo: true, estoqueMinimo: undefined },
    [config],
  );

  const setAtivo = useCallback((insumoId: string, ativo: boolean) => {
    setConfig(prev => ({
      ...prev,
      [insumoId]: { ...(prev[insumoId] ?? {}), ativo },
    }));
  }, []);

  const setMinimo = useCallback((insumoId: string, minimo: number | undefined) => {
    setConfig(prev => ({
      ...prev,
      [insumoId]: { ...(prev[insumoId] ?? { ativo: true }), estoqueMinimo: minimo },
    }));
  }, []);

  const setModoContagem = useCallback((insumoId: string, modo: 'kg' | 'unidade') => {
    setConfig(prev => ({
      ...prev,
      [insumoId]: { ...(prev[insumoId] ?? { ativo: true }), modoContagem: modo },
    }));
  }, []);

  const setKgPorUnidade = useCallback((insumoId: string, kg: number | undefined) => {
    setConfig(prev => ({
      ...prev,
      [insumoId]: { ...(prev[insumoId] ?? { ativo: true }), kgPorUnidade: kg },
    }));
  }, []);

  const setProductOrder = useCallback((order: string[]) => {
    setProductOrderState(order);
  }, []);

  /** Move produto uma posição acima na ordem global */
  const moverProdutoAcima = useCallback((produtoId: string, allIds: string[]) => {
    setProductOrderState(prev => {
      // Garante que todos os IDs estejam na ordem
      const ordem = allIds.map(id => {
        const idx = prev.indexOf(id);
        return { id, idx: idx === -1 ? 9999 : idx };
      });
      ordem.sort((a, b) => a.idx - b.idx);
      const ids = ordem.map(o => o.id);

      const pos = ids.indexOf(produtoId);
      if (pos <= 0) return prev;
      const nova = [...ids];
      [nova[pos - 1], nova[pos]] = [nova[pos], nova[pos - 1]];
      return nova;
    });
  }, []);

  /** Move produto uma posição abaixo na ordem global */
  const moverProdutoAbaixo = useCallback((produtoId: string, allIds: string[]) => {
    setProductOrderState(prev => {
      const ordem = allIds.map(id => {
        const idx = prev.indexOf(id);
        return { id, idx: idx === -1 ? 9999 : idx };
      });
      ordem.sort((a, b) => a.idx - b.idx);
      const ids = ordem.map(o => o.id);

      const pos = ids.indexOf(produtoId);
      if (pos === -1 || pos >= ids.length - 1) return prev;
      const nova = [...ids];
      [nova[pos], nova[pos + 1]] = [nova[pos + 1], nova[pos]];
      return nova;
    });
  }, []);

  return {
    config,
    productOrder,
    hydrated,
    getConfig,
    setAtivo,
    setMinimo,
    setModoContagem,
    setKgPorUnidade,
    setProductOrder,
    moverProdutoAcima,
    moverProdutoAbaixo,
  };
}
