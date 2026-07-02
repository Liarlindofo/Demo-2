'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StockCategory, StockItem } from '../types';
import type { EstoqueConfigMap } from './useEstoqueConfig';

export interface ProdutoEstoque {
  id: string;        // DB id (cuid)
  insumoId: string;  // slug identificador
  nome: string;
  unidade: string;
  sessaoId: string;
  sessaoNome: string;
  sessaoIcone: string;
}

interface EstoqueInsumoDb {
  id: string;
  insumoId: string;
  nome: string;
  unidade: string;
  categoriaId: string;
  categoriaNome: string;
  categoriaIcone: string;
}

async function fetchInsumos(): Promise<EstoqueInsumoDb[]> {
  const res = await fetch('/api/estoque/insumos');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Constrói sessões de contagem a partir dos insumos vindos do banco,
// aplicando config do usuário (ativo, estoqueMinimo, modo, kg/un).
export function construirSessoes(
  insumos: ProdutoEstoque[],
  config: EstoqueConfigMap = {},
  productOrder: string[] = [],
): StockCategory[] {
  // Agrupa por categoria
  const categorias = new Map<string, { nome: string; icone: string; itens: ProdutoEstoque[] }>();
  for (const p of insumos) {
    if (!categorias.has(p.sessaoId)) {
      categorias.set(p.sessaoId, { nome: p.sessaoNome, icone: p.sessaoIcone, itens: [] });
    }
    categorias.get(p.sessaoId)!.itens.push(p);
  }

  return Array.from(categorias.entries())
    .map(([categoriaId, cat]) => {
      const itens: StockItem[] = cat.itens
        .filter(p => {
          const cfg = config[p.insumoId];
          return cfg === undefined || cfg.ativo !== false;
        })
        .map(p => {
          const cfg = config[p.insumoId];
          return {
            insumoId: p.insumoId,
            nome: p.nome,
            unidade: p.unidade,
            quantidadeContada: null,
            estoqueMinimo: cfg?.estoqueMinimo,
            modoContagem: cfg?.modoContagem ?? (p.unidade === 'un' ? 'unidade' : 'kg'),
            kgPorUnidade: cfg?.kgPorUnidade,
            observacao: undefined,
          };
        })
        .sort((a, b) => {
          if (productOrder.length === 0) return 0;
          const ia = productOrder.indexOf(a.insumoId);
          const ib = productOrder.indexOf(b.insumoId);
          if (ia === -1 && ib === -1) return 0;
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        });

      return {
        id: categoriaId,
        nome: cat.nome,
        icone: cat.icone,
        status: 'pendente' as const,
        itens,
      };
    })
    .filter(s => s.itens.length > 0);
}

export function useProdutosEstoque(
  config: EstoqueConfigMap = {},
  productOrder: string[] = [],
) {
  const [insumos, setInsumos] = useState<ProdutoEstoque[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchInsumos();
      setInsumos(
        data.map(p => ({
          id: p.id,
          insumoId: p.insumoId,
          nome: p.nome,
          unidade: p.unidade,
          sessaoId: p.categoriaId,
          sessaoNome: p.categoriaNome,
          sessaoIcone: p.categoriaIcone,
        })),
      );
    } catch (err) {
      console.error('[useProdutosEstoque]', err);
      setError('Não foi possível carregar os produtos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sessoes = construirSessoes(insumos, config, productOrder);

  return {
    produtos: insumos,
    sessoes,
    isLoading,
    error,
    refetch: load,
  };
}
