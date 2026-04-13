'use client';

import { ChevronLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { StockSession, LojaId } from '../types';
import { LOJA_LABELS } from '../types';

interface AlertasProps {
  sessions: StockSession[];
  onVoltar: () => void;
}

interface AlertaItem {
  lojaId: LojaId;
  lojaNome: string;
  categoriaIcone: string;
  categoriaNome: string;
  insumoNome: string;
  unidade: string;
  quantidadeContada: number;
  estoqueMinimo: number;
  falta: number;
  dataContagem: string;
}

export function Alertas({ sessions, onVoltar }: AlertasProps) {
  const alertas: AlertaItem[] = sessions
    .filter(s => s.status !== 'em_andamento' || s.sessoes.some(c => c.status === 'concluida'))
    .flatMap(s =>
      s.sessoes.flatMap(cat =>
        cat.itens
          .filter(
            i =>
              i.quantidadeContada !== null &&
              i.estoqueMinimo !== undefined &&
              i.quantidadeContada < i.estoqueMinimo,
          )
          .map(i => ({
            lojaId: s.lojaId,
            lojaNome: LOJA_LABELS[s.lojaId],
            categoriaIcone: cat.icone,
            categoriaNome: cat.nome,
            insumoNome: i.nome,
            unidade: i.unidade,
            quantidadeContada: i.quantidadeContada as number,
            estoqueMinimo: i.estoqueMinimo as number,
            falta: (i.estoqueMinimo as number) - (i.quantidadeContada as number),
            dataContagem: s.dataCriacao,
          })),
      ),
    )
    .sort((a, b) => b.falta - a.falta);

  const porLoja = alertas.reduce<Record<string, AlertaItem[]>>((acc, a) => {
    if (!acc[a.lojaId]) acc[a.lojaId] = [];
    acc[a.lojaId].push(a);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="p-2 -ml-2 text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Alertas de Reposição
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {alertas.length === 0
                ? 'Nenhum alerta no momento'
                : `${alertas.length} item${alertas.length !== 1 ? 'ns' : ''} abaixo do mínimo`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 max-w-lg mx-auto w-full">
        {alertas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500/40 mb-4" />
            <p className="text-white font-semibold">Tudo em ordem!</p>
            <p className="text-sm text-gray-500 mt-1">Nenhum insumo abaixo do estoque mínimo</p>
          </div>
        ) : (
          Object.entries(porLoja).map(([lojaId, items]) => (
            <div key={lojaId}>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                {LOJA_LABELS[lojaId as LojaId]}
                <span className="ml-2 text-gray-500 normal-case font-normal">
                  ({items.length} alerta{items.length !== 1 ? 's' : ''})
                </span>
              </p>
              <div className="space-y-2">
                {items.map((a, idx) => {
                  const pct = Math.min(100, (a.quantidadeContada / a.estoqueMinimo) * 100);
                  const gravidade =
                    pct < 30 ? 'critico' : pct < 60 ? 'atencao' : 'baixo';

                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-4 ${
                        gravidade === 'critico'
                          ? 'bg-red-500/8 border-red-500/30'
                          : gravidade === 'atencao'
                          ? 'bg-amber-500/8 border-amber-500/30'
                          : 'bg-[#1c1c1e] border-[#2a2a2e]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-white text-sm">{a.insumoNome}</p>
                          <p className="text-xs text-gray-500">
                            {a.categoriaIcone} {a.categoriaNome}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-lg font-bold ${gravidade === 'critico' ? 'text-red-400' : 'text-amber-400'}`}>
                            {a.quantidadeContada} {a.unidade}
                          </p>
                          <p className="text-xs text-gray-500">de {a.estoqueMinimo} {a.unidade}</p>
                        </div>
                      </div>

                      {/* Barra de estoque */}
                      <div className="h-2 bg-[#2a2a2e] rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            gravidade === 'critico' ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>
                          Falta: <span className="text-white font-medium">{a.falta.toFixed(1)} {a.unidade}</span>
                        </span>
                        <span>
                          Contado em {new Date(a.dataContagem).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div className="h-6" />
      </div>
    </div>
  );
}
