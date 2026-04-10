'use client';

import type { ProductCMV } from '../types';
import { CMV_COLORS, CMV_META, getStatusLabel } from '../constants';
import { formatCurrency, formatPercent } from '../utils';

interface PizzaCardProps {
  product: ProductCMV;
  onClick: () => void;
}

const STATUS_BADGE_COLORS = {
  otimo: 'bg-green-500/20 text-green-400 border border-green-500/30',
  atencao: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  critico: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export const PizzaCard = ({ product, onClick }: PizzaCardProps) => {
  const cmvColor = CMV_COLORS[product.status];
  // Barra representa a margem: mais margem = barra mais cheia
  const barWidth = Math.min(100, Math.max(0, product.margem));
  // Largura da barra de referência da meta
  const metaBarWidth = 100 - CMV_META;

  return (
    <div
      onClick={onClick}
      className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 cursor-pointer hover:border-[#3a3a3e] hover:bg-[#202024] transition-all duration-200 select-none"
    >
      {/* Cabeçalho: Nome + Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm leading-tight">{product.nome}</h3>
          <p className="text-xs text-gray-500 mt-1 truncate" title={product.categoria}>
            {product.categoria}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${STATUS_BADGE_COLORS[product.status]}`}>
          {getStatusLabel(product.status)}
        </span>
      </div>

      {/* Barra de margem */}
      <div className="relative h-1.5 bg-[#2a2a2e] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${barWidth}%`, backgroundColor: cmvColor }}
        />
        {/* Indicador da meta */}
        <div
          className="absolute top-0 bottom-0 w-px bg-red-500/60"
          style={{ left: `${metaBarWidth}%` }}
        />
      </div>

      {/* Detalhes */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Custo</span>
          <span className="text-white font-medium">{formatCurrency(product.custo)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Venda</span>
          <span className="text-white font-medium">{formatCurrency(product.precoVenda)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Margem</span>
          <span className="text-white font-medium">{formatPercent(product.margem)}</span>
        </div>
      </div>

      {/* CMV e ingredientes */}
      <div className="flex items-end justify-between">
        <span
          className="text-2xl font-bold"
          style={{ color: cmvColor }}
        >
          {formatPercent(product.cmvPercent)}
        </span>
        <span className="text-xs text-gray-500">
          {product.numIngredientes} ingr.
        </span>
      </div>
    </div>
  );
};
