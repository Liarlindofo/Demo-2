'use client';

import { useState } from 'react';
import { ChevronLeft, CheckCircle2, Clock, Trash2, ChevronRight } from 'lucide-react';
import type { StockSession, LojaId } from '../types';
import { LOJA_LABELS, LOJA_CORES } from '../types';

interface HistoricoProps {
  sessions: StockSession[];
  onVoltar: () => void;
  onRetomar: (sessionId: string) => void;
  onExcluir: (sessionId: string) => void;
}

type LojaFiltro = 'todas' | LojaId;

export function Historico({ sessions, onVoltar, onRetomar, onExcluir }: HistoricoProps) {
  const [filtroLoja, setFiltroLoja] = useState<LojaFiltro>('todas');
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const filtradas = sessions
    .filter(s => filtroLoja === 'todas' || s.lojaId === filtroLoja)
    .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());

  const sessoesEmAndamento = filtradas.filter(s => s.status === 'em_andamento');
  const sessoesConcluidas = filtradas.filter(s => s.status === 'concluida');

  const detalhe = sessions.find(s => s.id === detalheId);

  if (detalhe) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-4 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => setDetalheId(null)} className="p-2 -ml-2 text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-white">{LOJA_LABELS[detalhe.lojaId]}</h2>
            <p className="text-xs text-gray-500">
              {new Date(detalhe.dataCriacao).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
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
                          {item.quantidadeContada === null ? '—' : `${item.quantidadeContada} ${item.unidade}`}
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onVoltar} className="p-2 -ml-2 text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-white text-lg">Histórico</h2>
        </div>

        {/* Filtro de loja */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['todas', 'ahu', 'pilarzinho', 'portao', 'uberaba'] as LojaFiltro[]).map(l => (
            <button
              key={l}
              onClick={() => setFiltroLoja(l)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                filtroLoja === l
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-transparent text-gray-500 border-[#374151] hover:text-white'
              }`}
            >
              {l === 'todas' ? 'Todas as lojas' : LOJA_LABELS[l as LojaId]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-white font-semibold">Nenhuma contagem encontrada</p>
            <p className="text-sm text-gray-500 mt-1">Inicie uma nova contagem na tela principal</p>
          </div>
        ) : (
          <>
            {sessoesEmAndamento.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Em andamento</p>
                {sessoesEmAndamento.map(s => <SessaoCard key={s.id} s={s} onClick={() => setDetalheId(s.id)} onExcluir={onExcluir} />)}
              </div>
            )}
            {sessoesConcluidas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Concluídas</p>
                {sessoesConcluidas.map(s => <SessaoCard key={s.id} s={s} onClick={() => setDetalheId(s.id)} onExcluir={onExcluir} />)}
              </div>
            )}
          </>
        )}
        <div className="h-6" />
      </div>
    </div>
  );
}

function SessaoCard({ s, onClick, onExcluir }: { s: StockSession; onClick: () => void; onExcluir: (id: string) => void }) {
  const concluidas = s.sessoes.filter(c => c.status === 'concluida').length;
  const alertas = s.sessoes.flatMap(cat => cat.itens.filter(i => i.quantidadeContada !== null && i.estoqueMinimo !== undefined && i.quantidadeContada < i.estoqueMinimo)).length;

  return (
    <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4 flex items-center gap-3 mb-2">
      {s.status === 'concluida'
        ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
        : <Clock className="w-5 h-5 text-amber-400 shrink-0" />}

      <button onClick={onClick} className="flex-1 text-left min-w-0">
        <p className="font-semibold text-white text-sm">{LOJA_LABELS[s.lojaId]}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {new Date(s.dataCriacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
          {' · '}
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
}
