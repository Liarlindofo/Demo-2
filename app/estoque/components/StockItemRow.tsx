'use client';

import { useState, useRef } from 'react';
import { AlertTriangle, MessageSquare, X, Check } from 'lucide-react';
import type { StockItem } from '../types';

interface StockItemRowProps {
  item: StockItem;
  categoriaId: string;
  onQuantidade: (categoriaId: string, insumoId: string, qty: number | null) => void;
  onObservacao: (categoriaId: string, insumoId: string, obs: string) => void;
}

export function StockItemRow({ item, categoriaId, onQuantidade, onObservacao }: StockItemRowProps) {
  const [showObs, setShowObs] = useState(!!item.observacao);
  const [obsLocal, setObsLocal] = useState(item.observacao ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const abaixoMinimo =
    item.quantidadeContada !== null &&
    item.estoqueMinimo !== undefined &&
    item.quantidadeContada < item.estoqueMinimo;

  const contado = item.quantidadeContada !== null;

  const handleQtdChange = (raw: string) => {
    if (raw === '' || raw === null) {
      onQuantidade(categoriaId, item.insumoId, null);
      return;
    }
    const num = parseFloat(raw.replace(',', '.'));
    if (!isNaN(num) && num >= 0) {
      onQuantidade(categoriaId, item.insumoId, num);
    }
  };

  const handleObsBlur = () => {
    onObservacao(categoriaId, item.insumoId, obsLocal);
  };

  return (
    <div
      className={`rounded-2xl transition-colors ${
        abaixoMinimo
          ? 'bg-amber-500/8 border border-amber-500/30'
          : contado
          ? 'bg-[#1c1c1e] border border-[#2a2a2e]'
          : 'bg-[#141416] border border-[#2a2a2e]'
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Status dot */}
        <div
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            abaixoMinimo
              ? 'bg-amber-400'
              : contado
              ? 'bg-green-500'
              : 'bg-[#374151]'
          }`}
        />

        {/* Nome + unidade */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-tight">{item.nome}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {item.unidade}
            {item.estoqueMinimo !== undefined && (
              <span className="ml-2 text-gray-600">mín: {item.estoqueMinimo}</span>
            )}
          </p>
        </div>

        {/* Alerta */}
        {abaixoMinimo && (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        )}

        {/* Botão de observação */}
        <button
          onClick={() => setShowObs(v => !v)}
          className={`p-2 rounded-lg transition-colors shrink-0 ${
            item.observacao
              ? 'text-amber-400 bg-amber-500/10'
              : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Campo de quantidade — grande e touch-friendly */}
        <div className="relative shrink-0">
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            value={item.quantidadeContada === null ? '' : item.quantidadeContada}
            onChange={e => handleQtdChange(e.target.value)}
            placeholder="—"
            className={`w-24 text-right text-2xl font-bold rounded-xl px-3 py-2 focus:outline-none transition-all
              placeholder:text-[#374151] placeholder:text-xl
              ${
                abaixoMinimo
                  ? 'bg-amber-500/15 border border-amber-500/50 text-amber-300 focus:border-amber-400'
                  : contado
                  ? 'bg-green-500/10 border border-green-500/30 text-green-300 focus:border-green-400'
                  : 'bg-[#2a2a2e] border border-[#374151] text-white focus:border-amber-500/60'
              }`}
          />
          {/* Botão para limpar (voltar para null) */}
          {contado && (
            <button
              onClick={() => onQuantidade(categoriaId, item.insumoId, null)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#374151] text-gray-400 flex items-center justify-center hover:bg-red-500/30 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Observação inline */}
      {showObs && (
        <div className="px-3 pb-3 pt-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={obsLocal}
              onChange={e => setObsLocal(e.target.value)}
              onBlur={handleObsBlur}
              placeholder="Observação…"
              className="flex-1 bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
            />
            <button
              onClick={() => {
                handleObsBlur();
                setShowObs(false);
              }}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Alerta de mínimo */}
      {abaixoMinimo && (
        <div className="px-3 pb-3">
          <p className="text-xs text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Abaixo do mínimo ({item.estoqueMinimo} {item.unidade})
          </p>
        </div>
      )}
    </div>
  );
}
