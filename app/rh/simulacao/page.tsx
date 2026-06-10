'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLoja, Loja } from '@/contexts/LojaContext';
import {
  ArrowLeft, BarChart3, AlertTriangle, CheckCircle,
  Users, Layers, DollarSign, RefreshCw, Plus,
  TrendingDown, ChevronDown, ChevronUp, ArrowRight,
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

// ─── Cálculos ────────────────────────────────────────────────────────────────

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

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function LojaSelector({ lojas, lojaSelecionada, setLojaSelecionada }: {
  lojas: Loja[];
  lojaSelecionada: Loja | null;
  setLojaSelecionada: (l: Loja | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {lojas.map((loja) => (
        <button key={loja.id} onClick={() => setLojaSelecionada(loja)}
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
        <div className={`h-full rounded-full transition-all duration-300 ${cor}`} style={{ width: `${Math.round(pct * 100)}%` }} />
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

// Card de posição com controle de migração embutido
function PosicaoCard({ pos, migrar, onMigrar, modoSimulacao }: {
  pos: PosicaoData;
  migrar: number;
  onMigrar: (v: number) => void;
  modoSimulacao: boolean;
}) {
  const simulado = simularPosicao(pos, migrar);
  const base = simularPosicao(pos, 0); // estado sem migração para comparação

  const border =
    simulado.situacao === 'critico' ? 'border-red-500/30' :
    simulado.situacao === 'atencao' ? 'border-amber-500/30' :
    'border-[#2a2a2e]';

  return (
    <div className={`bg-[#1c1c1e] border rounded-2xl p-4 transition-all ${border}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-white">{pos.cargo.nome}</p>
          {pos.turno && <p className="text-xs text-gray-500 mt-0.5">{TURNO_LABEL[pos.turno] ?? pos.turno}</p>}
        </div>
        <StatusTag situacao={simulado.situacao} />
      </div>

      {/* Composição da equipe */}
      <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
        <Users className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
        <span className="text-amber-400 font-medium">{simulado.proposto6x1} 6x1</span>
        {simulado.proposto5x2 > 0 && (
          <><span className="text-gray-600">+</span><span className="text-green-400 font-medium">{simulado.proposto5x2} 5x2</span></>
        )}
        <span className="text-gray-600">na equipe</span>
      </div>

      {/* Controle de migração — só aparece em modo simulação */}
      {modoSimulacao && pos.funcionarios6x1 > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2.5 bg-[#252528] rounded-xl">
          <span className="text-xs text-gray-400 flex-1">Migrar para 5x2</span>
          <button
            onClick={() => onMigrar(Math.max(0, migrar - 1))}
            disabled={migrar <= 0}
            className="w-7 h-7 rounded-lg bg-[#2a2a2e] flex items-center justify-center text-gray-300 hover:bg-[#3a3a3e] disabled:opacity-30 transition-colors text-base leading-none"
          >
            −
          </button>
          <span className="text-sm font-bold text-white w-6 text-center">{migrar}</span>
          <button
            onClick={() => onMigrar(Math.min(pos.funcionarios6x1, migrar + 1))}
            disabled={migrar >= pos.funcionarios6x1}
            className="w-7 h-7 rounded-lg bg-[#2a2a2e] flex items-center justify-center text-gray-300 hover:bg-[#3a3a3e] disabled:opacity-30 transition-colors text-base leading-none"
          >
            +
          </button>
          <span className="text-xs text-gray-500">de {pos.funcionarios6x1}</span>
        </div>
      )}

      {/* Barras de cobertura */}
      <div className="space-y-2">
        <CoberturaBar atual={simulado.coberturaMinima} ideal={simulado.idealMin} label="Pior dia garantido" />
        <CoberturaBar atual={simulado.coberturaDiaria} ideal={simulado.idealMin} label="Presença média/dia" />
      </div>

      {/* Comparação (antes vs depois) */}
      {modoSimulacao && migrar > 0 && base.coberturaMinima !== simulado.coberturaMinima && (
        <p className="text-xs text-gray-500 mt-2">
          Antes: pior dia era {base.coberturaMinima.toFixed(1)} → agora {simulado.coberturaMinima.toFixed(1)}
        </p>
      )}

      {/* Gap alert */}
      {simulado.gap > 0 && (
        <div className="flex items-center gap-1.5 text-red-400 text-xs font-semibold mt-2">
          <TrendingDown className="w-3.5 h-3.5" />
          Falta {Math.ceil(simulado.gap)} pessoa{Math.ceil(simulado.gap) !== 1 ? 's' : ''} no pior dia
        </div>
      )}
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
  const [modo, setModo] = useState<'atual' | 'simular'>('atual');
  // migracoes[posicaoId] = quantas pessoas mover de 6x1 → 5x2
  const [migracoes, setMigracoes] = useState<Record<string, number>>({});
  const [showExplicacao, setShowExplicacao] = useState(false);

  const fetchSetores = useCallback(async (lojaId: string) => {
    setLoadingSetores(true);
    setSetores([]);
    setSetorSelecionado(null);
    setModo('atual');
    setMigracoes({});
    try {
      const res = await fetch(`/api/rh/simulacao/setor?lojaId=${lojaId}`);
      if (!res.ok) return;
      const data = await res.json();
      setSetores(data.setores ?? []);
    } catch { /* silencia */ } finally {
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
    const init: Record<string, number> = {};
    setor.posicoes.forEach(p => (init[p.id] = 0));
    setMigracoes(init);
  };

  const handleMigrar = (posId: string, v: number) =>
    setMigracoes(m => ({ ...m, [posId]: v }));

  const migrarTodos = () => {
    if (!setorSelecionado) return;
    const todos: Record<string, number> = {};
    setorSelecionado.posicoes.forEach(p => (todos[p.id] = p.funcionarios6x1));
    setMigracoes(todos);
  };

  const resetarMigracoes = () => {
    if (!setorSelecionado) return;
    const init: Record<string, number> = {};
    setorSelecionado.posicoes.forEach(p => (init[p.id] = 0));
    setMigracoes(init);
  };

  // Calcula resultados reativos
  const resultado: PosicaoSimulada[] = (setorSelecionado?.posicoes ?? []).map(p =>
    simularPosicao(p, modo === 'simular' ? (migracoes[p.id] ?? 0) : 0)
  );

  const totalGargalos = resultado.filter(r => r.situacao === 'critico').length;
  const totalAtencao = resultado.filter(r => r.situacao === 'atencao').length;
  const custoMensal = resultado.reduce((s, r) => s + r.custoDelta, 0);
  const custoAnual = custoMensal * 14.33;
  const totalMigrando = Object.values(migracoes).reduce((s, v) => s + v, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/rh')}
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
              Veja a cobertura da equipe e simule a migração para 5x2
            </p>
          </div>
        </div>

        {/* Loja */}
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

        {/* Setor */}
        {lojaSelecionada && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" /> Setor
              </p>
              {/* Link para criar setores no Quadro Ideal */}
              <button
                onClick={() => router.push('/rh/quadro-ideal')}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar / editar setores
              </button>
            </div>

            {loadingSetores ? (
              <div className="text-gray-500 text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Carregando…
              </div>
            ) : setores.length === 0 ? (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-4 text-sm">
                <p className="text-amber-400 font-medium mb-1">Nenhum setor configurado para esta loja.</p>
                <p className="text-gray-400 mb-3">O simulador usa os setores e posições do Quadro Ideal. Configure-o primeiro.</p>
                <button
                  onClick={() => router.push('/rh/quadro-ideal')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-black text-sm font-semibold rounded-xl hover:bg-amber-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Configurar Quadro Ideal
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {setores.map(setor => (
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

        {/* Conteúdo do setor selecionado */}
        {setorSelecionado && setorSelecionado.posicoes.length > 0 && (
          <div className="space-y-5">

            {/* Toggle de modo */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-1 flex gap-1">
              <button
                onClick={() => setModo('atual')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  modo === 'atual' ? 'bg-[#2a2a2e] text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Como está hoje
              </button>
              <button
                onClick={() => setModo('simular')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  modo === 'simular'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                Simular migração para 5x2
              </button>
            </div>

            {/* Atalhos de migração (só no modo simular) */}
            {modo === 'simular' && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  {totalMigrando > 0
                    ? <><span className="text-amber-400 font-semibold">{totalMigrando}</span> funcionário{totalMigrando !== 1 ? 's' : ''} sendo migrado{totalMigrando !== 1 ? 's' : ''}</>
                    : 'Ajuste quantos funcionários migrar em cada posição'}
                </p>
                <div className="flex gap-2">
                  {totalMigrando > 0 && (
                    <button onClick={resetarMigracoes}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#2a2a2e] text-gray-400 hover:text-white hover:bg-[#3a3a3e] transition-colors"
                    >
                      Zerar
                    </button>
                  )}
                  <button onClick={migrarTodos}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                  >
                    Migrar todos →
                  </button>
                </div>
              </div>
            )}

            {/* Cards de posição */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {setorSelecionado.posicoes.map(pos => (
                <PosicaoCard
                  key={pos.id}
                  pos={pos}
                  migrar={modo === 'simular' ? (migracoes[pos.id] ?? 0) : 0}
                  onMigrar={v => handleMigrar(pos.id, v)}
                  modoSimulacao={modo === 'simular'}
                />
              ))}
            </div>

            {/* Pontos de atenção */}
            {totalGargalos + totalAtencao > 0 && (
              <div className={`rounded-2xl p-4 border space-y-3 ${
                totalGargalos > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'
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
                    {modo === 'simular' && totalMigrando > 0
                      ? 'A migração proposta não gera nenhum risco operacional.'
                      : 'Todas as posições têm cobertura suficiente mesmo no pior dia.'}
                  </p>
                </div>
              </div>
            )}

            {/* Impacto financeiro */}
            {custoMensal > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Custo de reforço / mês</p>
                  </div>
                  <p className="text-2xl font-bold text-amber-400">{fmt(custoMensal)}</p>
                  <p className="text-xs text-gray-500 mt-1">estimativa para cobrir os gargalos</p>
                </div>
                <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Custo de reforço / ano</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">{fmt(custoAnual)}</p>
                  <p className="text-xs text-gray-500 mt-1">com 13°, férias e encargos</p>
                </div>
              </div>
            )}

            {/* Explicação colapsável */}
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
                  <p><span className="text-amber-400 font-medium">6x1</span>: trabalha 6 dias, folga 1. Presente em 85,7% dos dias.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0 mt-1" />
                  <p><span className="text-green-400 font-medium">5x2</span>: trabalha 5 dias, folga 2. Presente em 71,4% dos dias.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                  <p><span className="text-white font-medium">Pior dia garantido</span>: quantas pessoas trabalham no dia com mais folgas simultâneas (distribuição ótima rotativa).</p>
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
            <p className="text-gray-400 text-sm mb-3">Nenhuma posição cadastrada neste setor.</p>
            <button onClick={() => router.push('/rh/quadro-ideal')}
              className="text-amber-400 text-sm underline hover:text-amber-300"
            >
              Configurar Quadro Ideal →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
