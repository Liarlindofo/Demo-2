'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLoja, Loja } from '@/contexts/LojaContext';
import { ArrowLeft, Calendar } from 'lucide-react';

interface Funcionario {
  id: string;
  nome: string;
  ativo: boolean;
  cargo: { id: string; nome: string };
  turno: 'manhã' | 'tarde' | 'noite' | 'integral';
  diasFolga: string[];
  domingoFolga?: string | null;
  escala: '6x1' | '5x2';
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
type Dia = (typeof DIAS)[number];

const DOMINGO_LABELS: Record<string, string> = {
  '1': '1º domingo',
  '2': '2º domingo',
  '3': '3º domingo',
  '4': '4º domingo',
  ultimo: 'Último domingo',
};

function getCargoColor(_cargo: string) {
  return 'bg-[#2a2a2e] text-gray-300 border-[#3a3a3e]';
}

function LojaSelector({
  lojas,
  lojaSelecionada,
  setLojaSelecionada,
}: {
  lojas: Loja[];
  lojaSelecionada: Loja | null;
  setLojaSelecionada: (l: Loja | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => setLojaSelecionada(null)}
        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          lojaSelecionada === null ? 'bg-amber-500 text-black' : 'bg-[#2a2a2e] text-gray-300 hover:bg-[#3a3a3e]'
        }`}
      >
        Todas as lojas
      </button>
      {lojas.map((loja) => (
        <button
          key={loja.id}
          onClick={() => setLojaSelecionada(loja)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            lojaSelecionada?.id === loja.id ? 'bg-amber-500 text-black' : 'bg-[#2a2a2e] text-gray-300 hover:bg-[#3a3a3e]'
          }`}
        >
          {loja.nome}
        </button>
      ))}
    </div>
  );
}

function FolgaCard({ f }: { f: Funcionario }) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${getCargoColor(f.cargo.nome)}`}>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white truncate leading-tight">
          {f.nome.split(' ')[0]}
        </p>
        <p className="text-[10px] text-gray-400 truncate leading-tight">{f.cargo.nome}</p>
      </div>
    </div>
  );
}

export default function EscalaPage() {
  const router = useRouter();
  const { lojas, lojaSelecionada, setLojaSelecionada } = useLoja();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFuncionarios = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ativo: 'true' });
      if (lojaSelecionada) params.set('lojaId', lojaSelecionada.id);
      const res = await fetch(`/api/rh/funcionarios?${params}`);
      if (res.ok) setFuncionarios(await res.json());
    } finally {
      setLoading(false);
    }
  }, [lojaSelecionada]);

  useEffect(() => {
    fetchFuncionarios();
  }, [fetchFuncionarios]);

  // Monta folgas por dia da semana (Seg–Sáb)
  const folgasPorDia: Record<string, Funcionario[]> = {};
  DIAS.forEach((d) => { folgasPorDia[d] = []; });

  funcionarios.forEach((f) => {
    const diasFolga = Array.isArray(f.diasFolga) ? f.diasFolga : [];
    diasFolga.forEach((d) => {
      if (d !== 'Dom' && folgasPorDia[d]) folgasPorDia[d].push(f);
    });
    // Dom com folga fixa (5x2)
    if (diasFolga.includes('Dom')) folgasPorDia['Dom'].push(f);
  });

  // Folgas de domingo agrupadas por qual domingo do mês (6x1 DSR)
  const domingosPorSemana: Record<string, Funcionario[]> = {
    '1': [], '2': [], '3': [], '4': [], ultimo: [],
  };
  funcionarios.forEach((f) => {
    const diasFolga = Array.isArray(f.diasFolga) ? f.diasFolga : [];
    if (!diasFolga.includes('Dom') && f.domingoFolga && domingosPorSemana[f.domingoFolga]) {
      domingosPorSemana[f.domingoFolga].push(f);
    }
  });

  const domingoGrupos = Object.entries(domingosPorSemana).filter(([, arr]) => arr.length > 0);
  const folgaFixaDom = folgasPorDia['Dom'];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/rh')}
            className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              Escala de Folgas
            </h1>
            <p className="text-sm text-gray-400">
              {loading ? '...' : `${funcionarios.length} funcionário${funcionarios.length !== 1 ? 's' : ''} — folgas por dia da semana`}
            </p>
          </div>
        </div>

        {/* Loja Selector */}
        <LojaSelector lojas={lojas} lojaSelecionada={lojaSelecionada} setLojaSelecionada={setLojaSelecionada} />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4 animate-pulse">
                <div className="h-4 w-16 bg-[#2a2a2e] rounded mb-3" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((__, j) => (
                    <div key={j} className="h-9 bg-[#2a2a2e] rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">

            {/* Domingo — card especial com subgrupos de DSR */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#2a2a2e] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Domingo</h3>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                  {folgaFixaDom.length + domingoGrupos.reduce((s, [, a]) => s + a.length, 0)} com folga no domingo
                </span>
              </div>
              <div className="p-5 space-y-5">

                {/* Folga fixa todo domingo (5x2) */}
                {folgaFixaDom.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      Folga fixa — todo domingo
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {folgaFixaDom.map((f) => <FolgaCard key={f.id} f={f} />)}
                    </div>
                  </div>
                )}

                {/* Divisor */}
                {folgaFixaDom.length > 0 && (
                  <div className="border-t border-[#2a2a2e]" />
                )}

                {/* DSR — folgas rotativas por qual domingo do mês */}
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    DSR — Domingo de folga mensal
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {(['1', '2', '3', '4', 'ultimo'] as const).map((semana) => {
                      const pessoas = domingosPorSemana[semana] ?? [];
                      return (
                        <div key={semana} className="bg-[#252528] rounded-xl p-3 space-y-2">
                          <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                            {DOMINGO_LABELS[semana]}
                          </p>
                          {pessoas.length === 0 ? (
                            <p className="text-[10px] text-gray-700 py-1">—</p>
                          ) : (
                            <div className="space-y-1.5">
                              {pessoas.map((f) => <FolgaCard key={f.id} f={f} />)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {folgaFixaDom.length === 0 && domingoGrupos.length === 0 && (
                  <p className="text-sm text-gray-600 py-2">Nenhuma folga de domingo cadastrada</p>
                )}
              </div>
            </div>

            {/* Seg–Sáb — grid de 6 colunas */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {(['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as Dia[]).map((dia) => {
                const pessoas = folgasPorDia[dia];
                return (
                  <div key={dia} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-[#2a2a2e] flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">{dia}</h3>
                      <span className="text-[10px] font-medium text-gray-500">{pessoas.length}</span>
                    </div>
                    <div className="p-3 space-y-1.5 min-h-[80px]">
                      {pessoas.length === 0 ? (
                        <div className="flex items-center justify-center h-12">
                          <span className="text-[10px] text-gray-700">ninguém</span>
                        </div>
                      ) : (
                        pessoas.map((f) => <FolgaCard key={f.id} f={f} />)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* Empty State */}
        {!loading && funcionarios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-gray-400 font-medium">Nenhum funcionário ativo</p>
              <p className="text-sm text-gray-600 mt-1">Selecione uma loja ou cadastre funcionários</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
