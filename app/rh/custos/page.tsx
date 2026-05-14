'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLoja, Loja } from '@/contexts/LojaContext';
import {
  ArrowLeft,
  DollarSign,
  Users,
  TrendingUp,
  Download,
} from 'lucide-react';

interface Funcionario {
  id: string;
  nome: string;
  salarioBruto: number;
  escala: '6x1' | '5x2';
  ativo: boolean;
  cargo: { id: string; nome: string; ratPct: number };
  loja: { id: string; nome: string };
}

type ViewMode = 'mensal' | 'anual';

const ENCARGOS_RATE = 0.44;
const ANUAL_MULTIPLIER = 13.33; // 12 meses + 13° + férias proporcional

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

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white shadow-xl z-50">
      {message}
    </div>
  );
}

export default function CustosPage() {
  const router = useRouter();
  const { lojas, lojaSelecionada, setLojaSelecionada } = useLoja();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('mensal');
  const [toast, setToast] = useState('');

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const calcCusto = useCallback(
    (salario: number) => {
      const mensal = salario * (1 + ENCARGOS_RATE);
      return viewMode === 'anual' ? mensal * ANUAL_MULTIPLIER : mensal;
    },
    [viewMode]
  );

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

  const totalSalarios = funcionarios.reduce((s, f) => s + f.salarioBruto, 0);
  const totalCusto = funcionarios.reduce((s, f) => s + calcCusto(f.salarioBruto), 0);
  const totalEncargos = totalCusto - (viewMode === 'anual' ? totalSalarios * ANUAL_MULTIPLIER : totalSalarios);

  // Group by cargo for visualization
  const byGroup = funcionarios.reduce<Record<string, { total: number; count: number }>>(
    (acc, f) => {
      const key = f.cargo.nome;
      if (!acc[key]) acc[key] = { total: 0, count: 0 };
      acc[key].total += calcCusto(f.salarioBruto);
      acc[key].count += 1;
      return acc;
    },
    {}
  );

  const groups = Object.entries(byGroup)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8);

  const groupColors = [
    'bg-amber-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-red-500',
    'bg-orange-500',
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/rh')}
              className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-400" />
                Custos de RH
              </h1>
              <p className="text-sm text-gray-400">Folha de pagamento e encargos estimados</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl p-1">
              {(['mensal', 'anual'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                    viewMode === m ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={() => setToast('Exportação disponível em breve.')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-gray-300 text-sm hover:bg-[#2a2a2e] transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Loja Selector */}
        <LojaSelector
          lojas={lojas}
          lojaSelecionada={lojaSelecionada}
          setLojaSelecionada={setLojaSelecionada}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 animate-pulse">
                <div className="h-4 w-24 bg-[#2a2a2e] rounded mb-3" />
                <div className="h-7 w-32 bg-[#2a2a2e] rounded" />
              </div>
            ))
          ) : (
            <>
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-blue-400" />
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Funcionários
                  </p>
                </div>
                <p className="text-2xl font-bold text-white">{funcionarios.length}</p>
                <p className="text-xs text-gray-500 mt-1">ativos</p>
              </div>

              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Folha {viewMode === 'anual' ? 'Anual' : 'Mensal'}
                  </p>
                </div>
                <p className="text-2xl font-bold text-white">
                  {fmt(viewMode === 'anual' ? totalSalarios * ANUAL_MULTIPLIER : totalSalarios)}
                </p>
                <p className="text-xs text-gray-500 mt-1">salários brutos</p>
              </div>

              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Custo Total {viewMode === 'anual' ? 'Anual' : 'Mensal'}
                  </p>
                </div>
                <p className="text-2xl font-bold text-amber-400">{fmt(totalCusto)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  +{fmt(totalEncargos)} em encargos (~44%)
                </p>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className="lg:col-span-2">
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
              <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_80px] gap-4 px-5 py-3 border-b border-[#2a2a2e] text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span>Funcionário</span>
                <span>Salário Bruto</span>
                <span>Custo Total</span>
                <span>% Enc.</span>
              </div>

              {loading ? (
                <div className="divide-y divide-[#2a2a2e]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 animate-pulse">
                      <div className="h-4 flex-1 bg-[#2a2a2e] rounded" />
                      <div className="h-4 w-20 bg-[#2a2a2e] rounded" />
                      <div className="h-4 w-20 bg-[#2a2a2e] rounded" />
                    </div>
                  ))}
                </div>
              ) : funcionarios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Users className="w-8 h-8 text-gray-600" />
                  <p className="text-gray-500 text-sm">Nenhum funcionário encontrado</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-[#2a2a2e]">
                    {funcionarios.map((f) => {
                      const custo = calcCusto(f.salarioBruto);
                      const pctEncargos = ((custo - (viewMode === 'anual' ? f.salarioBruto * ANUAL_MULTIPLIER : f.salarioBruto)) / custo * 100).toFixed(0);
                      return (
                        <div
                          key={f.id}
                          className="grid sm:grid-cols-[2fr_1fr_1fr_80px] gap-4 px-5 py-3.5 hover:bg-[#222224] transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">{f.nome}</p>
                            <p className="text-xs text-gray-500">{f.cargo.nome}</p>
                          </div>
                          <span className="text-sm text-gray-300 font-mono self-center">
                            {fmt(viewMode === 'anual' ? f.salarioBruto * ANUAL_MULTIPLIER : f.salarioBruto)}
                          </span>
                          <span className="text-sm text-amber-400 font-mono self-center font-semibold">
                            {fmt(custo)}
                          </span>
                          <span className="text-xs text-gray-500 self-center">{pctEncargos}%</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Totals row */}
                  <div className="grid sm:grid-cols-[2fr_1fr_1fr_80px] gap-4 px-5 py-4 border-t border-[#2a2a2e] bg-[#0a0a0a]">
                    <span className="text-sm font-semibold text-white">
                      Total ({funcionarios.length} func.)
                    </span>
                    <span className="text-sm font-semibold text-white font-mono">
                      {fmt(viewMode === 'anual' ? totalSalarios * ANUAL_MULTIPLIER : totalSalarios)}
                    </span>
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      {fmt(totalCusto)}
                    </span>
                    <span className="text-xs text-gray-500 self-center">44%</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Breakdown bar chart by cargo */}
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 pb-3 border-b border-[#2a2a2e]">
              Custo por Cargo
            </h3>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 w-20 bg-[#2a2a2e] rounded" />
                    <div className="h-2 bg-[#2a2a2e] rounded-full" style={{ width: `${70 - i * 15}%` }} />
                  </div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Sem dados</p>
            ) : (
              <div className="space-y-4">
                {groups.map(([cargo, data], idx) => {
                  const pct = totalCusto > 0 ? (data.total / totalCusto) * 100 : 0;
                  return (
                    <div key={cargo}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400 truncate max-w-[120px]">{cargo}</span>
                        <span className="text-xs text-gray-500 ml-2">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-[#2a2a2e] rounded-full h-2">
                        <div
                          className={`${groupColors[idx % groupColors.length]} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-600">
                          {data.count} func.
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{fmt(data.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
