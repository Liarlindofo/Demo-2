'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { StoreData, Sabor, SaborItem, SaborItemTipo, CategoriaPreco, PizzaTamanho } from '../types';
import { TAMANHOS_PIZZA } from '../types';
import {
  calcularCustoPorKgReceita,
  resolverPrecoVendaCategoria,
  formatCurrency,
} from '../utils';
import { SearchableSelect } from './SearchableSelect';

const TAMANHO_SUFIXO: Record<PizzaTamanho, string> = {
  broto: 'Broto',
  pequena: 'Pequena',
  media: 'Média',
  grande: 'Grande',
  gigante: 'Gigante',
  calzone: 'Calzone',
};

interface AddSizeModalProps {
  groupName: string;
  existingSizes: PizzaTamanho[];
  data: StoreData;
  onClose: () => void;
  onSave: (newData: StoreData) => void;
}

const makeItem = (): SaborItem => ({
  id: crypto.randomUUID(),
  tipo: 'ingrediente',
  referenciaId: '',
  quantidade: 0,
});

const toCompositeId = (tipo: SaborItemTipo, id: string) => `${tipo}::${id}`;
const fromCompositeId = (value: string): { tipo: SaborItemTipo; referenciaId: string } => {
  const [tipo, ...rest] = value.split('::');
  return { tipo: tipo as SaborItemTipo, referenciaId: rest.join('::') };
};

export const AddSizeModal = ({
  groupName,
  existingSizes,
  data,
  onClose,
  onSave,
}: AddSizeModalProps) => {
  const [selectedTamanhos, setSelectedTamanhos] = useState<PizzaTamanho[]>([]);
  const [categoriaId, setCategoriaId] = useState('');
  const [itens, setItens] = useState<SaborItem[]>([makeItem()]);

  const categoriaAtual: CategoriaPreco | undefined = data.categorias.find(c => c.id === categoriaId);

  const toggleTamanho = (t: PizzaTamanho) => {
    if (existingSizes.includes(t)) return;
    setSelectedTamanhos(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t],
    );
  };

  const getPrecoParaTamanho = (t: PizzaTamanho): number => {
    if (!categoriaAtual) return 0;
    return categoriaAtual.precos[t] ?? categoriaAtual.precoVenda ?? 0;
  };

  const addItem = () => setItens(prev => [...prev, makeItem()]);
  const removeItem = (id: string) => setItens(prev => prev.filter(it => it.id !== id));

  const updateReferencia = (id: string, compositeValue: string) => {
    if (!compositeValue) {
      setItens(prev => prev.map(it => it.id === id ? { ...it, referenciaId: '' } : it));
      return;
    }
    const { tipo, referenciaId } = fromCompositeId(compositeValue);
    setItens(prev => prev.map(it => it.id === id ? { ...it, tipo, referenciaId } : it));
  };

  const updateQuantidade = (id: string, valor: string) =>
    setItens(prev =>
      prev.map(it => it.id === id ? { ...it, quantidade: parseFloat(valor) || 0 } : it),
    );

  const handleSave = () => {
    if (selectedTamanhos.length === 0) {
      alert('Selecione ao menos um tamanho para adicionar.');
      return;
    }

    const validItens = itens.filter(it => it.referenciaId && it.quantidade > 0);

    const novosSabores: Sabor[] = selectedTamanhos.map(t => ({
      id: crypto.randomUUID(),
      nome: `${groupName} ${TAMANHO_SUFIXO[t]}`,
      categoria: 'tradicional' as const,
      categoriaId: categoriaId || undefined,
      precoVenda: getPrecoParaTamanho(t),
      itens: validItens.map(it => ({ ...it, id: crypto.randomUUID() })),
    }));

    onSave({ ...data, sabores: [...data.sabores, ...novosSabores] });
  };

  const hasOpcoes = data.ingredientes.length > 0 || data.receitas.length > 0;
  const itensPreenchidos = itens.filter(it => it.referenciaId).length;
  const availableTamanhos = TAMANHOS_PIZZA.filter(t => !existingSizes.includes(t));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col" style={{ maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2e] shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Adicionar Tamanho</h2>
            <p className="text-xs text-gray-500 mt-0.5">{groupName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Tamanhos disponíveis */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">
              Tamanhos a adicionar
            </label>
            {availableTamanhos.length === 0 ? (
              <p className="text-xs text-amber-400 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2">
                Todos os tamanhos já existem para este sabor.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {TAMANHOS_PIZZA.map(t => {
                  const jaExiste = existingSizes.includes(t);
                  const selected = selectedTamanhos.includes(t);
                  const temPreco = categoriaAtual?.precos[t] != null;

                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTamanho(t)}
                      disabled={jaExiste}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        jaExiste
                          ? 'bg-[#141416] border-[#2a2a2e] text-gray-600 cursor-not-allowed'
                          : selected
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'bg-transparent border-[#374151] text-gray-400 hover:border-green-500/50 hover:text-white'
                      }`}
                    >
                      {TAMANHO_SUFIXO[t]}
                      {jaExiste && <span className="ml-1 text-gray-700">✓</span>}
                      {!jaExiste && categoriaAtual && temPreco && (
                        <span className={`ml-1 ${selected ? 'text-green-200' : 'text-gray-600'}`}>
                          {formatCurrency(categoriaAtual.precos[t]!)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedTamanhos.length > 0 && groupName && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedTamanhos.map(t => (
                  <span key={t} className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-md px-2 py-0.5">
                    {groupName} {TAMANHO_SUFIXO[t]}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Categoria de preço */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Categoria de Preço</label>
            <SearchableSelect
              value={categoriaId}
              onChange={v => setCategoriaId(v)}
              options={data.categorias
                .filter(c => !c.tipoPrecificacao || c.tipoPrecificacao === 'pizza')
                .map(cat => {
                  const precoParaTamanho = selectedTamanhos.length === 1 && cat.precos[selectedTamanhos[0]];
                  const sublabel = precoParaTamanho
                    ? formatCurrency(precoParaTamanho)
                    : cat.precoVenda
                    ? formatCurrency(cat.precoVenda)
                    : Object.keys(cat.precos).length > 0
                    ? `${Object.keys(cat.precos).length} tamanho(s)`
                    : 'sem preço';
                  return {
                    value: cat.id,
                    label: cat.nome,
                    sublabel,
                    group: cat.grupo || undefined,
                  };
                })}
              placeholder="— Sem categoria —"
              accentColor="green"
            />
            {categoriaAtual && selectedTamanhos.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {selectedTamanhos.map(t => (
                  <p key={t} className="text-xs text-green-400">
                    {TAMANHO_SUFIXO[t]}: {categoriaAtual.precos[t] != null
                      ? formatCurrency(categoriaAtual.precos[t]!)
                      : <span className="text-yellow-500">sem preço</span>}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Ficha técnica (opcional) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-white">Ficha Técnica</p>
                <p className="text-xs text-gray-500">
                  {itensPreenchidos > 0
                    ? `${itensPreenchidos} item${itensPreenchidos !== 1 ? 'ns' : ''} adicionado${itensPreenchidos !== 1 ? 's' : ''}`
                    : 'Opcional — pode preencher depois'}
                </p>
              </div>
              {hasOpcoes && (
                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 bg-[#2a2a2e] hover:bg-[#374151] text-gray-300 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Item
                </button>
              )}
            </div>

            {!hasOpcoes ? (
              <div className="bg-[#141416] border border-[#2a2a2e] rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-gray-500">Sem ingredientes cadastrados. Adicione na Etapa 1 para montar a ficha técnica.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_80px_28px] gap-2 px-3 pb-1">
                  <span className="text-xs text-gray-600 uppercase tracking-wide">Ingrediente / Receita</span>
                  <span className="text-xs text-gray-600 uppercase tracking-wide">Qtd</span>
                  <span />
                </div>
                {itens.map(item => {
                  const itemOptions = [
                    ...data.ingredientes.map(i => ({
                      value: toCompositeId('ingrediente', i.id),
                      label: i.nome,
                      group: 'Ingredientes',
                      sublabel: i.precoPorKg > 0 ? `${formatCurrency(i.precoPorKg)}/kg` : 'sem preço',
                    })),
                    ...data.receitas.map(r => ({
                      value: toCompositeId('receita', r.id),
                      label: r.nome,
                      group: 'Receitas',
                      badge: 'receita',
                      badgeClass: 'bg-purple-500/15 text-purple-400',
                      sublabel: (() => {
                        const c = calcularCustoPorKgReceita(r, data.ingredientes);
                        return c > 0 ? `${formatCurrency(c)}/kg` : 'sem preço';
                      })(),
                    })),
                  ];

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_80px_28px] gap-2 items-center bg-[#141416] border border-[#2a2a2e] rounded-xl px-3 py-2.5 hover:border-[#374151] transition-colors"
                    >
                      <SearchableSelect
                        value={item.referenciaId ? toCompositeId(item.tipo, item.referenciaId) : ''}
                        onChange={v => updateReferencia(item.id, v)}
                        options={itemOptions}
                        placeholder="Buscar ingrediente ou receita…"
                        accentColor="green"
                      />
                      <input
                        type="number"
                        value={item.quantidade || ''}
                        onChange={e => updateQuantidade(item.id, e.target.value)}
                        placeholder="Qtd"
                        className="w-full bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1.5 text-sm text-white text-right focus:outline-none focus:border-green-500"
                        min="0"
                        step="any"
                      />
                      {itens.length > 1 ? (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-gray-600 hover:text-red-400 transition-colors rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2a2a2e] flex gap-3 justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-xl"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={selectedTamanhos.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            {selectedTamanhos.length > 1
              ? `Adicionar ${selectedTamanhos.length} tamanhos`
              : 'Adicionar tamanho'}
          </button>
        </div>
      </div>
    </div>
  );
};
