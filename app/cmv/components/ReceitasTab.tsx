'use client';

import { useState } from 'react';
import { Plus, Search, ChefHat } from 'lucide-react';
import type { StoreId, Receita } from '../types';
import { useStoreData } from '../hooks/useStoreData';
import { calcularCustoPorKgReceita, formatCurrency } from '../utils';
import { ReceitaModal } from './ReceitaModal';

interface ReceitasTabProps {
  storeId: StoreId;
}

const UNIDADE_CUSTO_LABEL: Record<string, string> = { g: '/kg', ml: '/L', un: '/un' };

export const ReceitasTab = ({ storeId }: ReceitasTabProps) => {
  const { data, updateData, isLoading } = useStoreData(storeId);

  const [search, setSearch] = useState('');
  const [selectedReceita, setSelectedReceita] = useState<Receita | null | undefined>(undefined);
  // undefined = modal fechado, null = nova receita, Receita = editar

  const filtered = data.receitas.filter(r =>
    r.nome.toLowerCase().includes(search.toLowerCase()),
  );

  // Quantos produtos usam esta receita
  const contarUsos = (receitaId: string) =>
    data.sabores.filter(s =>
      s.itens?.some(it => it.tipo === 'receita' && it.referenciaId === receitaId),
    ).length;

  const handleSave = (receita: Receita) => {
    const exists = data.receitas.some(r => r.id === receita.id);
    const newReceitas = exists
      ? data.receitas.map(r => (r.id === receita.id ? receita : r))
      : [...data.receitas, receita];
    updateData({ ...data, receitas: newReceitas });
  };

  const handleDelete = (receitaId: string) => {
    updateData({ ...data, receitas: data.receitas.filter(r => r.id !== receitaId) });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 animate-pulse h-36" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Receitas</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.receitas.length} receita{data.receitas.length !== 1 ? 's' : ''} cadastrada{data.receitas.length !== 1 ? 's' : ''}
            {' · '}Preparações compostas que entram como ingrediente nos produtos
          </p>
        </div>
        <button
          onClick={() => setSelectedReceita(null)}
          className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-purple-500/50 hover:bg-purple-500/10 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Receita
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar receita…"
          className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#374151]"
        />
      </div>

      {/* Grid de receitas */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {data.receitas.length === 0 ? (
            <>
              <div className="text-4xl mb-3">🍲</div>
              <h3 className="text-base font-semibold text-white mb-1">Nenhuma receita ainda</h3>
              <p className="text-sm text-gray-400 mb-4 max-w-sm">
                Cadastre preparações compostas como massa, molho bolonhesa, frango desfiado…
                O custo é calculado automaticamente pelos ingredientes da Etapa 1.
              </p>
              <button
                onClick={() => setSelectedReceita(null)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Criar primeira receita
              </button>
            </>
          ) : (
            <>
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm text-gray-400">Nenhuma receita encontrada</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(receita => {
            const custoPorKg = calcularCustoPorKgReceita(receita, data.ingredientes);
            const usos = contarUsos(receita.id);
            const custoLabel = UNIDADE_CUSTO_LABEL[receita.unidade] ?? '/kg';

            return (
              <div
                key={receita.id}
                onClick={() => setSelectedReceita(receita)}
                className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 cursor-pointer hover:border-[#3a3a3e] hover:bg-[#202024] transition-all duration-200 select-none"
              >
                {/* Header do card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                      <ChefHat className="w-4 h-4 text-purple-400" />
                    </div>
                    <h3 className="font-semibold text-white text-sm leading-tight">{receita.nome}</h3>
                  </div>
                  {usos > 0 && (
                    <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5 whitespace-nowrap shrink-0">
                      {usos} produto{usos > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Custo */}
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-0.5">Custo calculado</p>
                  <p className="text-xl font-bold text-purple-400">
                    {custoPorKg > 0 ? `${formatCurrency(custoPorKg)}${custoLabel}` : '—'}
                  </p>
                </div>

                {/* Detalhes */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {receita.itens.length} ingrediente{receita.itens.length !== 1 ? 's' : ''}
                  </span>
                  <span>
                    Rendimento: {receita.rendimento}{receita.unidade}
                  </span>
                </div>

                {/* Lista resumida de ingredientes */}
                <div className="mt-3 pt-3 border-t border-[#2a2a2e]">
                  <div className="flex flex-wrap gap-1">
                    {receita.itens.slice(0, 4).map(item => {
                      const ing = data.ingredientes.find(i => i.id === item.ingredienteId);
                      return ing ? (
                        <span key={item.ingredienteId} className="text-xs text-gray-500 bg-[#2a2a2e] rounded-md px-1.5 py-0.5">
                          {ing.nome}
                        </span>
                      ) : null;
                    })}
                    {receita.itens.length > 4 && (
                      <span className="text-xs text-gray-600">+{receita.itens.length - 4}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de receita */}
      {selectedReceita !== undefined && (
        <ReceitaModal
          receita={selectedReceita}
          ingredientes={data.ingredientes}
          onClose={() => setSelectedReceita(undefined)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
