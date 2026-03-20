'use client';

import { useState, useEffect } from 'react';
import { X, Save, ChevronDown } from 'lucide-react';
import type { Sabor, Ingrediente, StoreData, Categoria } from '../types';
import { calcularCustoSabor, calcularCMVSabor, formatCurrency, formatPercent } from '../utils';
import { CMV_COLORS, CMV_META, getStatusLabel } from '../constants';

interface PizzaModalProps {
  sabor: Sabor | null;
  data: StoreData;
  onClose: () => void;
  onSave: (newData: StoreData) => void;
  onDelete?: (saborId: string) => void;
}

export const PizzaModal = ({ sabor, data, onClose, onSave, onDelete }: PizzaModalProps) => {
  const [precos, setPrecos] = useState<Record<string, string>>({});
  const [quantidades, setQuantidades] = useState<Record<string, string>>({});
  const [editNome, setEditNome] = useState('');
  const [editCategoria, setEditCategoria] = useState<Categoria>('tradicional');
  const [editPrecoVenda, setEditPrecoVenda] = useState('');

  useEffect(() => {
    if (!sabor) return;
    setEditNome(sabor.nome);
    setEditCategoria(sabor.categoria);
    setEditPrecoVenda(sabor.precoVenda.toString());

    // Preencher preços e quantidades existentes dos ingredientes
    const initialPrecos: Record<string, string> = {};
    const initialQuantidades: Record<string, string> = {};
    sabor.ingredientes.forEach(ing => {
      const ingrediente = data.ingredientes.find(i => i.id === ing.ingredienteId);
      if (ingrediente) {
        initialPrecos[ing.ingredienteId] = ingrediente.precoPorKg > 0
          ? ingrediente.precoPorKg.toString()
          : '';
        initialQuantidades[ing.ingredienteId] = ing.quantidade.toString();
      }
    });
    setPrecos(initialPrecos);
    setQuantidades(initialQuantidades);
  }, [sabor, data]);

  if (!sabor) return null;

  // Calcular CMV atual com preços e quantidades do estado local
  const saborComQuantidades = {
    ...sabor,
    ingredientes: sabor.ingredientes.map(ing => ({
      ...ing,
      quantidade: parseFloat(quantidades[ing.ingredienteId] || '0') || ing.quantidade,
    })),
  };
  const dataComPrecos: StoreData = {
    ...data,
    ingredientes: data.ingredientes.map(ing => ({
      ...ing,
      precoPorKg: parseFloat(precos[ing.id] || '0') || ing.precoPorKg,
    })),
  };

  const product = calcularCMVSabor(saborComQuantidades, dataComPrecos.ingredientes);
  const cmvColor = CMV_COLORS[product.status];

  const handleSave = () => {
    // Atualizar preços dos ingredientes
    const newIngredientes = data.ingredientes.map(ing => ({
      ...ing,
      precoPorKg: parseFloat(precos[ing.id] || '0') || ing.precoPorKg,
    }));

    // Atualizar sabor com nova quantidade em cada ingrediente
    const newSabores = data.sabores.map(s =>
      s.id === sabor.id
        ? {
            ...s,
            nome: editNome,
            categoria: editCategoria,
            precoVenda: parseFloat(editPrecoVenda.replace(',', '.')) || s.precoVenda,
            ingredientes: s.ingredientes.map(ing => ({
              ...ing,
              quantidade: parseFloat(quantidades[ing.ingredienteId] || '0') || ing.quantidade,
            })),
          }
        : s
    );

    onSave({ sabores: newSabores, ingredientes: newIngredientes });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja remover "${sabor.nome}"?`)) {
      onDelete?.(sabor.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
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
              <div className="text-xs text-gray-400 mt-2">
                Meta: <span className="text-red-400 font-medium">{CMV_META}%</span>
              </div>
            </div>
          </div>

          {/* Barra de CMV */}
          <div className="mt-3 h-1.5 bg-[#2a2a2e] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, product.margem))}%`,
                backgroundColor: cmvColor,
              }}
            />
          </div>

          {/* Edição de preço de venda e categoria */}
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

        {/* Lista de Ingredientes */}
        <div className="flex-1 overflow-y-auto p-5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Ingredientes ({sabor.ingredientes.length})
          </h4>

          <div className="space-y-2">
            {sabor.ingredientes.map(ing => {
              const ingrediente = data.ingredientes.find(i => i.id === ing.ingredienteId);
              if (!ingrediente) return null;

              const precoAtual = parseFloat(precos[ing.ingredienteId] || '0') || 0;
              const qtdAtual = parseFloat(quantidades[ing.ingredienteId] || '0') || ing.quantidade;
              const custoIng =
                ingrediente.unidade === 'un'
                  ? precoAtual * qtdAtual
                  : (precoAtual / 1000) * qtdAtual;

              const unidadeLabel =
                ingrediente.unidade === 'g' ? 'g' :
                ingrediente.unidade === 'ml' ? 'ml' : 'un';

              return (
                <div
                  key={ing.ingredienteId}
                  className="bg-[#141416] border border-[#2a2a2e] rounded-xl p-3"
                >
                  <span className="text-sm font-medium text-white">{ingrediente.nome}</span>
                  <div className="flex items-center gap-2 mt-2">
                    {/* Quantidade */}
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">
                        Qtd ({unidadeLabel})
                      </label>
                      <input
                        type="number"
                        value={quantidades[ing.ingredienteId] || ''}
                        onChange={e =>
                          setQuantidades(prev => ({ ...prev, [ing.ingredienteId]: e.target.value }))
                        }
                        placeholder="0"
                        className="w-full mt-0.5 bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-green-500"
                        step="any"
                        min="0"
                      />
                    </div>
                    {/* Preço por kg/un */}
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">
                        Preço/{ingrediente.unidade === 'un' ? 'un' : 'kg'} (R$)
                      </label>
                      <input
                        type="number"
                        value={precos[ing.ingredienteId] || ''}
                        onChange={e =>
                          setPrecos(prev => ({ ...prev, [ing.ingredienteId]: e.target.value }))
                        }
                        placeholder="0,00"
                        className="w-full mt-0.5 bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-green-500"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    {/* Custo calculado */}
                    <div className="text-right min-w-[64px]">
                      <p className="text-xs text-gray-500">Custo</p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {formatCurrency(custoIng)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {sabor.ingredientes.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhum ingrediente cadastrado
              </p>
            )}
          </div>
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
