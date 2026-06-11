'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLoja, Loja } from '@/contexts/LojaContext';
import {
  ArrowLeft, BarChart3, AlertTriangle, CheckCircle,
  Users, RefreshCw, Plus, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Funcionario {
  id: string;
  nome: string;
  cargo: string;
  escala: string;
  turno: string;
  diasFolga: string[];
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'] as const;
const DIAS_LABEL: Record<string, string> = {
  domingo: 'Dom', segunda: 'Seg', 'terça': 'Ter',
  quarta: 'Qua', quinta: 'Qui', sexta: 'Sex', 'sábado': 'Sáb',
};
const TURNO_LABEL: Record<string, string> = {
  manhã: 'Manhã', tarde: 'Tarde', noite: 'Noite', integral: 'Integral',
};

// ─── Cálculo de cobertura (baseado nos dias de folga reais) ──────────────────

function calcularCobertura(
  funcionarios: Funcionario[],
  sobrepor: Record<string, string[]> // id → novos diasFolga na simulação
): Record<string, Record<string, Funcionario[]>> {
  const resultado: Record<string, Record<string, Funcionario[]>> = {};
  for (const dia of DIAS) {
    resultado[dia] = {};
    const turnos = [...new Set(funcionarios.map(f => f.turno))];
    for (const turno of turnos) {
      resultado[dia][turno] = funcionarios.filter(f => {
        if (f.turno !== turno) return false;
        const folgas = sobrepor[f.id] ?? f.diasFolga;
        return !folgas.includes(dia);
      });
    }
  }
  return resultado;
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function LojaSelector({ lojas, lojaSelecionada, setLojaSelecionada }: {
  lojas: Loja[];
  lojaSelecionada: Loja | null;
  setLojaSelecionada: (l: Loja | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {lojas.map(loja => (
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

function CelulaGrid({ presentes, ideal, dia, turno, onClick }: {
  presentes: Funcionario[];
  ideal: number;
  dia: string;
  turno: string;
  onClick: () => void;
}) {
  const n = presentes.length;
  const semIdeal = ideal === 0;
  const status = semIdeal
    ? 'neutro'
    : n >= ideal ? 'ok'
    : n === ideal - 1 ? 'atencao'
    : 'critico';

  const bg = status === 'ok' ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/15'
    : status === 'atencao' ? 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15'
    : status === 'critico' ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15'
    : 'bg-[#1c1c1e] border-[#2a2a2e] hover:bg-[#252528]';

  const textColor = status === 'ok' ? 'text-green-400'
    : status === 'atencao' ? 'text-amber-400'
    : status === 'critico' ? 'text-red-400'
    : 'text-gray-300';

  return (
    <button
      onClick={onClick}
      className={`border rounded-xl p-2.5 text-center transition-all cursor-pointer ${bg}`}
      title={`${DIAS_LABEL[dia]} · ${TURNO_LABEL[turno] ?? turno}: ${n} trabalhando${ideal > 0 ? ` (ideal: ${ideal})` : ''}`}
    >
      <p className={`text-lg font-bold leading-none ${textColor}`}>{n}</p>
      {ideal > 0 && (
        <p className="text-[10px] text-gray-500 mt-0.5">/ {ideal}</p>
      )}
    </button>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SimulacaoPage() {
  const router = useRouter();
  const { lojas, lojaSelecionada, setLojaSelecionada } = useLoja();

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [ideais, setIdeais] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Estado da simulação: id → novos diasFolga (2 dias para 5x2)
  const [migrando, setMigrando] = useState<Record<string, boolean>>({}); // quem está sendo migrado
  const [novaFolga, setNovaFolga] = useState<Record<string, string[]>>({});  // novos dias

  const [celulaSelecionada, setCelulaSelecionada] = useState<{ dia: string; turno: string } | null>(null);
  const [modoSimulacao, setModoSimulacao] = useState(false);
  const [showExplicacao, setShowExplicacao] = useState(false);

  const fetchDados = useCallback(async (lojaId: string) => {
    setLoading(true);
    setFuncionarios([]);
    setIdeais({});
    setMigrando({});
    setNovaFolga({});
    setCelulaSelecionada(null);
    setModoSimulacao(false);
    try {
      const res = await fetch(`/api/rh/simulacao/cobertura?lojaId=${lojaId}`);
      if (!res.ok) return;
      const data = await res.json();
      setFuncionarios(data.funcionarios ?? []);
      setIdeais(data.ideais ?? {});
    } catch { /* silencia */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (lojaSelecionada) fetchDados(lojaSelecionada.id);
    else setFuncionarios([]);
  }, [lojaSelecionada, fetchDados]);

  // Monta as sobreposições de folga para simulação
  const sobrepor: Record<string, string[]> = {};
  for (const f of funcionarios) {
    if (migrando[f.id]) {
      sobrepor[f.id] = novaFolga[f.id] ?? f.diasFolga;
    }
  }

  const coberturaAtual = calcularCobertura(funcionarios, {});
  const coberturaSimulada = calcularCobertura(funcionarios, sobrepor);
  const cobertura = modoSimulacao ? coberturaSimulada : coberturaAtual;

  // Turnos que têm pelo menos 1 funcionário
  const turnos = ['manhã', 'tarde', 'noite', 'integral'].filter(t =>
    funcionarios.some(f => f.turno === t)
  );

  // Funcionários 6x1 (candidatos a migrar)
  const f6x1 = funcionarios.filter(f => f.escala === '6x1');

  // Conta dias com gap na cobertura simulada
  const diasComGap = modoSimulacao
    ? DIAS.filter(dia => turnos.some(t => {
        const ideal = ideais[t] ?? 0;
        const n = coberturaSimulada[dia]?.[t]?.length ?? 0;
        return ideal > 0 && n < ideal;
      })).length
    : 0;

  // Quem está de folga no dia/turno selecionado
  const detalhe = celulaSelecionada
    ? {
        trabalhando: cobertura[celulaSelecionada.dia]?.[celulaSelecionada.turno] ?? [],
        folgando: funcionarios.filter(f => {
          if (f.turno !== celulaSelecionada.turno) return false;
          const folgas = sobrepor[f.id] ?? f.diasFolga;
          return folgas.includes(celulaSelecionada.dia);
        }),
      }
    : null;

  const totalMigrando = Object.values(migrando).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

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
              Cobertura real por dia, baseada nos dias de folga cadastrados
            </p>
          </div>
        </div>

        {/* Loja */}
        {lojas.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Loja</p>
            <LojaSelector lojas={lojas} lojaSelecionada={lojaSelecionada} setLojaSelecionada={setLojaSelecionada} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" /> Carregando funcionários…
          </div>
        )}

        {/* Sem loja */}
        {!lojaSelecionada && !loading && lojas.length > 0 && (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-10 text-center">
            <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Selecione uma loja para ver a cobertura.</p>
          </div>
        )}

        {/* Sem funcionários */}
        {lojaSelecionada && !loading && funcionarios.length === 0 && (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-8 text-center">
            <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Nenhum funcionário ativo nesta loja</p>
            <p className="text-gray-400 text-sm mb-4">Cadastre funcionários com dias de folga definidos para usar o simulador.</p>
            <button onClick={() => router.push('/rh/funcionarios/novo')}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-amber-500 text-black text-sm font-semibold rounded-xl hover:bg-amber-400 transition-colors"
            >
              <Plus className="w-4 h-4" /> Cadastrar funcionário
            </button>
          </div>
        )}

        {/* Conteúdo principal */}
        {lojaSelecionada && !loading && funcionarios.length > 0 && (
          <div className="space-y-6">

            {/* Toggle modo */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-1 flex gap-1">
              <button onClick={() => setModoSimulacao(false)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  !modoSimulacao ? 'bg-[#2a2a2e] text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Cobertura atual
              </button>
              <button onClick={() => setModoSimulacao(true)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                  modoSimulacao
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Simular migração 5x2
                {totalMigrando > 0 && (
                  <span className="ml-2 bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {totalMigrando}
                  </span>
                )}
              </button>
            </div>

            {/* Grade semanal */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2a2e] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  {modoSimulacao ? 'Cobertura projetada (com migração)' : 'Cobertura semanal real'}
                </h2>
                {Object.keys(ideais).length === 0 && (
                  <button onClick={() => router.push('/rh/quadro-ideal')}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Definir mínimos no Quadro Ideal
                  </button>
                )}
              </div>

              <div className="p-4 overflow-x-auto">
                {/* Cabeçalho dos dias */}
                <div
                  className="grid gap-2 mb-2 min-w-[480px]"
                  style={{ gridTemplateColumns: `100px repeat(7, 1fr)` }}
                >
                  <div />
                  {DIAS.map(dia => (
                    <div key={dia} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-1">
                      {DIAS_LABEL[dia]}
                    </div>
                  ))}
                </div>

                {/* Linhas por turno */}
                {turnos.map(turno => (
                  <div key={turno}
                    className="grid gap-2 mb-2 min-w-[480px] items-center"
                    style={{ gridTemplateColumns: `100px repeat(7, 1fr)` }}
                  >
                    <div className="text-xs font-medium text-gray-400 pr-2">
                      {TURNO_LABEL[turno] ?? turno}
                    </div>
                    {DIAS.map(dia => (
                      <CelulaGrid
                        key={dia}
                        presentes={cobertura[dia]?.[turno] ?? []}
                        ideal={ideais[turno] ?? 0}
                        dia={dia}
                        turno={turno}
                        onClick={() => setCelulaSelecionada(
                          celulaSelecionada?.dia === dia && celulaSelecionada?.turno === turno
                            ? null
                            : { dia, turno }
                        )}
                      />
                    ))}
                  </div>
                ))}

                {/* Legenda */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#2a2a2e]">
                  <p className="text-xs text-gray-500">Clique em um dia para ver detalhes.</p>
                  {Object.keys(ideais).length > 0 && (
                    <div className="flex items-center gap-3 ml-auto">
                      <span className="flex items-center gap-1 text-xs text-green-400"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> OK</span>
                      <span className="flex items-center gap-1 text-xs text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> −1 do ideal</span>
                      <span className="flex items-center gap-1 text-xs text-red-400"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Descoberto</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detalhe do dia/turno selecionado */}
            {celulaSelecionada && detalhe && (
              <div className="bg-[#1c1c1e] border border-amber-500/20 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  {DIAS_LABEL[celulaSelecionada.dia]} · {TURNO_LABEL[celulaSelecionada.turno] ?? celulaSelecionada.turno}
                  {ideais[celulaSelecionada.turno] > 0 && (
                    <span className="text-gray-500 font-normal ml-2">
                      (mínimo: {ideais[celulaSelecionada.turno]})
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-green-400 uppercase tracking-wider mb-2">
                      Trabalhando ({detalhe.trabalhando.length})
                    </p>
                    {detalhe.trabalhando.length === 0
                      ? <p className="text-xs text-gray-600">Ninguém</p>
                      : detalhe.trabalhando.map(f => (
                          <div key={f.id} className="flex items-center gap-2 mb-1.5">
                            <div className="w-6 h-6 rounded-lg bg-[#2a2a2e] flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
                              {f.nome.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-white font-medium truncate">{f.nome.split(' ')[0]}</p>
                              <p className="text-[10px] text-gray-500 truncate">{f.cargo}</p>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      De folga ({detalhe.folgando.length})
                    </p>
                    {detalhe.folgando.length === 0
                      ? <p className="text-xs text-gray-600">Ninguém</p>
                      : detalhe.folgando.map(f => (
                          <div key={f.id} className="flex items-center gap-2 mb-1.5 opacity-50">
                            <div className="w-6 h-6 rounded-lg bg-[#2a2a2e] flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                              {f.nome.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-gray-400 truncate">{f.nome.split(' ')[0]}</p>
                              <p className="text-[10px] text-gray-600 truncate">{f.cargo}</p>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Painel de simulação 5x2 */}
            {modoSimulacao && (
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2a2a2e] flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">
                    Quais funcionários migrar para 5x2?
                  </h2>
                  {totalMigrando > 0 && (
                    <button
                      onClick={() => { setMigrando({}); setNovaFolga({}); }}
                      className="text-xs text-gray-500 hover:text-white transition-colors"
                    >
                      Limpar seleção
                    </button>
                  )}
                </div>

                {f6x1.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    Todos os funcionários já estão na escala 5x2.
                  </div>
                ) : (
                  <div className="divide-y divide-[#2a2a2e]">
                    {f6x1.map(f => {
                      const estaMigrando = migrando[f.id] ?? false;
                      const folgasAtuais = f.diasFolga;
                      const novasFolgas = novaFolga[f.id] ?? folgasAtuais;

                      return (
                        <div key={f.id} className={`px-4 py-3 transition-colors ${estaMigrando ? 'bg-amber-500/5' : ''}`}>
                          <div className="flex items-center gap-3">
                            {/* Checkbox */}
                            <button
                              onClick={() => {
                                setMigrando(m => ({ ...m, [f.id]: !m[f.id] }));
                                if (!migrando[f.id]) {
                                  // Inicia com a folga atual + um placeholder
                                  setNovaFolga(n => ({ ...n, [f.id]: folgasAtuais }));
                                }
                              }}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                estaMigrando
                                  ? 'bg-amber-500 border-amber-500'
                                  : 'border-[#374151] hover:border-amber-500/60'
                              }`}
                            >
                              {estaMigrando && <span className="text-black text-xs font-bold">✓</span>}
                            </button>

                            {/* Nome e cargo */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{f.nome}</p>
                              <p className="text-xs text-gray-500">{f.cargo} · {TURNO_LABEL[f.turno] ?? f.turno}</p>
                            </div>

                            {/* Folga atual */}
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-gray-500">folga atual</p>
                              <p className="text-xs text-amber-400 font-medium">
                                {folgasAtuais.map(d => DIAS_LABEL[d] ?? d).join(', ') || '—'}
                              </p>
                            </div>
                          </div>

                          {/* Seletor do 2º dia de folga (só quando migrando) */}
                          {estaMigrando && (
                            <div className="mt-3 pl-8">
                              <p className="text-xs text-gray-400 mb-2">
                                Na escala 5x2, terá <strong className="text-white">2 dias de folga</strong>. Escolha os dias:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {DIAS.map(dia => {
                                  const selecionado = novasFolgas.includes(dia);
                                  const qtdSelecionados = novasFolgas.length;
                                  return (
                                    <button
                                      key={dia}
                                      onClick={() => {
                                        setNovaFolga(n => {
                                          const atual = n[f.id] ?? [];
                                          if (atual.includes(dia)) {
                                            // Remove se tiver mais de 1 selecionado
                                            return atual.length > 1 ? { ...n, [f.id]: atual.filter(d => d !== dia) } : n;
                                          } else {
                                            // Adiciona (máx 2 dias)
                                            const nova = atual.length >= 2 ? [...atual.slice(1), dia] : [...atual, dia];
                                            return { ...n, [f.id]: nova };
                                          }
                                        });
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                        selecionado
                                          ? 'bg-amber-500 text-black border-amber-500'
                                          : !selecionado && qtdSelecionados >= 2
                                          ? 'bg-[#1c1c1e] text-gray-600 border-[#2a2a2e] cursor-not-allowed opacity-40'
                                          : 'bg-[#2a2a2e] text-gray-300 border-[#374151] hover:border-amber-500/40'
                                      }`}
                                    >
                                      {DIAS_LABEL[dia]}
                                    </button>
                                  );
                                })}
                              </div>
                              {novasFolgas.length < 2 && (
                                <p className="text-xs text-amber-400 mt-1.5">Selecione mais {2 - novasFolgas.length} dia{2 - novasFolgas.length !== 1 ? 's' : ''}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Resumo da simulação */}
            {modoSimulacao && totalMigrando > 0 && (
              <div className={`rounded-2xl p-4 border ${diasComGap > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
                {diasComGap > 0 ? (
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {diasComGap} dia{diasComGap !== 1 ? 's' : ''} com cobertura abaixo do ideal
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Com a migração de {totalMigrando} funcionário{totalMigrando !== 1 ? 's' : ''}, alguns dias ficam descobertos.
                        Veja a grade acima e ajuste os dias de folga.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-400">Migração viável!</p>
                      <p className="text-xs text-gray-400 mt-1">
                        A cobertura permanece adequada com {totalMigrando} funcionário{totalMigrando !== 1 ? 's' : ''} migrando para 5x2.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Explicação */}
            <button
              onClick={() => setShowExplicacao(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl text-sm text-gray-400 hover:text-white hover:bg-[#222224] transition-colors"
            >
              <span>Como funciona o cálculo?</span>
              {showExplicacao ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showExplicacao && (
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 text-sm text-gray-400 space-y-3">
                <p>
                  <span className="text-white font-medium">Cobertura real:</span> para cada dia da semana,
                  o sistema conta quantos funcionários <em>não</em> estão nos dias de folga cadastrados. Não usa fórmulas — usa os dados reais.
                </p>
                <p>
                  <span className="text-white font-medium">Mínimos:</span> os números ideais por turno vêm do{' '}
                  <button onClick={() => router.push('/rh/quadro-ideal')} className="text-amber-400 underline hover:text-amber-300">
                    Quadro Ideal
                  </button>. Se não configurado, as células aparecem sem cor de referência.
                </p>
                <p>
                  <span className="text-white font-medium">Simulação 5x2:</span> selecione os funcionários e defina 2 dias de folga para cada um. A grade atualiza em tempo real mostrando o impacto.
                </p>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
