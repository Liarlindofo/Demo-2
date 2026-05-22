'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLoja, Loja } from '@/contexts/LojaContext';
import {
  ArrowLeft,
  BarChart3,
  Play,
  AlertTriangle,
  CheckCircle,
  Info,
  Users,
  Layers,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  Minus,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface PosicaoData {
  id: string;
  cargo: { id: string; nome: string };
  turno: string | null;
  idealMin: number;
  funcionarios6x1: number;
  funcionarios5x2: number;
  totalFuncionarios: number;
  salarioMedioGeral: number;
}

interface SetorData {
  id: string;
  nome: string;
  posicoes: PosicaoData[];
}

interface PosicaoSimulada extends PosicaoData {
  migrar: number; // quantos mover de 6x1 → 5x2
  proposto6x1: number;
  proposto5x2: number;
  coberturaDiaria: number;
  coberturaMinima: number;
  gap: number; // positivo = falta, negativo = excesso
  situacao: 'critico' | 'atencao' | 'ok' | 'excesso';
  custoDelta: number; // custo adicional de contratação se gap > 0
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ENCARGOS = 1.44;
const FATOR_6x1 = 6 / 7; // cobertura diária de cada funcionário 6x1
const FATOR_5x2 = 5 / 7; // cobertura diária de cada funcionário 5x2

/**
 * Cobertura diária esperada (funcionários presentes em média)
 */
function coberturaDiaria(n6x1: number, n5x2: number) {
  return n6x1 * FATOR_6x1 + n5x2 * FATOR_5x2;
}

/**
 * Cobertura mínima garantida (dia com mais folgas simultâneas,
 * distribuição ótima e rotativa)
 * - 6x1: 1 folga por semana → pior dia perde ceil(N/7) pessoas
 * - 5x2: 2 folgas por semana → pior dia perde ceil(2N/7) pessoas
 */
function coberturaMinima(n6x1: number, n5x2: number) {
  const min6 = Math.max(0, n6x1 - Math.ceil(n6x1 / 7));
  const min5 = Math.max(0, n5x2 - Math.ceil((2 * n5x2) / 7));
  return min6 + min5;
}

function simularPosicao(pos: PosicaoData, migrar: number): PosicaoSimulada {
  const migrarClamp = Math.max(0, Math.min(migrar, pos.funcionarios6x1));
  const p6x1 = pos.funcionarios6x1 - migrarClamp;
  const p5x2 = pos.funcionarios5x2 + migrarClamp;

  const cDiaria = coberturaDiaria(p6x1, p5x2);
  const cMin = coberturaMinima(p6x1, p5x2);
  const gap = pos.idealMin - cMin;

  let situacao: PosicaoSimulada['situacao'] = 'ok';
  if (gap > 0) situacao = 'critico';
  else if (cMin < pos.idealMin * 1.15) situacao = 'atencao';
  else if (cDiaria > pos.idealMin * 1.5) situacao = 'excesso';

  const salario = pos.salarioMedioGeral || 1518;
  const custoDelta = gap > 0 ? Math.ceil(gap) * salario * ENCARGOS : 0;

  return {
    ...pos,
    migrar: migrarClamp,
    proposto6x1: p6x1,
    proposto5x2: p5x2,
    coberturaDiaria: cDiaria,
    coberturaMinima: cMin,
    gap,
    situacao,
    custoDelta,
  };
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const TURNO_LABEL: Record<string, string> = {
  manhã: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

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

function SituacaoBadge({ situacao }: { situacao: PosicaoSimulada['situacao'] }) {
  const map = {
    critico: { label: 'Gargalo', cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
    atencao: { label: 'Atenção', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
    ok: { label: 'OK', cls: 'bg-green-500/15 text-green-400 border border-green-500/30' },
    excesso: { label: 'Excesso', cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  };
  const { label, cls } = map[situacao];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>
  );
}

function GapIcon({ gap }: { gap: number }) {
  if (gap > 0)
    return (
      <span className="flex items-center gap-1 text-red-400 font-semibold text-sm">
        <TrendingDown className="w-4 h-4" />
        -{Math.ceil(gap)}
      </span>
    );
  if (gap < -0.5)
    return (
      <span className="flex items-center gap-1 text-blue-400 font-semibold text-sm">
        <TrendingUp className="w-4 h-4" />
        +{Math.abs(Math.floor(gap))}
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-green-400 font-semibold text-sm">
      <Minus className="w-4 h-4" />
      OK
    </span>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function SimulacaoPage() {
  const router = useRouter();
  const { lojas, lojaSelecionada, setLojaSelecionada } = useLoja();

  const [setores, setSetores] = useState<SetorData[]>([]);
  const [setorSelecionado, setSetorSelecionado] = useState<SetorData | null>(null);
  const [loadingSetores, setLoadingSetores] = useState(false);

  // migracoes[posicaoId] = quantidade a mover de 6x1 → 5x2
  const [migracoes, setMigracoes] = useState<Record<string, number>>({});
  const [simulado, setSimulado] = useState(false);
  const [resultado, setResultado] = useState<PosicaoSimulada[]>([]);

  // Carrega setores do quadro ideal quando a loja muda
  const fetchSetores = useCallback(async (lojaId: string) => {
    setLoadingSetores(true);
    setSetores([]);
    setSetorSelecionado(null);
    setSimulado(false);
    try {
      const res = await fetch(`/api/rh/simulacao/setor?lojaId=${lojaId}`);
      if (!res.ok) return;
      const data = await res.json();
      setSetores(data.setores ?? []);
    } catch {
      // silencia
    } finally {
      setLoadingSetores(false);
    }
  }, []);

  useEffect(() => {
    if (lojaSelecionada) {
      fetchSetores(lojaSelecionada.id);
    } else {
      setSetores([]);
      setSetorSelecionado(null);
      setSimulado(false);
    }
  }, [lojaSelecionada, fetchSetores]);

  // Ao selecionar setor, inicializa migrações com 0
  const handleSelecionarSetor = (setor: SetorData) => {
    setSetorSelecionado(setor);
    setSimulado(false);
    const init: Record<string, number> = {};
    setor.posicoes.forEach((p) => (init[p.id] = 0));
    setMigracoes(init);
  };

  const handleSimular = () => {
    if (!setorSelecionado) return;
    const res = setorSelecionado.posicoes.map((pos) =>
      simularPosicao(pos, migracoes[pos.id] ?? 0)
    );
    setResultado(res);
    setSimulado(true);
  };

  const handleReset = () => {
    if (!setorSelecionado) return;
    const init: Record<string, number> = {};
    setorSelecionado.posicoes.forEach((p) => (init[p.id] = 0));
    setMigracoes(init);
    setSimulado(false);
  };

  // Totais do resultado
  const totalGargalos = resultado.filter((r) => r.situacao === 'critico').length;
  const totalAtencao = resultado.filter((r) => r.situacao === 'atencao').length;
  const totalOk = resultado.filter((r) => r.situacao === 'ok').length;
  const totalExcesso = resultado.filter((r) => r.situacao === 'excesso').length;
  const custoAdicionalMensal = resultado.reduce((s, r) => s + r.custoDelta, 0);
  const custoAdicionalAnual = custoAdicionalMensal * 14.33;
  const totalMigrar = resultado.reduce((s, r) => s + r.migrar, 0);

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
              Analise o impacto de migrar funcionários de 6x1 para 5x2 por setor
            </p>
          </div>
        </div>

        {/* Seletor de Loja */}
        {lojas.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Selecione a loja
            </p>
            <LojaSelector
              lojas={lojas}
              lojaSelecionada={lojaSelecionada}
              setLojaSelecionada={setLojaSelecionada}
            />
          </div>
        ) : (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 text-gray-400 text-sm">
            Nenhuma loja cadastrada. Acesse RH → Configurações para criar lojas.
          </div>
        )}

        {/* Seletor de Setor */}
        {lojaSelecionada && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Selecione o setor (Quadro Ideal)
            </p>

            {loadingSetores ? (
              <div className="text-gray-500 text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Carregando setores...
              </div>
            ) : setores.length === 0 ? (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm flex gap-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Nenhum quadro ideal configurado para esta loja.{' '}
                  <button
                    className="underline hover:text-amber-300"
                    onClick={() => router.push('/rh/quadro-ideal')}
                  >
                    Configurar agora →
                  </button>
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {setores.map((setor) => (
                  <button
                    key={setor.id}
                    onClick={() => handleSelecionarSetor(setor)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      setorSelecionado?.id === setor.id
                        ? 'bg-amber-500 text-black border-amber-500'
                        : 'bg-[#1c1c1e] text-gray-300 border-[#2a2a2e] hover:border-amber-500/40 hover:text-white'
                    }`}
                  >
                    {setor.nome}
                    <span className="ml-2 opacity-60 text-xs">
                      ({setor.posicoes.length} posições)
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Painel de simulação */}
        {setorSelecionado && (
          <div className="space-y-5">

            {/* Info */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-medium text-white mb-1">Como funciona</p>
                <p className="text-gray-400">
                  Ajuste quantos funcionários de cada posição deseja migrar de{' '}
                  <span className="text-amber-400 font-medium">6x1</span> para{' '}
                  <span className="text-green-400 font-medium">5x2</span>. O simulador calcula a{' '}
                  <strong>cobertura diária mínima garantida</strong> e compara com o mínimo
                  ideal do seu quadro. Gargalos ocorrem quando a cobertura mínima fica abaixo do
                  ideal.
                </p>
              </div>
            </div>

            {/* Tabela de posições com controles */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Setor: {setorSelecionado.nome}
              </h2>

              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
                {/* Cabeçalho */}
                <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-[#2a2a2e] text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="col-span-3">Cargo / Turno</span>
                  <span className="col-span-2 text-center">Atual 6x1</span>
                  <span className="col-span-2 text-center">Atual 5x2</span>
                  <span className="col-span-2 text-center">Ideal mín.</span>
                  <span className="col-span-3 text-center">Migrar → 5x2</span>
                </div>

                {setorSelecionado.posicoes.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-500 text-sm">
                    Nenhuma posição cadastrada neste setor.
                  </div>
                ) : (
                  setorSelecionado.posicoes.map((pos) => (
                    <div
                      key={pos.id}
                      className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[#2a2a2e] last:border-0 items-center hover:bg-[#222224] transition-colors"
                    >
                      <div className="col-span-3">
                        <p className="text-sm font-medium text-white">{pos.cargo.nome}</p>
                        {pos.turno && (
                          <p className="text-xs text-gray-500">
                            {TURNO_LABEL[pos.turno] ?? pos.turno}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-amber-400 font-semibold">{pos.funcionarios6x1}</span>
                        <p className="text-xs text-gray-500">funcionários</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-green-400 font-semibold">{pos.funcionarios5x2}</span>
                        <p className="text-xs text-gray-500">funcionários</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-white font-semibold">{pos.idealMin}</span>
                        <p className="text-xs text-gray-500">mínimo/dia</p>
                      </div>
                      <div className="col-span-3 flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            setMigracoes((m) => ({
                              ...m,
                              [pos.id]: Math.max(0, (m[pos.id] ?? 0) - 1),
                            }))
                          }
                          className="w-8 h-8 rounded-lg bg-[#2a2a2e] flex items-center justify-center text-gray-300 hover:bg-[#3a3a3e] transition-colors"
                        >
                          −
                        </button>
                        <div className="w-12 text-center">
                          <span className="text-lg font-bold text-white">
                            {migracoes[pos.id] ?? 0}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setMigracoes((m) => ({
                              ...m,
                              [pos.id]: Math.min(
                                pos.funcionarios6x1,
                                (m[pos.id] ?? 0) + 1
                              ),
                            }))
                          }
                          disabled={(migracoes[pos.id] ?? 0) >= pos.funcionarios6x1}
                          className="w-8 h-8 rounded-lg bg-[#2a2a2e] flex items-center justify-center text-gray-300 hover:bg-[#3a3a3e] disabled:opacity-30 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3">
              <button
                onClick={handleSimular}
                disabled={setorSelecionado.posicoes.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-amber-500 text-black font-bold text-base hover:bg-amber-400 disabled:opacity-60 transition-colors"
              >
                <Play className="w-5 h-5" />
                Simular
              </button>
              {simulado && (
                <button
                  onClick={handleReset}
                  className="px-5 py-3.5 rounded-2xl bg-[#1c1c1e] border border-[#2a2a2e] text-gray-300 font-medium hover:bg-[#2a2a2e] transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resetar
                </button>
              )}
            </div>

            {/* Resultados da simulação */}
            {simulado && resultado.length > 0 && (
              <div className="space-y-5">

                {/* Cards de resumo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Gargalos</p>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{totalGargalos}</p>
                    <p className="text-xs text-gray-500 mt-0.5">posições críticas</p>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Atenção</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">{totalAtencao}</p>
                    <p className="text-xs text-gray-500 mt-0.5">margem baixa</p>
                  </div>
                  <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Saudável</p>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{totalOk}</p>
                    <p className="text-xs text-gray-500 mt-0.5">posições OK</p>
                  </div>
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Excesso</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">{totalExcesso}</p>
                    <p className="text-xs text-gray-500 mt-0.5">acima do ideal</p>
                  </div>
                </div>

                {/* Tabela de resultado por posição */}
                <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#2a2a2e]">
                    <h3 className="text-sm font-semibold text-white">
                      Resultado por posição — {setorSelecionado.nome}
                    </h3>
                  </div>
                  <div className="grid grid-cols-12 gap-2 px-5 py-2.5 border-b border-[#2a2a2e] text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="col-span-3">Cargo / Turno</span>
                    <span className="col-span-2 text-center">6x1 → 5x2</span>
                    <span className="col-span-2 text-center">Cobert. média</span>
                    <span className="col-span-2 text-center">Cobert. mín.</span>
                    <span className="col-span-1 text-center">Gap</span>
                    <span className="col-span-2 text-center">Status</span>
                  </div>

                  {resultado.map((row) => (
                    <div
                      key={row.id}
                      className={`grid grid-cols-12 gap-2 px-5 py-4 border-b border-[#2a2a2e] last:border-0 items-center transition-colors ${
                        row.situacao === 'critico'
                          ? 'bg-red-500/5'
                          : row.situacao === 'atencao'
                          ? 'bg-amber-500/5'
                          : row.situacao === 'excesso'
                          ? 'bg-blue-500/5'
                          : 'hover:bg-[#222224]'
                      }`}
                    >
                      <div className="col-span-3">
                        <p className="text-sm font-medium text-white">{row.cargo.nome}</p>
                        {row.turno && (
                          <p className="text-xs text-gray-500">
                            {TURNO_LABEL[row.turno] ?? row.turno}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 text-center">
                        {row.migrar > 0 ? (
                          <div>
                            <span className="text-amber-400 font-semibold">{row.proposto6x1}</span>
                            <span className="text-gray-600 mx-1 text-xs">+</span>
                            <span className="text-green-400 font-semibold">{row.proposto5x2}</span>
                            <p className="text-xs text-gray-500">{row.migrar} migrado(s)</p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-amber-400 font-semibold">{row.proposto6x1}</span>
                            <span className="text-gray-600 mx-1 text-xs">+</span>
                            <span className="text-green-400 font-semibold">{row.proposto5x2}</span>
                            <p className="text-xs text-gray-500">sem mudança</p>
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-white font-semibold">
                          {row.coberturaDiaria.toFixed(1)}
                        </span>
                        <p className="text-xs text-gray-500">func/dia</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <span
                          className={`font-semibold ${
                            row.coberturaMinima >= row.idealMin
                              ? 'text-green-400'
                              : row.coberturaMinima >= row.idealMin * 0.8
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {row.coberturaMinima.toFixed(1)}
                        </span>
                        <p className="text-xs text-gray-500">mín. real</p>
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <GapIcon gap={row.gap} />
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <SituacaoBadge situacao={row.situacao} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Análise detalhada de gargalos */}
                {(totalGargalos > 0 || totalAtencao > 0) && (
                  <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Análise de riscos
                    </h3>

                    {resultado
                      .filter((r) => r.situacao === 'critico' || r.situacao === 'atencao')
                      .map((row) => (
                        <div
                          key={row.id}
                          className={`rounded-xl p-4 border ${
                            row.situacao === 'critico'
                              ? 'bg-red-500/5 border-red-500/20'
                              : 'bg-amber-500/5 border-amber-500/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {row.cargo.nome}
                                {row.turno && (
                                  <span className="text-gray-400 font-normal ml-2">
                                    · {TURNO_LABEL[row.turno] ?? row.turno}
                                  </span>
                                )}
                              </p>
                              {row.situacao === 'critico' ? (
                                <p className="text-xs text-red-300 mt-1">
                                  Cobertura mínima{' '}
                                  <strong>{row.coberturaMinima.toFixed(1)}</strong> está abaixo do
                                  ideal de <strong>{row.idealMin}</strong>. Em dias com múltiplas
                                  folgas simultâneas, faltarão{' '}
                                  <strong>{Math.ceil(row.gap)} funcionário(s)</strong>. Risco de
                                  operação descoberta.
                                </p>
                              ) : (
                                <p className="text-xs text-amber-300 mt-1">
                                  Cobertura mínima{' '}
                                  <strong>{row.coberturaMinima.toFixed(1)}</strong> está próxima
                                  do ideal ({row.idealMin}). Margem de segurança baixa — qualquer
                                  ausência imprevista pode gerar gargalo.
                                </p>
                              )}
                            </div>
                            {row.custoDelta > 0 && (
                              <div className="flex-shrink-0 text-right">
                                <p className="text-xs text-gray-500">Custo de reforço</p>
                                <p className="text-sm font-bold text-amber-400">
                                  {fmt(row.custoDelta)}/mês
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Impacto financeiro */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-green-400" />
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        Migrar para 5x2
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-white">{totalMigrar}</p>
                    <p className="text-xs text-gray-500 mt-1">funcionários no cenário proposto</p>
                  </div>
                  <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        Custo de reforço/mês
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-amber-400">
                      {custoAdicionalMensal > 0 ? fmt(custoAdicionalMensal) : '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {custoAdicionalMensal > 0
                        ? 'contratações necessárias p/ cobrir gargalos'
                        : 'nenhuma contratação necessária'}
                    </p>
                  </div>
                  <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                        Custo de reforço/ano
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">
                      {custoAdicionalAnual > 0 ? fmt(custoAdicionalAnual) : '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">13°, férias e encargos inclusos</p>
                  </div>
                </div>

                {/* Excesso de pessoal */}
                {totalExcesso > 0 && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      Excesso de pessoal detectado
                    </h3>
                    <div className="space-y-2">
                      {resultado
                        .filter((r) => r.situacao === 'excesso')
                        .map((row) => (
                          <div key={row.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-white">
                                {row.cargo.nome}
                                {row.turno && (
                                  <span className="text-gray-400 ml-2">
                                    · {TURNO_LABEL[row.turno] ?? row.turno}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                Cobertura média {row.coberturaDiaria.toFixed(1)} vs ideal{' '}
                                {row.idealMin} (
                                {Math.round((row.coberturaDiaria / row.idealMin - 1) * 100)}%
                                acima)
                              </p>
                            </div>
                            <span className="text-blue-400 text-sm font-semibold">
                              +{Math.floor(row.coberturaDiaria - row.idealMin)} extra
                            </span>
                          </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Posições com excesso podem absorver mais migrações para 5x2 sem risco operacional.
                    </p>
                  </div>
                )}

                {/* Tudo OK */}
                {totalGargalos === 0 && totalAtencao === 0 && totalExcesso === 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-green-400 font-semibold text-sm">
                        Cenário saudável!
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Todas as posições mantêm cobertura adequada com a migração proposta. Nenhum
                        gargalo detectado.
                      </p>
                    </div>
                  </div>
                )}

                {/* Legenda */}
                <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                    Como os cálculos são feitos
                  </h3>
                  <div className="text-sm text-gray-400 space-y-2">
                    <p>
                      <span className="text-amber-400 font-medium">Escala 6x1</span>: cada
                      funcionário trabalha 6 dias e folga 1 → cobre{' '}
                      <strong className="text-white">85,7%</strong> dos dias (fator 6/7).
                    </p>
                    <p>
                      <span className="text-green-400 font-medium">Escala 5x2</span>: trabalha 5
                      dias e folga 2 → cobre{' '}
                      <strong className="text-white">71,4%</strong> dos dias (fator 5/7).
                    </p>
                    <p>
                      <strong className="text-white">Cobertura mínima garantida</strong>: considera
                      o pior dia da semana com folgas simultâneas distribuídas de forma ótima e
                      rotativa. Para 6x1 com N pessoas:{' '}
                      <code className="bg-[#2a2a2e] px-1 rounded text-xs">N − ⌈N/7⌉</code>. Para
                      5x2:{' '}
                      <code className="bg-[#2a2a2e] px-1 rounded text-xs">N − ⌈2N/7⌉</code>.
                    </p>
                    <p>
                      <strong className="text-white">Gargalo</strong>: cobertura mínima abaixo do
                      mínimo ideal. <strong className="text-white">Atenção</strong>: cobertura
                      mínima dentro do ideal mas com margem inferior a 15%. <strong className="text-white">Excesso</strong>: cobertura média superior a 150% do ideal.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado inicial sem loja selecionada */}
        {!lojaSelecionada && lojas.length > 0 && (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-8 text-center">
            <Layers className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              Selecione uma loja acima para carregar os setores do Quadro Ideal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
