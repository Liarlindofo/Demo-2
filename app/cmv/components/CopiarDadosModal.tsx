'use client';

import { useState } from 'react';
import {
  X, ArrowRight, Layers, ChefHat, Tag, Pizza, Package2,
  AlertTriangle, CheckSquare, Square, CheckCircle, Loader2,
} from 'lucide-react';
import type { StoreData, StoreId } from '../types';
import { STORES, STORE_IDS, STORE_COLORS } from '../constants';
import { migrarStoreData } from '../utils';

interface CopiarDadosModalProps {
  sourceStoreId: StoreId;
  sourceData: StoreData;
  onClose: () => void;
}

type DataKey = 'ingredientes' | 'receitas' | 'categorias' | 'sabores' | 'combos';

interface DataOption {
  key: DataKey;
  label: string;
  icon: React.ReactNode;
  descricao: string;
  aviso?: string;
  count: (data: StoreData) => number;
}

const DATA_OPTIONS: DataOption[] = [
  {
    key: 'ingredientes',
    label: 'Ingredientes',
    icon: <Layers className="w-4 h-4" />,
    descricao: 'Nomes e unidades dos ingredientes',
    count: d => d.ingredientes.length,
  },
  {
    key: 'receitas',
    label: 'Receitas',
    icon: <ChefHat className="w-4 h-4" />,
    descricao: 'Fichas técnicas de preparações compostas',
    count: d => d.receitas.length,
  },
  {
    key: 'categorias',
    label: 'Categorias',
    icon: <Tag className="w-4 h-4" />,
    descricao: 'Nomes e grupos de categorias',
    aviso: 'Os preços de venda serão zerados na loja destino',
    count: d => d.categorias.length,
  },
  {
    key: 'sabores',
    label: 'Sabores / Produtos',
    icon: <Pizza className="w-4 h-4" />,
    descricao: 'Produtos e suas fichas técnicas',
    count: d => d.sabores.length,
  },
  {
    key: 'combos',
    label: 'Combos',
    icon: <Package2 className="w-4 h-4" />,
    descricao: 'Estrutura dos combos',
    aviso: 'O preço de venda dos combos será zerado na loja destino',
    count: d => (d.combos ?? []).length,
  },
];

const API_BASE = '/api/cmv';

async function fetchStoreData(storeId: StoreId): Promise<StoreData> {
  const res = await fetch(`${API_BASE}/${storeId}`);
  if (!res.ok) throw new Error(`Erro ao buscar dados da loja ${storeId}`);
  const raw = await res.json();
  return migrarStoreData(raw);
}

async function saveStoreData(storeId: StoreId, data: StoreData): Promise<void> {
  const res = await fetch(`${API_BASE}/${storeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erro ao salvar dados na loja ${storeId}`);
}

function buildTargetData(
  targetData: StoreData,
  sourceData: StoreData,
  keys: DataKey[],
  manterCustos: boolean,
): StoreData {
  const result = { ...targetData };

  if (keys.includes('ingredientes')) {
    result.ingredientes = sourceData.ingredientes.map(ing => ({
      ...ing,
      precoPorKg: manterCustos ? ing.precoPorKg : 0,
    }));
  }

  if (keys.includes('receitas')) {
    result.receitas = sourceData.receitas.map(r => ({ ...r }));
  }

  if (keys.includes('categorias')) {
    // Copia estrutura mas zera os preços de venda (são específicos por loja)
    result.categorias = sourceData.categorias.map(cat => ({
      ...cat,
      precos: {},
    }));
  }

  if (keys.includes('sabores')) {
    result.sabores = sourceData.sabores.map(s => ({
      ...s,
      itens: s.itens ? s.itens.map(i => ({ ...i })) : [],
    }));
  }

  if (keys.includes('combos')) {
    // Copia estrutura mas zera preço de venda dos combos
    result.combos = (sourceData.combos ?? []).map(c => ({
      ...c,
      precoVenda: 0,
      itens: c.itens.map(i => ({ ...i })),
    }));
  }

  return result;
}

export const CopiarDadosModal = ({ sourceStoreId, sourceData, onClose }: CopiarDadosModalProps) => {
  const otherStores = STORE_IDS.filter(id => id !== sourceStoreId);
  const [targetStoreId, setTargetStoreId] = useState<StoreId>(otherStores[0]);
  const [selectedKeys, setSelectedKeys] = useState<Set<DataKey>>(
    new Set(['ingredientes', 'receitas', 'categorias', 'sabores', 'combos']),
  );
  const [manterCustos, setManterCustos] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const toggleKey = (key: DataKey) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedKeys.size === DATA_OPTIONS.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(DATA_OPTIONS.map(o => o.key)));
    }
  };

  const allSelected = selectedKeys.size === DATA_OPTIONS.length;
  const noneSelected = selectedKeys.size === 0;

  const handleCopy = async () => {
    if (noneSelected || status === 'loading') return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const targetData = await fetchStoreData(targetStoreId);
      const newData = buildTargetData(targetData, sourceData, [...selectedKeys], manterCustos);
      await saveStoreData(targetStoreId, newData);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro desconhecido');
      setStatus('error');
    }
  };

  const sourceColor = STORE_COLORS[sourceStoreId];
  const targetColor = STORE_COLORS[targetStoreId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2e] shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">Transferir dados entre lojas</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Copia a estrutura de uma loja para outra, mantendo os preços da loja destino separados
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors rounded-lg p-1 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Seletor de lojas */}
          <div>
            <p className="text-xs text-gray-400 mb-3">Selecione as lojas</p>
            <div className="flex items-center gap-3">
              {/* Loja origem */}
              <div className="flex-1 bg-[#141416] border border-[#2a2a2e] rounded-xl px-3 py-2.5">
                <p className="text-xs text-gray-500 mb-1">Origem</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: sourceColor }}
                  />
                  <span className="text-sm font-semibold text-white">{STORES[sourceStoreId]}</span>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-gray-500 shrink-0" />

              {/* Loja destino */}
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1 ml-0.5">Destino</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {otherStores.map(storeId => (
                    <button
                      key={storeId}
                      onClick={() => setTargetStoreId(storeId)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        targetStoreId === storeId
                          ? 'border-white/30 bg-white/8 text-white'
                          : 'border-[#2a2a2e] text-gray-400 hover:border-[#374151] hover:text-white'
                      }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: STORE_COLORS[storeId] }}
                      />
                      {STORES[storeId]}
                      {targetStoreId === storeId && (
                        <CheckCircle className="w-3.5 h-3.5 ml-auto" style={{ color: targetColor }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* O que copiar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">O que transferir</p>
              <button
                onClick={toggleAll}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                {allSelected ? 'Desmarcar tudo' : 'Marcar tudo'}
              </button>
            </div>

            <div className="space-y-2">
              {DATA_OPTIONS.map(opt => {
                const count = opt.count(sourceData);
                const checked = selectedKeys.has(opt.key);
                return (
                  <button
                    key={opt.key}
                    onClick={() => toggleKey(opt.key)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                      checked
                        ? 'border-white/20 bg-white/5'
                        : 'border-[#2a2a2e] hover:border-[#374151]'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-white" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{opt.icon}</span>
                        <span className="text-sm font-medium text-white">{opt.label}</span>
                        <span className="text-xs text-gray-500 ml-auto shrink-0">
                          {count} {count === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.descricao}</p>
                      {opt.aviso && checked && (
                        <p className="text-xs text-yellow-500/80 mt-1 flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                          {opt.aviso}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opções de custos */}
          {selectedKeys.has('ingredientes') && (
            <div className="bg-[#141416] border border-[#2a2a2e] rounded-xl p-4">
              <button
                onClick={() => setManterCustos(v => !v)}
                className="flex items-start gap-3 w-full text-left"
              >
                <div className="mt-0.5 shrink-0">
                  {manterCustos ? (
                    <CheckSquare className="w-4 h-4 text-white" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Manter custos dos ingredientes</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {manterCustos
                      ? 'O custo por kg/unidade de cada ingrediente será copiado para a loja destino'
                      : 'Os custos serão zerados — você precisará preencher na loja destino'}
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Aviso geral */}
          <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400/90">
              Os dados selecionados na loja <strong>{STORES[targetStoreId]}</strong> serão{' '}
              <strong>substituídos</strong> pelos da loja{' '}
              <strong>{STORES[sourceStoreId]}</strong>. Esta ação não pode ser desfeita.
            </p>
          </div>

          {/* Feedback de erro */}
          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{errorMsg}</p>
            </div>
          )}

          {/* Feedback de sucesso */}
          {status === 'success' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">Transferência concluída!</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Os dados foram copiados para a loja <strong>{STORES[targetStoreId]}</strong>.
                  Preencha os preços de venda para calcular o CMV.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#2a2a2e] shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#2a2a2e] hover:bg-[#333] text-white rounded-xl text-sm font-medium transition-colors"
          >
            {status === 'success' ? 'Fechar' : 'Cancelar'}
          </button>
          {status !== 'success' && (
            <button
              onClick={handleCopy}
              disabled={noneSelected || status === 'loading'}
              className="flex-1 py-2.5 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Transferindo…
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Transferir para {STORES[targetStoreId]}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
