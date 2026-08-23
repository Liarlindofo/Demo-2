'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ToolProtection from '@/components/auth/ToolProtection';
import { SystemTool } from '@/types/admin';
import {
  ArrowLeft,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  Copy,
} from 'lucide-react';
import {
  type ModoCalculo,
  type MetricaTemplate,
  type DescontoTemplate,
  type FaixaTemplate,
  defaultTipoPayload,
  normalizeFaixas,
} from '@/lib/bonificacao-defaults';

interface TipoAvaliacao {
  id: string;
  nome: string;
  lojaId: string | null;
  lojaNome: string | null;
  modoCalculo: ModoCalculo;
  metricas: MetricaTemplate[];
  descontos: DescontoTemplate[];
  faixas: FaixaTemplate[];
}

interface Loja { id: string; nome: string; }

const inputCls =
  'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50';

function newId() {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function asMetricas(val: unknown): MetricaTemplate[] {
  return Array.isArray(val) ? val as MetricaTemplate[] : [];
}

function asDescontos(val: unknown): DescontoTemplate[] {
  return Array.isArray(val) ? val as DescontoTemplate[] : [];
}

function cloneTipo(t: TipoAvaliacao): TipoAvaliacao {
  return {
    ...t,
    metricas: asMetricas(t.metricas),
    descontos: asDescontos(t.descontos),
    faixas: normalizeFaixas(t.faixas),
  };
}

function TiposContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [lojaAtiva, setLojaAtiva] = useState('');
  const [tipos, setTipos] = useState<TipoAvaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<TipoAvaliacao | null>(null);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState('');

  const load = useCallback(async (lojaId: string) => {
    if (!lojaId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tipos-avaliacao?lojaId=${lojaId}`);
      const data = await res.json().catch(() => []);
      setTipos((data as TipoAvaliacao[]).map(t => cloneTipo(t)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/rh/lojas')
      .then(r => r.ok ? r.json() : [])
      .then((data: Loja[]) => {
        setLojas(data);
        const fromUrl = searchParams.get('lojaId');
        const initial = fromUrl && data.some((l: Loja) => l.id === fromUrl) ? fromUrl : data[0]?.id ?? '';
        setLojaAtiva(initial);
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    if (lojaAtiva) load(lojaAtiva);
  }, [lojaAtiva, load]);

  function iniciarCriacao(copiarDe?: TipoAvaliacao) {
    const loja = lojas.find(l => l.id === lojaAtiva);
    const base = copiarDe
      ? {
          nome: `${copiarDe.nome} (cópia)`,
          lojaId: lojaAtiva,
          lojaNome: loja?.nome ?? null,
          modoCalculo: copiarDe.modoCalculo,
          metricas: copiarDe.metricas.map(m => ({ ...m, id: newId() })),
          descontos: copiarDe.descontos.map(d => ({ ...d, id: newId() })),
          faixas: copiarDe.faixas.map((f, i) => ({ ...f, faixa: i + 1 })),
        }
      : {
          nome: '',
          lojaId: lojaAtiva,
          lojaNome: loja?.nome ?? null,
          modoCalculo: 'PADRAO' as ModoCalculo,
          ...defaultTipoPayload('PADRAO'),
        };
    setEditando({ id: '', ...base });
    setCriando(true);
    setErro('');
  }

  async function salvar() {
    if (!editando?.nome.trim()) { setErro('Nome é obrigatório'); return; }
    setSaving(true);
    setErro('');
    try {
      const payload = {
        nome: editando.nome.trim(),
        lojaId: lojaAtiva,
        lojaNome: lojas.find(l => l.id === lojaAtiva)?.nome,
        modoCalculo: editando.modoCalculo,
        metricas: editando.metricas,
        descontos: editando.descontos,
        faixas: editando.faixas,
      };
      const res = await fetch(
        criando ? '/api/tipos-avaliacao' : `/api/tipos-avaliacao/${editando.id}`,
        {
          method: criando ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao salvar');
        return;
      }
      setEditando(null);
      setCriando(false);
      await load(lojaAtiva);
    } finally {
      setSaving(false);
    }
  }

  async function excluir(id: string, nome: string) {
    if (!confirm(`Excluir o tipo "${nome}"?\n\nPlanos trimestrais já criados não são afetados (usam snapshot).`)) return;
    const res = await fetch(`/api/tipos-avaliacao/${id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? 'Não foi possível excluir');
      return;
    }
    await load(lojaAtiva);
  }

  function updateEditado(updater: (prev: TipoAvaliacao) => TipoAvaliacao) {
    setEditando(prev => (prev ? updater(prev) : prev));
  }

  const lojaNome = lojas.find(l => l.id === lojaAtiva)?.nome ?? '';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push(`/bonificacao`)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#1c1c1e]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl font-bold">Tipos de Avaliação</h1>
          <button
            onClick={() => iniciarCriacao()}
            disabled={!lojaAtiva}
            className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Novo tipo
          </button>
        </div>

        <div className="mb-6">
          <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">Loja</label>
          <select
            value={lojaAtiva}
            onChange={e => setLojaAtiva(e.target.value)}
            className="w-full max-w-md appearance-none bg-[#111113] border border-[#2a2a2e] text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500/40"
          >
            {lojas.map(l => (
              <option key={l.id} value={l.id}>{l.nome}</option>
            ))}
          </select>
          {lojaNome && <p className="text-xs text-gray-600 mt-1">Tipos de {lojaNome}</p>}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {tipos.length === 0 && !editando && (
              <p className="text-center text-gray-500 py-12">Nenhum tipo cadastrado. Crie o primeiro.</p>
            )}
            {tipos.map(t => (
              <div key={t.id} className="bg-[#111113] border border-[#2a2a2e] rounded-2xl p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-white">{t.nome}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.modoCalculo === 'MEDIA' ? 'Modo média' : 'Modo padrão'}
                    {' · '}{t.metricas.length} métricas · {t.descontos.length} descontos · {t.faixas.length} faixas
                  </p>
                </div>
                <button
                  onClick={() => iniciarCriacao(t)}
                  className="p-2 text-gray-500 hover:text-gray-300"
                  title="Duplicar"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setEditando(cloneTipo(t)); setCriando(false); setErro(''); }}
                  className="p-2 text-gray-500 hover:text-amber-400"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => excluir(t.id, t.nome)}
                  className="p-2 text-gray-500 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {editando && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center overflow-y-auto p-4">
            <div className="bg-[#111113] border border-[#2a2a2e] rounded-2xl w-full max-w-3xl my-8">
              <div className="px-5 py-4 border-b border-[#2a2a2e] flex items-center justify-between">
                <h2 className="font-bold">{criando ? 'Novo tipo' : 'Editar tipo'}</h2>
                <button onClick={() => { setEditando(null); setCriando(false); }} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                {erro && <p className="text-sm text-red-400">{erro}</p>}

                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Nome</label>
                  <input
                    className={inputCls + ' mt-1'}
                    value={editando.nome}
                    onChange={e => updateEditado(p => ({ ...p, nome: e.target.value }))}
                    placeholder="Ex.: Gerente, Coordenador..."
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Modo de cálculo</label>
                  <select
                    className={inputCls + ' mt-1'}
                    value={editando.modoCalculo}
                    onChange={e => updateEditado(p => ({ ...p, modoCalculo: e.target.value as ModoCalculo }))}
                  >
                    <option value="PADRAO">Padrão (tabela editável por loja)</option>
                    <option value="MEDIA">Média (soma média das outras lojas)</option>
                  </select>
                </div>

                {/* Métricas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Métricas</label>
                    <button
                      onClick={() => updateEditado(p => ({
                        ...p,
                        metricas: [...p.metricas, { id: newId(), nome: 'Nova métrica', maxPontos: 30 }],
                      }))}
                      className="text-xs text-amber-400 hover:text-amber-300"
                    >
                      + Adicionar
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[minmax(0,1fr)_80px_36px] gap-2 px-1">
                      <span className="text-[10px] text-gray-600 uppercase">Nome da métrica</span>
                      <span className="text-[10px] text-gray-600 uppercase text-center">Pts</span>
                      <span />
                    </div>
                    {editando.metricas.map((m, i) => (
                      <div key={m.id} className="grid grid-cols-[minmax(0,1fr)_80px_36px] gap-2 items-center">
                        <input
                          className={inputCls}
                          placeholder="Nome da métrica"
                          value={m.nome ?? ''}
                          onChange={e => updateEditado(p => ({
                            ...p,
                            metricas: p.metricas.map((x, j) => j === i ? { ...x, nome: e.target.value } : x),
                          }))}
                        />
                        <input
                          type="number"
                          className={inputCls + ' text-center'}
                          value={m.maxPontos}
                          onChange={e => updateEditado(p => ({
                            ...p,
                            metricas: p.metricas.map((x, j) => j === i ? { ...x, maxPontos: Number(e.target.value) || 0 } : x),
                          }))}
                        />
                        <button
                          onClick={() => updateEditado(p => ({ ...p, metricas: p.metricas.filter((_, j) => j !== i) }))}
                          className="p-2 text-gray-600 hover:text-red-400 justify-self-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Descontos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Descontos (pts quando ativo)</label>
                    <button
                      onClick={() => updateEditado(p => ({
                        ...p,
                        descontos: [...p.descontos, { id: newId(), nome: 'Novo desconto', valor: 20 }],
                      }))}
                      className="text-xs text-amber-400 hover:text-amber-300"
                    >
                      + Adicionar
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[minmax(0,1fr)_80px_36px] gap-2 px-1">
                      <span className="text-[10px] text-gray-600 uppercase">Nome do desconto</span>
                      <span className="text-[10px] text-gray-600 uppercase text-center">Pts</span>
                      <span />
                    </div>
                    {editando.descontos.map((d, i) => (
                      <div key={d.id} className="grid grid-cols-[minmax(0,1fr)_80px_36px] gap-2 items-center">
                        <input
                          className={inputCls}
                          placeholder="Nome do desconto"
                          value={d.nome ?? ''}
                          onChange={e => updateEditado(p => ({
                            ...p,
                            descontos: p.descontos.map((x, j) => j === i ? { ...x, nome: e.target.value } : x),
                          }))}
                        />
                        <input
                          type="number"
                          className={inputCls + ' text-center'}
                          value={d.valor}
                          onChange={e => updateEditado(p => ({
                            ...p,
                            descontos: p.descontos.map((x, j) => j === i ? { ...x, valor: Number(e.target.value) || 0 } : x),
                          }))}
                        />
                        <button
                          onClick={() => updateEditado(p => ({ ...p, descontos: p.descontos.filter((_, j) => j !== i) }))}
                          className="p-2 text-gray-600 hover:text-red-400 justify-self-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Faixas */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Faixas de bonificação</label>
                    <button
                      onClick={() => updateEditado(p => ({
                        ...p,
                        faixas: [...p.faixas, {
                          faixa: p.faixas.length + 1,
                          pontosMin: 0,
                          valorGerente: 0,
                          valorFuncionario: 0,
                        }],
                      }))}
                      className="text-xs text-amber-400 hover:text-amber-300"
                    >
                      + Adicionar
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2 px-1">
                      <span className="text-[10px] text-gray-600 uppercase">Pts mínimos</span>
                      <span className="text-[10px] text-gray-600 uppercase">Gerente (R$)</span>
                      <span className="text-[10px] text-gray-600 uppercase">Funcionário (R$)</span>
                      <span />
                    </div>
                    {editando.faixas.map((f, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2 items-center">
                        <input
                          type="number"
                          placeholder="Pts mín."
                          className={inputCls}
                          value={f.pontosMin}
                          onChange={e => updateEditado(p => ({
                            ...p,
                            faixas: p.faixas.map((x, j) => j === i ? { ...x, pontosMin: Number(e.target.value) || 0 } : x),
                          }))}
                        />
                        <input
                          type="number"
                          placeholder="Gerente R$"
                          className={inputCls}
                          value={f.valorGerente}
                          onChange={e => updateEditado(p => ({
                            ...p,
                            faixas: p.faixas.map((x, j) => j === i ? { ...x, valorGerente: Number(e.target.value) || 0 } : x),
                          }))}
                        />
                        <input
                          type="number"
                          placeholder="Func. R$"
                          className={inputCls}
                          value={f.valorFuncionario}
                          onChange={e => updateEditado(p => ({
                            ...p,
                            faixas: p.faixas.map((x, j) => j === i ? { ...x, valorFuncionario: Number(e.target.value) || 0 } : x),
                          }))}
                        />
                        <button
                          onClick={() => updateEditado(p => ({ ...p, faixas: p.faixas.filter((_, j) => j !== i) }))}
                          className="p-2 text-gray-600 hover:text-red-400 justify-self-end"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-[#2a2a2e] flex justify-end gap-2">
                <button
                  onClick={() => { setEditando(null); setCriando(false); }}
                  className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TiposAvaliacaoPage() {
  return (
    <ToolProtection tool={SystemTool.BONIFICACAO} toolName="Bonificação">
      <Suspense fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
        </div>
      }>
        <TiposContent />
      </Suspense>
    </ToolProtection>
  );
}
