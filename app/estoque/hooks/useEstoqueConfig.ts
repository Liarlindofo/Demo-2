'use client';

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';

export interface ProdutoConfig {
  ativo: boolean;
  estoqueMinimo?: number;
  modoContagem?: 'kg' | 'unidade';
  kgPorUnidade?: number;
}

export type EstoqueConfigMap = Record<string, ProdutoConfig>;

// ── Helpers de persistência ────────────────────────────────────────────────────

async function fetchConfig(): Promise<{ configs: EstoqueConfigMap; order: string[] }> {
  const res = await fetch('/api/estoque/config');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function patchProduto(produtoId: string, cfg: Partial<ProdutoConfig>) {
  await fetch('/api/estoque/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'produto', produtoId, ...cfg }),
  });
}

async function patchOrdem(order: string[]) {
  await fetch('/api/estoque/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'ordem', order }),
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useEstoqueConfig() {
  const [config, setConfig] = useState<EstoqueConfigMap>({});
  const [productOrder, setProductOrderState] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Ref sempre atualizado com o config mais recente — evita closure stale no debounce
  const configRef = useRef<EstoqueConfigMap>({});
  useLayoutEffect(() => { configRef.current = config; });

  // Debounce refs — evitam request por keystroke
  const debounceMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Carrega do banco na montagem
  useEffect(() => {
    fetchConfig()
      .then(({ configs, order }) => {
        setConfig(configs);
        setProductOrderState(order);
      })
      .catch(err => {
        console.warn('[useEstoqueConfig] Falha ao carregar config:', err.message);
      })
      .finally(() => setHydrated(true));
  }, []);

  // ── Config de produto ────────────────────────────────────────────────────────

  const getConfig = useCallback(
    (insumoId: string): ProdutoConfig =>
      config[insumoId] ?? { ativo: true, estoqueMinimo: undefined },
    [config],
  );

  /** Atualiza campo(s) de um produto localmente e persiste no banco (debounced) */
  const updateProduto = useCallback(
    (insumoId: string, partial: Partial<ProdutoConfig>, debounceMs = 600) => {
      setConfig(prev => ({
        ...prev,
        [insumoId]: { ...(prev[insumoId] ?? { ativo: true }), ...partial },
      }));

      // Usa chave por produto+campo para evitar que uma mudança de campo cancele outra
      const fieldKey = `${insumoId}::${Object.keys(partial).join(',')}`;
      if (debounceMap.current[fieldKey]) {
        clearTimeout(debounceMap.current[fieldKey]);
      }
      debounceMap.current[fieldKey] = setTimeout(() => {
        // Lê configRef.current no momento do disparo para sempre usar o estado mais recente,
        // evitando closure stale e perda de campos salvos em paralelo
        const current = configRef.current[insumoId] ?? { ativo: true };
        patchProduto(insumoId, { ...current, ...partial }).catch(err =>
          console.warn('[useEstoqueConfig] Falha ao salvar config:', err.message),
        );
      }, debounceMs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const setAtivo = useCallback(
    (insumoId: string, ativo: boolean) => updateProduto(insumoId, { ativo }, 0),
    [updateProduto],
  );

  const setMinimo = useCallback(
    (insumoId: string, estoqueMinimo: number | undefined) =>
      updateProduto(insumoId, { estoqueMinimo }),
    [updateProduto],
  );

  const setModoContagem = useCallback(
    (insumoId: string, modoContagem: 'kg' | 'unidade') =>
      updateProduto(insumoId, { modoContagem }, 0),
    [updateProduto],
  );

  const setKgPorUnidade = useCallback(
    (insumoId: string, kgPorUnidade: number | undefined) =>
      updateProduto(insumoId, { kgPorUnidade }),
    [updateProduto],
  );

  // ── Ordem de produtos ────────────────────────────────────────────────────────

  const setProductOrder = useCallback((order: string[]) => {
    setProductOrderState(order);
    patchOrdem(order).catch(err =>
      console.warn('[useEstoqueConfig] Falha ao salvar ordem:', err.message),
    );
  }, []);

  const moverProdutoAcima = useCallback((produtoId: string, allIds: string[]) => {
    setProductOrderState(prev => {
      const ordem = buildOrdem(prev, allIds);
      const pos = ordem.indexOf(produtoId);
      if (pos <= 0) return prev;
      const nova = [...ordem];
      [nova[pos - 1], nova[pos]] = [nova[pos], nova[pos - 1]];
      patchOrdem(nova).catch(() => {});
      return nova;
    });
  }, []);

  const moverProdutoAbaixo = useCallback((produtoId: string, allIds: string[]) => {
    setProductOrderState(prev => {
      const ordem = buildOrdem(prev, allIds);
      const pos = ordem.indexOf(produtoId);
      if (pos === -1 || pos >= ordem.length - 1) return prev;
      const nova = [...ordem];
      [nova[pos], nova[pos + 1]] = [nova[pos + 1], nova[pos]];
      patchOrdem(nova).catch(() => {});
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

// ── Util: garante que todos os IDs aparecem na ordem ────────────────────────────

function buildOrdem(prev: string[], allIds: string[]): string[] {
  const seen = new Set(prev);
  const extra = allIds.filter(id => !seen.has(id));
  return [...prev.filter(id => allIds.includes(id)), ...extra];
}
