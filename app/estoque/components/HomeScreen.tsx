'use client';

import { ClipboardList, RotateCcw, Plus, CheckCircle2 } from 'lucide-react';
import type { StockSession } from '../types';

interface HomeScreenProps {
  sessions: StockSession[];
  onIniciar: () => void;
  onRetomar: (sessionId: string) => void;
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HomeScreen({ sessions, onIniciar, onRetomar }: HomeScreenProps) {
  const emAndamento = sessions.filter(s => s.status === 'em_andamento');
  const concluidas  = sessions.filter(s => s.status === 'concluida');
  const temAtiva    = emAndamento.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-5 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Plateful Estoque</h1>
            <p className="text-xs text-gray-500">Contagem semanal de insumos</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-5 max-w-lg mx-auto w-full">

        {/* ── Contagem em andamento ───────────────────────────────────────── */}
        {emAndamento.map(s => {
          const total      = s.sessoes.length;
          const concluidas = s.sessoes.filter(c => c.status === 'concluida').length;
          const pct        = total > 0 ? Math.round((concluidas / total) * 100) : 0;

          return (
            <div key={s.id} className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Em andamento
                  </p>
                  {s.lojaNome && (
                    <p className="text-xs text-amber-300/70 mt-0.5">{s.lojaNome}</p>
                  )}
                </div>
                <span className="text-xs text-gray-500">{formatarData(s.dataCriacao)}</span>
              </div>

              {/* Barra de progresso */}
              <div className="my-3 h-2 bg-[#2a2a2e] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-amber-300">
                  {concluidas}/{total} sessões concluídas
                </p>
                <button
                  onClick={() => onRetomar(s.id)}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black font-semibold text-sm rounded-xl px-4 py-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Continuar
                </button>
              </div>
            </div>
          );
        })}

        {/* ── Iniciar nova contagem ───────────────────────────────────────── */}
        {!temAtiva ? (
          <button
            onClick={onIniciar}
            className="w-full bg-[#1c1c1e] border-2 border-dashed border-amber-500/40 hover:border-amber-500/80 hover:bg-amber-500/5 rounded-2xl p-8 flex flex-col items-center gap-3 transition-all active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Plus className="w-7 h-7 text-amber-400" />
            </div>
            <div className="text-center">
              <p className="font-bold text-white text-base">Iniciar nova contagem</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>
            </div>
          </button>
        ) : (
          <button
            onClick={onIniciar}
            className="w-full flex items-center justify-center gap-2 border border-[#374151] rounded-2xl py-3 text-sm text-gray-500 hover:text-white hover:border-[#4a4a50] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova contagem (substituirá a atual)
          </button>
        )}

        {/* ── Últimas contagens ───────────────────────────────────────────── */}
        {concluidas.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
              Últimas contagens
            </p>
            <div className="space-y-2">
              {concluidas.slice(0, 3).map(s => {
                const alertas = s.sessoes.flatMap(cat =>
                  cat.itens.filter(
                    i => i.quantidadeContada !== null && i.estoqueMinimo !== undefined && i.quantidadeContada < i.estoqueMinimo,
                  ),
                ).length;

                return (
                  <div
                    key={s.id}
                    className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">
                        {new Date(s.dataCriacao).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                        {s.lojaNome && (
                          <span className="ml-2 text-xs font-normal text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                            {s.lojaNome}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {s.sessoes.length} sessões
                        {alertas > 0 && (
                          <span className="ml-2 text-amber-500">⚠ {alertas} alerta{alertas !== 1 ? 's' : ''}</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-700 text-center pb-4">
          Dados salvos no banco de dados
        </p>
      </div>
    </div>
  );
}
