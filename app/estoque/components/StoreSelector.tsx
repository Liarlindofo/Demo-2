'use client';

import { Store, Clock, RotateCcw, Plus } from 'lucide-react';
import type { LojaId, StockSession } from '../types';
import { LOJA_LABELS, LOJA_CORES } from '../types';

interface StoreSelectorProps {
  sessions: StockSession[];
  onIniciar: (lojaId: LojaId) => void;
  onRetomar: (sessionId: string) => void;
}

const LOJAS: LojaId[] = ['ahu', 'pilarzinho', 'portao', 'uberaba'];

const LOJA_EMOJI: Record<LojaId, string> = {
  ahu: '🏪',
  pilarzinho: '🍕',
  portao: '🔥',
  uberaba: '🌟',
};

function formatarData(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StoreSelector({ sessions, onIniciar, onRetomar }: StoreSelectorProps) {
  const emAndamento = sessions.filter(s => s.status === 'em_andamento');
  const ultimasPorLoja: Record<string, StockSession> = {};
  sessions
    .filter(s => s.status === 'concluida')
    .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
    .forEach(s => {
      if (!ultimasPorLoja[s.lojaId]) ultimasPorLoja[s.lojaId] = s;
    });

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Store className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Plateful Estoque</h1>
            <p className="text-xs text-gray-500">Contagem semanal de insumos</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6 max-w-lg mx-auto w-full">
        {/* Contagens em andamento */}
        {emAndamento.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Em andamento
            </p>
            <div className="space-y-2">
              {emAndamento.map(s => {
                const total = s.sessoes.length;
                const concluidas = s.sessoes.filter(c => c.status === 'concluida').length;
                const pct = Math.round((concluidas / total) * 100);
                return (
                  <button
                    key={s.id}
                    onClick={() => onRetomar(s.id)}
                    className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-left flex items-center gap-4 active:scale-[0.98] transition-transform"
                  >
                    <span className="text-3xl">{LOJA_EMOJI[s.lojaId]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white">{LOJA_LABELS[s.lojaId]}</p>
                      <p className="text-xs text-gray-400">{formatarData(s.dataCriacao)}</p>
                      <div className="mt-2 h-1.5 bg-[#2a2a2e] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-amber-400 mt-1">{concluidas}/{total} sessões</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 text-sm font-medium shrink-0">
                      <RotateCcw className="w-4 h-4" />
                      Continuar
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selecionar loja para nova contagem */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            Nova contagem
          </p>
          <div className="grid grid-cols-2 gap-3">
            {LOJAS.map(lojaId => {
              const jaEmAndamento = emAndamento.some(s => s.lojaId === lojaId);
              const ultima = ultimasPorLoja[lojaId];
              return (
                <button
                  key={lojaId}
                  onClick={() => onIniciar(lojaId)}
                  disabled={jaEmAndamento}
                  className={`relative bg-[#1c1c1e] border rounded-2xl p-5 text-left flex flex-col gap-2 active:scale-[0.97] transition-all ${
                    jaEmAndamento
                      ? 'border-amber-500/40 opacity-50 cursor-not-allowed'
                      : 'border-[#2a2a2e] hover:border-[#374151]'
                  }`}
                >
                  <span className="text-4xl">{LOJA_EMOJI[lojaId]}</span>
                  <div>
                    <p className="font-bold text-white text-base">{LOJA_LABELS[lojaId]}</p>
                    {ultima ? (
                      <p className="text-xs text-gray-600 mt-0.5">
                        Última: {new Date(ultima.dataCriacao).toLocaleDateString('pt-BR')}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600 mt-0.5">Sem contagens</p>
                    )}
                  </div>
                  {jaEmAndamento && (
                    <span className="absolute top-3 right-3 text-xs bg-amber-500/20 text-amber-400 rounded-full px-2 py-0.5">
                      Em andamento
                    </span>
                  )}
                  {/* Dot de cor da loja */}
                  <div
                    className="absolute bottom-3 right-3 w-2 h-2 rounded-full"
                    style={{ backgroundColor: LOJA_CORES[lojaId] }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-gray-600 text-center pb-4">
          Plateful Estoque · Dados salvos localmente
        </p>
      </div>
    </div>
  );
}
