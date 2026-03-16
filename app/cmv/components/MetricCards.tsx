'use client';

import type { StoreMetrics } from '../types';
import { formatPercent, getCMVColor, getCMVStatus } from '../constants';

interface MetricCardsProps {
  metrics: StoreMetrics;
  isLoading?: boolean;
}

export const MetricCards = ({ metrics, isLoading }: MetricCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 animate-pulse"
          >
            <div className="h-4 bg-white/10 rounded mb-2 w-1/2"></div>
            <div className="h-8 bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const cmvStatus = getCMVStatus(metrics.cmvMedio);
  const cmvColor = getCMVColor(metrics.cmvMedio);

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {/* CMV Médio */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-1">CMV Médio</p>
        <p className="text-2xl font-bold" style={{ color: cmvColor }}>
          {formatPercent(metrics.cmvMedio)}
        </p>
      </div>

      {/* Melhor Produto */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-1">Melhor Produto</p>
        <p className="text-lg font-semibold text-white truncate">
          {metrics.melhorProduto.nome}
        </p>
        <p className="text-sm text-green-500">
          {formatPercent(metrics.melhorProduto.cmv)}
        </p>
      </div>

      {/* Pior Produto */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-1">Pior Produto</p>
        <p className="text-lg font-semibold text-white truncate">
          {metrics.piorProduto.nome}
        </p>
        <p className="text-sm text-red-500">
          {formatPercent(metrics.piorProduto.cmv)}
        </p>
      </div>

      {/* Total de Produtos */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
        <p className="text-sm text-gray-400 mb-1">Total de Produtos</p>
        <p className="text-2xl font-bold text-white">
          {metrics.totalProdutos}
        </p>
      </div>
    </div>
  );
};
