'use client';

import { useState, useMemo } from 'react';
import { X, Plus, Minus, Trash2, Search, Package2, AlertTriangle } from 'lucide-react';
import type { Combo, ComboItem, ProductCMV, StoreData } from '../types';
import { calcularComboCMV, calcularTodosCMV, formatCurrency, formatPercent } from '../utils';
import { CMV_COLORS, CMV_META, getStatusLabel } from '../constants';

interface ComboModalProps {
  combo: Combo | null; // null = novo combo
  data: StoreData;
  onClose: () => void;
  onSave: (combo: Combo) => void;
  onDelete?: (comboId: string) => void;
}

export const ComboModal = ({ combo, data, onClose, onSave, onDelete }: ComboModalProps) => {
  const [nome, setNome] = useState(combo?.nome ?? '');
  const [descricao, setDescricao] = useState(combo?.descricao ?? '');
  const [precoVenda, setPrecoVenda] = useState(
    combo?.precoVenda ? combo.precoVenda.toString() : '',
  );
  const [itens, setItens] = useState<ComboItem[]>(combo?.itens ?? []);
  const [search, setSearch] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Todos os produtos disponíveis
  const allProducts = useMemo(() => calcularTodosCMV(data), [data]);

  // Produtos filtrados pela busca, excluindo os já adicionados
  const filteredProducts = useMemo(() => {
    const addedIds = new Set(itens.map(i => i.saborId));
    return allProducts.filter(
      p =>
        !addedIds.has(p.id) &&
        p.nome.toLowerCase().includes(search.toLowerCase()),
    );
  }, [allProducts, itens, search]);

  // Preview do CMV do combo
  const previewCombo: Combo = {
    id: combo?.id ?? 'preview',
    nome,
    descricao,
    precoVenda: parseFloat(precoVenda.replace(',', '.')) || 0,
    itens,
  };
  const preview = useMemo(
    () => calcularComboCMV(previewCombo, allProducts),
    [previewCombo, allProducts], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const addProduct = (product: ProductCMV) => {
    setItens(prev => [...prev, { saborId: product.id, quantidade: 1 }]);
    setSearch('');
  };

  const removeItem = (saborId: string) => {
    setItens(prev => prev.filter(i => i.saborId !== saborId));
  };

  const changeQty = (saborId: string, delta: number) => {
    setItens(prev =>
      prev
        .map(i =>
          i.saborId === saborId
            ? { ...i, quantidade: Math.max(1, i.quantidade + delta) }
            : i,
        ),
    );
  };

  const setQtyDirect = (saborId: string, value: string) => {
    const qty = parseInt(value) || 1;
    setItens(prev =>
      prev.map(i =>
        i.saborId === saborId ? { ...i, quantidade: Math.max(1, qty) } : i,
      ),
    );
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
    if (combo && onDelete) {
      onDelete(combo.id);
      onClose();
    }
  };

  const canSave = nome.trim().length > 0 && itens.length > 0;
  const semPreco = preview.precoVenda === 0;
  const cmvColor = CMV_COLORS[preview.status];

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
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors rounded-lg p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Nome e descrição */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Nome do combo *</label>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                autoFocus
                placeholder="Ex: Kit Final de Semana"
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
              <label className="text-xs text-gray-400 block mb-1">Preço de venda (R$)</label>
              <input
                type="number"
                value={precoVenda}
                onChange={e => setPrecoVenda(e.target.value)}
                placeholder="0,00"
                min="0"
                step="0.01"
                className="w-full bg-[#141416] border border-[#374151] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/60"
              />
            </div>
          </div>

          {/* Adicionar produtos */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">Adicionar produtos ao combo</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full bg-[#141416] border border-[#374151] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/60"
              />
            </div>

            {/* Dropdown de resultados */}
            {search.length > 0 && (
              <div className="mt-1 bg-[#141416] border border-[#2a2a2e] rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    Nenhum produto encontrado
                  </p>
                ) : (
                  filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <span className="text-sm text-white">{product.nome}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        custo {formatCurrency(product.custo)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Lista de itens do combo */}
          <div>
            <p className="text-xs text-gray-400 mb-2">
              Produtos no combo{itens.length > 0 && ` (${itens.length})`}
            </p>

            {itens.length === 0 ? (
              <div className="bg-[#141416] border border-dashed border-[#2a2a2e] rounded-xl p-6 text-center">
                <Package2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Busque e adicione produtos acima
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {itens.map(item => {
                  const product = allProducts.find(p => p.id === item.saborId);
                  if (!product) return null;
                  return (
                    <div
                      key={item.saborId}
                      className="bg-[#141416] border border-[#2a2a2e] rounded-xl px-4 py-3 flex items-center gap-3"
                    >
                      {/* Nome + custo */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{product.nome}</p>
                        <p className="text-xs text-gray-500">
                          custo {formatCurrency(product.custo)} × {item.quantidade} ={' '}
                          <span className="text-gray-400">{formatCurrency(product.custo * item.quantidade)}</span>
                        </p>
                      </div>

                      {/* Controle de quantidade */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => changeQty(item.saborId, -1)}
                          className="w-7 h-7 rounded-lg bg-[#2a2a2e] hover:bg-[#333] text-white flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={item.quantidade}
                          onChange={e => setQtyDirect(item.saborId, e.target.value)}
                          min={1}
                          className="w-10 text-center bg-[#2a2a2e] border border-[#374151] rounded-lg py-1 text-sm text-white focus:outline-none"
                        />
                        <button
                          onClick={() => changeQty(item.saborId, 1)}
                          className="w-7 h-7 rounded-lg bg-[#2a2a2e] hover:bg-[#333] text-white flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remover */}
                      <button
                        onClick={() => removeItem(item.saborId)}
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
            <div className={`rounded-xl p-4 border ${semPreco
              ? 'bg-[#141416] border-[#2a2a2e]'
              : preview.status === 'otimo'
              ? 'bg-green-500/8 border-green-500/20'
              : preview.status === 'atencao'
              ? 'bg-yellow-500/8 border-yellow-500/20'
              : 'bg-red-500/8 border-red-500/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400 font-medium">Resumo do combo</p>
                {!semPreco && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    preview.status === 'otimo'
                      ? 'bg-green-500/20 text-green-400'
                      : preview.status === 'atencao'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {getStatusLabel(preview.status)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Custo total</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(preview.custoTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">CMV</p>
                  <p
                    className="text-sm font-bold"
                    style={{ color: semPreco ? '#6b7280' : cmvColor }}
                  >
                    {semPreco ? '—' : formatPercent(preview.cmvPercent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Margem</p>
                  <p className="text-sm font-bold text-white">
                    {semPreco ? '—' : formatPercent(preview.margem)}
                  </p>
                </div>
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
          {/* Botão de excluir (apenas em edição) */}
          {combo && onDelete && !showConfirmDelete && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-500 hover:text-red-400 transition-colors mb-3"
            >
              <Trash2 className="w-4 h-4" />
              Excluir combo
            </button>
          )}

          {/* Confirmação de exclusão inline */}
          {showConfirmDelete && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-sm font-semibold text-white">Excluir "{combo?.nome}"?</p>
              </div>
              <p className="text-xs text-gray-400 mb-3">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-2 bg-[#2a2a2e] hover:bg-[#333] text-white rounded-lg text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Excluir de vez
                </button>
              </div>
            </div>
          )}

          {/* Ações principais */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#2a2a2e] hover:bg-[#333] text-white rounded-xl text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
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
              {!nome.trim() ? 'Dê um nome ao combo' : 'Adicione pelo menos 1 produto'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
