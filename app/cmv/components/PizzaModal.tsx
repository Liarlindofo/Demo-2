'use client';

import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, ChevronDown } from 'lucide-react';
import type { Sabor, StoreData, Categoria, SaborItem, SaborItemTipo } from '../types';
import {
  calcularCustoItem,
  calcularCMVSabor,
  migrarSaborItens,
  calcularCustoPorKgReceita,
  formatCurrency,
  formatPercent,
} from '../utils';
import { CMV_COLORS, CMV_META, getStatusLabel } from '../constants';

interface PizzaModalProps {
  sabor: Sabor | null;
  data: StoreData;
  onClose: () => void;
  onSave: (newData: StoreData) => void;
  onDelete?: (saborId: string) => void;
}

export const PizzaModal = ({ sabor, data, onClose, onSave, onDelete }: PizzaModalProps) => {
  const [editNome, setEditNome] = useState('');
  const [editCategoria, setEditCategoria] = useState<Categoria>('tradicional');
  const [editPrecoVenda, setEditPrecoVenda] = useState('');
  const [itens, setItens] = useState<SaborItem[]>([]);

  useEffect(() => {
    if (!sabor) return;
    setEditNome(sabor.nome);
    setEditCategoria(sabor.categoria);
    setEditPrecoVenda(sabor.precoVenda > 0 ? sabor.precoVenda.toString() : '');
    setItens(migrarSaborItens(sabor).map(it => ({ ...it })));
  }, [sabor]);

  if (!sabor) return null;

  // ── Sabor preview para cálculo em tempo real ──────────────────────────────
  const saborPreview: Sabor = {
    ...sabor,
    nome: editNome,
    categoria: editCategoria,
    precoVenda: parseFloat(editPrecoVenda.replace(',', '.')) || 0,
    itens,
  };
  const product = calcularCMVSabor(saborPreview, data.ingredientes, data.receitas);
  const cmvColor = CMV_COLORS[product.status];

  // ── Helpers de nome / unidade de cada item ────────────────────────────────
  const resolveItemNome = (item: SaborItem): string => {
    if (item.tipo === 'ingrediente') {
      return data.ingredientes.find(i => i.id === item.referenciaId)?.nome ?? '—';
    }
    return data.receitas.find(r => r.id === item.referenciaId)?.nome ?? '—';
  };

  const resolveItemUnidade = (item: SaborItem): string => {
    if (item.tipo === 'ingrediente') {
      return data.ingredientes.find(i => i.id === item.referenciaId)?.unidade ?? '';
    }
    return data.receitas.find(r => r.id === item.referenciaId)?.unidade ?? '';
  };

  const resolvePrecoLabel = (item: SaborItem): string => {
    if (item.tipo === 'ingrediente') {
      const ing = data.ingredientes.find(i => i.id === item.referenciaId);
      if (!ing) return '';
      const preco = ing.precoPorKg;
      const label = ing.unidade === 'un' ? '/un' : '/kg';
      return preco > 0 ? `${formatCurrency(preco)}${label}` : 'sem preço';
    }
    const rec = data.receitas.find(r => r.id === item.referenciaId);
    if (!rec) return '';
    const custo = calcularCustoPorKgReceita(rec, data.ingredientes);
    const label = rec.unidade === 'un' ? '/un' : '/kg';
    return custo > 0 ? `${formatCurrency(custo)}${label}` : 'sem preço';
  };

  // ── Itens CRUD ─────────────────────────────────────────────────────────────
  const addItem = () =>
    setItens(prev => [
      ...prev,
      { id: crypto.randomUUID(), tipo: 'ingrediente', referenciaId: '', quantidade: 0 },
    ]);

  const removeItem = (id: string) =>
    setItens(prev => prev.filter(it => it.id !== id));

  const updateTipo = (id: string, tipo: SaborItemTipo) =>
    setItens(prev =>
      prev.map(it => (it.id === id ? { ...it, tipo, referenciaId: '' } : it)),
    );

  const updateReferencia = (id: string, referenciaId: string) =>
    setItens(prev =>
      prev.map(it => (it.id === id ? { ...it, referenciaId } : it)),
    );

  const updateQuantidade = (id: string, valor: string) =>
    setItens(prev =>
      prev.map(it =>
        it.id === id ? { ...it, quantidade: parseFloat(valor) || 0 } : it,
      ),
    );

  // ── Salvar ────────────────────────────────────────────────────────────────
  const handleSave = () => {
    const precoVenda = parseFloat(editPrecoVenda.replace(',', '.')) || sabor.precoVenda;
    const validItens = itens.filter(it => it.referenciaId && it.quantidade > 0);

    const newSabores = data.sabores.map(s =>
      s.id === sabor.id
        ? {
            ...s,
            nome: editNome || s.nome,
            categoria: editCategoria,
            precoVenda,
            itens: validItens,
          }
        : s,
    );

    onSave({ ...data, sabores: newSabores });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Remover "${sabor.nome}"?`)) {
      onDelete?.(sabor.id);
      onClose();
    }
  };

  const hasIngredientes = data.ingredientes.length > 0;
  const hasReceitas = data.receitas.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2e]">
          <div className="flex-1 mr-3">
            <input
              value={editNome}
              onChange={e => setEditNome(e.target.value)}
              className="text-lg font-bold text-white bg-transparent border-b border-transparent hover:border-[#374151] focus:border-green-500 focus:outline-none w-full transition-colors"
            />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CMV Summary */}
        <div className="px-5 py-4 bg-[#141416] border-b border-[#2a2a2e]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">CMV</p>
              <p className="text-3xl font-bold" style={{ color: cmvColor }}>
                {formatPercent(product.cmvPercent)}
              </p>
              <p className="text-xs mt-1" style={{ color: cmvColor }}>
                {getStatusLabel(product.status)}
              </p>
            </div>
            <div className="text-right space-y-1">
              <div className="text-xs text-gray-400">
                Custo: <span className="text-white font-medium">{formatCurrency(product.custo)}</span>
              </div>
              <div className="text-xs text-gray-400">
                Margem: <span className="text-white font-medium">{formatPercent(product.margem)}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Meta: <span className="text-red-400 font-medium">{CMV_META}%</span>
              </div>
            </div>
          </div>

          <div className="mt-3 h-1.5 bg-[#2a2a2e] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, product.margem))}%`,
                backgroundColor: cmvColor,
              }}
            />
          </div>

          {/* Preço de venda + Categoria */}
          <div className="flex gap-3 mt-3">
            <div className="flex-1">
              <label className="text-xs text-gray-400">Preço de Venda (R$)</label>
              <input
                type="number"
                value={editPrecoVenda}
                onChange={e => setEditPrecoVenda(e.target.value)}
                className="w-full mt-1 bg-[#2a2a2e] border border-[#374151] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
                step="0.01"
                min="0"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400">Categoria</label>
              <div className="relative mt-1">
                <select
                  value={editCategoria}
                  onChange={e => setEditCategoria(e.target.value as Categoria)}
                  className="w-full appearance-none bg-[#2a2a2e] border border-[#374151] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
                >
                  <option value="tradicional">Tradicional</option>
                  <option value="especial">Especial</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de itens (ingredientes + receitas) */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Ficha Técnica ({itens.filter(it => it.referenciaId).length} itens)
            </h4>
            {(hasIngredientes || hasReceitas) && (
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar
              </button>
            )}
          </div>

          <div className="space-y-2">
            {itens.map(item => {
              const custo = calcularCustoItem(item, data.ingredientes, data.receitas);
              const unidade = resolveItemUnidade(item);
              const precoLabel = resolvePrecoLabel(item);

              return (
                <div
                  key={item.id}
                  className="bg-[#141416] border border-[#2a2a2e] rounded-xl p-3"
                >
                  {/* Linha 1: tipo + selector */}
                  <div className="flex gap-2 items-center mb-2">
                    {/* Tipo */}
                    <div className="relative w-32 shrink-0">
                      <select
                        value={item.tipo}
                        onChange={e => updateTipo(item.id, e.target.value as SaborItemTipo)}
                        className="w-full appearance-none bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-green-500"
                      >
                        <option value="ingrediente">Ingrediente</option>
                        <option value="receita">Receita</option>
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Selector do item */}
                    <div className="flex-1 relative">
                      <select
                        value={item.referenciaId}
                        onChange={e => updateReferencia(item.id, e.target.value)}
                        className="w-full appearance-none bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
                      >
                        <option value="">Selecionar…</option>
                        {item.tipo === 'ingrediente'
                          ? data.ingredientes.map(i => (
                              <option key={i.id} value={i.id}>{i.nome}</option>
                            ))
                          : data.receitas.map(r => (
                              <option key={r.id} value={r.id}>{r.nome}</option>
                            ))
                        }
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Linha 2: quantidade + custo */}
                  {item.referenciaId && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="number"
                          value={item.quantidade || ''}
                          onChange={e => updateQuantidade(item.id, e.target.value)}
                          placeholder="Qtd"
                          className="w-full bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-green-500"
                          step="any"
                          min="0"
                        />
                        <span className="text-xs text-gray-500 w-6 shrink-0">{unidade}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {precoLabel}
                      </div>
                      <div className="text-right min-w-[64px]">
                        <p className="text-xs text-gray-500">custo</p>
                        <p className="text-sm font-semibold text-white">
                          {custo > 0 ? formatCurrency(custo) : '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!hasIngredientes && !hasReceitas && (
            <p className="text-sm text-gray-500 text-center py-6">
              Cadastre ingredientes (Etapa 1) ou receitas (Etapa 2) primeiro
            </p>
          )}

          {itens.length === 0 && (hasIngredientes || hasReceitas) && (
            <button
              onClick={addItem}
              className="w-full mt-2 flex items-center justify-center gap-2 border border-dashed border-[#374151] hover:border-green-500/50 rounded-xl py-4 text-sm text-gray-500 hover:text-green-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar item à ficha técnica
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#2a2a2e] flex gap-3">
          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-colors"
            >
              Remover
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-xl"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
