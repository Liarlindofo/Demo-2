'use client';

import { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ChevronLeft } from 'lucide-react';
import type { StockSession } from '../types';
import { LOJA_LABELS } from '../types';
import { ProgressBar } from '../components/ProgressBar';
import { SessionAccordion } from '../components/SessionAccordion';

interface ContagemProps {
  session: StockSession;
  onFechar: () => void;
  onQuantidade: (categoriaId: string, insumoId: string, qty: number | null) => void;
  onObservacao: (categoriaId: string, insumoId: string, obs: string) => void;
  onConcluirCategoria: (categoriaId: string) => void;
  onReabrirCategoria: (categoriaId: string) => void;
  onFinalizar: () => void;
}

export function Contagem({
  session,
  onFechar,
  onQuantidade,
  onObservacao,
  onConcluirCategoria,
  onReabrirCategoria,
  onFinalizar,
}: ContagemProps) {
  const [activeCatId, setActiveCatId] = useState<string | null>(
    session.sessoes.find(s => s.status === 'pendente')?.id ?? null,
  );
  const [showRevisao, setShowRevisao] = useState(false);

  const concluidas = session.sessoes.filter(s => s.status === 'concluida').length;
  const total = session.sessoes.length;
  const todasConcluidas = concluidas === total;
  const alertas = session.sessoes.flatMap(cat =>
    cat.itens.filter(
      i =>
        i.quantidadeContada !== null &&
        i.estoqueMinimo !== undefined &&
        i.quantidadeContada < i.estoqueMinimo,
    ),
  );

  const dataFormatada = new Date(session.dataCriacao).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const toggleCategoria = (id: string) => {
    setActiveCatId(prev => (prev === id ? null : id));
  };

  const handleConcluirCategoria = (catId: string) => {
    onConcluirCategoria(catId);
    const idx = session.sessoes.findIndex(s => s.id === catId);
    const proxima = session.sessoes[idx + 1];
    if (proxima) setActiveCatId(proxima.id);
    else setActiveCatId(null);
  };

  const handleProxima = (catId: string) => {
    const idx = session.sessoes.findIndex(s => s.id === catId);
    const proxima = session.sessoes[idx + 1];
    if (proxima) setActiveCatId(proxima.id);
  };

  // ── Tela de revisão ───────────────────────────────────────────────────────
  if (showRevisao) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-4 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => setShowRevisao(false)} className="p-2 -ml-2 text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-white">Revisão</h2>
            <p className="text-xs text-gray-500">{LOJA_LABELS[session.lojaId]} · {dataFormatada}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
          {alertas.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <p className="text-amber-400 font-semibold text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {alertas.length} item{alertas.length !== 1 ? 'ns' : ''} abaixo do mínimo
              </p>
              <div className="space-y-1">
                {alertas.map(a => (
                  <p key={a.insumoId} className="text-xs text-gray-400">
                    • {a.nome}: {a.quantidadeContada} {a.unidade} (mín: {a.estoqueMinimo})
                  </p>
                ))}
              </div>
            </div>
          )}

          {session.sessoes.map(cat => (
            <div key={cat.id} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span>{cat.icone}</span>
                <p className="font-semibold text-white text-sm">{cat.nome}</p>
                {cat.status === 'concluida' && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />
                )}
              </div>
              <div className="space-y-1.5">
                {cat.itens.map(item => {
                  const abaixo =
                    item.quantidadeContada !== null &&
                    item.estoqueMinimo !== undefined &&
                    item.quantidadeContada < item.estoqueMinimo;
                  return (
                    <div key={item.insumoId} className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">{item.nome}</span>
                      <span
                        className={`font-semibold ${
                          item.quantidadeContada === null
                            ? 'text-gray-600'
                            : abaixo
                            ? 'text-amber-400'
                            : 'text-white'
                        }`}
                      >
                        {item.quantidadeContada === null
                          ? '—'
                          : `${item.quantidadeContada} ${item.unidade}`}
                        {abaixo && ' ⚠'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            onClick={onFinalizar}
            className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-base transition-colors"
          >
            ✓ Confirmar e finalizar contagem
          </button>
          <div className="h-6" />
        </div>
      </div>
    );
  }

  // ── Tela principal de contagem ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header fixo */}
      <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-4 pt-12 pb-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-bold text-white text-base">{LOJA_LABELS[session.lojaId]}</h1>
            <p className="text-xs text-gray-500">{dataFormatada}</p>
          </div>
          <button
            onClick={onFechar}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors border border-[#374151] rounded-xl px-3 py-2"
          >
            <X className="w-3.5 h-3.5" />
            Salvar e sair
          </button>
        </div>

        {/* Barra de progresso */}
        <ProgressBar concluidas={concluidas} total={total} />
        <p className="text-xs text-gray-600 mt-1">
          {concluidas} de {total} sessões concluídas
          {alertas.length > 0 && (
            <span className="ml-2 text-amber-500">· ⚠ {alertas.length} alerta{alertas.length !== 1 ? 's' : ''}</span>
          )}
        </p>
      </div>

      {/* Lista de sessões */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {session.sessoes.map((cat, idx) => (
          <SessionAccordion
            key={cat.id}
            categoria={cat}
            isActive={activeCatId === cat.id}
            onToggle={() => toggleCategoria(cat.id)}
            onQuantidade={onQuantidade}
            onObservacao={onObservacao}
            onConcluir={() => handleConcluirCategoria(cat.id)}
            onReabrir={() => onReabrirCategoria(cat.id)}
            onProxima={
              idx < session.sessoes.length - 1
                ? () => handleProxima(cat.id)
                : undefined
            }
          />
        ))}

        {/* Botão finalizar */}
        <div className="pt-2 pb-8">
          {todasConcluidas ? (
            <button
              onClick={() => setShowRevisao(true)}
              className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-base transition-colors"
            >
              ✓ Revisar e finalizar
            </button>
          ) : (
            <button
              disabled
              className="w-full py-4 rounded-2xl bg-[#1c1c1e] border border-[#2a2a2e] text-gray-600 font-medium text-sm cursor-not-allowed"
            >
              Conclua todas as sessões para finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
