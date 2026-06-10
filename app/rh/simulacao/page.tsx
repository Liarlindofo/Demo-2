'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLoja, Loja } from '@/contexts/LojaContext';
import {
  ArrowLeft, BarChart3, AlertTriangle, CheckCircle,
  Users, Layers, DollarSign, RefreshCw, ArrowRight,
  TrendingDown, Minus, ChevronDown, ChevronUp,
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
  migrar: number;
  proposto6x1: number;
  proposto5x2: number;
  coberturaDiaria: number;
  coberturaMinima: number;
  gap: number;
  situacao: 'critico' | 'atencao' | 'ok' | 'excesso';
  custoDelta: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ENCARGOS = 1.44;
const FATOR_6x1 = 6 / 7;
const FATOR_5x2 = 5 / 7;

function coberturaDiaria(n6x1: number, n5x2: number) {
  return n6x1 * FATOR_6x1 + n5x2 * FATOR_5x2;
}

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

  return { ...pos, migrar: migrarClamp, proposto6x1: p6x1, proposto5x2: p5x2, coberturaDiaria: cDiaria, coberturaMinima: cMin, gap, situacao, custoDelta };
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const TURNO_LABEL: Record<string, string> = {
  manhã: 'Manhã', tarde: 'Tarde', noite: 'Noite', integral: 'Integral',
};

// ─── Componentes ─────────────────────────────────────────────────────────────

function LojaSelector({ lojas, lojaSelecionada, setLojaSelecionada }: {
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

function CoberturaBar({ atual, ideal, label }: { atual: number; ideal: number; label: string }) {
  const pct = ideal > 0 ? Math.min(1, atual / ideal) : 0;
  const cor = pct >= 1 ? 'bg-green-500' : pct >= 0.8 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={`text-xs font-semibold ${pct >= 1 ? 'text-green-400' : pct >= 0.8 ? 'text-amber-400' : 'text-red-400'}`}>
          {atual.toFixed(1)} / {ideal}
        </span>
      </div>
      <div className="h-2 bg-[#2a2a2e] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${cor}`} style={{ width: `${Math.round(pct * 100)}%` }} />
      </div>
    </div>
  );
}

function StatusTag({ situacao }: { situacao: PosicaoSimulada['situacao'] }) {
  const map = {
    critico: { label: 'Risco de descoberta', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    atencao: { label: 'Margem baixa', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    ok: { label: 'Cobertura OK', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    excesso: { label: 'Acima do necessário', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  };
  const { label, cls } = map[situacao];
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>{label}</span>;
}

function GapTag({ gap }: { gap: number }) {
  if (gap <= 0) return null;
  return (
    <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold mt-1.5">
      <TrendingDown className="w-3.5 h-3.5" />
      Falta {Math.ceil(gap)} pessoa{Math.ceil(gap) !== 1 ? 's' : ''} no pior dia
    </div>
  );
}

function PosicaoCard({ atual, projetado, modoComparacao }: {
  atual: PosicaoSimulada;
  projetado: PosicaoSimulada | null;
  modoComparacao: boolean;
}) {
  const exibir = modoComparacao && projetado ? projetado : atual;
  const mudou = modoComparacao && projetado && (projetado.situacao !== atual.situacao);

  return (
    <div className={`bg-[#1c1c1e] border rounded-2xl p-4 transition-all ${
      exibir.situacao === 'critico' ? 'border-red-500/30' :
      exibir.situacao === 'atencao' ? 'border-amber-500/30' :
      'border-[#2a2a2e]'
    }`}>
      {/* Header do card */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-white">{exibir.cargo.nome}</p>
          {exibir.turno && (
            <p className="text-xs text-gray-500 mt-0.5">{TURNO_LABEL[exibir.turno] ?? exibir.turno}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusTag situacao={exibir.situacao} />
          {mudou && projetado && (
            <span className="text-xs text-gray-500">
              era <span className={atual.situacao === 'critico' ? 'text-red-400' : atual.situacao === 'atencao' ? 'text-amber-400' : 'text-green-400'}>{
                atual.situacao === 'critico' ? 'risco' : atual.situacao === 'atencao' ? 'margem baixa' : 'OK'
              }</span>
            </span>
          )}
        </div>
      </div>

      {/* Equipe atual */}
      <div className="flex items-center gap-3 mb-3 text-sm">
        <Users className="w-4 h-4 text-gray-600 flex-shrink-0" />
        {modoComparacao && projetado ? (
          <span className="text-gray-300">
            <span className="text-amber-400 font-medium">{projetado.proposto6x1} 6x1</span>
            {' + '}
            <span className="text-green-400 font-medium">{projetado.proposto5x2} 5x2</span>
            {projetado.migrar > 0 && (
              <span className="text-gray-500 ml-1.5">({projetado.migrar} migrado{projetado.migrar !== 1 ? 's' : ''})</span>
            )}
          </span>
        ) : (
          <span className="text-gray-300">
            <span className="text-amber-400 font-medium">{exibir.funcionarios6x1} 6x1</span>
            {exibir.funcionarios5x2 > 0 && (
              <><span className="text-gray-600 mx-1">+</span><span className="text-green-400 font-medium">{exibir.funcionarios5x2} 5x2</span></>
            )}
            <span className="text-gray-600 ml-1.5">na equipe</span>
          </span>
        )}
      </div>

      {/* Barra de cobertura */}
      <div className="space-y-2">
        <CoberturaBar
          atual={exibir.coberturaMinima}
          ideal={exibir.idealMin}
          label="Pior dia garantido"
        />
        <CoberturaBar
          atual={exibir.coberturaDiaria}
          ideal={exibir.idealMin}
          label="Presença média/dia"
        />
      </div>

      <GapTag gap={exibir.gap} />
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SimulacaoPage() {
  const router = useRouter();
  const { lojas, lojaSelecionada, setLojaSelecionada } = useLoja();

  const [setores, setSetores] = useState<SetorData[]>([]);
  const [setorSelecionado, setSetorSelecionado] = useState<SetorData | null>(null);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [modo, setModo] = useState<'atual' | '5x2'>('atual');
  const [showExplicacao, setShowExplicacao] = useState(false);

  const fetchSetores = useCallback(async (lojaId: string) => {
    setLoadingSetores(true);
    setSetores([]);
    setSetorSelecionado(null);
    setModo('atual');
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
    if (lojaSelecionada) fetchSetores(lojaSelecionada.id);
    else { setSetores([]); setSetorSelecionado(null); }
  }, [lojaSelecionada, fetchSetores]);

  const handleSelecionarSetor = (setor: SetorData) => {
    setSetorSelecionado(setor);
    setModo('atual');
  };

  // Calcula resultado imediatamente (sem botão)
  const resultadoAtual: PosicaoSimulada[] = setorSelecionado
    ? setorSelecionado.posicoes.map((p) => simularPosicao(p, 0))
    : [];

  const resultadoProjetado: PosicaoSimulada[] = setorSelecionado
    ? setorSelecionado.posicoes.map((p) => simularPosicao(p, p.funcionarios6x1))
    : [];

  const resultado = modo === '5x2' ? resultadoProjetado : resultadoAtual;

  const totalGargalos = resultado.filter((r) => r.situacao === 'critico').length;
  const totalAtencao = resultado.filter((r) => r.situacao === 'atencao').length;
  const custoAdicionalMensal = resultado.reduce((s, r) => s + r.custoDelta, 0);
  const custoAdicionalAnual = custoAdicionalMensal * 14.33;
  const totalMigrar = resultadoProjetado.reduce((s, r) => s + r.migrar, 0);

  // Conta mudanças ao comparar modos
  const melhoras = resultadoAtual.filter((a, i) => {
    const p = resultadoProjetado[i];
    if (!p) return false;
    const ord = ['critico','atencao','ok','excesso'];
    return ord.indexOf(p.situacao) > ord.indexOf(a.situacao);
  }).length;
  const pioras = resultadoAtual.filter((a, i) => {
    const p = resultadoProjetado[i];
    if (!p) return false;
    const ord = ['critico','atencao','ok','excesso'];
    return ord.indexOf(p.situacao) < ord.indexOf(a.situacao);
  }).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

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
              Veja a cobertura da sua equipe e o impacto de migrar para 5x2
            </p>
          </div>
        </div>

        {/* Seletor de Loja */}
        {lojas.length === 0 ? (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 text-gray-400 text-sm">
            Nenhuma loja cadastrada.
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Loja</p>
            <LojaSelector lojas={lojas} lojaSelecionada={lojaSelecionada} setLojaSelecionada={setLojaSelecionada} />
          </div>
        )}

        {/* Seletor de Setor */}
        {lojaSelecionada && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Setor
            </p>

            {loadingSetores ? (
              <div className="text-gray-500 text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Carregando…
              </div>
            ) : setores.length === 0 ? (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm flex gap-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Nenhum quadro ideal configurado para esta loja.{' '}
                  <button className="underline hover:text-amber-300" onClick={() => router.push('/rh/quadro-ideal')}>
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
                    <span className="ml-1.5 opacity-50 text-xs">({setor.posicoes.length})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Diagnóstico do setor */}
        {setorSelecionado && setorSelecionado.posicoes.length > 0 && (
          <div className="space-y-5">

            {/* Toggle de modo */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-1 flex gap-1">
              <button
                onClick={() => setModo('atual')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  modo === 'atual'
                    ? 'bg-[#2a2a2e] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Como está hoje
              </button>
              <button
                onClick={() => setModo('5x2')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  modo === '5x2'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                E se todos fossem para 5x2?
              </button>
            </div>

            {/* Resumo rápido de mudanças (só no modo 5x2) */}
            {modo === '5x2' && (melhoras > 0 || pioras > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {melhoras > 0 && (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-400">{melhoras} melhora{melhoras !== 1 ? 'm' : ''}</p>
                      <p className="text-xs text-gray-500">posições ficam mais seguras</p>
                    </div>
                  </div>
                )}
                {pioras > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-400">{pioras} piora{pioras !== 1 ? 'm' : ''}</p>
                      <p className="text-xs text-gray-500">posições ficam em risco</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pergunta principal */}
            <div>
              <h2 className="text-base font-semibold text-white mb-1">
                {modo === 'atual'
                  ? `Como está a equipe de ${setorSelecionado.nome} hoje?`
                  : `Se todos os ${totalMigrar} funcionários migrarem para 5x2…`}
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                {modo === 'atual'
                  ? 'Cobertura no pior dia (quando mais pessoas estão de folga ao mesmo tempo).'
                  : `Cada pessoa trabalhará 5 dias e folga 2. Veja o impacto por posição.`}
              </p>

              {/* Cards de posição */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resultadoAtual.map((atual, i) => (
                  <PosicaoCard
                    key={atual.id}
                    atual={atual}
                    projetado={resultadoProjetado[i] ?? null}
                    modoComparacao={modo === '5x2'}
                  />
                ))}
              </div>
            </div>

            {/* Pontos de atenção */}
            {totalGargalos + totalAtencao > 0 && (
              <div className={`rounded-2xl p-4 border space-y-3 ${
                totalGargalos > 0
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-amber-500/5 border-amber-500/20'
              }`}>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${totalGargalos > 0 ? 'text-red-400' : 'text-amber-400'}`} />
                  {totalGargalos > 0
                    ? `${totalGargalos} posição${totalGargalos !== 1 ? 'ões' : ''} com risco de operação descoberta`
                    : `${totalAtencao} posição${totalAtencao !== 1 ? 'ões' : ''} com margem baixa`}
                </h3>
                {resultado.filter(r => r.situacao === 'critico' || r.situacao === 'atencao').map(row => (
                  <div key={row.id} className="flex items-center justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {row.cargo.nome}{row.turno ? ` · ${TURNO_LABEL[row.turno] ?? row.turno}` : ''}
                      </p>
                      <p className={`text-xs mt-0.5 ${row.situacao === 'critico' ? 'text-red-300' : 'text-amber-300'}`}>
                        {row.situacao === 'critico'
                          ? `Faltarão ${Math.ceil(row.gap)} pessoa${Math.ceil(row.gap) !== 1 ? 's' : ''} nos dias com mais folgas`
                          : 'Qualquer falta imprevista pode gerar gargalo'}
                      </p>
                    </div>
                    {row.custoDelta > 0 && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">Reforço estimado</p>
                        <p className="text-sm font-bold text-amber-400">{fmt(row.custoDelta)}/mês</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Tudo bem */}
            {totalGargalos === 0 && totalAtencao === 0 && (
              <div className="bg-green-500/5 border border-green-500/20 rounded-2xl px-5 py-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-400 font-semibold text-sm">Cobertura adequada!</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {modo === 'atual'
                      ? 'Todas as posições têm cobertura suficiente mesmo no pior dia.'
                      : 'A migração não gera nenhum risco operacional neste setor.'}
                  </p>
                </div>
              </div>
            )}

            {/* Impacto financeiro (só mostra se há custo) */}
            {custoAdicionalMensal > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Custo de reforço / mês</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-400">{fmt(custoAdicionalMensal)}</p>
                  <p className="text-xs text-gray-500 mt-1">estimativa para cobrir os gargalos</p>
                </div>
                <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Custo de reforço / ano</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">{fmt(custoAdicionalAnual)}</p>
                  <p className="text-xs text-gray-500 mt-1">com 13°, férias e encargos</p>
                </div>
              </div>
            )}

            {/* Explicação técnica colapsável */}
            <button
              onClick={() => setShowExplicacao(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl text-sm text-gray-400 hover:text-white hover:bg-[#222224] transition-colors"
            >
              <span>Como esses números são calculados?</span>
              {showExplicacao ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showExplicacao && (
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 text-sm text-gray-400 space-y-3">
                <div className="flex gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0 mt-1" />
                  <p><span className="text-amber-400 font-medium">Escala 6x1</span>: o funcionário trabalha 6 dias e folga 1. Em média, está presente 85,7% dos dias.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                  <p><span className="text-green-400 font-medium">Escala 5x2</span>: trabalha 5 dias e folga 2. Presença em 71,4% dos dias.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                  <p><span className="text-white font-medium">Pior dia garantido</span>: quantas pessoas estarão trabalhando no dia da semana com mais folgas simultâneas — assumindo distribuição ótima e rotativa.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                  <p><span className="text-white font-medium">Risco de descoberta</span>: o pior dia está abaixo do mínimo definido no Quadro Ideal.</p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Estado inicial */}
        {!lojaSelecionada && lojas.length > 0 && (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-10 text-center">
            <Layers className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Selecione uma loja para ver a análise de cobertura.</p>
          </div>
        )}

        {setorSelecionado && setorSelecionado.posicoes.length === 0 && (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-8 text-center">
            <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma posição cadastrada neste setor.</p>
            <button
              className="mt-3 text-amber-400 text-sm underline hover:text-amber-300"
              onClick={() => router.push('/rh/quadro-ideal')}
            >
              Configurar Quadro Ideal →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
