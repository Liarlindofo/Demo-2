'use client';

import { useState, useRef } from 'react';
import { AlertTriangle, MessageSquare, X, Check, Plus } from 'lucide-react';
import type { StockItem } from '../types';
import { formatQtd } from '../utils';

interface StockItemRowProps {
  item: StockItem;
  categoriaId: string;
  onQuantidade: (categoriaId: string, insumoId: string, qty: number | null) => void;
  onObservacao: (categoriaId: string, insumoId: string, obs: string) => void;
  fardoSize?: number;
}

export function StockItemRow({ item, categoriaId, onQuantidade, onObservacao, fardoSize = 1 }: StockItemRowProps) {
  const [showObs, setShowObs] = useState(!!item.observacao);
  const [obsLocal, setObsLocal] = useState(item.observacao ?? '');
  const [addValue, setAddValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const contado = item.quantidadeContada !== null;
  const abaixoMinimo =
    contado &&
    item.estoqueMinimo !== undefined &&
    item.quantidadeContada! < item.estoqueMinimo;

  const modoUnidade = item.modoContagem === 'unidade';
  const kgPorUn = item.kgPorUnidade ?? 1;
  const puroUnidade = modoUnidade && !item.kgPorUnidade;
  const unidadeDisplay = (modoUnidade && item.kgPorUnidade) ? 'kg' : item.unidade;

  const handleAdicionar = () => {
    const num = parseFloat(addValue.replace(',', '.'));
    if (isNaN(num) || num < 0) return;
    const qtdBase = modoUnidade ? num * kgPorUn : num;
    const qtdAdicionada = puroUnidade ? num * fardoSize : qtdBase;
    const novoTotal = parseFloat(((item.quantidadeContada ?? 0) + qtdAdicionada).toFixed(3));
    onQuantidade(categoriaId, item.insumoId, novoTotal);
    setAddValue('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdicionar();
  };

  const handleObsBlur = () => {
    onObservacao(categoriaId, item.insumoId, obsLocal);
  };

  const handleReset = () => {
    onQuantidade(categoriaId, item.insumoId, null);
    setAddValue('');
  };

  return (
    <div
      className={`rounded-2xl transition-colors ${
        abaixoMinimo
          ? 'bg-amber-500/8 border border-amber-500/30'
          : contado
          ? 'bg-[#1c1c1e] border border-green-500/20'
          : 'bg-[#141416] border border-[#2a2a2e]'
      }`}
    >
      {/* ── Linha principal ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
        {/* Status dot */}
        <div
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            abaixoMinimo ? 'bg-amber-400' : contado ? 'bg-green-500' : 'bg-[#374151]'
          }`}
        />

        {/* Nome + unidade */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-tight">{item.nome}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {/* Badge de modo de contagem — só exibe para kg ou quando há conversão */}
            {!puroUnidade && (
              modoUnidade ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/20">
                  contar em unidade
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  contar em kg
                </span>
              )
            )}
            {/* Conversão (quando modo unidade com fator kg) */}
            {modoUnidade && item.kgPorUnidade && (
              <span className="text-[10px] text-gray-600">
                1 un = {item.kgPorUnidade} kg
              </span>
            )}
            {/* Mínimo */}
            {item.estoqueMinimo !== undefined && (
              <span className="text-[10px] text-gray-600">mín: {item.estoqueMinimo} {unidadeDisplay}</span>
            )}
          </div>
        </div>

        {/* Alerta */}
        {abaixoMinimo && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}

        {/* Total acumulado */}
        {contado && (
          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-1">
              <span
                className={`text-xl font-bold ${
                  abaixoMinimo ? 'text-amber-300' : 'text-green-300'
                }`}
              >
                {formatQtd(item.quantidadeContada)}
              </span>
              <span className="text-xs text-gray-500">{unidadeDisplay}</span>
            </div>
            {modoUnidade && item.kgPorUnidade && (
              <p className="text-xs text-gray-600 leading-tight">
                ≈ {formatQtd(item.quantidadeContada! / kgPorUn)} un
              </p>
            )}
            {puroUnidade && fardoSize > 1 && (
              <p className="text-xs text-gray-600 leading-tight">
                {formatQtd(item.quantidadeContada! / fardoSize)} fardo{item.quantidadeContada! / fardoSize !== 1 ? 's' : ''} de {fardoSize}
              </p>
            )}
          </div>
        )}

        {/* Botão reset */}
        {contado && (
          <button
            onClick={handleReset}
            title="Zerar contagem"
            className="w-7 h-7 rounded-lg bg-[#2a2a2e] text-gray-500 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Botão de observação */}
        <button
          onClick={() => setShowObs(v => !v)}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
            item.observacao
              ? 'text-amber-400 bg-amber-500/10'
              : 'text-gray-600 hover:text-gray-400 hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Campo de adição ───────────────────────────────────────────────── */}
      <div className="flex gap-2 px-3 pb-3">
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          min="0"
          step={puroUnidade ? '1' : '0.1'}
          value={addValue}
          onChange={e => setAddValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            puroUnidade
              ? fardoSize > 1
                ? contado ? `+ fardo de ${fardoSize}` : `qtd em fardos de ${fardoSize}`
                : contado ? `+ adicionar ${item.unidade}` : `quantidade em ${item.unidade}`
              : modoUnidade
              ? contado ? '+ adicionar un' : 'quantidade em un'
              : contado ? `+ adicionar ${item.unidade}` : `quantidade em ${item.unidade}`
          }
          className="flex-1 bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60 transition-colors"
        />
        <button
          onClick={handleAdicionar}
          disabled={addValue === ''}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            addValue !== ''
              ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black'
              : 'bg-[#2a2a2e] text-gray-600 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" />
          {contado ? 'Somar' : 'Add'}{puroUnidade && fardoSize > 1 ? ` fardo ${fardoSize}` : ` ${unidadeDisplay}`}
        </button>
      </div>

      {/* ── Observação inline ─────────────────────────────────────────────── */}
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
              onClick={() => { handleObsBlur(); setShowObs(false); }}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Alerta de mínimo ──────────────────────────────────────────────── */}
      {abaixoMinimo && (
        <div className="px-3 pb-3">
          <p className="text-xs text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Abaixo do mínimo ({formatQtd(item.estoqueMinimo ?? null)} {unidadeDisplay})
          </p>
        </div>
      )}
    </div>
  );
}
