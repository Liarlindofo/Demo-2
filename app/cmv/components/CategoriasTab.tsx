'use client';

import { useState } from 'react';
import { Plus, Pencil, Check, X, Trash2, AlertTriangle, Tag } from 'lucide-react';
import type { StoreId, CategoriaPreco } from '../types';
import { useStoreData } from '../hooks/useStoreData';
import { formatCurrency } from '../utils';

interface CategoriasTabProps {
  storeId: StoreId;
}

export const CategoriasTab = ({ storeId }: CategoriasTabProps) => {
  const { data, updateData, isLoading } = useStoreData(storeId);

  // ── Novo item ─────────────────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newPreco, setNewPreco] = useState('');

  // ── Edição inline ──────────────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editPreco, setEditPreco] = useState('');

  // ── Confirmação de exclusão ────────────────────────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Quantos produtos usam esta categoria
  const contarUsos = (categoriaId: string) =>
    data.sabores.filter(s => s.categoriaId === categoriaId).length;

  // ── Adicionar ──────────────────────────────────────────────────────────────
  const handleAdd = () => {
    if (!newNome.trim()) return;
    const preco = parseFloat(newPreco.replace(',', '.')) || 0;
    const nova: CategoriaPreco = {
      id: crypto.randomUUID(),
      nome: newNome.trim(),
      precoVenda: preco,
    };
    updateData({ ...data, categorias: [...data.categorias, nova] });
    setNewNome('');
    setNewPreco('');
    setShowAdd(false);
  };

  // ── Editar ────────────────────────────────────────────────────────────────
  const startEdit = (cat: CategoriaPreco) => {
    setEditId(cat.id);
    setEditNome(cat.nome);
    setEditPreco(cat.precoVenda > 0 ? cat.precoVenda.toString() : '');
  };

  const saveEdit = () => {
    if (!editId) return;
    const preco = parseFloat(editPreco.replace(',', '.')) || 0;
    const newCats = data.categorias.map(c =>
      c.id === editId
        ? { ...c, nome: editNome.trim() || c.nome, precoVenda: preco }
        : c,
    );
    updateData({ ...data, categorias: newCats });
    setEditId(null);
  };

  const cancelEdit = () => setEditId(null);

  // ── Deletar ───────────────────────────────────────────────────────────────
  const handleDelete = (cat: CategoriaPreco) => {
    const usos = contarUsos(cat.id);
    if (usos > 0) {
      setConfirmDeleteId(cat.id);
    } else {
      updateData({ ...data, categorias: data.categorias.filter(c => c.id !== cat.id) });
    }
  };

  const confirmDelete = (categoriaId: string) => {
    // Remove a categoria e limpa a referência nos sabores
    updateData({
      ...data,
      categorias: data.categorias.filter(c => c.id !== categoriaId),
      sabores: data.sabores.map(s =>
        s.categoriaId === categoriaId ? { ...s, categoriaId: undefined } : s,
      ),
    });
    setConfirmDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl h-14 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Categorias de Preço</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.categorias.length} categoria{data.categorias.length !== 1 ? 's' : ''} cadastrada{data.categorias.length !== 1 ? 's' : ''}
            {' · '}O preço de venda dos produtos é definido aqui
          </p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-green-500/50 hover:bg-green-500/10 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {/* Formulário de adição */}
      {showAdd && (
        <div className="bg-[#1c1c1e] border border-green-500/30 rounded-xl p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-gray-400 block mb-1">Nome da Categoria *</label>
            <input
              value={newNome}
              onChange={e => setNewNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
              placeholder="Ex: Pizza Grande, Pizza Pequena, Bordas..."
              className="w-full bg-[#2a2a2e] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="w-48">
            <label className="text-xs text-gray-400 block mb-1">Preço de Venda (R$) *</label>
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

      {/* Aviso informativo */}
      <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3">
        <Tag className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-300">
          O preço de venda é definido por categoria. Ao alterar o valor aqui, o CMV de todos os produtos
          vinculados a essa categoria é recalculado automaticamente.
        </p>
      </div>

      {/* Lista de categorias */}
      {data.categorias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">🏷️</div>
          <h3 className="text-base font-semibold text-white mb-1">Nenhuma categoria ainda</h3>
          <p className="text-sm text-gray-400 mb-4 max-w-sm">
            Crie categorias com o preço de venda (ex: Pizza Grande R$ 60,00, Pizza Pequena R$ 45,00).
            <br />
            Os produtos serão vinculados a uma categoria e herdarão o preço dela.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar primeira categoria
          </button>
        </div>
      ) : (
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_180px_120px_80px] gap-3 px-4 py-2.5 border-b border-[#2a2a2e]">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço de Venda</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Produtos</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</span>
          </div>

          {data.categorias.map((cat, idx) => {
            const isEditing = editId === cat.id;
            const usos = contarUsos(cat.id);

            return (
              <div
                key={cat.id}
                className={`grid grid-cols-[1fr_180px_120px_80px] gap-3 px-4 py-3 items-center transition-colors
                  ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#141416]'}
                  ${isEditing ? 'bg-green-500/5 border-l-2 border-green-500' : ''}
                `}
              >
                {/* Nome */}
                {isEditing ? (
                  <input
                    value={editNome}
                    onChange={e => setEditNome(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                    autoFocus
                    className="bg-[#2a2a2e] border border-green-500/60 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="text-sm font-medium text-white">{cat.nome}</span>
                  </div>
                )}

                {/* Preço */}
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">R$</span>
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
                  </div>
                ) : (
                  <span className={`text-sm font-semibold ${cat.precoVenda > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                    {cat.precoVenda > 0 ? formatCurrency(cat.precoVenda) : '— sem preço'}
                  </span>
                )}

                {/* Produtos em uso */}
                <div>
                  {usos > 0 ? (
                    <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5">
                      {usos} produto{usos > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600">—</span>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5 justify-end">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEdit}
                        className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                        title="Salvar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmação de exclusão (categoria em uso) */}
      {confirmDeleteId && (() => {
        const cat = data.categorias.find(c => c.id === confirmDeleteId);
        const usos = cat ? contarUsos(cat.id) : 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-sm shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Categoria em uso</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{usos} produto{usos !== 1 ? 's' : ''} vinculado{usos !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-6">
                A categoria <span className="font-semibold text-white">"{cat?.nome}"</span> está sendo usada
                por {usos} produto{usos !== 1 ? 's' : ''}. Ao remover, esses produtos ficarão sem preço de venda
                e o CMV não será calculado.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 bg-[#2a2a2e] hover:bg-[#333] text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmDelete(confirmDeleteId)}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Remover mesmo assim
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
