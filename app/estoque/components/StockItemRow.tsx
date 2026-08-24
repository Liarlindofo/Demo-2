'use client';

import { useState, useRef } from 'react';
import { AlertTriangle, MessageSquare, X, Check, Plus, Pencil } from 'lucide-react';
import type { StockItem } from '../types';
import { formatQtd } from '../utils';

const FARDO_OPCOES_BEBIDAS = [
  { size: 1, label: 'un' },
  { size: 6, label: 'fardo 6' },
  { size: 8, label: 'fardo 8' },
  { size: 12, label: 'fardo 12' },
];

const FARDO_OPCOES_EMBALAGENS = [
  { size: 1, label: 'un' },
  { size: 50, label: 'fardo 50' },
];

function getFardoOpcoes(categoriaId: string) {
  if (categoriaId === 'bebidas') return FARDO_OPCOES_BEBIDAS;
  if (categoriaId === 'embalagens') return FARDO_OPCOES_EMBALAGENS;
  return null;
}

interface StockItemRowProps {
  item: StockItem;
  categoriaId: string;
  onQuantidade: (categoriaId: string, insumoId: string, qty: number | null) => void;
  onObservacao: (categoriaId: string, insumoId: string, obs: string) => void;
}

export function StockItemRow({ item, categoriaId, onQuantidade, onObservacao }: StockItemRowProps) {
  // ── Todos os hooks no topo ─────────────────────────────────────────────────
  const [showObs, setShowObs] = useState(!!item.observacao);
  const [obsLocal, setObsLocal] = useState(item.observacao ?? '');
  const [addValue, setAddValue] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [contarEmKgLocal, setContarEmKgLocal] = useState(false);
  const [fardoIdx, setFardoIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Derivações ─────────────────────────────────────────────────────────────
  const contado = item.quantidadeContada !== null;
  const abaixoMinimo =
    contado &&
    item.estoqueMinimo !== undefined &&
    item.quantidadeContada! < item.estoqueMinimo;

  const modoUnidade = item.modoContagem === 'unidade';
  const kgPorUn = item.kgPorUnidade ?? 1;
  const puroUnidade = modoUnidade && !item.kgPorUnidade;
  const isItemUnidade = item.unidade === 'un';
  // Toggle kg/un: disponível para itens configurados como "unidade" com fator de conversão
  const hasKgConversion = modoUnidade && !!item.kgPorUnidade;
  const contarEmKg = hasKgConversion && contarEmKgLocal;

  const fardoOpcoes = getFardoOpcoes(categoriaId);
  const hasFardoToggle = !!fardoOpcoes && !hasKgConversion;
  const fardoSize = hasFardoToggle ? fardoOpcoes[fardoIdx % fardoOpcoes.length].size : 1;
  const fardoLabel = hasFardoToggle ? fardoOpcoes[fardoIdx % fardoOpcoes.length].label : 'un';
  const contarEmFardo = hasFardoToggle && fardoSize > 1;

  const unidadeDisplay = (modoUnidade && item.kgPorUnidade) ? 'kg' : item.unidade;
  const inputUnidade = contarEmKg
    ? 'kg'
    : contarEmFardo
    ? fardoLabel
    : modoUnidade || isItemUnidade
    ? 'un'
    : item.unidade;

  const cycleFardo = () => {
    if (!fardoOpcoes) return;
    setFardoIdx(i => (i + 1) % fardoOpcoes.length);
    setAddValue('');
  };

  const handleAdicionar = () => {
    const num = parseFloat(addValue.replace(',', '.'));
    if (isNaN(num) || num < 0) return;
    // Fardo: multiplica diretamente em unidades
    if (contarEmFardo) {
      const novoTotal = (item.quantidadeContada ?? 0) + num * fardoSize;
      onQuantidade(categoriaId, item.insumoId, novoTotal);
    } else if (contarEmKg) {
      // Embalagem aberta: digita diretamente em kg
      const novoTotal = parseFloat(((item.quantidadeContada ?? 0) + num).toFixed(3));
      onQuantidade(categoriaId, item.insumoId, novoTotal);
    } else {
      const qtdBase = modoUnidade ? num * kgPorUn : num;
      const qtdAdicionada = puroUnidade ? num : qtdBase;
      const novoTotal = parseFloat(((item.quantidadeContada ?? 0) + qtdAdicionada).toFixed(3));
      onQuantidade(categoriaId, item.insumoId, novoTotal);
    }
    setAddValue('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') editMode ? handleSalvarEdicao() : handleAdicionar();
    if (e.key === 'Escape' && editMode) handleCancelarEdicao();
  };

  const handleObsBlur = () => {
    onObservacao(categoriaId, item.insumoId, obsLocal);
  };

  const handleEditarTotal = () => {
    // Preenche o input com o valor atual armazenado e entra no modo edição
    setAddValue(item.quantidadeContada !== null ? String(item.quantidadeContada) : '');
    setEditMode(true);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 50);
  };

  const handleSalvarEdicao = () => {
    const num = parseFloat(addValue.replace(',', '.'));
    if (isNaN(num) || num < 0) return;
    // Substitui o valor diretamente (sem somar)
    onQuantidade(categoriaId, item.insumoId, parseFloat(num.toFixed(3)));
    setAddValue('');
    setEditMode(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCancelarEdicao = () => {
    setAddValue('');
    setEditMode(false);
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
            {/* Badge / toggle de modo de contagem */}
            {hasKgConversion ? (
              // Toggle clicável: alterna entre contar em un ou kg direto (embalagem aberta)
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setContarEmKgLocal(v => !v); setAddValue(''); }}
                className={`cursor-pointer inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all active:scale-95 ${
                  contarEmKg
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30'
                }`}
              >
                {contarEmKg ? '⚖ kg' : '# un'}
                <span className="text-[9px] opacity-60 ml-0.5">trocar</span>
              </button>
            ) : hasFardoToggle ? (
              // Toggle clicável: cicla entre unidade e fardos (bebidas / embalagens)
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); cycleFardo(); }}
                className={`cursor-pointer inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all active:scale-95 ${
                  contarEmFardo
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-blue-500/30'
                }`}
              >
                # {fardoLabel}
                <span className="text-[9px] opacity-60 ml-0.5">trocar</span>
              </button>
            ) : !isItemUnidade && (
              // Badge estático (sem conversão)
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
            {/* Conversão de fardo */}
            {contarEmFardo && (
              <span className="text-[10px] text-gray-600">
                1 fardo = {fardoSize} un
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
            {contarEmFardo && (
              <p className="text-xs text-gray-600 leading-tight">
                {formatQtd(item.quantidadeContada! / fardoSize)} fardo{item.quantidadeContada! / fardoSize !== 1 ? 's' : ''} de {fardoSize}
              </p>
            )}
          </div>
        )}

        {/* Botão editar */}
        {contado && (
          <button
            onClick={handleEditarTotal}
            title="Editar valor"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
              editMode
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-[#2a2a2e] text-gray-500 hover:bg-amber-500/10 hover:text-amber-400'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
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

      {/* ── Campo de adição / edição ──────────────────────────────────────── */}
      {editMode && (
        <div className="px-3 pb-1">
          <p className="text-xs text-amber-400 flex items-center gap-1">
            <Pencil className="w-3 h-3" />
            Editando — digite o valor correto e confirme
          </p>
        </div>
      )}
      <div className="flex gap-2 px-3 pb-3">
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          min="0"
          step={puroUnidade || hasFardoToggle ? '1' : '0.1'}
          value={addValue || ''}
          onChange={e => setAddValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            editMode
              ? `novo valor em ${unidadeDisplay}`
              : contado
              ? `+ adicionar ${inputUnidade}`
              : `quantidade em ${inputUnidade}`
          }
          className={`flex-1 bg-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors ${
            editMode
              ? 'border-2 border-amber-500/60 focus:border-amber-500'
              : 'border border-[#374151] focus:border-amber-500/60'
          }`}
        />
        {editMode ? (
          <>
            <button
              onClick={handleCancelarEdicao}
              className="w-10 flex items-center justify-center rounded-xl bg-[#2a2a2e] text-gray-400 hover:text-white transition-colors shrink-0"
              title="Cancelar edição"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleSalvarEdicao}
              disabled={addValue === ''}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                addValue !== ''
                  ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black'
                  : 'bg-[#2a2a2e] text-gray-600 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              Salvar
            </button>
          </>
        ) : (
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
            {contado ? 'Somar' : 'Add'} {inputUnidade}
          </button>
        )}
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
