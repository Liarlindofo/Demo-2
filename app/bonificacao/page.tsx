'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ToolProtection from '@/components/auth/ToolProtection';
import { SystemTool } from '@/types/admin';
import {
  ArrowLeft,
  Trophy,
  Plus,
  Loader2,
  ChevronDown,
  Pencil,
  Trash2,
  Check,
  X,
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
}

interface Dados {
  metricas: Metrica[];
  descontos: Desconto[];
}

interface Trimestre {
  id: string;
  lojaNome: string;
  lojaId: string | null;
  ano: number;
  trimestre: number;
  dados: Dados;
  updatedAt: string;
}

interface Loja { id: string; nome: string; }

// ── constantes ──────────────────────────────────────────────────────────────

const FAIXAS = [
  { faixa: 1, pontos: 200, gerente: 450,   funcionario: 100 },
  { faixa: 2, pontos: 400, gerente: 750,   funcionario: 200 },
  { faixa: 3, pontos: 600, gerente: 1050,  funcionario: 300 },
  { faixa: 4, pontos: 750, gerente: 1350,  funcionario: 400 },
  { faixa: 5, pontos: 870, gerente: 1600,  funcionario: 500 },
];

const TRIMESTRES_LABEL: Record<number, string> = {
  1: 'Q1 (Jan–Mar)',
  2: 'Q2 (Abr–Jun)',
  3: 'Q3 (Jul–Set)',
  4: 'Q4 (Out–Dez)',
};

const MESES_POR_TRIMESTRE: Record<number, { mes: number; label: string }[]> = {
  1: [{ mes: 1, label: 'Jan' }, { mes: 2, label: 'Fev' }, { mes: 3, label: 'Mar' }],
  2: [{ mes: 4, label: 'Abr' }, { mes: 5, label: 'Mai' }, { mes: 6, label: 'Jun' }],
  3: [{ mes: 7, label: 'Jul' }, { mes: 8, label: 'Ago' }, { mes: 9, label: 'Set' }],
  4: [{ mes: 10, label: 'Out' }, { mes: 11, label: 'Nov' }, { mes: 12, label: 'Dez' }],
};

function mesKey(mes: number, ano: number) {
  return `${mes}-${ano}`;
}

function getFaixa(totalLiquido: number) {
  let current = null;
  for (const f of FAIXAS) {
    if (totalLiquido >= f.pontos) current = f;
  }
  return current;
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const inputCls =
  'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-lg px-2.5 py-1.5 text-sm text-white text-right placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors';

// ── componente principal ─────────────────────────────────────────────────────

function BonificacaoContent() {
  const router = useRouter();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [lojaAtiva, setLojaAtiva] = useState<string>('');
  const [anoAtivo, setAnoAtivo] = useState(new Date().getFullYear());
  const [trimestreAtivo, setTrimestreAtivo] = useState(() => Math.ceil((new Date().getMonth() + 1) / 3));

  const [trimestre, setTrimestre] = useState<Trimestre | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [criando, setCriando] = useState(false);

  // estado de edição inline de nome de métrica
  const [editandoMetrica, setEditandoMetrica] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── carregar trimestre ─────────────────────────────────────────────────────
  const loadTrimestre = useCallback(async () => {
    if (!lojaAtiva) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bonificacao?ano=${anoAtivo}&trimestre=${trimestreAtivo}`);
      const data: Trimestre[] = await res.json().catch(() => []);
      const loja = lojas.find(l => l.id === lojaAtiva);
      const found = data.find(t => t.lojaId === lojaAtiva || t.lojaNome === loja?.nome);
      setTrimestre(found ?? null);
    } finally {
      setLoading(false);
    }
  }, [lojaAtiva, anoAtivo, trimestreAtivo, lojas]);

  useEffect(() => {
    if (lojaAtiva) loadTrimestre();
  }, [loadTrimestre]);

  // ── criar trimestre ────────────────────────────────────────────────────────
  async function criarTrimestre() {
    const loja = lojas.find(l => l.id === lojaAtiva);
    if (!loja) return;
    setCriando(true);
    try {
      const res = await fetch('/api/bonificacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lojaId: loja.id, lojaNome: loja.nome, ano: anoAtivo, trimestre: trimestreAtivo }),
      });
      if (res.ok) {
        const novo = await res.json();
        setTrimestre(novo);
      }
    } finally {
      setCriando(false);
    }
  }

  // ── salvar (debounced) ────────────────────────────────────────────────────
  const saveDados = useCallback(async (t: Trimestre) => {
    setSaving(true);
    try {
      await fetch(`/api/bonificacao/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dados: t.dados }),
      });
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

  // ── editar pontuação mensal ────────────────────────────────────────────────
  function setPontos(metricaId: string, mes: number, raw: string) {
    const val = raw === '' ? null : Math.min(Number(raw), getMaxPontos(metricaId));
    updateTrimestre(prev => ({
      ...prev,
      dados: {
        ...prev.dados,
        metricas: prev.dados.metricas.map(m =>
          m.id === metricaId
            ? { ...m, pontos: { ...m.pontos, [mesKey(mes, anoAtivo)]: val } }
            : m,
        ),
      },
    }));
  }

  function getMaxPontos(metricaId: string) {
    return trimestre?.dados.metricas.find(m => m.id === metricaId)?.maxPontos ?? 40;
  }

  // ── editar desconto ──────────────────────────────────────────────────────
  function setDesconto(descontoId: string, raw: string) {
    const val = raw === '' ? 0 : Math.max(0, Number(raw));
    updateTrimestre(prev => ({
      ...prev,
      dados: {
        ...prev.dados,
        descontos: prev.dados.descontos.map(d =>
          d.id === descontoId ? { ...d, valor: val } : d,
        ),
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

  // ── editar maxPontos ──────────────────────────────────────────────────────
  function setMaxPontos(metricaId: string, raw: string) {
    const val = Math.max(1, Math.min(999, Number(raw) || 1));
    updateTrimestre(prev => ({
      ...prev,
      dados: {
        ...prev.dados,
        metricas: prev.dados.metricas.map(m =>
          m.id === metricaId ? { ...m, maxPontos: val } : m,
        ),
      },
    }));
  }

  // ── cálculos ──────────────────────────────────────────────────────────────
  const meses = MESES_POR_TRIMESTRE[trimestreAtivo];

  function pontosMetricaMes(metrica: Metrica, mes: number) {
    const v = metrica.pontos[mesKey(mes, anoAtivo)];
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

  const faixa = trimestre ? getFaixa(totalLiquido()) : null;

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
          {saving && <Loader2 className="w-4 h-4 text-gray-500 animate-spin ml-2" />}
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

          <div className="flex gap-2 ml-auto items-center">
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
        ) : !trimestre ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400/50" />
            </div>
            <div>
              <p className="text-white font-medium">Nenhum plano para este período</p>
              <p className="text-sm text-gray-500 mt-1">
                {lojas.find(l => l.id === lojaAtiva)?.nome ?? 'Loja'} · {TRIMESTRES_LABEL[trimestreAtivo]} {anoAtivo}
              </p>
            </div>
            {lojaAtiva ? (
              <button
                onClick={criarTrimestre}
                disabled={criando}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {criando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Criar plano trimestral
              </button>
            ) : (
              <p className="text-sm text-gray-600">Selecione uma loja acima para começar.</p>
            )}
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
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              min={1}
                              max={999}
                              value={m.maxPontos}
                              onChange={e => setMaxPontos(m.id, e.target.value)}
                              className={inputCls + ' w-16 mx-auto'}
                            />
                          </td>
                          {/* Meses */}
                          {meses.map(({ mes }) => {
                            const v = pontosMetricaMes(m, mes);
                            return (
                              <td key={mes} className="px-3 py-2.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={m.maxPontos}
                                  placeholder="—"
                                  value={v === null ? '' : v}
                                  onChange={e => setPontos(m.id, mes, e.target.value)}
                                  className={inputCls + ' w-20 mx-auto'}
                                />
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
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={d.valor || ''}
                        onChange={e => setDesconto(d.id, e.target.value)}
                        className={inputCls + ' w-24'}
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 bg-red-500/5">
                    <span className="text-sm font-semibold text-red-400">Total descontos</span>
                    <span className="text-sm font-bold text-red-400">{totalDescontos()}</span>
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
                        <span className="text-xs text-gray-500">{totalLiquido()}/{FAIXAS[FAIXAS.length - 1].pontos} pts</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">Gerentes</p>
                          <p className="text-lg font-bold text-green-400">{brl(faixa.gerente)}</p>
                        </div>
                        <div className="bg-[#0a0a0a] rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">Funcionários</p>
                          <p className="text-lg font-bold text-green-400">{brl(faixa.funcionario)}</p>
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
                    {FAIXAS.map(f => {
                      const atingida = faixa?.faixa === f.faixa;
                      return (
                        <tr
                          key={f.faixa}
                          className={`border-b border-[#2a2a2e] last:border-0 transition-colors ${atingida ? 'bg-amber-500/10' : ''}`}
                        >
                          <td className={`px-4 py-2.5 font-semibold ${atingida ? 'text-amber-400' : 'text-gray-300'}`}>
                            {f.faixa}{f.faixa === 5 ? ' (100%)' : ''}
                            {atingida && <span className="ml-2 text-xs">← atual</span>}
                          </td>
                          <td className="px-4 py-2.5 text-center text-gray-300">{f.pontos}</td>
                          <td className="px-4 py-2.5 text-center text-green-400 font-medium">{brl(f.gerente)}</td>
                          <td className="px-4 py-2.5 text-center text-green-400 font-medium">{brl(f.funcionario)}</td>
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
