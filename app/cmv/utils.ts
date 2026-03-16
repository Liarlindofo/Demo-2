import type { StoreState, FichaTecnica, Insumo, ProductCMV, CMVCalculation, StoreMetrics } from './types';
import { getCMVStatus, getCMVColor } from './constants';

export const calculateCMV = (
  ficha: FichaTecnica,
  insumos: Insumo[]
): CMVCalculation => {
  const custo = ficha.ingredientes.reduce((total, ingrediente) => {
    const insumo = insumos.find(i => i.id === ingrediente.insumoId);
    if (!insumo) return total;
    return total + insumo.precoPorUnidade * ingrediente.quantidade;
  }, 0);

  const cmvPercent = (custo / ficha.precoVenda) * 100;
  const margem = 100 - cmvPercent;

  return { custo, cmvPercent, margem };
};

export const calculateAllProductsCMV = (
  state: StoreState
): ProductCMV[] => {
  return state.fichas.map(ficha => {
    const { custo, cmvPercent, margem } = calculateCMV(ficha, state.insumos);
    const status = getCMVStatus(cmvPercent);

    return {
      produto: ficha.produto,
      custo,
      precoVenda: ficha.precoVenda,
      cmvPercent,
      margem,
      status,
    };
  });
};

export const calculateStoreMetrics = (
  state: StoreState
): StoreMetrics => {
  const productsCMV = calculateAllProductsCMV(state);

  if (productsCMV.length === 0) {
    return {
      cmvMedio: 0,
      melhorProduto: { nome: '-', cmv: 0 },
      piorProduto: { nome: '-', cmv: 0 },
      totalProdutos: 0,
    };
  }

  const cmvMedio = productsCMV.reduce((sum, p) => sum + p.cmvPercent, 0) / productsCMV.length;

  const melhorProduto = productsCMV.reduce((best, current) => 
    current.cmvPercent < best.cmvPercent ? current : best
  );

  const piorProduto = productsCMV.reduce((worst, current) => 
    current.cmvPercent > worst.cmvPercent ? current : worst
  );

  return {
    cmvMedio,
    melhorProduto: { nome: melhorProduto.produto, cmv: melhorProduto.cmvPercent },
    piorProduto: { nome: piorProduto.produto, cmv: piorProduto.cmvPercent },
    totalProdutos: productsCMV.length,
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
