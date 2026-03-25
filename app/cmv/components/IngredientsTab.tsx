'use client';

import { useState } from 'react';
import { Plus, Pencil, Check, X, Trash2, Search, ChevronDown, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import type { StoreId, Ingrediente, Unidade } from '../types';
import { useStoreData } from '../hooks/useStoreData';
import { formatCurrency } from '../utils';

interface IngredientsTabProps {
  storeId: StoreId;
}

const UNIDADE_LABEL: Record<Unidade, string> = {
  g: 'kg (g)',
  ml: 'L (ml)',
  un: 'un',
};

const UNIDADE_PRECO_LABEL: Record<Unidade, string> = {
  g: '/kg',
  ml: '/L',
  un: '/un',
};

export const IngredientsTab = ({ storeId }: IngredientsTabProps) => {
  const { data, updateData, isLoading } = useStoreData(storeId);

  const [search, setSearch] = useState('');

  // ── Novo ingrediente ───────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newPreco, setNewPreco] = useState('');
  const [newUnidade, setNewUnidade] = useState<Unidade>('g');

  // ── Edição inline ──────────────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editPreco, setEditPreco] = useState('');
  const [editUnidade, setEditUnidade] = useState<Unidade>('g');

  // ── Seleção múltipla ───────────────────────────────────────────────────────
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const filtered = data.ingredientes.filter(i =>
    i.nome.toLowerCase().includes(search.toLowerCase()),
  );

  const allFilteredSelected =
    filtered.length > 0 && filtered.every(i => selectedIds.has(i.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)));
    }
  };

  const enterSelectMode = () => {
    setSelectMode(true);
    setSelectedIds(new Set());
    setEditId(null);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setShowConfirmDelete(false);
  };

  const deleteSelected = () => {
    updateData({
      ...data,
      ingredientes: data.ingredientes.filter(i => !selectedIds.has(i.id)),
    });
    exitSelectMode();
  };

  // Quantos sabores/receitas usam esse ingrediente
  const contarUsos = (ingredienteId: string): { receitas: number; sabores: number } => {
    const receitas = data.receitas.filter(r =>
      r.itens.some(it => it.ingredienteId === ingredienteId),
    ).length;
    const sabores = data.sabores.filter(s =>
      s.itens?.some(it => it.tipo === 'ingrediente' && it.referenciaId === ingredienteId),
    ).length;
    return { receitas, sabores };
  };

  // ── Adicionar ──────────────────────────────────────────────────────────────
  const handleAdd = () => {
    if (!newNome.trim()) return;
    const preco = parseFloat(newPreco.replace(',', '.')) || 0;
    const novoIng: Ingrediente = {
      id: crypto.randomUUID(),
      nome: newNome.trim(),
      unidade: newUnidade,
      precoPorKg: preco,
    };
    updateData({ ...data, ingredientes: [...data.ingredientes, novoIng] });
    setNewNome('');
    setNewPreco('');
    setNewUnidade('g');
    setShowAdd(false);
  };

  // ── Iniciar edição ─────────────────────────────────────────────────────────
  const startEdit = (ing: Ingrediente) => {
    setEditId(ing.id);
    setEditNome(ing.nome);
    setEditPreco(ing.precoPorKg > 0 ? ing.precoPorKg.toString() : '');
    setEditUnidade(ing.unidade);
  };

  const saveEdit = () => {
    if (!editId) return;
    const preco = parseFloat(editPreco.replace(',', '.')) || 0;
    const newIngs = data.ingredientes.map(i =>
      i.id === editId
        ? { ...i, nome: editNome.trim() || i.nome, precoPorKg: preco, unidade: editUnidade }
        : i,
    );
    updateData({ ...data, ingredientes: newIngs });
    setEditId(null);
  };

  const cancelEdit = () => setEditId(null);

  // ── Deletar individual ─────────────────────────────────────────────────────
  const handleDelete = (ing: Ingrediente) => {
    const { receitas, sabores } = contarUsos(ing.id);
    const msg =
      receitas + sabores > 0
        ? `"${ing.nome}" está sendo usado em ${receitas} receita(s) e ${sabores} produto(s). Deseja remover mesmo assim?`
        : `Remover ingrediente "${ing.nome}"?`;
    if (!confirm(msg)) return;
    updateData({ ...data, ingredientes: data.ingredientes.filter(i => i.id !== ing.id) });
  };

  const updatePrecoInline = (id: string, valor: string) => {
    const preco = parseFloat(valor.replace(',', '.'));
    if (isNaN(preco) || preco < 0) return;
    const newIngs = data.ingredientes.map(i =>
      i.id === id ? { ...i, precoPorKg: preco } : i,
    );
    updateData({ ...data, ingredientes: newIngs });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl h-14 animate-pulse" />
        ))}
      </div>
    );
  }

  const gridCols = selectMode
    ? 'grid-cols-[32px_1fr_120px_160px_100px_80px]'
    : 'grid-cols-[1fr_120px_160px_100px_80px]';

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Ingredientes</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.ingredientes.length} ingrediente{data.ingredientes.length !== 1 ? 's' : ''} cadastrado{data.ingredientes.length !== 1 ? 's' : ''}
            {' · '}Alterar preço aqui recalcula receitas e produtos automaticamente
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!selectMode ? (
            <>
              {data.ingredientes.length > 0 && (
                <button
                  onClick={enterSelectMode}
                  className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-[#374151] text-gray-400 hover:text-white rounded-xl px-3 py-2 text-sm font-medium transition-colors"
                >
                  <CheckSquare className="w-4 h-4" />
                  Selecionar
                </button>
              )}
              <button
                onClick={() => setShowAdd(v => !v)}
                className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-green-500/50 hover:bg-green-500/10 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Ingrediente
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-400">
                {selectedIds.size > 0 ? `${selectedIds.size} selecionado${selectedIds.size !== 1 ? 's' : ''}` : 'Nenhum selecionado'}
              </span>
              {someSelected && (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir {selectedIds.size}
                </button>
              )}
              <button
                onClick={exitSelectMode}
                className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-[#374151] text-gray-400 hover:text-white rounded-xl px-3 py-2 text-sm font-medium transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Formulário de adição */}
      {showAdd && !selectMode && (
        <div className="bg-[#1c1c1e] border border-green-500/30 rounded-xl p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-gray-400 block mb-1">Nome *</label>
            <input
              value={newNome}
              onChange={e => setNewNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
              placeholder="Ex: Farinha de trigo"
              className="w-full bg-[#2a2a2e] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="w-36">
            <label className="text-xs text-gray-400 block mb-1">Unidade</label>
            <div className="relative">
              <select
                value={newUnidade}
                onChange={e => setNewUnidade(e.target.value as Unidade)}
                className="w-full appearance-none bg-[#2a2a2e] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
              >
                <option value="g">Peso (g/kg)</option>
                <option value="ml">Volume (ml/L)</option>
                <option value="un">Unidade (un)</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="w-40">
            <label className="text-xs text-gray-400 block mb-1">
              Preço{UNIDADE_PRECO_LABEL[newUnidade]} (R$)
            </label>
            <input
              type="number"
              value={newPreco}
              onChange={e => setNewPreco(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="0,00"
              className="w-full bg-[#2a2a2e] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
              step="0.01"
              min="0"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newNome.trim()}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              Adicionar
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewNome(''); setNewPreco(''); }}
              className="flex items-center gap-1 text-gray-400 hover:text-white px-3 py-2 rounded-lg transition-colors text-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar ingrediente..."
          className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#374151]"
        />
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {data.ingredientes.length === 0 ? (
            <>
              <div className="text-4xl mb-3">🧂</div>
              <h3 className="text-base font-semibold text-white mb-1">Nenhum ingrediente ainda</h3>
              <p className="text-sm text-gray-400 mb-4">
                Cadastre os ingredientes base (farinha, queijo, frango…) e seus preços por kg
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar primeiro ingrediente
              </button>
            </>
          ) : (
            <>
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm text-gray-400">Nenhum ingrediente encontrado</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl overflow-hidden">
          {/* Header da tabela */}
          <div className={`grid ${gridCols} gap-3 px-4 py-2.5 border-b border-[#2a2a2e]`}>
            {selectMode && (
              <button
                onClick={toggleSelectAll}
                className="flex items-center justify-center"
                title={allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              >
                {allFilteredSelected ? (
                  <CheckSquare className="w-4 h-4 text-red-400" />
                ) : (
                  <Square className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidade</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Em uso</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</span>
          </div>

          {/* Linhas */}
          {filtered.map((ing, idx) => {
            const isEditing = editId === ing.id;
            const isSelected = selectedIds.has(ing.id);
            const usos = contarUsos(ing.id);
            const totalUsos = usos.receitas + usos.sabores;

            return (
              <div
                key={ing.id}
                onClick={selectMode && !isEditing ? () => toggleSelect(ing.id) : undefined}
                className={`grid ${gridCols} gap-3 px-4 py-3 items-center transition-colors
                  ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#141416]'}
                  ${isEditing ? 'bg-green-500/5 border-l-2 border-green-500' : ''}
                  ${selectMode && isSelected ? 'bg-red-500/8 border-l-2 border-red-500/60' : ''}
                  ${selectMode ? 'cursor-pointer hover:bg-white/5' : ''}
                `}
              >
                {/* Checkbox */}
                {selectMode && (
                  <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleSelect(ing.id)}>
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-red-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                )}

                {/* Nome */}
                {isEditing && !selectMode ? (
                  <input
                    value={editNome}
                    onChange={e => setEditNome(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                    autoFocus
                    className="bg-[#2a2a2e] border border-green-500/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                ) : (
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white'}`}>{ing.nome}</span>
                )}

                {/* Unidade */}
                {isEditing && !selectMode ? (
                  <div className="relative">
                    <select
                      value={editUnidade}
                      onChange={e => setEditUnidade(e.target.value as Unidade)}
                      className="w-full appearance-none bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="g">g/kg</option>
                      <option value="ml">ml/L</option>
                      <option value="un">un</option>
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">{UNIDADE_LABEL[ing.unidade]}</span>
                )}

                {/* Preço */}
                {isEditing && !selectMode ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={editPreco}
                      onChange={e => setEditPreco(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                      placeholder="0,00"
                      className="flex-1 bg-[#2a2a2e] border border-green-500/60 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none"
                      step="0.01"
                      min="0"
                    />
                    <span className="text-xs text-gray-500 whitespace-nowrap">{UNIDADE_PRECO_LABEL[editUnidade]}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-semibold ${ing.precoPorKg > 0 ? 'text-white' : 'text-gray-600'}`}>
                      {ing.precoPorKg > 0 ? formatCurrency(ing.precoPorKg) : '—'}
                    </span>
                    <span className="text-xs text-gray-500">{UNIDADE_PRECO_LABEL[ing.unidade]}</span>
                  </div>
                )}

                {/* Em uso */}
                <div className="flex gap-1.5 flex-wrap">
                  {usos.receitas > 0 && (
                    <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-2 py-0.5">
                      {usos.receitas} receita{usos.receitas > 1 ? 's' : ''}
                    </span>
                  )}
                  {usos.sabores > 0 && (
                    <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5">
                      {usos.sabores} produto{usos.sabores > 1 ? 's' : ''}
                    </span>
                  )}
                  {totalUsos === 0 && <span className="text-xs text-gray-600">—</span>}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5 justify-end" onClick={e => e.stopPropagation()}>
                  {!selectMode && (
                    isEditing ? (
                      <>
                        <button onClick={saveEdit} className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors" title="Salvar">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Cancelar">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(ing)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(ing)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Remover">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Excluir ingredientes?</h3>
                <p className="text-xs text-gray-400 mt-0.5">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-6">
              Você está prestes a excluir{' '}
              <span className="font-semibold text-white">{selectedIds.size} ingrediente{selectedIds.size !== 1 ? 's' : ''}</span>.
              Receitas e produtos que os utilizam podem ficar incompletos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-2.5 bg-[#2a2a2e] hover:bg-[#333] text-white rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={deleteSelected}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Excluir de vez
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
