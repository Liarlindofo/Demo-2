'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLoja, Loja } from '@/contexts/LojaContext';
import { ArrowLeft, Calendar, AlertTriangle } from 'lucide-react';

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

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TURNOS = ['manhã', 'tarde', 'noite', 'integral'] as const;
type Turno = (typeof TURNOS)[number];

const TURNO_LABELS: Record<Turno, string> = {
  manhã: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
};

const TURNO_COLORS: Record<Turno, string> = {
  manhã: 'bg-amber-500/10 border-amber-500/20',
  tarde: 'bg-blue-500/10 border-blue-500/20',
  noite: 'bg-purple-500/10 border-purple-500/20',
  integral: 'bg-green-500/10 border-green-500/20',
};

const CARGO_COLORS: Record<string, string> = {
  Gerente: 'bg-purple-500/20 text-purple-300',
  Pizzaiolo: 'bg-orange-500/20 text-orange-300',
  Atendente: 'bg-blue-500/20 text-blue-300',
  Caixa: 'bg-green-500/20 text-green-300',
  Entregador: 'bg-cyan-500/20 text-cyan-300',
  'Auxiliar de Cozinha': 'bg-yellow-500/20 text-yellow-300',
  Supervisor: 'bg-pink-500/20 text-pink-300',
};

function getCargoColor(cargo: string): string {
  return CARGO_COLORS[cargo] ?? 'bg-gray-500/20 text-gray-300';
}

function domingoFolgaLabel(domingoFolga: string | null | undefined): string {
  if (!domingoFolga) return '';
  if (domingoFolga === 'ultimo') return 'f. últ. dom';
  return `f. ${domingoFolga}º dom`;
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
          lojaSelecionada === null
            ? 'bg-amber-500 text-black'
            : 'bg-[#2a2a2e] text-gray-300 hover:bg-[#3a3a3e]'
        }`}
      >
        Todas as lojas
      </button>
      {lojas.map((loja) => (
        <button
          key={loja.id}
          onClick={() => setLojaSelecionada(loja)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            lojaSelecionada?.id === loja.id
              ? 'bg-amber-500 text-black'
              : 'bg-[#2a2a2e] text-gray-300 hover:bg-[#3a3a3e]'
          }`}
        >
          {loja.nome}
        </button>
      ))}
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

  // Build schedule grid: turno → dia → funcionarios[]
  const grid: Record<Turno, Record<string, Funcionario[]>> = {
    manhã: {},
    tarde: {},
    noite: {},
    integral: {},
  };
  DIAS.forEach((dia) => {
    TURNOS.forEach((turno) => {
      grid[turno][dia] = [];
    });
  });

  funcionarios.forEach((f) => {
    const turno = f.turno as Turno;
    const diasFolga = Array.isArray(f.diasFolga) ? f.diasFolga : [];
    DIAS.forEach((dia) => {
      if (!diasFolga.includes(dia)) {
        if (grid[turno]) grid[turno][dia].push(f);
      }
    });
  });

  // Collect unique cargos for legend
  const cargosUnicos = Array.from(new Set(funcionarios.map((f) => f.cargo.nome)));


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
              Escala Semanal
            </h1>
            <p className="text-sm text-gray-400">
              Grade de turnos —{' '}
              {loading ? '...' : `${funcionarios.length} funcionário${funcionarios.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Loja Selector */}
        <LojaSelector
          lojas={lojas}
          lojaSelecionada={lojaSelecionada}
          setLojaSelecionada={setLojaSelecionada}
        />

        {loading ? (
          <div className="space-y-4">
            {TURNOS.map((t) => (
              <div
                key={t}
                className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 animate-pulse"
              >
                <div className="h-5 w-20 bg-[#2a2a2e] rounded mb-4" />
                <div className="grid grid-cols-7 gap-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-16 bg-[#2a2a2e] rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {TURNOS.map((turno) => {
              const hasTurno = funcionarios.some((f) => f.turno === turno);
              if (!hasTurno && turno !== 'manhã') return null;

              return (
                <div
                  key={turno}
                  className={`bg-[#1c1c1e] border rounded-2xl overflow-hidden ${TURNO_COLORS[turno]}`}
                >
                  {/* Turno header */}
                  <div className="px-5 py-3 border-b border-[#2a2a2e]/50">
                    <h3 className="text-sm font-semibold text-white">{TURNO_LABELS[turno]}</h3>
                  </div>

                  {/* Day columns */}
                  <div className="grid grid-cols-7 divide-x divide-[#2a2a2e]/50">
                    {DIAS.map((dia) => {
                      const people = grid[turno][dia];
                      const isDom = dia === 'Dom';
                      const isLow = people.length < 2 && people.length > 0;
                      const isEmpty = people.length === 0;

                      return (
                        <div key={dia} className="p-2 min-h-[100px]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-semibold text-gray-500 uppercase">
                              {dia}
                            </span>
                            {isLow && (
                              <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            )}
                          </div>
                          {isEmpty ? (
                            <div className="flex items-center justify-center h-12">
                              <span className="text-[10px] text-gray-700">—</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {people.map((f) => (
                                <div key={f.id} className="space-y-0.5">
                                  <div
                                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate ${getCargoColor(f.cargo.nome)}`}
                                    title={`${f.nome} — ${f.cargo.nome}`}
                                  >
                                    {f.nome.split(' ')[0]}
                                  </div>
                                  {isDom && f.domingoFolga && f.domingoFolga !== 'todos' && (
                                    <div className="px-1.5 py-0.5 rounded-md text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 truncate">
                                      {domingoFolgaLabel(f.domingoFolga)}
                                    </div>
                                  )}
                                </div>
                              ))}
                              {isLow && (
                                <div className="px-1.5 py-0.5 rounded-md text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  ⚠ Baixo
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        {!loading && cargosUnicos.length > 0 && (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Legenda de Cargos
            </h3>
            <div className="flex flex-wrap gap-2">
              {cargosUnicos.map((cargo) => (
                <span
                  key={cargo}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getCargoColor(cargo)}`}
                >
                  {cargo}
                </span>
              ))}
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {'< 2 pessoas no turno'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400">
                f. Nº dom = DSR (domingo de folga mensal)
              </span>
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
              <p className="text-sm text-gray-600 mt-1">
                Selecione uma loja ou cadastre funcionários
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
