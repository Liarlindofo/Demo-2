'use client';

import { useState } from 'react';
import { Search, Plus, Upload } from 'lucide-react';
import type { StoreId, ProductCMV, Sabor } from '../types';
import { useStoreData } from '../hooks/useStoreData';
import { calcularTodosCMV, calcularMetricasLoja } from '../utils';
import { CMV_META, CMV_COLORS } from '../constants';
import { MetricCards } from './MetricCards';
import { PizzaCard } from './PizzaCard';
import { PizzaModal } from './PizzaModal';
import { AddProductModal } from './AddProductModal';
import { ImportPlanilhaModal } from './ImportPlanilhaModal';

interface StoreTabProps {
  storeId: StoreId;
}

type FilterStatus = 'todos' | 'otimo' | 'atencao' | 'critico' | 'tradicional' | 'especial';

const FILTER_LABELS: Record<FilterStatus, string> = {
  todos: 'Todos',
  otimo: 'Ótimo',
  atencao: 'Atenção',
  critico: 'Acima da meta',
  tradicional: 'Tradicionais',
  especial: 'Especiais',
};

export const StoreTab = ({ storeId }: StoreTabProps) => {
  const { data, updateData, isLoading } = useStoreData(storeId);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('todos');
  const [selectedSabor, setSelectedSabor] = useState<Sabor | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const products = calcularTodosCMV(data);
  const metrics = calcularMetricasLoja(data);

  // Filtrar produtos
  const filtered = products.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    switch (filter) {
      case 'otimo': return p.status === 'otimo';
      case 'atencao': return p.status === 'atencao';
      case 'critico': return p.status === 'critico';
      case 'tradicional': return p.categoria === 'tradicional';
      case 'especial': return p.categoria === 'especial';
      default: return true;
    }
  });

  const handleClickCard = (product: ProductCMV) => {
    const sabor = data.sabores.find(s => s.id === product.id);
    if (sabor) setSelectedSabor(sabor);
  };

  const handleDeleteSabor = (saborId: string) => {
    updateData({
      ...data,
      sabores: data.sabores.filter(s => s.id !== saborId),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Métricas */}
      <MetricCards metrics={metrics} isLoading={isLoading} />

      {/* Controles */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#374151]"
          />
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-blue-500/50 hover:bg-blue-500/10 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap"
        >
          <Upload className="w-4 h-4" />
          Importar
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-green-500/50 hover:bg-green-500/10 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Produto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as FilterStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
              filter === f
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-gray-400 border-[#2a2a2e] hover:border-[#374151] hover:text-white'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Linha de meta */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="w-6 h-0.5 bg-red-500" />
        <span>Linha vermelha = meta de {CMV_META}% CMV</span>
      </div>

      {/* Grid de cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-3 w-3/4" />
              <div className="h-1.5 bg-white/10 rounded mb-4" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-3 bg-white/10 rounded" />
                ))}
              </div>
              <div className="h-8 bg-white/10 rounded mt-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {data.sabores.length === 0 ? (
            <>
              <div className="text-5xl mb-4">🍕</div>
              <h3 className="text-lg font-semibold text-white mb-2">Nenhum produto ainda</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-sm">
                Adicione seus sabores de pizza manualmente ou importe de uma planilha CSV
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar primeiro produto
              </button>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-base font-semibold text-white mb-1">Nenhum produto encontrado</h3>
              <p className="text-sm text-gray-400">Tente ajustar a busca ou os filtros</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(product => (
            <PizzaCard
              key={product.id}
              product={product}
              onClick={() => handleClickCard(product)}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      {selectedSabor && (
        <PizzaModal
          sabor={selectedSabor}
          data={data}
          onClose={() => setSelectedSabor(null)}
          onSave={updateData}
          onDelete={handleDeleteSabor}
        />
      )}

      {showAddModal && (
        <AddProductModal
          data={data}
          onClose={() => setShowAddModal(false)}
          onSave={newData => {
            updateData(newData);
            setShowAddModal(false);
          }}
        />
      )}

      {showImportModal && (
        <ImportPlanilhaModal
          data={data}
          onClose={() => setShowImportModal(false)}
          onSave={newData => {
            updateData(newData);
            setShowImportModal(false);
          }}
        />
      )}
    </div>
  );
};
