'use client';

import { useState, useMemo } from 'react';
import { X, Plus, Minus, Trash2, Package2, AlertTriangle, Sparkles, ChevronDown } from 'lucide-react';
import type { Combo, ComboItem, StoreData, Tamanho, CategoriaPreco } from '../types';
import { TAMANHO_LABELS, TAMANHOS } from '../types';
import {
  calcularComboCMV,
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

export const ComboModal = ({ combo, data, onClose, onSave, onDelete }: ComboModalProps) => {
  const [nome, setNome] = useState(combo?.nome ?? '');
  const [descricao, setDescricao] = useState(combo?.descricao ?? '');
  const [precoVenda, setPrecoVenda] = useState(
    combo?.precoVenda ? combo.precoVenda.toFixed(2) : '',
  );
  const [itens, setItens] = useState<ComboItem[]>(combo?.itens ?? []);
  const [selCategoriaId, setSelCategoriaId] = useState('');
  const [selTamanho, setSelTamanho] = useState<Tamanho | ''>('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const categorias = data.categorias ?? [];

  // Tamanhos disponíveis para a categoria selecionada
  const categoriaSelected = categorias.find(c => c.id === selCategoriaId);
  const tamanhosDisponiveis: Tamanho[] = categoriaSelected
    ? TAMANHOS.filter(t => categoriaSelected.precos[t] != null)
    : [];

  // Preview CMV em tempo real
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

  // Preço regular = soma dos preços de categoria × quantidade
  const precoRegularCalculado = preview.precoRegular;

  // Custo médio de um item (categoria+tamanho)
  const calcularCustoMedioItem = (categoriaId: string, tamanho: Tamanho): { custo: number; numProdutos: number } => {
    const produtos = data.sabores.filter(
      s => s.categoriaId === categoriaId && detectarTamanho(s.nome) === tamanho,
    );
    if (produtos.length === 0) return { custo: 0, numProdutos: 0 };
    const soma = produtos.reduce(
      (sum, s) => sum + calcularCustoSabor(s, data.ingredientes, data.receitas),
      0,
    );
    return { custo: soma / produtos.length, numProdutos: produtos.length };
  };

  const addItem = () => {
    if (!selCategoriaId || !selTamanho) return;
    const exists = itens.some(i => i.categoriaId === selCategoriaId && i.tamanho === selTamanho);
    if (exists) {
      setItens(prev =>
        prev.map(i =>
          i.categoriaId === selCategoriaId && i.tamanho === selTamanho
            ? { ...i, quantidade: i.quantidade + 1 }
            : i,
        ),
      );
    } else {
      setItens(prev => [...prev, { categoriaId: selCategoriaId, tamanho: selTamanho, quantidade: 1 }]);
    }
    setSelTamanho('');
  };

  const removeItem = (categoriaId: string, tamanho: Tamanho) =>
    setItens(prev => prev.filter(i => !(i.categoriaId === categoriaId && i.tamanho === tamanho)));

  const changeQty = (categoriaId: string, tamanho: Tamanho, delta: number) =>
    setItens(prev =>
      prev.map(i =>
        i.categoriaId === categoriaId && i.tamanho === tamanho
          ? { ...i, quantidade: Math.max(1, i.quantidade + delta) }
          : i,
      ),
    );

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
          {/* Nome + descrição */}
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
                placeholder="Ex: 2 pizzas grandes + refrigerante"
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
                    Usar preço regular ({formatCurrency(precoRegularCalculado)})
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
                  ✓ Desconto de {formatCurrency(economia)} ({((economia / precoRegularCalculado) * 100).toFixed(1)}% off) em relação ao preço regular
                </p>
              )}
              {temSobretaxa && (
                <p className="text-xs text-yellow-400 mt-1">
                  ⚠ Preço {formatCurrency(-economia)} acima do preço regular
                </p>
              )}
            </div>
          </div>

          {/* Adicionar categoria + tamanho */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">
              Adicionar ao combo — selecione a categoria e o tamanho
            </label>

            {categorias.length === 0 ? (
              <div className="bg-[#141416] border border-dashed border-[#374151] rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500">
                  Nenhuma categoria cadastrada. Crie categorias na aba{' '}
                  <span className="text-orange-400">Categorias</span> primeiro.
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                {/* Selector de categoria */}
                <div className="flex-1 relative">
                  <select
                    value={selCategoriaId}
                    onChange={e => { setSelCategoriaId(e.target.value); setSelTamanho(''); }}
                    className="w-full appearance-none bg-[#141416] border border-[#374151] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/60 pr-8"
                  >
                    <option value="">Categoria...</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>

                {/* Selector de tamanho */}
                <div className="w-40 relative">
                  <select
                    value={selTamanho}
                    onChange={e => setSelTamanho(e.target.value as Tamanho)}
                    disabled={!selCategoriaId || tamanhosDisponiveis.length === 0}
                    className="w-full appearance-none bg-[#141416] border border-[#374151] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/60 pr-8 disabled:opacity-40"
                  >
                    <option value="">Tamanho...</option>
                    {tamanhosDisponiveis.map(t => (
                      <option key={t} value={t}>
                        {TAMANHO_LABELS[t]} — {formatCurrency(categoriaSelected?.precos[t] ?? 0)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>

                {/* Botão adicionar */}
                <button
                  onClick={addItem}
                  disabled={!selCategoriaId || !selTamanho}
                  className="w-10 h-10 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
                  title="Adicionar ao combo"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Lista de itens do combo */}
          <div>
            <p className="text-xs text-gray-400 mb-2">
              Itens do combo{itens.length > 0 && ` (${itens.length})`}
            </p>

            {itens.length === 0 ? (
              <div className="bg-[#141416] border border-dashed border-[#2a2a2e] rounded-xl p-6 text-center">
                <Package2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Selecione categoria e tamanho acima</p>
              </div>
            ) : (
              <div className="space-y-2">
                {itens.map(item => {
                  const categoria = categorias.find(c => c.id === item.categoriaId);
                  if (!categoria) return null;
                  const preco = categoria.precos[item.tamanho] ?? 0;
                  const { custo, numProdutos } = calcularCustoMedioItem(item.categoriaId, item.tamanho);

                  return (
                    <div
                      key={`${item.categoriaId}-${item.tamanho}`}
                      className="bg-[#141416] border border-[#2a2a2e] rounded-xl px-4 py-3 flex items-center gap-3"
                    >
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">
                          {categoria.nome}
                          <span className="text-orange-400 ml-1.5">— {TAMANHO_LABELS[item.tamanho]}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {preco > 0 && (
                            <p className="text-xs text-gray-500">
                              venda{' '}
                              <span className="text-green-400 font-medium">
                                {formatCurrency(preco * item.quantidade)}
                              </span>
                              {item.quantidade > 1 && (
                                <span className="text-gray-600 ml-1">
                                  ({formatCurrency(preco)} × {item.quantidade})
                                </span>
                              )}
                            </p>
                          )}
                          {custo > 0 ? (
                            <p className="text-xs text-gray-500">
                              custo médio{' '}
                              <span className="text-gray-400">{formatCurrency(custo * item.quantidade)}</span>
                              <span className="text-gray-600 ml-1">
                                ({numProdutos} produto{numProdutos !== 1 ? 's' : ''})
                              </span>
                            </p>
                          ) : (
                            <p className="text-xs text-yellow-600">
                              nenhum produto cadastrado nesta categoria/tamanho
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quantidade */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => changeQty(item.categoriaId, item.tamanho, -1)}
                          className="w-7 h-7 rounded-lg bg-[#2a2a2e] hover:bg-[#333] text-white flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm text-white font-medium">{item.quantidade}</span>
                        <button
                          onClick={() => changeQty(item.categoriaId, item.tamanho, 1)}
                          className="w-7 h-7 rounded-lg bg-[#2a2a2e] hover:bg-[#333] text-white flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remover */}
                      <button
                        onClick={() => removeItem(item.categoriaId, item.tamanho)}
                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview CMV */}
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
                  <span className="text-gray-500">Preço regular</span>
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
              <Trash2 className="w-4 h-4" />
              Excluir combo
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
