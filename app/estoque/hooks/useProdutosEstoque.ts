'use client';

import type { StockCategory, StockItem } from '../types';
import {
  SESSOES_PADRAO,
  TODOS_PRODUTOS_ESTOQUE,
  type ProdutoEstoque,
} from '../data/mockInsumos';
import type { EstoqueConfigMap } from './useEstoqueConfig';

export type { ProdutoEstoque };

/**
 * Constrói as sessões de contagem a partir da lista definitiva de produtos,
 * aplicando as configurações do usuário (ativo, estoqueMinimo, modo, kg/un).
 * A ordem dos produtos dentro de cada sessão respeita `productOrder` se definido.
 */
export function construirSessoes(
  config: EstoqueConfigMap = {},
  productOrder: string[] = [],
): StockCategory[] {
  return SESSOES_PADRAO.map(sessao => {
    const itens: StockItem[] = sessao.itens
      .filter(item => {
        const cfg = config[item.insumoId];
        return cfg === undefined || cfg.ativo !== false;
      })
      .map(item => {
        const cfg = config[item.insumoId];
        return {
          insumoId: item.insumoId,
          nome: item.nome,
          unidade: item.unidade,
          quantidadeContada: null,
          estoqueMinimo: cfg?.estoqueMinimo,
          modoContagem: cfg?.modoContagem ?? 'kg',
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
      id: sessao.id,
      nome: sessao.nome,
      icone: sessao.icone,
      status: 'pendente' as const,
      itens,
    };
  }).filter(s => s.itens.length > 0);
}

/**
 * Hook que expõe a lista de produtos e sessões do estoque.
 * Usa exclusivamente a lista definitiva do mockInsumos — sem chamadas de API.
 */
export function useProdutosEstoque(
  config: EstoqueConfigMap = {},
  productOrder: string[] = [],
) {
  const sessoes = construirSessoes(config, productOrder);

  return {
    produtos: TODOS_PRODUTOS_ESTOQUE,
    sessoes,
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}
