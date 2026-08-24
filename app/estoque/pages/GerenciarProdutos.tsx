'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, Search, ChevronUp, ChevronDown, Plus, Trash2, X, ArrowDownAZ } from 'lucide-react';
import type { EstoqueConfigMap } from '../hooks/useEstoqueConfig';
import type { ProdutoEstoque } from '../hooks/useProdutosEstoque';
import { CATEGORIAS_PADRAO } from '@/lib/estoque-insumos-padrao';

interface GerenciarProdutosProps {
  produtos: ProdutoEstoque[];
  config: EstoqueConfigMap;
  productOrder: string[];
  onVoltar: () => void;
  onSetAtivo: (insumoId: string, ativo: boolean) => void;
  onSetMinimo: (insumoId: string, minimo: number | undefined) => void;
  onSetModoContagem: (insumoId: string, modo: 'kg' | 'unidade') => void;
  onSetKgPorUnidade: (insumoId: string, kg: number | undefined) => void;
  onMoverAcima: (produtoId: string, allIds: string[]) => void;
  onMoverAbaixo: (produtoId: string, allIds: string[]) => void;
  onSetProductOrder: (ids: string[]) => void;
  onRefetch: () => void;
}

function Toggle({ ativo, onChange }: { ativo: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!ativo)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        ativo ? 'bg-amber-500' : 'bg-[#374151]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          ativo ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ── Modal de Adicionar Produto ────────────────────────────────────────────────

interface AddModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function AddModal({ onClose, onSaved }: AddModalProps) {
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('kg');
  const [categoriaId, setCategoriaId] = useState<string>(CATEGORIAS_PADRAO[0].id);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const categoria = CATEGORIAS_PADRAO.find(c => c.id === categoriaId)!;

  const handleSalvar = async () => {
    if (!nome.trim()) { setErro('Informe o nome do produto.'); return; }
    setSaving(true);
    setErro('');
    try {
      const res = await fetch('/api/estoque/insumos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          unidade,
          categoriaId: categoria.id,
          categoriaNome: categoria.nome,
          categoriaIcone: categoria.icone,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar');
      }
      onSaved();
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Novo produto</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Nome</label>
            <input
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: MOZZARELA EXTRA"
              className="w-full bg-[#141416] border border-[#374151] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Unidade</label>
              <select
                value={unidade}
                onChange={e => setUnidade(e.target.value)}
                className="w-full bg-[#141416] border border-[#374151] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
              >
                <option value="kg">kg</option>
                <option value="un">un</option>
                <option value="L">L</option>
                <option value="g">g</option>
                <option value="ml">ml</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Categoria</label>
              <select
                value={categoriaId}
                onChange={e => setCategoriaId(e.target.value)}
                className="w-full bg-[#141416] border border-[#374151] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/60"
              >
                {CATEGORIAS_PADRAO.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icone} {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {erro && <p className="text-xs text-red-400">{erro}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#374151] text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function GerenciarProdutos({
  produtos,
  config,
  productOrder,
  onVoltar,
  onSetAtivo,
  onSetMinimo,
  onSetModoContagem,
  onSetKgPorUnidade,
  onMoverAcima,
  onMoverAbaixo,
  onSetProductOrder,
  onRefetch,
}: GerenciarProdutosProps) {
  const [search, setSearch] = useState('');
  const [reordenando, setReordenando] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOrdenarAlfabetico = () => {
    const ordenados = [...produtos].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }),
    );
    onSetProductOrder(ordenados.map(p => p.insumoId));
  };

  const allIds = produtos.map(p => p.insumoId);

  const produtosOrdenados = useMemo(() => {
    if (productOrder.length === 0) return produtos;
    return [...produtos].sort((a, b) => {
      const ia = productOrder.indexOf(a.insumoId);
      const ib = productOrder.indexOf(b.insumoId);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [produtos, productOrder]);

  const grupos = useMemo(() => {
    const map = new Map<string, { id: string; nome: string; icone: string; itens: ProdutoEstoque[] }>();
    for (const p of produtosOrdenados) {
      if (!map.has(p.sessaoId)) {
        map.set(p.sessaoId, { id: p.sessaoId, nome: p.sessaoNome, icone: p.sessaoIcone, itens: [] });
      }
      map.get(p.sessaoId)!.itens.push(p);
    }
    return Array.from(map.values());
  }, [produtosOrdenados]);

  const filtrados = search.trim()
    ? produtosOrdenados.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()))
    : null;

  const totalAtivos = produtos.filter(p => {
    const cfg = config[p.insumoId];
    return cfg === undefined || cfg.ativo !== false;
  }).length;

  const handleDelete = async (produto: ProdutoEstoque) => {
    if (!confirm(`Remover "${produto.nome}" da lista?`)) return;
    setDeletingId(produto.id);
    try {
      await fetch(`/api/estoque/insumos/${produto.id}`, { method: 'DELETE' });
      onRefetch();
    } catch {
      alert('Erro ao remover produto.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onSaved={onRefetch}
        />
      )}

      {/* Header */}
      <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onVoltar} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-white text-lg">Produtos da Contagem</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalAtivos} de {produtos.length} produto{produtos.length !== 1 ? 's' : ''} habilitado{totalAtivos !== 1 ? 's' : ''}
            </p>
          </div>
          {!reordenando && (
            <button
              onClick={handleOrdenarAlfabetico}
              title="Ordenar A-Z"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#374151] text-gray-400 hover:text-white transition-colors"
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
              A-Z
            </button>
          )}
          <button
            onClick={() => setReordenando(r => !r)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
              reordenando
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'border-[#374151] text-gray-400 hover:text-white'
            }`}
          >
            {reordenando ? 'Concluir' : 'Reordenar'}
          </button>
          {!reordenando && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo
            </button>
          )}
        </div>

        {!reordenando && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar produto…"
              className="w-full bg-[#141416] border border-[#374151] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>
        )}
      </div>

      {/* Info */}
      {!reordenando && (
        <div className="px-4 py-3 bg-[#141416] border-b border-[#2a2a2e]">
          <p className="text-xs text-gray-500">
            Produtos <span className="text-white">desabilitados</span> não aparecem nas próximas contagens.
            O <span className="text-white">estoque mínimo</span> gera alerta quando a quantidade contada estiver abaixo.
          </p>
        </div>
      )}

      {reordenando && (
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <p className="text-xs text-amber-400">
            Use as setas para definir a ordem de exibição dos produtos na contagem.
          </p>
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 overflow-y-auto pb-6">
        {reordenando ? (
          <div className="px-4 pt-4 space-y-2">
            {produtosOrdenados.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center gap-3 bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl px-4 py-3"
              >
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => onMoverAcima(p.insumoId, allIds)}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-amber-400 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onMoverAbaixo(p.insumoId, allIds)}
                    disabled={idx === produtosOrdenados.length - 1}
                    className="p-1 text-gray-400 hover:text-amber-400 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.nome}</p>
                  <p className="text-xs text-gray-600">{p.unidade}</p>
                </div>
                <span className="text-xs text-gray-600 shrink-0">{idx + 1}</span>
              </div>
            ))}
          </div>
        ) : filtrados ? (
          <div className="px-4 pt-4 space-y-2">
            {filtrados.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">Nenhum produto encontrado</p>
            ) : (
              filtrados.map(p => (
                <ProdutoRow
                  key={p.id}
                  produto={p}
                  config={config[p.insumoId]}
                  deleting={deletingId === p.id}
                  onSetAtivo={onSetAtivo}
                  onSetMinimo={onSetMinimo}
                  onSetModoContagem={onSetModoContagem}
                  onSetKgPorUnidade={onSetKgPorUnidade}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        ) : (
          grupos.map(grupo => (
            <div key={grupo.id}>
              <div className="flex items-center gap-2 px-4 pt-5 pb-2">
                <span className="text-base">{grupo.icone}</span>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {grupo.nome}
                </p>
                <span className="text-xs text-gray-600 ml-auto">
                  {grupo.itens.filter(p => {
                    const cfg = config[p.insumoId];
                    return cfg === undefined || cfg.ativo !== false;
                  }).length}/{grupo.itens.length}
                </span>
              </div>
              <div className="px-4 space-y-2">
                {grupo.itens.map(p => (
                  <ProdutoRow
                    key={p.id}
                    produto={p}
                    config={config[p.insumoId]}
                    deleting={deletingId === p.id}
                    onSetAtivo={onSetAtivo}
                    onSetMinimo={onSetMinimo}
                    onSetModoContagem={onSetModoContagem}
                    onSetKgPorUnidade={onSetKgPorUnidade}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Linha de produto ──────────────────────────────────────────────────────────

interface ProdutoRowProps {
  produto: ProdutoEstoque;
  config: { ativo: boolean; estoqueMinimo?: number; modoContagem?: 'kg' | 'unidade'; kgPorUnidade?: number } | undefined;
  deleting: boolean;
  onSetAtivo: (id: string, v: boolean) => void;
  onSetMinimo: (id: string, v: number | undefined) => void;
  onSetModoContagem: (id: string, modo: 'kg' | 'unidade') => void;
  onSetKgPorUnidade: (id: string, kg: number | undefined) => void;
  onDelete: (p: ProdutoEstoque) => void;
}

function ProdutoRow({
  produto,
  config,
  deleting,
  onSetAtivo,
  onSetMinimo,
  onSetModoContagem,
  onSetKgPorUnidade,
  onDelete,
}: ProdutoRowProps) {
  const ativo = config?.ativo !== false;
  const minimo = config?.estoqueMinimo;
  // Padrão alinhado com construirSessoes: itens com unidade 'un' são contados por unidade por padrão
  const modo = config?.modoContagem ?? (produto.unidade === 'un' ? 'unidade' : 'kg');
  const kgPorUnidade = config?.kgPorUnidade;

  const handleMinimo = (raw: string) => {
    if (raw === '') { onSetMinimo(produto.insumoId, undefined); return; }
    const n = parseFloat(raw.replace(',', '.'));
    if (!isNaN(n) && n >= 0) onSetMinimo(produto.insumoId, n);
  };

  const handleKgPorUnidade = (raw: string) => {
    if (raw === '') { onSetKgPorUnidade(produto.insumoId, undefined); return; }
    const n = parseFloat(raw.replace(',', '.'));
    if (!isNaN(n) && n > 0) onSetKgPorUnidade(produto.insumoId, n);
  };

  return (
    <div
      className={`rounded-2xl border px-4 py-3 transition-colors ${
        ativo ? 'bg-[#1c1c1e] border-[#2a2a2e]' : 'bg-[#141416] border-[#2a2a2e] opacity-50'
      } ${deleting ? 'opacity-30 pointer-events-none' : ''}`}
    >
      <div className="flex items-center gap-3">
        <Toggle ativo={ativo} onChange={v => onSetAtivo(produto.insumoId, v)} />

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${ativo ? 'text-white' : 'text-gray-500'}`}>
            {produto.nome}
          </p>
          <p className="text-xs text-gray-600">{produto.unidade}</p>
        </div>

        {ativo && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-gray-500">mín:</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={minimo ?? '' || ''}
              onChange={e => handleMinimo(e.target.value)}
              placeholder="—"
              className="w-16 text-right text-sm font-medium bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1 text-white focus:outline-none focus:border-amber-500/60 placeholder-gray-700"
            />
            <span className="text-xs text-gray-600">{produto.unidade}</span>
          </div>
        )}

        <button
          onClick={() => onDelete(produto)}
          className="ml-1 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          title="Remover produto"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {ativo && (
        <div className="mt-2.5 flex items-center gap-2 pl-14">
          <span className="text-xs text-gray-500 shrink-0">Contar por:</span>

          <div className="flex rounded-lg overflow-hidden border border-[#374151] shrink-0">
            {(['kg', 'unidade'] as const).map(m => (
              <button
                key={m}
                onClick={() => onSetModoContagem(produto.insumoId, m)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  modo === m
                    ? 'bg-amber-500 text-black'
                    : 'bg-[#2a2a2e] text-gray-400 hover:text-white'
                }`}
              >
                {m === 'kg' ? produto.unidade : 'unidade'}
              </button>
            ))}
          </div>

          {modo === 'unidade' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 shrink-0">1 un =</span>
              <input
                type="number"
                inputMode="decimal"
                min="0.001"
                step="0.1"
                value={kgPorUnidade ?? '' || ''}
                onChange={e => handleKgPorUnidade(e.target.value)}
                placeholder="0,0"
                className="w-16 text-right text-sm font-medium bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1 text-white focus:outline-none focus:border-amber-500/60 placeholder-gray-700"
              />
              <span className="text-xs text-gray-600">{produto.unidade}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
