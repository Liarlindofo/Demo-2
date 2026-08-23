'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ToolProtection from '@/components/auth/ToolProtection';
import { SystemTool } from '@/types/admin';
import {
  type FaixaTemplate,
  getFaixaFromDados,
  resolveModoCalculo,
  resolveFaixasFromDados,
  normalizeFaixas,
  DEFAULT_FAIXAS,
} from '@/lib/bonificacao-defaults';
import {
  ArrowLeft,
  Trophy,
  Loader2,
  ChevronDown,
  Pencil,
  Check,
  X,
  Settings,
} from 'lucide-react';

// ── tipos ───────────────────────────────────────────────────────────────────

interface Metrica {
  id: string;
  nome: string;
  maxPontos: number;
  pontos: Record<string, number | null>; // chave = "mes-ano" ex: "6-2026"
}

interface Desconto {
  id: string;
  nome: string;
  valor: number;
  pontos?: number;
}

interface Dados {
  modoCalculo?: 'PADRAO' | 'MEDIA';
  metricas: Metrica[];
  descontos: Desconto[];
  faixas?: FaixaTemplate[];
}

interface Trimestre {
  id: string;
  lojaNome: string;
  lojaId: string | null;
  tipoAvaliacaoId: string;
  ano: number;
  trimestre: number;
  dados: Dados;
  updatedAt: string;
  tipoAvaliacao?: { nome: string; modoCalculo: string; lojaId: string | null };
}

interface Loja { id: string; nome: string; }

interface TipoAvaliacao {
  id: string;
  nome: string;
  lojaId: string | null;
  lojaNome: string | null;
  modoCalculo: 'PADRAO' | 'MEDIA';
  metricas: unknown;
  descontos: unknown;
  faixas: FaixaTemplate[];
}

// ── constantes ──────────────────────────────────────────────────────────────

const DESCONTO_VALOR = 20; // fallback para planos antigos sem pontos no desconto

const TRIMESTRES_LABEL: Record<number, string> = {
  1: 'T1 (Mar–Mai)',
  2: 'T2 (Jun–Ago)',
  3: 'T3 (Set–Nov)',
  4: 'T4 (Dez–Fev)',
};

// Trimestres "quebrados": iniciam em março e cruzam ano no T4 (Dez do ano base, Jan/Fev do ano seguinte)
const MESES_POR_TRIMESTRE: Record<number, { mes: number; label: string }[]> = {
  1: [{ mes: 3, label: 'Mar' }, { mes: 4, label: 'Abr' }, { mes: 5, label: 'Mai' }],
  2: [{ mes: 6, label: 'Jun' }, { mes: 7, label: 'Jul' }, { mes: 8, label: 'Ago' }],
  3: [{ mes: 9, label: 'Set' }, { mes: 10, label: 'Out' }, { mes: 11, label: 'Nov' }],
  4: [{ mes: 12, label: 'Dez' }, { mes: 1, label: 'Jan' }, { mes: 2, label: 'Fev' }],
};

function mesKey(mes: number, ano: number) {
  return `${mes}-${ano}`;
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ── componente principal ─────────────────────────────────────────────────────

function BonificacaoContent() {
  const router = useRouter();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [lojaAtiva, setLojaAtiva] = useState<string>('');
  const [anoAtivo, setAnoAtivo] = useState(new Date().getFullYear());
  const [trimestreAtivo, setTrimestreAtivo] = useState(() => {
    const mes = new Date().getMonth() + 1;
    if (mes >= 3 && mes <= 5) return 1;
    if (mes >= 6 && mes <= 8) return 2;
    if (mes >= 9 && mes <= 11) return 3;
    return 4; // Dez, Jan, Fev
  });

  const [trimestre, setTrimestre] = useState<Trimestre | null>(null);
  const [trimestres, setTrimestres] = useState<Trimestre[]>([]);
  const [tipos, setTipos] = useState<TipoAvaliacao[]>([]);
  const [tipoSelecionadoId, setTipoSelecionadoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [criando, setCriando] = useState(false);

  // estado de edição inline de nome de métrica
  const [editandoMetrica, setEditandoMetrica] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTipos = useCallback(async (lojaId: string) => {
    const res = await fetch(`/api/tipos-avaliacao?lojaId=${lojaId}`);
    const data: TipoAvaliacao[] = res.ok ? await res.json() : [];
    setTipos(data.map(t => ({ ...t, faixas: normalizeFaixas(t.faixas) })));
    if (data.length > 0) {
      setTipoSelecionadoId(prev => data.some(t => t.id === prev) ? prev : data[0].id);
    } else {
      setTipoSelecionadoId('');
    }
  }, []);

  // ── carregar lojas ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/rh/lojas')
      .then(r => r.ok ? r.json() : [])
      .then((data: Loja[]) => {
        setLojas(data);
        if (data.length > 0 && !lojaAtiva) setLojaAtiva(data[0].id);
      })
      .catch(() => {});
  }, [lojaAtiva]);

  useEffect(() => {
    if (lojaAtiva) loadTipos(lojaAtiva);
  }, [lojaAtiva, loadTipos]);

  const loadTrimestre = useCallback(async () => {
    if (!lojaAtiva) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bonificacao?ano=${anoAtivo}&trimestre=${trimestreAtivo}`);
      const data: Trimestre[] = await res.json().catch(() => []);
      setTrimestres(data);
    } finally {
      setLoading(false);
    }
  }, [anoAtivo, trimestreAtivo, lojaAtiva]);

  useEffect(() => {
    if (lojaAtiva) loadTrimestre();
  }, [loadTrimestre]);

  function planoDaLojaTipo(lista: Trimestre[], lojaId: string, tipoId: string) {
    const loja = lojas.find(l => l.id === lojaId);
    return lista.find(t =>
      t.tipoAvaliacaoId === tipoId &&
      (t.lojaId === lojaId || t.lojaNome === loja?.nome),
    ) ?? null;
  }

  async function garantirPlano(tipoId: string) {
    const loja = lojas.find(l => l.id === lojaAtiva);
    const tipo = tipos.find(t => t.id === tipoId);
    if (!loja || !tipo) return;

    if (tipo.modoCalculo === 'MEDIA') {
      setTrimestre(null);
      return;
    }

    const existente = planoDaLojaTipo(trimestres, lojaAtiva, tipoId);
    if (existente) {
      setTrimestre(existente);
      return;
    }

    setCriando(true);
    try {
      const res = await fetch('/api/bonificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lojaId: loja.id,
          lojaNome: loja.nome,
          ano: anoAtivo,
          trimestre: trimestreAtivo,
          tipoAvaliacaoId: tipoId,
        }),
      });
      if (res.ok) {
        const novo: Trimestre = await res.json();
        setTrimestres(prev => [...prev.filter(p => p.id !== novo.id), novo]);
        setTrimestre(novo);
      }
    } finally {
      setCriando(false);
    }
  }

  async function selecionarTipo(tipoId: string) {
    setTipoSelecionadoId(tipoId);
    await garantirPlano(tipoId);
  }

  useEffect(() => {
    if (!loading && tipoSelecionadoId && lojaAtiva && tipos.length > 0) {
      const tipo = tipos.find(t => t.id === tipoSelecionadoId);
      if (tipo?.modoCalculo === 'MEDIA') {
        setTrimestre(null);
        return;
      }
      const existente = planoDaLojaTipo(trimestres, lojaAtiva, tipoSelecionadoId);
      setTrimestre(existente);
      if (!existente && !criando) {
        garantirPlano(tipoSelecionadoId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimestres, loading, lojaAtiva, tipoSelecionadoId, tipos]);

  // ── salvar (debounced) ────────────────────────────────────────────────────
  const saveDados = useCallback(async (t: Trimestre) => {
    setSaving(true);
    try {
      await fetch(`/api/bonificacao/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dados: t.dados }),
      });
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }, []);

  function updateTrimestre(updater: (prev: Trimestre) => Trimestre) {
    setTrimestre(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveDados(next), 800);
      return next;
    });
  }

  // ── toggle de pontuação mensal (FEITO = maxPontos | NÃO FEITO = 0) ────────
  function togglePontos(metricaId: string, mes: number) {
    const max = trimestre?.dados.metricas.find(m => m.id === metricaId)?.maxPontos ?? 40;
    const key = mesKey(mes, anoDoMes(mes));
    const current = trimestre?.dados.metricas.find(m => m.id === metricaId)?.pontos[key];
    const feito = typeof current === 'number' && current === max;
    updateTrimestre(prev => ({
      ...prev,
      dados: {
        ...prev.dados,
        metricas: prev.dados.metricas.map(m =>
          m.id === metricaId
            ? { ...m, pontos: { ...m.pontos, [key]: feito ? 0 : max } }
            : m,
        ),
      },
    }));
  }

  // ── toggle de desconto (−DESCONTO_VALOR pts ou 0) ─────────────────────────
  function toggleDesconto(descontoId: string) {
    updateTrimestre(prev => ({
      ...prev,
      dados: {
        ...prev.dados,
        descontos: prev.dados.descontos.map(d => {
          const pts = d.pontos ?? DESCONTO_VALOR;
          return d.id === descontoId ? { ...d, valor: d.valor > 0 ? 0 : pts } : d;
        }),
      },
    }));
  }

  // ── editar nome de métrica ────────────────────────────────────────────────
  function confirmarNomeMetrica() {
    if (!editandoMetrica || !editNome.trim()) { setEditandoMetrica(null); return; }
    updateTrimestre(prev => ({
      ...prev,
      dados: {
        ...prev.dados,
        metricas: prev.dados.metricas.map(m =>
          m.id === editandoMetrica ? { ...m, nome: editNome.trim() } : m,
        ),
      },
    }));
    setEditandoMetrica(null);
  }

  // ── cálculos ──────────────────────────────────────────────────────────────
  const meses = MESES_POR_TRIMESTRE[trimestreAtivo];

  // T4 cruza o ano: Dez pertence ao anoAtivo, Jan/Fev ao ano seguinte
  function anoDoMes(mes: number): number {
    return (trimestreAtivo === 4 && (mes === 1 || mes === 2)) ? anoAtivo + 1 : anoAtivo;
  }

  function pontosMetricaMes(metrica: Metrica, mes: number) {
    const v = metrica.pontos[mesKey(mes, anoDoMes(mes))];
    return typeof v === 'number' ? v : null;
  }

  function totalMetrica(metrica: Metrica) {
    return meses.reduce((sum, { mes }) => sum + (pontosMetricaMes(metrica, mes) ?? 0), 0);
  }

  function totalBruto() {
    if (!trimestre) return 0;
    return trimestre.dados.metricas.reduce((sum, m) => sum + totalMetrica(m), 0);
  }

  function totalDescontos() {
    if (!trimestre) return 0;
    return trimestre.dados.descontos.reduce((sum, d) => sum + (d.valor ?? 0), 0);
  }

  function totalLiquido() {
    return totalBruto() - totalDescontos();
  }

  function maxTrimestre() {
    if (!trimestre) return 0;
    return trimestre.dados.metricas.reduce((sum, m) => sum + m.maxPontos, 0) * 3;
  }

  const tipoAtivo = tipos.find(t => t.id === tipoSelecionadoId);
  const isMediaMode = tipoAtivo?.modoCalculo === 'MEDIA';

  const faixasAtivas = trimestre
    ? resolveFaixasFromDados(trimestre.dados)
    : normalizeFaixas(tipoAtivo?.faixas ?? DEFAULT_FAIXAS);

  const faixa = trimestre ? getFaixaFromDados(totalLiquido(), faixasAtivas) : null;
  const maxPontosFaixa = faixasAtivas.length > 0
    ? [...faixasAtivas].sort((a, b) => b.pontosMin - a.pontosMin)[0].pontosMin
    : 870;

  function trimestresRegulares() {
    return trimestres.filter(t =>
      resolveModoCalculo(t.dados) !== 'MEDIA' &&
      !(t.tipoAvaliacao?.modoCalculo === 'MEDIA') &&
      !t.lojaNome.toLowerCase().includes('central'),
    );
  }

  function agruparPorTipo() {
    const map = new Map<string, { tipoNome: string; lojas: { nome: string; liquido: number; faixa: FaixaTemplate | null }[] }>();
    for (const t of trimestresRegulares()) {
      const tipoNome = t.tipoAvaliacao?.nome ?? 'Sem tipo';
      const liq = calcularLiquidoTrimestre(t);
      const f = getFaixaFromDados(liq, resolveFaixasFromDados(t.dados));
      if (!map.has(tipoNome)) map.set(tipoNome, { tipoNome, lojas: [] });
      map.get(tipoNome)!.lojas.push({ nome: t.lojaNome, liquido: liq, faixa: f });
    }
    return [...map.values()];
  }

  function mediaDoGrupo(lojas: { faixa: FaixaTemplate | null }[]) {
    if (lojas.length === 0) return null;
    const soma = lojas.reduce((acc, d) => ({
      gerente: acc.gerente + (d.faixa?.valorGerente ?? 0),
      funcionario: acc.funcionario + (d.faixa?.valorFuncionario ?? 0),
    }), { gerente: 0, funcionario: 0 });
    return { gerente: soma.gerente / lojas.length, funcionario: soma.funcionario / lojas.length };
  }
  function calcularLiquidoTrimestre(t: Trimestre): number {
    const bruto = t.dados.metricas.reduce((sum, m) =>
      sum + meses.reduce((s, { mes }) => {
        const v = m.pontos[mesKey(mes, anoDoMes(mes))];
        return s + (typeof v === 'number' ? v : 0);
      }, 0), 0);
    const descontos = t.dados.descontos.reduce((sum, d) => sum + (d.valor ?? 0), 0);
    return bruto - descontos;
  }

  function dadosPorLoja() {
    return trimestresRegulares().map(t => {
      const liq = calcularLiquidoTrimestre(t);
      const f = getFaixaFromDados(liq, resolveFaixasFromDados(t.dados));
      return { nome: t.lojaNome, tipo: t.tipoAvaliacao?.nome ?? '', liquido: liq, faixa: f };
    });
  }

  function mediaBonus(): { gerente: number; funcionario: number; n: number } | null {
    const por = dadosPorLoja();
    if (por.length === 0) return null;
    const soma = por.reduce((acc, d) => ({
      gerente: acc.gerente + (d.faixa?.valorGerente ?? 0),
      funcionario: acc.funcionario + (d.faixa?.valorFuncionario ?? 0),
    }), { gerente: 0, funcionario: 0 });
    return { gerente: soma.gerente / por.length, funcionario: soma.funcionario / por.length, n: por.length };
  }

  const anos = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 1 + i);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#1c1c1e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-white">Plano de Bonificação</h1>
          </div>
          <button
            onClick={() => router.push(`/bonificacao/tipos?lojaId=${lojaAtiva}`)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#1c1c1e] border border-[#2a2a2e]"
          >
            <Settings className="w-3.5 h-3.5" />
            Tipos de avaliação
          </button>
          {saving ? (
            <span className="flex items-center gap-1.5 text-xs text-gray-500 ml-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Salvando…
            </span>
          ) : savedAt ? (
            <span className="flex items-center gap-1.5 text-xs text-gray-600 ml-2">
              <Check className="w-3.5 h-3.5 text-green-500" />
              Salvo às {savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : null}
        </div>

        {/* Seletores */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Lojas (tabs) */}
          <div className="flex gap-1.5 flex-wrap">
            {lojas.map(l => (
              <button
                key={l.id}
                onClick={() => setLojaAtiva(l.id)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                  lojaAtiva === l.id
                    ? 'bg-amber-500 text-black'
                    : 'bg-[#111113] border border-[#2a2a2e] text-gray-400 hover:text-white'
                }`}
              >
                {l.nome}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto items-center flex-wrap">
            {/* Tipo de avaliação */}
            {tipos.length > 0 && (
              <div className="relative min-w-[160px]">
                <select
                  value={tipoSelecionadoId}
                  onChange={e => selecionarTipo(e.target.value)}
                  className="appearance-none w-full bg-[#111113] border border-[#2a2a2e] text-sm text-white rounded-xl px-3.5 py-2 pr-7 focus:outline-none focus:border-amber-500/40"
                >
                  {tipos.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            )}
            {/* Trimestre */}
            <div className="relative">
              <select
                value={trimestreAtivo}
                onChange={e => setTrimestreAtivo(Number(e.target.value))}
                className="appearance-none bg-[#111113] border border-[#2a2a2e] text-sm text-white rounded-xl px-3.5 py-2 pr-7 focus:outline-none focus:border-amber-500/40"
              >
                {[1, 2, 3, 4].map(t => (
                  <option key={t} value={t}>{TRIMESTRES_LABEL[t]}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* Ano */}
            <div className="relative">
              <select
                value={anoAtivo}
                onChange={e => setAnoAtivo(Number(e.target.value))}
                className="appearance-none bg-[#111113] border border-[#2a2a2e] text-sm text-white rounded-xl px-3.5 py-2 pr-7 focus:outline-none focus:border-amber-500/40"
              >
                {anos.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Estado de carregamento */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : isMediaMode ? (
          (() => {
            const grupos = agruparPorTipo();
            return (
              <div className="space-y-6">
                {grupos.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-12">
                    Nenhuma loja possui planos para este trimestre ainda.
                  </p>
                ) : grupos.map(grupo => {
                  const media = mediaDoGrupo(grupo.lojas);
                  return (
                    <div key={grupo.tipoNome} className="bg-[#111113] border border-[#2a2a2e] rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-[#2a2a2e] bg-[#0d0d0f]">
                        <h3 className="text-sm font-semibold text-white">{grupo.tipoNome}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{TRIMESTRES_LABEL[trimestreAtivo]} {anoAtivo}</p>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#2a2a2e] bg-[#0d0d0f]">
                            <th className="px-4 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase">Loja</th>
                            <th className="px-4 py-2.5 text-center text-xs text-gray-500 font-semibold uppercase">Pts líquidos</th>
                            <th className="px-4 py-2.5 text-center text-xs text-gray-500 font-semibold uppercase">Faixa</th>
                            <th className="px-4 py-2.5 text-center text-xs text-gray-500 font-semibold uppercase">Gerentes</th>
                            <th className="px-4 py-2.5 text-center text-xs text-gray-500 font-semibold uppercase">Funcionários</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupo.lojas.map((d, i) => (
                            <tr key={d.nome} className={`border-b border-[#2a2a2e] ${i % 2 !== 0 ? 'bg-[#0d0d0f]' : ''}`}>
                              <td className="px-4 py-3 text-gray-200">{d.nome}</td>
                              <td className="px-4 py-3 text-center font-semibold text-amber-400">{d.liquido}</td>
                              <td className="px-4 py-3 text-center text-gray-300">{d.faixa ? `Faixa ${d.faixa.faixa}` : '—'}</td>
                              <td className="px-4 py-3 text-center text-green-400 font-medium">{d.faixa ? brl(d.faixa.valorGerente) : '—'}</td>
                              <td className="px-4 py-3 text-center text-green-400 font-medium">{d.faixa ? brl(d.faixa.valorFuncionario) : '—'}</td>
                            </tr>
                          ))}
                          {media && (
                            <tr className="bg-[#1a1a1e] border-t-2 border-[#3a3a3e]">
                              <td className="px-4 py-3 font-bold text-white">Média · {grupo.tipoNome}</td>
                              <td className="px-4 py-3 text-center text-gray-500">—</td>
                              <td className="px-4 py-3 text-center text-gray-500">—</td>
                              <td className="px-4 py-3 text-center font-bold text-green-400">{brl(media.gerente)}</td>
                              <td className="px-4 py-3 text-center font-bold text-green-400">{brl(media.funcionario)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            );
          })()
        ) : !trimestre ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            <p className="text-sm text-gray-500">
              {criando ? 'Criando plano…' : 'Carregando plano…'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Tabela de métricas */}
            <div className="bg-[#111113] border border-[#2a2a2e] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2e] bg-[#0d0d0f]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[180px]">
                        Métrica
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                        Max
                      </th>
                      {meses.map(({ mes, label }) => (
                        <th key={mes} className="px-3 py-3 text-center text-xs font-semibold text-amber-400/80 uppercase tracking-wider w-24">
                          {label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trimestre.dados.metricas.map((m, idx) => {
                      const total = totalMetrica(m);
                      const maxTriTrimestre = m.maxPontos * 3;
                      const pct = maxTriTrimestre > 0 ? (total / maxTriTrimestre) * 100 : 0;
                      return (
                        <tr key={m.id} className={`border-b border-[#2a2a2e] last:border-0 ${idx % 2 === 0 ? '' : 'bg-[#0d0d0f]'}`}>
                          {/* Nome */}
                          <td className="px-4 py-2.5">
                            {editandoMetrica === m.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  autoFocus
                                  className="flex-1 bg-[#0a0a0a] border border-amber-500/40 rounded-lg px-2 py-1 text-sm text-white focus:outline-none"
                                  value={editNome}
                                  onChange={e => setEditNome(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') confirmarNomeMetrica(); if (e.key === 'Escape') setEditandoMetrica(null); }}
                                />
                                <button onClick={confirmarNomeMetrica} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setEditandoMetrica(null)} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <button
                                className="flex items-center gap-1.5 group text-left w-full"
                                onClick={() => { setEditandoMetrica(m.id); setEditNome(m.nome); }}
                              >
                                <span className="text-gray-200 group-hover:text-white transition-colors">{m.nome}</span>
                                <Pencil className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </button>
                            )}
                          </td>
                          {/* Max */}
                          <td className="px-3 py-2.5 text-center">
                            <span className="text-sm font-semibold text-gray-400">{m.maxPontos}</span>
                          </td>
                          {/* Meses — toggle FEITO / NÃO FEITO */}
                          {meses.map(({ mes }) => {
                            const v = pontosMetricaMes(m, mes);
                            const feito = v === m.maxPontos;
                            return (
                              <td key={mes} className="px-2 py-2.5 text-center">
                                <button
                                  onClick={() => togglePontos(m.id, mes)}
                                  className={`w-full px-2 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    feito
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30'
                                      : 'bg-[#1a1a1e] text-gray-500 border border-[#2a2a2e] hover:border-gray-500 hover:text-gray-300'
                                  }`}
                                >
                                  {feito ? '✓ Feito' : '✗'}
                                </button>
                              </td>
                            );
                          })}
                          {/* Total */}
                          <td className="px-4 py-2.5 text-center">
                            <span className={`font-semibold text-sm ${pct >= 100 ? 'text-green-400' : pct >= 60 ? 'text-amber-400' : 'text-gray-300'}`}>
                              {total}
                            </span>
                            <span className="text-xs text-gray-600">/{maxTriTrimestre}</span>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Linha de total bruto */}
                    <tr className="bg-[#1a1a1e] border-t-2 border-[#3a3a3e]">
                      <td className="px-4 py-3 font-bold text-white text-sm" colSpan={2}>
                        TOTAL
                      </td>
                      {meses.map(({ mes }) => {
                        const t = trimestre.dados.metricas.reduce((sum, m) => sum + (pontosMetricaMes(m, mes) ?? 0), 0);
                        return (
                          <td key={mes} className="px-3 py-3 text-center font-bold text-amber-400 text-sm">
                            {t}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-bold text-amber-400 text-base">
                        {totalBruto()}
                        <span className="text-xs text-gray-600 font-normal">/{maxTrimestre()}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Descontos + Resultado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Descontos */}
              <div className="bg-[#111113] border border-[#2a2a2e] rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[#2a2a2e] bg-[#0d0d0f]">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descontos</h3>
                </div>
                <div className="divide-y divide-[#2a2a2e]">
                  {trimestre.dados.descontos.map(d => (
                    <div key={d.id} className="flex items-center justify-between px-4 py-2.5 gap-4">
                      <span className="text-sm text-gray-400 flex-1">{d.nome}</span>
                      <button
                        onClick={() => toggleDesconto(d.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                          d.valor > 0
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                            : 'bg-[#1a1a1e] text-gray-500 border border-[#2a2a2e] hover:border-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {d.valor > 0 ? `−${d.pontos ?? DESCONTO_VALOR} pts` : 'Sem desconto'}
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 bg-red-500/5">
                    <span className="text-sm font-semibold text-red-400">Total descontos</span>
                    <span className="text-sm font-bold text-red-400">{totalDescontos()} pts</span>
                  </div>
                </div>
              </div>

              {/* Resultado */}
              <div className="space-y-4">
                {/* Resumo de pontos */}
                <div className="bg-[#111113] border border-[#2a2a2e] rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Total bruto</span>
                    <span className="font-semibold text-white">{totalBruto()} pts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Descontos</span>
                    <span className="font-semibold text-red-400">− {totalDescontos()} pts</span>
                  </div>
                  <div className="h-px bg-[#2a2a2e]" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Total líquido</span>
                    <span className="text-xl font-bold text-amber-400">{totalLiquido()} pts</span>
                  </div>
                  {/* barra de progresso */}
                  <div className="h-2 bg-[#2a2a2e] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (totalLiquido() / (maxTrimestre() || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Faixa atingida */}
                <div className={`rounded-2xl border p-5 ${faixa ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#111113] border-[#2a2a2e]'}`}>
                  {faixa ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                          Faixa {faixa.faixa} atingida
                          {faixa.faixa === 5 && ' 🏆'}
                        </p>
                        <span className="text-xs text-gray-500">{totalLiquido()}/{maxPontosFaixa} pts</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">Gerentes</p>
                          <p className="text-lg font-bold text-green-400">{brl(faixa.valorGerente)}</p>
                        </div>
                        <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">Funcionários</p>
                          <p className="text-lg font-bold text-green-400">{brl(faixa.valorFuncionario)}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">
                      Preencha as métricas para ver a faixa atingida
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tabela de referência de faixas */}
            <div className="bg-[#111113] border border-[#2a2a2e] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2a2e] bg-[#0d0d0f]">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tabela de faixas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2e]">
                      <th className="px-4 py-2.5 text-left text-xs text-gray-500 font-semibold uppercase tracking-wider">Faixa</th>
                      <th className="px-4 py-2.5 text-center text-xs text-gray-500 font-semibold uppercase tracking-wider">Pontos</th>
                      <th className="px-4 py-2.5 text-center text-xs text-gray-500 font-semibold uppercase tracking-wider">Gerentes</th>
                      <th className="px-4 py-2.5 text-center text-xs text-gray-500 font-semibold uppercase tracking-wider">Funcionários</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faixasAtivas.map(f => {
                      const atingida = faixa?.faixa === f.faixa;
                      return (
                        <tr
                          key={f.faixa}
                          className={`border-b border-[#2a2a2e] last:border-0 transition-colors ${atingida ? 'bg-amber-500/10' : ''}`}
                        >
                          <td className={`px-4 py-2.5 font-semibold ${atingida ? 'text-amber-400' : 'text-gray-300'}`}>
                            {f.faixa}{f.faixa === faixasAtivas.length ? ' (100%)' : ''}
                            {atingida && <span className="ml-2 text-xs">← atual</span>}
                          </td>
                          <td className="px-4 py-2.5 text-center text-gray-300">{f.pontosMin}</td>
                          <td className="px-4 py-2.5 text-center text-green-400 font-medium">{brl(f.valorGerente)}</td>
                          <td className="px-4 py-2.5 text-center text-green-400 font-medium">{brl(f.valorFuncionario)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>


          </div>
        )}
      </div>
    </div>
  );
}

export default function BonificacaoPage() {
  return (
    <ToolProtection tool={SystemTool.BONIFICACAO} toolName="Bonificação">
      <BonificacaoContent />
    </ToolProtection>
  );
}
