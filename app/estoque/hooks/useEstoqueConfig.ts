'use client';

import { useState, useEffect, useCallback } from 'react';

const CONFIG_KEY = 'plateful_estoque_config';

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

export function useEstoqueConfig() {
  const [config, setConfig] = useState<EstoqueConfigMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConfig(carregar());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) salvar(config);
  }, [config, hydrated]);

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

  return { config, hydrated, getConfig, setAtivo, setMinimo, setModoContagem, setKgPorUnidade };
}
