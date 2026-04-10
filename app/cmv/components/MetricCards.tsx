'use client';

import type { StoreMetrics } from '../types';
import { getCMVColor, CMV_META } from '../constants';
import { formatPercent } from '../utils';

interface MetricCardsProps {
  metrics: StoreMetrics;
  isLoading?: boolean;
  /** Define rótulos e contexto: produtos (Sabores/Todos) ou combos. */
  variant?: 'produtos' | 'combos';
}

const cmvLinhaMelhorPior = (
  variant: 'produtos' | 'combos',
  cmv: number,
  temItens: boolean,
) => {
  if (!temItens) return '—';
  const pct = formatPercent(cmv);
  return variant === 'combos' ? `CMV ${pct}` : `CMV médio ${pct}`;
};

export const MetricCards = ({ metrics, isLoading, variant = 'produtos' }: MetricCardsProps) => {
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

      {/* Produtos ou combos cadastrados */}
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
        <p className="text-xs text-gray-400 mb-1">
          {variant === 'combos' ? 'Combos cadastrados' : 'Produtos cadastrados'}
        </p>
        <p className="text-2xl font-bold text-white">{metrics.totalProdutos}</p>
        <p className="text-xs text-gray-500 mt-1">
          {variant === 'combos'
            ? (metrics.totalProdutos === 1 ? 'combo no catálogo' : 'combos no catálogo')
            : `${metrics.totalCategorias} ${metrics.totalCategorias === 1 ? 'categoria' : 'categorias'}`}
        </p>
      </div>

      {/* Melhor margem (produto ou combo com menor CMV) */}
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
        <p className="text-xs text-gray-400 mb-1">
          {variant === 'combos' ? 'Melhor combo' : 'Melhor margem'}
        </p>
        <p className="text-sm font-semibold text-white truncate" title={metrics.melhorSabor.nome}>
          {metrics.melhorSabor.nome}
        </p>
        <p className="text-xs mt-1" style={{ color: getCMVColor(metrics.melhorSabor.cmv) }}>
          {cmvLinhaMelhorPior(variant, metrics.melhorSabor.cmv, metrics.totalProdutos > 0)}
        </p>
      </div>

      {/* Pior margem (maior CMV médio do sabor ou do combo) */}
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
        <p className="text-xs text-gray-400 mb-1">
          {variant === 'combos' ? 'Pior combo' : 'Pior margem'}
        </p>
        <p className="text-sm font-semibold text-white truncate" title={metrics.piorSabor.nome}>
          {metrics.piorSabor.nome}
        </p>
        <p className="text-xs mt-1" style={{ color: getCMVColor(metrics.piorSabor.cmv) }}>
          {cmvLinhaMelhorPior(variant, metrics.piorSabor.cmv, metrics.totalProdutos > 0)}
        </p>
      </div>
    </div>
  );
};
