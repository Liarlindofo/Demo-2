'use client';

import type { StoreMetrics } from '../types';
import { getCMVColor, CMV_META } from '../constants';
import { formatPercent } from '../utils';

interface MetricCardsProps {
  metrics: StoreMetrics;
  isLoading?: boolean;
}

export const MetricCards = ({ metrics, isLoading }: MetricCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4 animate-pulse">
            <div className="h-3 bg-white/10 rounded mb-3 w-1/2" />
            <div className="h-7 bg-white/10 rounded w-3/4 mb-1" />
            <div className="h-3 bg-white/10 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  const cmvColor = getCMVColor(metrics.cmvMedio);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {/* CMV Médio */}
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
        <p className="text-xs text-gray-400 mb-1">CMV médio</p>
        <p className="text-2xl font-bold" style={{ color: cmvColor }}>
          {metrics.totalProdutos > 0 ? formatPercent(metrics.cmvMedio) : '—'}
        </p>
        <p className="text-xs text-gray-500 mt-1">Meta: {CMV_META}%</p>
      </div>

      {/* Produtos cadastrados */}
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
        <p className="text-xs text-gray-400 mb-1">Produtos cadastrados</p>
        <p className="text-2xl font-bold text-white">{metrics.totalProdutos}</p>
        <p className="text-xs text-gray-500 mt-1">
          {metrics.totalCategorias} {metrics.totalCategorias === 1 ? 'categoria' : 'categorias'}
        </p>
      </div>

      {/* Melhor margem */}
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
        <p className="text-xs text-gray-400 mb-1">Melhor margem</p>
        <p className="text-sm font-semibold text-white truncate" title={metrics.melhorSabor.nome}>
          {metrics.melhorSabor.nome}
        </p>
        <p className="text-xs text-green-400 mt-1">
          {metrics.totalProdutos > 0 ? `CMV ${formatPercent(metrics.melhorSabor.cmv)}` : '—'}
        </p>
      </div>

      {/* Atenção */}
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
        <p className="text-xs text-gray-400 mb-1">Atenção</p>
        <p className={`text-2xl font-bold ${metrics.totalAcimaMeta > 0 ? 'text-red-400' : 'text-white'}`}>
          {metrics.totalAcimaMeta}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {metrics.totalAcimaMeta === 1 ? 'produto acima da meta' : 'produtos acima da meta'}
        </p>
      </div>
    </div>
  );
};
