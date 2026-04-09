'use client';

import { Package2 } from 'lucide-react';
import type { ComboCMV } from '../types';
import { CMV_COLORS, CMV_META, getStatusLabel } from '../constants';
import { formatCurrency, formatPercent } from '../utils';

interface ComboCardProps {
  combo: ComboCMV;
  onClick: () => void;
}

const STATUS_BADGE_COLORS = {
  otimo: 'bg-green-500/20 text-green-400 border border-green-500/30',
  atencao: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  critico: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

export const ComboCard = ({ combo, onClick }: ComboCardProps) => {
  const cmvColor = CMV_COLORS[combo.status];
  const barWidth = Math.min(100, Math.max(0, combo.margem));
  const metaBarWidth = 100 - CMV_META;
  const semPreco = combo.precoVenda === 0;

  return (
    <div
      onClick={onClick}
      className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 cursor-pointer hover:border-[#3a3a3e] hover:bg-[#202024] transition-all duration-200 select-none"
    >
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-orange-500/15 flex items-center justify-center shrink-0">
            <Package2 className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <h3 className="font-semibold text-white text-sm leading-tight truncate">{combo.nome}</h3>
        </div>
        {!semPreco && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${STATUS_BADGE_COLORS[combo.status]}`}>
            {getStatusLabel(combo.status)}
          </span>
        )}
      </div>

      {/* Descrição */}
      {combo.descricao && (
        <p className="text-xs text-gray-500 mb-2 ml-8 truncate">{combo.descricao}</p>
      )}

      {/* Produtos do combo */}
      <div className="ml-8 mb-3 space-y-1">
        {combo.itens.slice(0, 3).map(item => (
          <div key={item.produto.id} className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-400 truncate">
              {item.quantidade > 1 && (
                <span className="text-orange-400 font-medium mr-1">{item.quantidade}×</span>
              )}
              {item.produto.nome}
            </span>
            <span className="text-xs text-gray-600 shrink-0">{formatCurrency(item.custoItem)}</span>
          </div>
        ))}
        {combo.itens.length > 3 && (
          <p className="text-xs text-gray-600">+{combo.itens.length - 3} produto{combo.itens.length - 3 !== 1 ? 's' : ''}</p>
        )}
        {combo.itens.length === 0 && (
          <p className="text-xs text-gray-600 italic">Nenhum produto adicionado</p>
        )}
      </div>

      {/* Barra de margem */}
      {!semPreco && (
        <div className="relative h-1.5 bg-[#2a2a2e] rounded-full mb-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${barWidth}%`, backgroundColor: cmvColor }}
          />
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500/60"
            style={{ left: `${metaBarWidth}%` }}
          />
        </div>
      )}

      {/* Valores */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Custo total</span>
          <span className="text-white font-medium">{formatCurrency(combo.custoTotal)}</span>
        </div>
        {combo.precoRegular > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Preço regular</span>
            <span className={`font-medium ${combo.economia > 0.01 ? 'text-gray-400 line-through' : 'text-white'}`}>
              {formatCurrency(combo.precoRegular)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Venda combo</span>
          <span className={`font-medium ${semPreco ? 'text-gray-600 italic' : 'text-white'}`}>
            {semPreco ? 'Não definido' : formatCurrency(combo.precoVenda)}
          </span>
        </div>
        {!semPreco && combo.economia > 0.01 && (
          <div className="flex justify-between text-xs">
            <span className="text-green-400">Economia do cliente</span>
            <span className="text-green-400 font-medium">
              -{formatCurrency(combo.economia)} ({((combo.economia / combo.precoRegular) * 100).toFixed(0)}% off)
            </span>
          </div>
        )}
        {!semPreco && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Margem</span>
            <span className="text-white font-medium">{formatPercent(combo.margem)}</span>
          </div>
        )}
      </div>

      {/* CMV grande */}
      <div className="flex items-end justify-between">
        {semPreco ? (
          <span className="text-sm text-gray-600 italic">Defina um preço de venda</span>
        ) : (
          <span className="text-2xl font-bold" style={{ color: cmvColor }}>
            {formatPercent(combo.cmvPercent)}
          </span>
        )}
        <span className="text-xs text-gray-500">
          {combo.itens.length} produto{combo.itens.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};
