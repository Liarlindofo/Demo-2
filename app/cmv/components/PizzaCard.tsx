'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Pencil, Check, X } from 'lucide-react';
import type { ProductCMV } from '../types';
import { CMV_COLORS, CMV_META, getStatusLabel } from '../constants';
import { formatCurrency, formatPercent } from '../utils';

interface PizzaCardProps {
  product: ProductCMV;
  onClick: () => void;
  selectMode?: boolean;
  selected?: boolean;
  onClone?: () => void;
  onRename?: (newName: string) => void;
}

const STATUS_BADGE_COLORS = {
  otimo: 'bg-green-500/20 text-green-400 border border-green-500/30',
  atencao: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  critico: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const BEBIDA_COLOR = '#06b6d4'; // cyan-500

export const PizzaCard = ({ product, onClick, selectMode, selected, onClone, onRename }: PizzaCardProps) => {
  const isBebida = product.tipoPrecificacao === 'bebidas';
  const cmvColor = isBebida ? BEBIDA_COLOR : CMV_COLORS[product.status];
  const barWidth = Math.min(100, Math.max(0, product.margem));
  const metaBarWidth = 100 - CMV_META;

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(product.nome);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      setRenameValue(product.nome);
      setTimeout(() => inputRef.current?.select(), 10);
    }
  }, [isRenaming, product.nome]);

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== product.nome) {
      onRename?.(trimmed);
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setRenameValue(product.nome);
    setIsRenaming(false);
  };

  const handleCardClick = () => {
    if (isRenaming) return;
    onClick();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-[#1c1c1e] border rounded-2xl p-5 transition-all duration-200 select-none ${
        selectMode
          ? selected
            ? 'border-red-500/60 bg-red-500/5 cursor-pointer'
            : 'border-[#2a2a2e] hover:border-red-500/30 cursor-pointer'
          : 'border-[#2a2a2e] hover:border-[#3a3a3e] hover:bg-[#202024] cursor-pointer'
      }`}
    >
      {/* Cabeçalho: Nome + Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <div
              className="flex items-center gap-1"
              onClick={e => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') cancelRename();
                }}
                className="flex-1 bg-[#141416] border border-orange-500/50 rounded-lg px-2 py-0.5 text-sm text-white font-semibold focus:outline-none focus:border-orange-500 min-w-0"
                autoComplete="off"
              />
              <button
                onClick={commitRename}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={cancelRename}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-[#2a2a2e] hover:bg-[#333] text-gray-400 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h3 className="font-semibold text-white text-sm leading-tight">{product.nome}</h3>
          )}
          <p className="text-xs text-gray-500 mt-1 truncate" title={product.categoria}>
            {product.categoria}
          </p>
        </div>
        {isBebida ? (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
            Bebida
          </span>
        ) : (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${STATUS_BADGE_COLORS[product.status]}`}>
            {getStatusLabel(product.status)}
          </span>
        )}
      </div>

      {/* Barra de margem */}
      <div className="relative h-1.5 bg-[#2a2a2e] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${barWidth}%`, backgroundColor: cmvColor }}
        />
        {!isBebida && (
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500/60"
            style={{ left: `${metaBarWidth}%` }}
          />
        )}
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
        <span className="text-2xl font-bold" style={{ color: cmvColor }}>
          {formatPercent(product.cmvPercent)}
        </span>
        <span className="text-xs text-gray-500">
          {product.numIngredientes} ingr.
        </span>
      </div>

      {/* Ações rápidas — aparecem no hover (apenas fora do modo seleção) */}
      {!selectMode && !isRenaming && (onClone || onRename) && (
        <div
          className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          {onRename && (
            <button
              title="Renomear produto"
              onClick={() => setIsRenaming(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2a2a2e] hover:bg-orange-500/20 hover:text-orange-400 text-gray-400 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onClone && (
            <button
              title="Clonar produto"
              onClick={onClone}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2a2a2e] hover:bg-blue-500/20 hover:text-blue-400 text-gray-400 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
