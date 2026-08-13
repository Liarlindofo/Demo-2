"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Camera, Check, X, Loader2,
} from "lucide-react";
import { useUser } from "@stackframe/stack";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Item {
  id: string;
  nome: string;
  weight: number;
  fotoObrigatoria: boolean;
  ativo: boolean;
  ordem: number;
  categoriaId: string;
}

interface Category {
  id: string;
  nome: string;
  ordem: number;
  itens: Item[];
}

type WeightOption = 10 | 15 | 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const weightColor: Record<number, string> = {
  10: "bg-gray-600/30 text-gray-300 border-gray-600/40",
  15: "bg-blue-600/20 text-blue-300 border-blue-600/30",
  20: "bg-purple-600/20 text-purple-300 border-purple-600/30",
};

// ─── Componente principal ────────────────────────────────────────────────────

export default function ChecklistAdminPage() {
  const user = useUser({ or: "redirect" });

  const [categories, setCategories]       = useState<Category[]>([]);
  const [loading, setLoading]             = useState(true);
  const [expandedCats, setExpandedCats]   = useState<Set<string>>(new Set());
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // ── Modal de item ──────────────────────────────────────────────────────────
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem]     = useState<Item | null>(null);
  const [itemForm, setItemForm] = useState({
    nome: "", categoriaId: "", weight: 10 as WeightOption, fotoObrigatoria: false,
  });

  // ── Modal de categoria (criar / editar) ────────────────────────────────────
  const [showCatModal, setShowCatModal]   = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catNome, setCatNome]             = useState("");

  // ── Modal de confirmação de exclusão ──────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<{ item: Item; catName: string } | null>(null);

  // ─── Carregar dados ────────────────────────────────────────────────────────

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checklist/admin/categories");
      if (!res.ok) throw new Error("Erro ao carregar categorias");
      setCategories(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadCategories();
  }, [user]);

  // ─── Ações de categoria ────────────────────────────────────────────────────

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCatNome("");
    setShowCatModal(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatNome(cat.nome);
    setShowCatModal(true);
  };

  const handleSaveCategory = async () => {
    if (!catNome.trim()) return;
    setSaving(true);
    try {
      const res = editingCategory
        ? await fetch(`/api/checklist/admin/categories/${editingCategory.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: catNome.trim() }),
          })
        : await fetch("/api/checklist/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: catNome.trim() }),
          });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || (editingCategory ? "Erro ao editar categoria" : "Erro ao criar categoria"));
      }
      setShowCatModal(false);
      setEditingCategory(null);
      setCatNome("");
      await loadCategories();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Ações de item ─────────────────────────────────────────────────────────

  const openCreateItem = (catId: string) => {
    setEditingItem(null);
    setItemForm({ nome: "", categoriaId: catId, weight: 10, fotoObrigatoria: false });
    setShowItemModal(true);
  };

  const openEditItem = (item: Item) => {
    setEditingItem(item);
    setItemForm({
      nome:            item.nome,
      categoriaId:     item.categoriaId,
      weight:          item.weight as WeightOption,
      fotoObrigatoria: item.fotoObrigatoria,
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.nome.trim() || !itemForm.categoriaId) return;
    setSaving(true);
    try {
      const url    = editingItem
        ? `/api/checklist/admin/items/${editingItem.id}`
        : "/api/checklist/admin/items";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar item");
      }
      setShowItemModal(false);
      await loadCategories();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async (item: Item) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/checklist/admin/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: false }),
      });
      if (!res.ok) throw new Error("Erro ao excluir item");
      setConfirmDelete(null);
      await loadCategories();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCat = (id: string) => {
    const next = new Set(expandedCats);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedCats(next);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/checklist"
              className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Gerenciar Checklist</h1>
              <p className="text-sm text-gray-400">Categorias e itens de avaliação</p>
            </div>
          </div>
          <button
            onClick={openCreateCategory}
            className="flex items-center gap-2 bg-[#001F05] hover:bg-[#001F05]/80 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Categoria
          </button>
        </div>

        {/* Erro global */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-red-300 text-sm">{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-400" /></button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            Carregando catálogo...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="mb-2">Nenhuma categoria encontrada.</p>
            <p className="text-sm">Execute o seed primeiro: <code className="text-green-400">npx tsx scripts/seed-checklist-categorias.ts</code></p>
          </div>
        ) : (

          /* Lista de categorias */
          <div className="space-y-3">
            {categories.map((cat) => {
              const isOpen = expandedCats.has(cat.id);
              return (
                <div key={cat.id} className="bg-[#141415] border border-[#374151] rounded-2xl overflow-hidden">
                  {/* Header da categoria */}
                  <div className="px-6 py-4 flex items-center justify-between hover:bg-[#0f0f10] transition-colors">
                    <button
                      onClick={() => toggleCat(cat.id)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    >
                      {isOpen
                        ? <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                        : <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                      }
                      <span className="font-bold text-white truncate">{cat.nome}</span>
                      <span className="text-xs text-gray-500 bg-[#374151] px-2 py-0.5 rounded-full shrink-0">
                        {cat.itens.length} {cat.itens.length === 1 ? "item" : "itens"}
                      </span>
                    </button>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={() => openEditCategory(cat)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-[#374151] rounded-lg transition-colors"
                        title="Editar categoria"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openCreateItem(cat.id)}
                        className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 border border-green-800/50 hover:border-green-600 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar item
                      </button>
                    </div>
                  </div>

                  {/* Itens da categoria */}
                  {isOpen && (
                    <div className="border-t border-[#374151]">
                      {cat.itens.length === 0 ? (
                        <p className="px-6 py-4 text-sm text-gray-500 italic">Nenhum item ativo nesta categoria.</p>
                      ) : (
                        cat.itens.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`px-6 py-3 flex items-center gap-3 ${idx > 0 ? "border-t border-[#374151]/60" : ""} hover:bg-[#0f0f10]/50 transition-colors`}
                          >
                            {/* Peso */}
                            <span className={`text-xs font-bold border px-2 py-0.5 rounded-full shrink-0 ${weightColor[item.weight]}`}>
                              {item.weight}pts
                            </span>

                            {/* Nome */}
                            <span className="flex-1 text-sm text-gray-200">{item.nome}</span>

                            {/* Badge foto obrigatória */}
                            {item.fotoObrigatoria && (
                              <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-600/10 border border-amber-600/20 px-2 py-0.5 rounded-full shrink-0">
                                <Camera className="w-3 h-3" />
                                Foto obrig.
                              </span>
                            )}

                            {/* Ações */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => openEditItem(item)}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#374151] rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setConfirmDelete({ item, catName: cat.nome })}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal: criar / editar item ─────────────────────────────────────── */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141415] border border-[#374151] rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-5">
              {editingItem ? "Editar Item" : "Novo Item"}
            </h2>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome do item *</label>
                <input
                  type="text"
                  value={itemForm.nome}
                  onChange={(e) => setItemForm({ ...itemForm, nome: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f0f10] border border-[#374151] rounded-xl text-white text-sm focus:ring-2 focus:ring-green-800 outline-none"
                  placeholder="Descreva o item de avaliação..."
                  autoFocus
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Categoria *</label>
                <select
                  value={itemForm.categoriaId}
                  onChange={(e) => setItemForm({ ...itemForm, categoriaId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f0f10] border border-[#374151] rounded-xl text-white text-sm focus:ring-2 focus:ring-green-800 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              {/* Peso */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Peso (pontos) *</label>
                <div className="flex gap-3">
                  {([10, 15, 20] as WeightOption[]).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setItemForm({ ...itemForm, weight: w })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        itemForm.weight === w
                          ? "bg-green-700 border-green-600 text-white"
                          : "bg-[#0f0f10] border-[#374151] text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Foto obrigatória */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setItemForm({ ...itemForm, fotoObrigatoria: !itemForm.fotoObrigatoria })}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    itemForm.fotoObrigatoria
                      ? "bg-amber-600 border-amber-500"
                      : "bg-[#0f0f10] border-[#374151] group-hover:border-gray-400"
                  }`}
                >
                  {itemForm.fotoObrigatoria && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-gray-300">Foto obrigatória para concluir a avaliação</span>
              </label>
            </div>

            {/* Botões */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowItemModal(false)}
                className="flex-1 py-2.5 bg-[#0f0f10] border border-[#374151] text-gray-300 rounded-xl text-sm hover:bg-[#374151] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveItem}
                disabled={!itemForm.nome.trim() || !itemForm.categoriaId || saving}
                className="flex-1 py-2.5 bg-[#001F05] hover:bg-[#001F05]/80 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingItem ? "Salvar alterações" : "Criar item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: criar / editar categoria ────────────────────────────────── */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141415] border border-[#374151] rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-4">
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </h2>
            <input
              type="text"
              value={catNome}
              onChange={(e) => setCatNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveCategory()}
              className="w-full px-4 py-2.5 bg-[#0f0f10] border border-[#374151] rounded-xl text-white text-sm focus:ring-2 focus:ring-green-800 outline-none mb-4"
              placeholder="Ex: SEGURANÇA ALIMENTAR"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCatModal(false); setEditingCategory(null); setCatNome(""); }}
                className="flex-1 py-2.5 bg-[#0f0f10] border border-[#374151] text-gray-300 rounded-xl text-sm hover:bg-[#374151] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={!catNome.trim() || saving}
                className="flex-1 py-2.5 bg-[#001F05] hover:bg-[#001F05]/80 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingCategory ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: confirmar exclusão ──────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141415] border border-[#374151] rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-white mb-2">Excluir item?</h2>
            <p className="text-sm text-gray-400 mb-1">
              <span className="text-white font-medium">{confirmDelete.item.nome}</span>
            </p>
            <p className="text-xs text-gray-500 mb-5">
              O item será ocultado do checklist mas permanece no banco para não quebrar o histórico de avaliações.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-[#0f0f10] border border-[#374151] text-gray-300 rounded-xl text-sm hover:bg-[#374151] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSoftDelete(confirmDelete.item)}
                disabled={saving}
                className="flex-1 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
