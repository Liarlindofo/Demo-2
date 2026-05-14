'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoja, Loja } from '@/contexts/LojaContext';
import {
  ArrowLeft,
  BarChart3,
  Play,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  Users,
} from 'lucide-react';

interface TurnoMinimos {
  manha: number;
  tarde: number;
  noite: number;
}

interface TurnoResult {
  turno: string;
  atual6x1: number;
  necessario5x2: number;
  delta: number;
  impactoMensal: number;
}

interface SimulacaoResult {
  turnos: TurnoResult[];
  totalContratar: number;
  custoAdicionalMensal: number;
  custoAdicionalAnual: number;
  salarioMedioReferencia: number;
}

const TURNO_LABELS: Record<string, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

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

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function SimulacaoPage() {
  const router = useRouter();
  const { lojas, lojaSelecionada, setLojaSelecionada } = useLoja();
  const [minimosPorTurno, setMinimosPorTurno] = useState<TurnoMinimos>({
    manha: 2,
    tarde: 2,
    noite: 1,
  });
  const [resultado, setResultado] = useState<SimulacaoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSimular = async () => {
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const res = await fetch('/api/rh/simulacao/escala', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lojaId: lojaSelecionada?.id ?? null,
          minimosPorTurno,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? 'Erro ao simular');
        return;
      }
      setResultado(await res.json());
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const allOk = resultado?.turnos.every((t) => t.delta <= 0) ?? false;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
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
              <BarChart3 className="w-6 h-6 text-amber-400" />
              Simulador de Escala
            </h1>
            <p className="text-sm text-gray-400">
              Calcule o impacto da transição de 6x1 para 5x2
            </p>
          </div>
        </div>

        {/* Loja Selector */}
        <LojaSelector
          lojas={lojas}
          lojaSelecionada={lojaSelecionada}
          setLojaSelecionada={setLojaSelecionada}
        />

        {/* Info card */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-medium text-white mb-1">Como funciona a simulação</p>
            <p className="text-gray-400">
              Na escala <strong className="text-amber-400">6x1</strong>, cada funcionário trabalha 6
              dias e folga 1. Na <strong className="text-green-400">5x2</strong>, trabalha 5 e folga
              2. Para manter a mesma cobertura por turno, são necessários mais funcionários. Configure
              abaixo o mínimo por turno e clique em Simular.
            </p>
          </div>
        </div>

        {/* Input cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Mínimo de funcionários por turno (5x2)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['manha', 'tarde', 'noite'] as const).map((turno) => (
              <div key={turno} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {TURNO_LABELS[turno]}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setMinimosPorTurno((p) => ({
                        ...p,
                        [turno]: Math.max(0, p[turno] - 1),
                      }))
                    }
                    className="w-9 h-9 rounded-xl bg-[#2a2a2e] flex items-center justify-center text-gray-300 hover:bg-[#3a3a3e] transition-colors text-lg"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-bold text-white">
                      {minimosPorTurno[turno]}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">funcionários</p>
                  </div>
                  <button
                    onClick={() =>
                      setMinimosPorTurno((p) => ({ ...p, [turno]: p[turno] + 1 }))
                    }
                    className="w-9 h-9 rounded-xl bg-[#2a2a2e] flex items-center justify-center text-gray-300 hover:bg-[#3a3a3e] transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulate button */}
        <button
          onClick={handleSimular}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-amber-500 text-black font-bold text-base hover:bg-amber-400 disabled:opacity-60 transition-colors"
        >
          <Play className="w-5 h-5" />
          {loading ? 'Simulando...' : 'Simular Escala 5x2'}
        </button>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Results */}
        {resultado && (
          <div className="space-y-5">
            {/* Alert */}
            {allOk ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Nenhuma contratação adicional necessária para atingir os mínimos configurados.
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-400 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                São necessárias <strong>{resultado.totalContratar} contratações</strong> para manter a cobertura mínima.
              </div>
            )}

            {/* Tabela de resultados */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
              <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-[#2a2a2e] text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span>Turno</span>
                <span className="text-center">Atual (6x1)</span>
                <span className="text-center">Necessário (5x2)</span>
                <span className="text-center">+ Contratações</span>
                <span className="text-right">Impacto Mensal</span>
              </div>
              {resultado.turnos.map((row) => (
                <div
                  key={row.turno}
                  className="grid grid-cols-5 gap-4 px-5 py-4 border-b border-[#2a2a2e] last:border-0 hover:bg-[#222224] transition-colors"
                >
                  <span className="text-sm font-medium text-white capitalize">{row.turno}</span>
                  <span className="text-sm text-gray-300 text-center">{row.atual6x1}</span>
                  <span className="text-sm text-gray-300 text-center">{row.necessario5x2}</span>
                  <span
                    className={`text-sm font-semibold text-center ${
                      row.delta > 0
                        ? 'text-amber-400'
                        : row.delta < 0
                        ? 'text-green-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {row.delta > 0 ? `+${row.delta}` : row.delta === 0 ? '—' : row.delta}
                  </span>
                  <span className="text-sm font-mono text-right text-gray-300">
                    {row.impactoMensal > 0 ? fmt(row.impactoMensal) : '—'}
                  </span>
                </div>
              ))}
            </div>

            {/* Summary */}
            {!allOk && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-gray-400 uppercase tracking-wider">A Contratar</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{resultado.totalContratar}</p>
                  <p className="text-xs text-gray-500 mt-1">novos funcionários</p>
                </div>
                <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Custo Mensal</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-400">
                    {fmt(resultado.custoAdicionalMensal)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">encargos inclusos (~44%)</p>
                </div>
                <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Custo Anual</p>
                  </div>
                  <p className="text-2xl font-bold text-green-400">
                    {fmt(resultado.custoAdicionalAnual)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">13° e férias inclusos</p>
                </div>
              </div>
            )}

            {/* Explanation */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Como o cálculo é feito</h3>
              <div className="text-sm text-gray-400 space-y-2">
                <p>
                  Na escala <span className="text-amber-400 font-medium">6x1</span>, cada funcionário
                  trabalha 6 dias por semana → cobre <strong className="text-white">~85,7%</strong>{' '}
                  dos dias.
                </p>
                <p>
                  Na escala <span className="text-green-400 font-medium">5x2</span>, trabalha 5 dias
                  → cobre <strong className="text-white">~71,4%</strong> dos dias. Para manter a
                  mesma cobertura, o número necessário é:{' '}
                  <code className="bg-[#2a2a2e] px-1.5 py-0.5 rounded text-white text-xs">
                    ceil(atual × (6/5))
                  </code>
                  .
                </p>
                <p>
                  O custo adicional usa o salário médio de referência de{' '}
                  <strong className="text-white">{fmt(resultado.salarioMedioReferencia)}</strong>{' '}
                  multiplicado por{' '}
                  <strong className="text-white">1,44</strong> (encargos patronais).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
