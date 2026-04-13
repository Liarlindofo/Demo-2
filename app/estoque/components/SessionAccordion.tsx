'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import type { StockCategory } from '../types';
import { StockItemRow } from './StockItemRow';

interface SessionAccordionProps {
  categoria: StockCategory;
  isActive: boolean;
  onToggle: () => void;
  onQuantidade: (categoriaId: string, insumoId: string, qty: number | null) => void;
  onObservacao: (categoriaId: string, insumoId: string, obs: string) => void;
  onConcluir: () => void;
  onReabrir: () => void;
  onProxima?: () => void;
}

export function SessionAccordion({
  categoria,
  isActive,
  onToggle,
  onQuantidade,
  onObservacao,
  onConcluir,
  onReabrir,
  onProxima,
}: SessionAccordionProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const concluida = categoria.status === 'concluida';

  const totalItens = categoria.itens.length;
  const contados = categoria.itens.filter(i => i.quantidadeContada !== null).length;
  const alertas = categoria.itens.filter(
    i =>
      i.quantidadeContada !== null &&
      i.estoqueMinimo !== undefined &&
      i.quantidadeContada < i.estoqueMinimo,
  ).length;

  const handleConcluir = () => {
    onConcluir();
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        concluida
          ? 'border-green-500/30 bg-green-500/5'
          : isActive
          ? 'border-amber-500/40 bg-[#1c1c1e]'
          : 'border-[#2a2a2e] bg-[#1c1c1e]'
      }`}
    >
      {/* Header do accordion */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* Ícone de status */}
        {concluida ? (
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
        ) : (
          <Circle className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-400' : 'text-gray-600'}`} />
        )}

        {/* Emoji da sessão */}
        <span className="text-xl shrink-0">{categoria.icone}</span>

        {/* Nome */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${concluida ? 'text-green-400' : 'text-white'}`}>
            {categoria.nome}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {concluida
              ? `${totalItens} itens contados`
              : `${contados}/${totalItens} contados`}
            {alertas > 0 && (
              <span className="ml-2 text-amber-400">⚠ {alertas} alerta{alertas > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 shrink-0">
          {!concluida && contados > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-400 rounded-full px-2 py-0.5 font-medium">
              {contados}/{totalItens}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isActive ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Conteúdo expandido */}
      {isActive && (
        <div className="px-4 pb-4 space-y-2">
          {/* Celebração ao concluir */}
          {showCelebration && (
            <div className="bg-green-500/15 border border-green-500/30 rounded-xl p-3 text-center animate-pulse">
              <p className="text-green-400 font-semibold text-sm">✅ Sessão concluída!</p>
            </div>
          )}

          {/* Itens */}
          {categoria.itens.map(item => (
            <StockItemRow
              key={item.insumoId}
              item={item}
              categoriaId={categoria.id}
              onQuantidade={onQuantidade}
              onObservacao={onObservacao}
            />
          ))}

          {/* Ações */}
          <div className="pt-2 flex gap-2">
            {concluida ? (
              <button
                onClick={onReabrir}
                className="flex-1 py-3 rounded-xl border border-[#374151] text-sm text-gray-400 hover:text-white hover:border-[#4a4a50] transition-colors font-medium"
              >
                Reabrir sessão
              </button>
            ) : (
              <button
                onClick={handleConcluir}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-semibold transition-colors"
              >
                ✓ Concluir sessão
              </button>
            )}
            {onProxima && (
              <button
                onClick={onProxima}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#374151] text-sm text-gray-400 hover:text-white hover:border-amber-500/50 transition-colors font-medium shrink-0"
              >
                Próxima
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
