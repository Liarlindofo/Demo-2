'use client';

import { useState, useMemo } from 'react';
import { X, Plus, Minus, Trash2, Package2, AlertTriangle, Sparkles, ChevronDown, ChevronUp, GlassWater, Pizza } from 'lucide-react';
import type { Combo, ComboItem, ComboItemIngrediente, ComboItemPizza, StoreData, Tamanho } from '../types';
import { TAMANHO_LABELS, TAMANHOS } from '../types';
import {
  calcularComboCMV,
  calcularCMVSabor,
  calcularCustoSabor,
  detectarTamanho,
  formatCurrency,
  formatPercent,
} from '../utils';
import { CMV_COLORS, getStatusLabel } from '../constants';

interface ComboModalProps {
  combo: Combo | null;
  data: StoreData;
  onClose: () => void;
  onSave: (combo: Combo) => void;
  onDelete?: (comboId: string) => void;
}

// Calcula média de preço e custo para um conjunto de categorias num tamanho
function calcularMediaCategorias(
  categoriaIds: string[],
  tamanho: Tamanho,
  data: StoreData,
): { precoMedio: number; custoMedio: number; numProdutos: number } {
  const todasCats = data.categorias ?? [];
  const cats = categoriaIds.length > 0
    ? todasCats.filter(c => categoriaIds.includes(c.id))
    : todasCats;

  const catsComPreco = cats.filter(c => c.precos[tamanho] != null);
  const precoMedio = catsComPreco.length > 0
    ? catsComPreco.reduce((s, c) => s + (c.precos[tamanho] ?? 0), 0) / catsComPreco.length
    : 0;

  let somaCustos = 0;
  let numCats = 0;
  let numProdutos = 0;
  for (const cat of cats) {
    const prods = data.sabores.filter(
      s => s.categoriaId === cat.id && detectarTamanho(s.nome) === tamanho,
    );
    numProdutos += prods.length;
    if (prods.length > 0) {
      somaCustos += prods.reduce(
        (s, p) => s + calcularCustoSabor(p, data.ingredientes, data.receitas),
        0,
      ) / prods.length;
      numCats++;
    }
  }
  const custoMedio = numCats > 0 ? somaCustos / numCats : 0;

  return { precoMedio, custoMedio, numProdutos };
}

type AddMode = 'pizza' | 'ingrediente' | null;

export const ComboModal = ({ combo, data, onClose, onSave, onDelete }: ComboModalProps) => {
  const [nome, setNome] = useState(combo?.nome ?? '');
  const [descricao, setDescricao] = useState(combo?.descricao ?? '');
  const [precoVenda, setPrecoVenda] = useState(
    combo?.precoVenda ? combo.precoVenda.toFixed(2) : '',
  );
  const [itens, setItens] = useState<ComboItem[]>(combo?.itens ?? []);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // ── Estado do formulário de adição de slot de pizza ────────────────────────
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [selTamanho, setSelTamanho] = useState<Tamanho>('grande');
  const [selCatIds, setSelCatIds] = useState<string[]>([]); // vazio = todas
  const [selQtd, setSelQtd] = useState(1);

  // ── Estado do formulário de adição de bebida/outro (produto) ────────────────
  const [selIngId, setSelIngId] = useState('');
  const [selIngQtd, setSelIngQtd] = useState(1);
  const [ingBusca, setIngBusca] = useState('');

  const categorias = data.categorias ?? [];
  const produtos = data.sabores ?? [];

  // Para o seletor: mostrar apenas tamanhos que pelo menos uma categoria tem preço
  const tamanhosDisponiveis = TAMANHOS.filter(t =>
    categorias.some(c => c.precos[t] != null),
  );

  // Produtos filtrados pela busca
  const ingredientesFiltrados = useMemo(() => {
    const q = ingBusca.trim().toLowerCase();
    return q ? produtos.filter(i => i.nome.toLowerCase().includes(q)) : produtos;
  }, [produtos, ingBusca]);

  // Quando nenhuma categoria está marcada = "todas"
  const todasSelecionadas = selCatIds.length === 0;

  const toggleCat = (id: string) => {
    setSelCatIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      return next;
    });
  };

  const toggleTodas = () => setSelCatIds([]);

  const openMode = (mode: AddMode) => {
    setAddMode(prev => prev === mode ? null : mode);
    setSelQtd(1);
    setSelCatIds([]);
    setSelIngId('');
    setSelIngQtd(1);
    setIngBusca('');
  };

  // Preview do slot de pizza sendo montado
  const previewSlot = useMemo(
    () => calcularMediaCategorias(selCatIds, selTamanho, data),
    [selCatIds, selTamanho, data],
  );

  const addSlotPizza = () => {
    const novoItem: ComboItemPizza = {
      id: crypto.randomUUID(),
      tipo: 'pizza',
      tamanho: selTamanho,
      quantidade: selQtd,
      categoriaIds: [...selCatIds],
    };
    setItens(prev => [...prev, novoItem]);
    setSelQtd(1);
    setAddMode(null);
  };

  const addSlotIngrediente = () => {
    if (!selIngId) return;
    const novoItem: ComboItemIngrediente = {
      id: crypto.randomUUID(),
      tipo: 'ingrediente',
      ingredienteId: selIngId,
      produtoId: selIngId,
      quantidade: selIngQtd,
      precoVenda: 0,
    };
    setItens(prev => [...prev, novoItem]);
    setSelIngId('');
    setSelIngQtd(1);
    setIngBusca('');
    setAddMode(null);
  };

  const removeItem = (id: string) => setItens(prev => prev.filter(i => i.id !== id));

  const changeQty = (id: string, delta: number) =>
    setItens(prev =>
      prev.map(i => (i.id === id ? { ...i, quantidade: Math.max(1, i.quantidade + delta) } : i)),
    );

  // Preview CMV do combo completo
  const previewCombo: Combo = useMemo(
    () => ({
      id: combo?.id ?? 'preview',
      nome,
      descricao,
      precoVenda: parseFloat(precoVenda.replace(',', '.')) || 0,
      itens,
    }),
    [combo?.id, nome, descricao, precoVenda, itens],
  );
  const preview = useMemo(() => calcularComboCMV(previewCombo, data), [previewCombo, data]);

  const precoRegularCalculado = preview.precoRegular;
  const applyPrecoRegular = () => {
    if (precoRegularCalculado > 0) setPrecoVenda(precoRegularCalculado.toFixed(2));
  };

  const handleSave = () => {
    if (!nome.trim() || itens.length === 0) return;
    onSave({
      id: combo?.id ?? crypto.randomUUID(),
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      precoVenda: parseFloat(precoVenda.replace(',', '.')) || 0,
      itens,
    });
  };

  const handleDelete = () => {
    if (combo && onDelete) { onDelete(combo.id); onClose(); }
  };

  const canSave = nome.trim().length > 0 && itens.length > 0;
  const semPreco = preview.precoVenda === 0;
  const cmvColor = CMV_COLORS[preview.status];
  const precoInput = parseFloat(precoVenda.replace(',', '.')) || 0;
  const economia = precoRegularCalculado - precoInput;
  const temDesconto = economia > 0.01 && precoInput > 0;
  const temSobretaxa = economia < -0.01 && precoInput > 0;

  const ingSelecionado = produtos.find(i => i.id === selIngId);
  const previewProdutoSelecionado = useMemo(() => {
    if (!ingSelecionado) return null;
    return calcularCMVSabor(ingSelecionado, data.ingredientes, data.receitas, data.categorias);
  }, [ingSelecionado, data]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2e] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
              <Package2 className="w-4 h-4 text-orange-400" />
            </div>
            <h2 className="text-base font-bold text-white">
              {combo ? 'Editar Combo' : 'Novo Combo'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors rounded-lg p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Nome + descrição + preço */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Nome do combo *</label>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                autoFocus
                placeholder="Ex: Kit Casal"
                className="w-full bg-[#141416] border border-[#374151] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/60"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Descrição (opcional)</label>
              <input
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Ex: 1 Grande + 1 Média + Refri 2L"
                className="w-full bg-[#141416] border border-[#374151] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/60"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-400">Preço de venda do combo (R$)</label>
                {precoRegularCalculado > 0 && (
                  <button
                    onClick={applyPrecoRegular}
                    className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    Usar média ({formatCurrency(precoRegularCalculado)})
                  </button>
                )}
              </div>
              <input
                type="number"
                value={precoVenda}
                onChange={e => setPrecoVenda(e.target.value)}
                placeholder="0,00"
                min="0"
                step="0.01"
                className="w-full bg-[#141416] border border-[#374151] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/60"
              />
              {temDesconto && (
                <p className="text-xs text-green-400 mt-1">
                  ✓ Desconto de {formatCurrency(economia)} ({((economia / precoRegularCalculado) * 100).toFixed(1)}% off)
                </p>
              )}
              {temSobretaxa && (
                <p className="text-xs text-yellow-400 mt-1">
                  ⚠ {formatCurrency(-economia)} acima da média regular
                </p>
              )}
            </div>
          </div>

          {/* ── Itens do combo ──────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">
                Itens do combo{itens.length > 0 && ` (${itens.length})`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openMode('pizza')}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    addMode === 'pizza' ? 'text-orange-300' : 'text-orange-400 hover:text-orange-300'
                  }`}
                >
                  {addMode === 'pizza' ? <ChevronUp className="w-3.5 h-3.5" /> : <Pizza className="w-3.5 h-3.5" />}
                  {addMode === 'pizza' ? 'Fechar' : 'Pizza'}
                </button>
                <span className="text-gray-700">|</span>
                <button
                  onClick={() => openMode('ingrediente')}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    addMode === 'ingrediente' ? 'text-blue-300' : 'text-blue-400 hover:text-blue-300'
                  }`}
                >
                  {addMode === 'ingrediente' ? <ChevronUp className="w-3.5 h-3.5" /> : <GlassWater className="w-3.5 h-3.5" />}
                  {addMode === 'ingrediente' ? 'Fechar' : 'Bebida/Outro'}
                </button>
              </div>
            </div>

            {/* ── Formulário de adição de pizza ── */}
            {addMode === 'pizza' && (
              <div className="bg-[#141416] border border-orange-500/20 rounded-xl p-4 mb-3 space-y-4">

                {/* Tamanho + quantidade */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Tamanho</label>
                    <div className="relative">
                      <select
                        value={selTamanho}
                        onChange={e => setSelTamanho(e.target.value as Tamanho)}
                        className="w-full appearance-none bg-[#1c1c1e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/60 pr-8"
                      >
                        {tamanhosDisponiveis.map(t => (
                          <option key={t} value={t}>{TAMANHO_LABELS[t]}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="w-32">
                    <label className="text-xs text-gray-500 block mb-1">Quantidade</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelQtd(q => Math.max(1, q - 1))}
                        className="w-8 h-9 rounded-lg bg-[#2a2a2e] hover:bg-[#333] text-white flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="flex-1 text-center text-sm text-white font-medium">{selQtd}</span>
                      <button
                        onClick={() => setSelQtd(q => q + 1)}
                        className="w-8 h-9 rounded-lg bg-[#2a2a2e] hover:bg-[#333] text-white flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Categorias elegíveis */}
                <div>
                  <label className="text-xs text-gray-500 block mb-2">
                    Categorias elegíveis para este tamanho
                    <span className="text-gray-600 ml-1">(sem seleção = usa todas)</span>
                  </label>

                  {categorias.length === 0 ? (
                    <p className="text-xs text-yellow-600">Nenhuma categoria cadastrada ainda.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {/* Opção "Todas" */}
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div
                          onClick={toggleTodas}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            todasSelecionadas
                              ? 'bg-orange-500 border-orange-500'
                              : 'border-[#374151] bg-[#1c1c1e]'
                          }`}
                        >
                          {todasSelecionadas && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-white font-medium group-hover:text-orange-300 transition-colors">
                          Todas as categorias
                        </span>
                        {todasSelecionadas && previewSlot.precoMedio > 0 && (
                          <span className="text-xs text-gray-500 ml-auto">
                            média {formatCurrency(previewSlot.precoMedio)}
                          </span>
                        )}
                      </label>

                      {/* Divisor */}
                      <div className="flex items-center gap-2 py-1">
                        <div className="flex-1 h-px bg-[#2a2a2e]" />
                        <span className="text-xs text-gray-600">ou selecione individualmente</span>
                        <div className="flex-1 h-px bg-[#2a2a2e]" />
                      </div>

                      {/* Lista de categorias */}
                      {categorias.map(cat => {
                        const preco = cat.precos[selTamanho];
                        const checked = selCatIds.includes(cat.id);
                        const semPrecoNesseT = preco == null;

                        return (
                          <label
                            key={cat.id}
                            className={`flex items-center gap-2.5 cursor-pointer group ${semPrecoNesseT ? 'opacity-40' : ''}`}
                          >
                            <div
                              onClick={() => !semPrecoNesseT && toggleCat(cat.id)}
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                checked && !semPrecoNesseT
                                  ? 'bg-orange-500 border-orange-500'
                                  : 'border-[#374151] bg-[#1c1c1e]'
                              } ${semPrecoNesseT ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {checked && !semPrecoNesseT && (
                                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm text-gray-300 flex-1 group-hover:text-white transition-colors">
                              {cat.nome}
                              {cat.grupo && (
                                <span className="text-gray-600 ml-1 text-xs">({cat.grupo})</span>
                              )}
                            </span>
                            <span className={`text-xs ml-auto shrink-0 ${semPrecoNesseT ? 'text-gray-600' : 'text-green-400'}`}>
                              {semPrecoNesseT ? '—' : formatCurrency(preco!)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Preview do slot de pizza */}
                {previewSlot.precoMedio > 0 || previewSlot.custoMedio > 0 ? (
                  <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl p-3 text-xs space-y-1">
                    <p className="text-gray-400 font-medium mb-1">
                      Preview — {TAMANHO_LABELS[selTamanho]} × {selQtd}
                      {selCatIds.length > 0
                        ? ` (${selCatIds.length} categoria${selCatIds.length !== 1 ? 's' : ''})`
                        : ' (todas as categorias)'}
                    </p>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Preço médio unitário</span>
                      <span className="text-green-400 font-semibold">{formatCurrency(previewSlot.precoMedio)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Custo médio unitário</span>
                      <span className="text-white font-semibold">
                        {previewSlot.custoMedio > 0 ? formatCurrency(previewSlot.custoMedio) : '—'}
                      </span>
                    </div>
                    {previewSlot.numProdutos === 0 && (
                      <p className="text-yellow-600 pt-1">
                        ⚠ Nenhum produto cadastrado nestas categorias para o tamanho {TAMANHO_LABELS[selTamanho]} (custo = R$ 0)
                      </p>
                    )}
                  </div>
                ) : null}

                <button
                  onClick={addSlotPizza}
                  disabled={categorias.length === 0}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Adicionar {selQtd}× {TAMANHO_LABELS[selTamanho]} ao combo
                </button>
              </div>
            )}

            {/* ── Formulário de adição de ingrediente (bebida/outro) ── */}
            {addMode === 'ingrediente' && (
              <div className="bg-[#141416] border border-blue-500/20 rounded-xl p-4 mb-3 space-y-4">

                {/* Busca de produto */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Buscar produto</label>
                  <input
                    value={ingBusca}
                    onChange={e => setIngBusca(e.target.value)}
                    placeholder="Ex: Coca-Cola, Suco de Laranja..."
                    className="w-full bg-[#1c1c1e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60"
                  />
                </div>

                {/* Lista de produtos */}
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {ingredientesFiltrados.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-3">
                      {produtos.length === 0
                        ? 'Nenhum produto cadastrado. Cadastre na aba de Sabores/Produtos.'
                        : 'Nenhum produto encontrado.'}
                    </p>
                  ) : (
                    ingredientesFiltrados.map(ing => (
                      <button
                        key={ing.id}
                        onClick={() => {
                          setSelIngId(ing.id);
                          setIngBusca(ing.nome);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                          selIngId === ing.id
                            ? 'bg-blue-500/20 border border-blue-500/40 text-white'
                            : 'bg-[#1c1c1e] hover:bg-[#252528] text-gray-300'
                        }`}
                      >
                        <span className="font-medium truncate">{ing.nome}</span>
                        <span className="text-xs text-gray-500 shrink-0 ml-2">
                          produto
                        </span>
                      </button>
                    ))
                  )}
                </div>

                {/* Quantidade */}
                {selIngId && (
                  <>
                    <div className="w-32">
                      <label className="text-xs text-gray-500 block mb-1">Quantidade</label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelIngQtd(q => Math.max(1, q - 1))}
                          className="w-8 h-9 rounded-lg bg-[#2a2a2e] hover:bg-[#333] text-white flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="flex-1 text-center text-sm text-white font-medium">{selIngQtd}</span>
                        <button
                          onClick={() => setSelIngQtd(q => q + 1)}
                          className="w-8 h-9 rounded-lg bg-[#2a2a2e] hover:bg-[#333] text-white flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Preview do slot de ingrediente */}
                    {ingSelecionado && (
                      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl p-3 text-xs space-y-1">
                        <p className="text-gray-400 font-medium mb-1">
                          Preview — {ingSelecionado.nome} × {selIngQtd}
                        </p>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Custo unitário</span>
                          <span className="text-white font-semibold">
                            {previewProdutoSelecionado ? formatCurrency(previewProdutoSelecionado.custo) : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Custo total</span>
                          <span className="text-white font-semibold">
                            {previewProdutoSelecionado ? formatCurrency(previewProdutoSelecionado.custo * selIngQtd) : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Preço de venda total</span>
                          <span className="text-green-400 font-semibold">
                            {previewProdutoSelecionado ? formatCurrency(previewProdutoSelecionado.precoVenda * selIngQtd) : '—'}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button
                  onClick={addSlotIngrediente}
                  disabled={!selIngId}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {selIngId && ingSelecionado
                    ? `Adicionar ${selIngQtd}× ${ingSelecionado.nome} ao combo`
                    : 'Selecione um produto acima'}
                </button>
              </div>
            )}

            {/* Lista de itens já adicionados */}
            {itens.length === 0 ? (
              <div className="bg-[#141416] border border-dashed border-[#2a2a2e] rounded-xl p-5 text-center">
                <Package2 className="w-7 h-7 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Adicione pizzas ou bebidas ao combo acima</p>
              </div>
            ) : (
              <div className="space-y-2">
                {itens.map(item => {
                  if (item.tipo === 'ingrediente') {
                    const produtoId = item.produtoId ?? item.ingredienteId;
                    const produto = produtos.find(i => i.id === produtoId);
                    const produtoCMV = produto
                      ? calcularCMVSabor(produto, data.ingredientes, data.receitas, data.categorias)
                      : null;
                    return (
                      <div key={item.id} className="bg-[#141416] border border-[#2a2a2e] rounded-xl px-4 py-3 flex items-start gap-3">
                        <div className="w-5 h-5 rounded bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
                          <GlassWater className="w-3 h-3 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium">
                            <span className="text-blue-400 mr-1">{item.quantidade}×</span>
                            {produto?.nome ?? '—'}
                          </p>
                          <div className="flex gap-3 mt-0.5 flex-wrap">
                            {produtoCMV && produtoCMV.precoVenda > 0 && (
                              <span className="text-xs text-gray-500">
                                venda{' '}
                                <span className="text-green-400">{formatCurrency(produtoCMV.precoVenda * item.quantidade)}</span>
                              </span>
                            )}
                            {produtoCMV && (
                              <span className="text-xs text-gray-500">
                                custo{' '}
                                <span className="text-gray-300">{formatCurrency(produtoCMV.custo * item.quantidade)}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                          <button
                            onClick={() => changeQty(item.id, -1)}
                            className="w-6 h-6 rounded-md bg-[#2a2a2e] hover:bg-[#333] text-white flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs text-white">{item.quantidade}</span>
                          <button
                            onClick={() => changeQty(item.id, 1)}
                            className="w-6 h-6 rounded-md bg-[#2a2a2e] hover:bg-[#333] text-white flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 mt-0.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  }

                  // Pizza item
                  const { precoMedio, custoMedio, numProdutos } = calcularMediaCategorias(
                    item.categoriaIds ?? [],
                    item.tamanho,
                    data,
                  );
                  const catsNomes =
                    (item.categoriaIds ?? []).length === 0
                      ? 'todas as categorias'
                      : (item.categoriaIds ?? [])
                          .map(id => categorias.find(c => c.id === id)?.nome ?? id)
                          .join(', ');

                  return (
                    <div key={item.id} className="bg-[#141416] border border-[#2a2a2e] rounded-xl px-4 py-3 flex items-start gap-3">
                      <div className="w-5 h-5 rounded bg-orange-500/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Pizza className="w-3 h-3 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">
                          <span className="text-orange-400 mr-1">{item.quantidade}×</span>
                          {TAMANHO_LABELS[item.tamanho]}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {catsNomes}
                        </p>
                        <div className="flex gap-3 mt-1 flex-wrap">
                          {precoMedio > 0 && (
                            <span className="text-xs text-gray-500">
                              venda média{' '}
                              <span className="text-green-400">{formatCurrency(precoMedio * item.quantidade)}</span>
                            </span>
                          )}
                          {custoMedio > 0 ? (
                            <span className="text-xs text-gray-500">
                              custo médio{' '}
                              <span className="text-gray-300">{formatCurrency(custoMedio * item.quantidade)}</span>
                              {numProdutos > 0 && (
                                <span className="text-gray-600 ml-1">({numProdutos} prod.)</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-yellow-600">sem produtos cadastrados</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        <button
                          onClick={() => changeQty(item.id, -1)}
                          className="w-6 h-6 rounded-md bg-[#2a2a2e] hover:bg-[#333] text-white flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs text-white">{item.quantidade}</span>
                        <button
                          onClick={() => changeQty(item.id, 1)}
                          className="w-6 h-6 rounded-md bg-[#2a2a2e] hover:bg-[#333] text-white flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview CMV total */}
          {itens.length > 0 && (
            <div className={`rounded-xl p-4 border ${
              semPreco ? 'bg-[#141416] border-[#2a2a2e]'
              : preview.status === 'otimo' ? 'bg-green-500/8 border-green-500/20'
              : preview.status === 'atencao' ? 'bg-yellow-500/8 border-yellow-500/20'
              : 'bg-red-500/8 border-red-500/20'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400 font-medium">Resumo do combo</p>
                {!semPreco && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    preview.status === 'otimo' ? 'bg-green-500/20 text-green-400'
                    : preview.status === 'atencao' ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                  }`}>
                    {getStatusLabel(preview.status)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Custo médio total</span>
                  <span className="text-white font-semibold">{formatCurrency(preview.custoTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Preço médio total</span>
                  <span className="text-gray-300">{precoRegularCalculado > 0 ? formatCurrency(precoRegularCalculado) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CMV</span>
                  <span className="font-semibold" style={{ color: semPreco ? '#6b7280' : cmvColor }}>
                    {semPreco ? '—' : formatPercent(preview.cmvPercent)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Margem</span>
                  <span className="text-white font-semibold">{semPreco ? '—' : formatPercent(preview.margem)}</span>
                </div>
                {temDesconto && (
                  <div className="col-span-2 flex justify-between border-t border-[#2a2a2e] pt-2 mt-1">
                    <span className="text-gray-500">Economia do cliente</span>
                    <span className="text-green-400 font-semibold">
                      {formatCurrency(economia)} ({((economia / precoRegularCalculado) * 100).toFixed(1)}% off)
                    </span>
                  </div>
                )}
              </div>
              {semPreco && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Defina um preço de venda para calcular o CMV
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#2a2a2e] shrink-0">
          {combo && onDelete && !showConfirmDelete && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:text-red-400 transition-colors mb-3"
            >
              <Trash2 className="w-4 h-4" />Excluir combo
            </button>
          )}
          {showConfirmDelete && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-sm font-semibold text-white">Excluir "{combo?.nome}"?</p>
              </div>
              <p className="text-xs text-gray-400 mb-3">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-2 bg-[#2a2a2e] hover:bg-[#333] text-white rounded-lg text-sm transition-colors">Cancelar</button>
                <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors">Excluir de vez</button>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-[#2a2a2e] hover:bg-[#333] text-white rounded-xl text-sm font-medium transition-colors">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {combo ? 'Salvar alterações' : 'Criar combo'}
            </button>
          </div>
          {!canSave && (
            <p className="text-xs text-gray-600 text-center mt-2">
              {!nome.trim() ? 'Dê um nome ao combo' : 'Adicione pelo menos 1 item'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
