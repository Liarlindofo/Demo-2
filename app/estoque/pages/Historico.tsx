'use client';

import { useState } from 'react';
import { ChevronLeft, CheckCircle2, Clock, Trash2, ChevronRight } from 'lucide-react';
import type { StockSession } from '../types';
import { formatQtd } from '../utils';

interface HistoricoProps {
  sessions: StockSession[];
  onVoltar: () => void;
  onRetomar: (sessionId: string) => void;
  onExcluir: (sessionId: string) => void;
}

export function Historico({ sessions, onVoltar, onRetomar, onExcluir }: HistoricoProps) {
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const ordenadas = [...sessions].sort(
    (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime(),
  );

  const detalhe = sessions.find(s => s.id === detalheId);

  // ── Tela de detalhe ────────────────────────────────────────────────────────
  if (detalhe) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-4 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => setDetalheId(null)} className="p-2 -ml-2 text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-white">
              {new Date(detalhe.dataCriacao).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </h2>
            <p className="text-xs text-gray-500">
              {new Date(detalhe.dataCriacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {detalhe.sessoes.length} sessões
            </p>
          </div>
          {detalhe.status === 'em_andamento' && (
            <button
              onClick={() => { onRetomar(detalhe.id); setDetalheId(null); }}
              className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl px-3 py-1.5"
            >
              Continuar
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
          {detalhe.sessoes.map(cat => {
            const alertas = cat.itens.filter(
              i => i.quantidadeContada !== null && i.estoqueMinimo !== undefined && i.quantidadeContada < i.estoqueMinimo,
            ).length;
            return (
              <div key={cat.id} className={`rounded-2xl border p-4 ${cat.status === 'concluida' ? 'bg-green-500/5 border-green-500/20' : 'bg-[#1c1c1e] border-[#2a2a2e]'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span>{cat.icone}</span>
                  <p className="font-semibold text-white text-sm flex-1">{cat.nome}</p>
                  {cat.status === 'concluida' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  {alertas > 0 && <span className="text-xs text-amber-400">⚠ {alertas}</span>}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {cat.itens.map(item => {
                    const abaixo = item.quantidadeContada !== null && item.estoqueMinimo !== undefined && item.quantidadeContada < item.estoqueMinimo;
                    return (
                      <div key={item.insumoId} className="flex justify-between text-xs gap-2">
                        <span className="text-gray-500 truncate">{item.nome}</span>
                        <span className={`font-medium shrink-0 ${item.quantidadeContada === null ? 'text-gray-700' : abaixo ? 'text-amber-400' : 'text-white'}`}>
                          {item.quantidadeContada === null ? '—' : `${formatQtd(item.quantidadeContada)} ${item.unidade}`}
                          {abaixo && ' ⚠'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="h-6" />
        </div>
      </div>
    );
  }

  // ── Lista de contagens ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={onVoltar} className="p-2 -ml-2 text-gray-400 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-white text-lg">Histórico</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 max-w-lg mx-auto w-full">
        {ordenadas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-white font-semibold">Nenhuma contagem ainda</p>
            <p className="text-sm text-gray-500 mt-1">Inicie uma nova contagem na tela principal</p>
          </div>
        ) : (
          ordenadas.map(s => {
            const concluidas = s.sessoes.filter(c => c.status === 'concluida').length;
            const alertas = s.sessoes.flatMap(cat =>
              cat.itens.filter(i => i.quantidadeContada !== null && i.estoqueMinimo !== undefined && i.quantidadeContada < i.estoqueMinimo),
            ).length;

            return (
              <div key={s.id} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4 flex items-center gap-3">
                {s.status === 'concluida'
                  ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  : <Clock className="w-5 h-5 text-amber-400 shrink-0" />}

                <button onClick={() => setDetalheId(s.id)} className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-white text-sm">
                    {new Date(s.dataCriacao).toLocaleDateString('pt-BR', {
                      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.status === 'em_andamento' ? (
                      <span className="text-amber-400">Em andamento · </span>
                    ) : null}
                    {concluidas}/{s.sessoes.length} sessões
                    {alertas > 0 && <span className="ml-2 text-amber-400">⚠ {alertas}</span>}
                  </p>
                </button>

                <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />

                <button
                  onClick={e => { e.stopPropagation(); onExcluir(s.id); }}
                  className="p-2 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
        <div className="h-6" />
      </div>
    </div>
  );
}
