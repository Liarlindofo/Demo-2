'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLoja } from '@/contexts/LojaContext';
import {
  ArrowLeft, ClipboardList, Plus, Pencil, Trash2, X,
  Check, ChevronUp, ChevronDown, BarChart3, Settings,
  Loader2, AlertTriangle, CheckCircle,
} from 'lucide-react';

interface Cargo { id: string; nome: string }
interface Loja { id: string; nome: string }

interface PosicaoIdeal {
  id: string;
  cargoId: string;
  cargo: Cargo;
  turno: string;
  quantidadeIdeal: number;
  observacoes: string | null;
}

interface SetorIdeal {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  posicoes: PosicaoIdeal[];
}

interface QuadroIdeal {
  id: string;
  lojaId: string;
  nome: string | null;
  setores: SetorIdeal[];
}

interface PosicaoComparativo extends PosicaoIdeal {
  quantidadeReal: number;
  diff: number;
  situacao: 'ok' | 'atencao' | 'critico';
}

interface SetorComparativo {
  id: string;
  nome: string;
  posicoes: PosicaoComparativo[];
}

interface Comparativo {
  quadro: { id: string; nome: string | null; lojaId: string };
  setores: SetorComparativo[];
  resumo: { totalIdeal: number; totalOk: number; totalGaps: number };
}

const TURNOS = ['manhã', 'tarde', 'noite', 'integral'];
const TURNO_LABELS: Record<string, string> = { manhã: 'Manhã', tarde: 'Tarde', noite: 'Noite', integral: 'Integral' };

const inputCls = 'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors';

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

export default function QuadroIdealPage() {
  const router = useRouter();
  const { lojas, lojaSelecionada, setLojaSelecionada } = useLoja();
  const [tab, setTab] = useState<'editar' | 'comparativo'>('editar');
  const [quadro, setQuadro] = useState<QuadroIdeal | null>(null);
  const [comparativo, setComparativo] = useState<Comparativo | null>(null);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingComp, setLoadingComp] = useState(false);
  const [toast, setToast] = useState('');

  // Novo setor
  const [novoSetorNome, setNovoSetorNome] = useState('');
  const [criandoSetor, setCriandoSetor] = useState(false);
  const [showNovoSetor, setShowNovoSetor] = useState(false);

  // Edição de setor
  const [editandoSetorId, setEditandoSetorId] = useState<string | null>(null);
  const [editandoSetorNome, setEditandoSetorNome] = useState('');

  // Nova posição
  const [novaPosicaoSetorId, setNovaPosicaoSetorId] = useState<string | null>(null);
  const [npCargo, setNpCargo] = useState('');
  const [npTurno, setNpTurno] = useState('manhã');
  const [npQtd, setNpQtd] = useState(1);
  const [npObs, setNpObs] = useState('');
  const [salvandoPosicao, setSalvandoPosicao] = useState(false);

  // Edição de posição
  const [editPosicaoId, setEditPosicaoId] = useState<string | null>(null);
  const [epCargo, setEpCargo] = useState('');
  const [epTurno, setEpTurno] = useState('manhã');
  const [epQtd, setEpQtd] = useState(1);
  const [epObs, setEpObs] = useState('');

  const lojaAtiva = lojaSelecionada;
  const showToast = (msg: string) => { setToast(msg); };

  const fetchQuadro = useCallback(async (lojaId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rh/quadro-ideal?lojaId=${lojaId}`);
      if (res.ok) setQuadro(await res.json());
      else setQuadro(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComparativo = useCallback(async (lojaId: string) => {
    setLoadingComp(true);
    try {
      const res = await fetch(`/api/rh/quadro-ideal/comparativo?lojaId=${lojaId}`);
      if (res.ok) setComparativo(await res.json());
    } finally {
      setLoadingComp(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/rh/cargos').then(r => r.ok ? r.json() : []).then(setCargos).catch(() => {});
  }, []);

  useEffect(() => {
    if (lojaAtiva) {
      fetchQuadro(lojaAtiva.id);
      if (tab === 'comparativo') fetchComparativo(lojaAtiva.id);
    }
  }, [lojaAtiva, tab, fetchQuadro, fetchComparativo]);

  const criarQuadro = async () => {
    if (!lojaAtiva) return;
    const res = await fetch('/api/rh/quadro-ideal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lojaId: lojaAtiva.id }),
    });
    if (res.ok) { fetchQuadro(lojaAtiva.id); showToast('Quadro criado'); }
  };

  const criarSetor = async () => {
    if (!novoSetorNome.trim() || !quadro) return;
    setCriandoSetor(true);
    try {
      const res = await fetch('/api/rh/quadro-ideal/setores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quadroIdealId: quadro.id, nome: novoSetorNome.trim(), ordem: quadro.setores.length }),
      });
      if (res.ok) {
        setNovoSetorNome('');
        setShowNovoSetor(false);
        fetchQuadro(lojaAtiva!.id);
        showToast('Setor criado');
      }
    } finally {
      setCriandoSetor(false);
    }
  };

  const salvarNomeSetor = async (setorId: string) => {
    if (!editandoSetorNome.trim()) return;
    const res = await fetch(`/api/rh/quadro-ideal/setores/${setorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: editandoSetorNome.trim() }),
    });
    if (res.ok) { setEditandoSetorId(null); fetchQuadro(lojaAtiva!.id); showToast('Setor atualizado'); }
  };

  const moverSetor = async (setorId: string, dir: 'up' | 'down') => {
    if (!quadro) return;
    const idx = quadro.setores.findIndex(s => s.id === setorId);
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === quadro.setores.length - 1)) return;
    const newOrdem = dir === 'up' ? quadro.setores[idx - 1].ordem : quadro.setores[idx + 1].ordem;
    await fetch(`/api/rh/quadro-ideal/setores/${setorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ordem: newOrdem }),
    });
    fetchQuadro(lojaAtiva!.id);
  };

  const excluirSetor = async (setorId: string) => {
    if (!confirm('Excluir este setor e todas as suas posições?')) return;
    const res = await fetch(`/api/rh/quadro-ideal/setores/${setorId}`, { method: 'DELETE' });
    if (res.ok) { fetchQuadro(lojaAtiva!.id); showToast('Setor removido'); }
  };

  const salvarPosicao = async () => {
    if (!npCargo || !novaPosicaoSetorId) return;
    setSalvandoPosicao(true);
    try {
      const res = await fetch('/api/rh/quadro-ideal/posicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setorId: novaPosicaoSetorId, cargoId: npCargo, turno: npTurno, quantidadeIdeal: npQtd, observacoes: npObs || null }),
      });
      if (res.ok) {
        setNovaPosicaoSetorId(null);
        setNpCargo(''); setNpTurno('manhã'); setNpQtd(1); setNpObs('');
        fetchQuadro(lojaAtiva!.id);
        showToast('Posição adicionada');
      }
    } finally {
      setSalvandoPosicao(false);
    }
  };

  const salvarEdicaoPosicao = async (posicaoId: string) => {
    const res = await fetch(`/api/rh/quadro-ideal/posicoes/${posicaoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cargoId: epCargo, turno: epTurno, quantidadeIdeal: epQtd, observacoes: epObs || null }),
    });
    if (res.ok) { setEditPosicaoId(null); fetchQuadro(lojaAtiva!.id); showToast('Posição atualizada'); }
  };

  const excluirPosicao = async (posicaoId: string) => {
    const res = await fetch(`/api/rh/quadro-ideal/posicoes/${posicaoId}`, { method: 'DELETE' });
    if (res.ok) { fetchQuadro(lojaAtiva!.id); showToast('Posição removida'); }
  };

  const exportarGaps = () => {
    if (!comparativo) return;
    const linhas = ['Setor,Cargo,Turno,Ideal,Real,Gap'];
    comparativo.setores.forEach(s => {
      s.posicoes.filter(p => p.situacao !== 'ok').forEach(p => {
        linhas.push(`"${s.nome}","${p.cargo.nome}","${TURNO_LABELS[p.turno] ?? p.turno}",${p.quantidadeIdeal},${p.quantidadeReal},${Math.abs(p.diff)}`);
      });
    });
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gaps_quadro_ideal.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/rh')} className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Quadro Ideal</h1>
              <p className="text-xs text-gray-500">Estrutura ideal de equipe por setor</p>
            </div>
          </div>
        </div>

        {/* Seletor de loja */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {lojas.map((l: Loja) => (
            <button key={l.id} onClick={() => setLojaSelecionada(l)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${lojaSelecionada?.id === l.id ? 'bg-amber-500 text-black' : 'bg-[#2a2a2e] text-gray-300 hover:bg-[#3a3a3e]'}`}
            >
              {l.nome}
            </button>
          ))}
        </div>

        {!lojaAtiva ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <ClipboardList className="w-12 h-12 text-gray-700" />
            <p className="text-gray-400 font-medium">Selecione uma loja para ver o quadro ideal</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl p-1 w-fit">
              {([['editar', Settings, 'Editar Quadro'], ['comparativo', BarChart3, 'Comparativo']] as const).map(([t, Icon, label]) => (
                <button key={t} onClick={() => setTab(t as 'editar' | 'comparativo')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[0, 1].map(i => <div key={i} className="h-40 bg-[#1c1c1e] rounded-2xl" />)}
              </div>
            ) : tab === 'editar' ? (
              /* ── TAB EDITAR ── */
              <div className="space-y-4">
                {!quadro ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 bg-[#111113] border border-[#2a2a2e] rounded-2xl">
                    <ClipboardList className="w-12 h-12 text-gray-700" />
                    <div className="text-center">
                      <p className="text-white font-medium">Nenhum quadro ideal configurado</p>
                      <p className="text-sm text-gray-500 mt-1">Crie o quadro ideal para {lojaAtiva.nome}</p>
                    </div>
                    <button onClick={criarQuadro} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors">
                      <Plus className="w-4 h-4" /> Criar Quadro Ideal
                    </button>
                  </div>
                ) : (
                  <>
                    {quadro.setores.map((setor) => (
                      <div key={setor.id} className="bg-[#111113] border border-[#2a2a2e] rounded-2xl overflow-hidden">
                        {/* Cabeçalho do setor */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2a2e] bg-[#161618]">
                          {editandoSetorId === setor.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input value={editandoSetorNome} onChange={e => setEditandoSetorNome(e.target.value)}
                                className="flex-1 bg-[#0a0a0a] border border-amber-500/40 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                                autoFocus onKeyDown={e => e.key === 'Enter' && salvarNomeSetor(setor.id)}
                              />
                              <button onClick={() => salvarNomeSetor(setor.id)} className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center hover:bg-amber-500/20"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setEditandoSetorId(null)} className="w-7 h-7 rounded-lg bg-[#2a2a2e] text-gray-400 flex items-center justify-center hover:bg-[#3a3a3e]"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <h3 className="font-semibold text-white">{setor.nome}</h3>
                          )}
                          <div className="flex items-center gap-1 ml-2">
                            <button onClick={() => moverSetor(setor.id, 'up')} className="w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-[#2a2a2e] flex items-center justify-center"><ChevronUp className="w-3.5 h-3.5" /></button>
                            <button onClick={() => moverSetor(setor.id, 'down')} className="w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-[#2a2a2e] flex items-center justify-center"><ChevronDown className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setEditandoSetorId(setor.id); setEditandoSetorNome(setor.nome); }} className="w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-[#2a2a2e] flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => excluirSetor(setor.id)} className="w-7 h-7 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>

                        {/* Tabela de posições */}
                        {setor.posicoes.length > 0 && (
                          <div className="divide-y divide-[#2a2a2e]">
                            <div className="hidden sm:grid grid-cols-[2fr_1fr_80px_2fr_80px] gap-4 px-5 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                              <span>Cargo</span><span>Turno</span><span>Qtd</span><span>Observações</span><span />
                            </div>
                            {setor.posicoes.map((p) => (
                              <div key={p.id}>
                                {editPosicaoId === p.id ? (
                                  <div className="px-5 py-3 grid sm:grid-cols-[2fr_1fr_80px_2fr_80px] gap-3 items-center">
                                    <select value={epCargo} onChange={e => setEpCargo(e.target.value)} className={inputCls}>
                                      {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                    </select>
                                    <select value={epTurno} onChange={e => setEpTurno(e.target.value)} className={inputCls}>
                                      {TURNOS.map(t => <option key={t} value={t}>{TURNO_LABELS[t]}</option>)}
                                    </select>
                                    <input type="number" min={1} value={epQtd} onChange={e => setEpQtd(Number(e.target.value))} className={inputCls} />
                                    <input value={epObs} onChange={e => setEpObs(e.target.value)} placeholder="Observações" className={inputCls} />
                                    <div className="flex gap-1">
                                      <button onClick={() => salvarEdicaoPosicao(p.id)} className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center hover:bg-amber-500/20"><Check className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => setEditPosicaoId(null)} className="w-7 h-7 rounded-lg bg-[#2a2a2e] text-gray-400 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="px-5 py-3 grid sm:grid-cols-[2fr_1fr_80px_2fr_80px] gap-4 items-center hover:bg-[#161618] transition-colors">
                                    <span className="text-sm text-white">{p.cargo.nome}</span>
                                    <span className="text-sm text-gray-400">{TURNO_LABELS[p.turno] ?? p.turno}</span>
                                    <span className="text-sm font-semibold text-amber-400">{p.quantidadeIdeal}</span>
                                    <span className="text-xs text-gray-500 truncate">{p.observacoes || '—'}</span>
                                    <div className="flex gap-1">
                                      <button onClick={() => { setEditPosicaoId(p.id); setEpCargo(p.cargoId); setEpTurno(p.turno); setEpQtd(p.quantidadeIdeal); setEpObs(p.observacoes ?? ''); }} className="w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-[#2a2a2e] flex items-center justify-center"><Pencil className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => excluirPosicao(p.id)} className="w-7 h-7 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Formulário nova posição */}
                        {novaPosicaoSetorId === setor.id ? (
                          <div className="px-5 py-3 border-t border-[#2a2a2e] bg-[#0d0d0f]">
                            <div className="grid sm:grid-cols-[2fr_1fr_80px_2fr_auto] gap-3 items-end">
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase mb-1 block">Cargo</label>
                                <select value={npCargo} onChange={e => setNpCargo(e.target.value)} className={inputCls}>
                                  <option value="">Selecione...</option>
                                  {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase mb-1 block">Turno</label>
                                <select value={npTurno} onChange={e => setNpTurno(e.target.value)} className={inputCls}>
                                  {TURNOS.map(t => <option key={t} value={t}>{TURNO_LABELS[t]}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase mb-1 block">Qtd</label>
                                <input type="number" min={1} value={npQtd} onChange={e => setNpQtd(Number(e.target.value))} className={inputCls} />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-500 uppercase mb-1 block">Observações</label>
                                <input value={npObs} onChange={e => setNpObs(e.target.value)} placeholder="Opcional" className={inputCls} />
                              </div>
                              <div className="flex gap-2 pb-0.5">
                                <button onClick={salvarPosicao} disabled={salvandoPosicao || !npCargo}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors">
                                  {salvandoPosicao ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  Salvar
                                </button>
                                <button onClick={() => setNovaPosicaoSetorId(null)} className="px-3 py-2 rounded-lg border border-[#2a2a2e] text-xs text-gray-400 hover:text-white">
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="px-5 py-3 border-t border-[#2a2a2e]">
                            <button onClick={() => { setNovaPosicaoSetorId(setor.id); setNpCargo(cargos[0]?.id ?? ''); }}
                              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                              <Plus className="w-3.5 h-3.5" /> Adicionar posição
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Novo setor */}
                    {showNovoSetor ? (
                      <div className="bg-[#111113] border border-amber-500/20 rounded-2xl p-5">
                        <div className="flex items-center gap-3">
                          <input value={novoSetorNome} onChange={e => setNovoSetorNome(e.target.value)}
                            placeholder="Nome do setor (ex: Cozinha, Atendimento...)"
                            className={`flex-1 ${inputCls}`}
                            autoFocus onKeyDown={e => e.key === 'Enter' && criarSetor()}
                          />
                          <button onClick={criarSetor} disabled={criandoSetor || !novoSetorNome.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors">
                            {criandoSetor ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Criar
                          </button>
                          <button onClick={() => { setShowNovoSetor(false); setNovoSetorNome(''); }}
                            className="w-9 h-9 rounded-xl border border-[#2a2a2e] text-gray-400 hover:text-white flex items-center justify-center">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowNovoSetor(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#2a2a2e] text-gray-500 hover:border-amber-500/30 hover:text-amber-400 transition-colors text-sm">
                        <Plus className="w-4 h-4" /> Novo Setor
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              /* ── TAB COMPARATIVO ── */
              <div className="space-y-4">
                {loadingComp ? (
                  <div className="animate-pulse space-y-4">
                    {[0, 1].map(i => <div key={i} className="h-40 bg-[#1c1c1e] rounded-2xl" />)}
                  </div>
                ) : !comparativo || !comparativo.quadro ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 bg-[#111113] border border-[#2a2a2e] rounded-2xl text-center">
                    <BarChart3 className="w-12 h-12 text-gray-700" />
                    <p className="text-gray-400">Configure o quadro ideal primeiro para ver o comparativo</p>
                  </div>
                ) : (
                  <>
                    {/* Resumo */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Posições Ideais', value: comparativo.resumo.totalIdeal, color: 'text-white' },
                        { label: 'Preenchidas', value: comparativo.resumo.totalOk, color: 'text-green-400' },
                        { label: 'Gaps', value: comparativo.resumo.totalGaps, color: 'text-red-400' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4 text-center">
                          <p className={`text-2xl font-bold ${color}`}>{value}</p>
                          <p className="text-xs text-gray-500 mt-1">{label}</p>
                        </div>
                      ))}
                    </div>

                    {comparativo.resumo.totalGaps > 0 && (
                      <div className="flex justify-end">
                        <button onClick={exportarGaps}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-gray-300 text-sm hover:bg-[#2a2a2e] transition-colors">
                          Exportar gaps (CSV)
                        </button>
                      </div>
                    )}

                    {comparativo.setores.map((setor) => (
                      <div key={setor.id} className="bg-[#111113] border border-[#2a2a2e] rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 bg-[#161618] border-b border-[#2a2a2e]">
                          <h3 className="font-semibold text-white text-sm">{setor.nome}</h3>
                        </div>
                        <div className="divide-y divide-[#2a2a2e]">
                          <div className="hidden sm:grid grid-cols-[2fr_1fr_80px_80px_120px] gap-4 px-5 py-2 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                            <span>Cargo</span><span>Turno</span><span>Ideal</span><span>Real</span><span>Situação</span>
                          </div>
                          {setor.posicoes.map((p) => (
                            <div key={p.id} className="px-5 py-3 grid sm:grid-cols-[2fr_1fr_80px_80px_120px] gap-4 items-center hover:bg-[#161618] transition-colors">
                              <span className="text-sm text-white">{p.cargo.nome}</span>
                              <span className="text-sm text-gray-400">{TURNO_LABELS[p.turno] ?? p.turno}</span>
                              <span className="text-sm font-medium text-gray-300">{p.quantidadeIdeal}</span>
                              <span className="text-sm font-medium text-gray-300">{p.quantidadeReal}</span>
                              <span className={`flex items-center gap-1.5 text-xs font-semibold ${p.situacao === 'ok' ? 'text-green-400' : p.situacao === 'atencao' ? 'text-amber-400' : 'text-red-400'}`}>
                                {p.situacao === 'ok'
                                  ? <><CheckCircle className="w-3.5 h-3.5" /> OK</>
                                  : p.situacao === 'atencao'
                                  ? <><AlertTriangle className="w-3.5 h-3.5" /> Falta 1</>
                                  : <><AlertTriangle className="w-3.5 h-3.5" /> Faltam {Math.abs(p.diff)}</>
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
