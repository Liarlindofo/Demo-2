'use client';

import { useState } from 'react';
import { Layers, ChefHat, Pizza, BarChart2, FileSpreadsheet } from 'lucide-react';
import type { StoreId } from '../types';
import { STORE_IDS, STORES } from '../constants';
import { useStoreData } from '../hooks/useStoreData';
import { IngredientsTab } from './IngredientsTab';
import { ReceitasTab } from './ReceitasTab';
import { StoreTab } from './StoreTab';
import { ComparisonTab } from './ComparisonTab';
import { ImportPlanilhaModal } from './ImportPlanilhaModal';

type Section = 'ingredientes' | 'receitas' | 'produtos' | 'comparativo';

const SECTIONS: { id: Section; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    id: 'ingredientes',
    label: 'Ingredientes',
    icon: <Layers className="w-4 h-4" />,
    desc: 'Base de custos',
  },
  {
    id: 'receitas',
    label: 'Receitas',
    icon: <ChefHat className="w-4 h-4" />,
    desc: 'Preparações compostas',
  },
  {
    id: 'produtos',
    label: 'Produtos / CMV',
    icon: <Pizza className="w-4 h-4" />,
    desc: 'Ficha técnica e CMV',
  },
  {
    id: 'comparativo',
    label: 'Comparativo',
    icon: <BarChart2 className="w-4 h-4" />,
    desc: 'Entre lojas',
  },
];

export const CMVDashboard = () => {
  const [section, setSection] = useState<Section>('ingredientes');
  const [activeStore, setActiveStore] = useState<StoreId>('ahu');
  const [showImportModal, setShowImportModal] = useState(false);

  const { data, updateData } = useStoreData(activeStore);

  const showStoreTabs = section !== 'comparativo';

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">CMV — Custo da Mercadoria Vendida</h1>
            <p className="text-sm text-gray-400 mt-1">
              Configure ingredientes → receitas → produtos para calcular o CMV automaticamente
            </p>
          </div>
          {showStoreTabs && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 shrink-0 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-green-500/50 hover:bg-green-500/5 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-400" />
              Importar Planilha
            </button>
          )}
        </div>

        {/* Navegação das seções */}
        <div className="flex flex-wrap gap-2 mb-5">
          {SECTIONS.map((s, idx) => {
            const isActive = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  isActive
                    ? 'bg-white text-black border-white'
                    : 'bg-transparent text-gray-300 border-[#374151] hover:border-[#4a4a50] hover:text-white'
                }`}
              >
                {/* Número da etapa (não para comparativo) */}
                {idx < 3 && (
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold shrink-0 ${
                      isActive ? 'bg-black text-white' : 'bg-[#2a2a2e] text-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                )}
                {s.icon}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{idx < 3 ? `Etapa ${idx + 1}` : s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Seletor de loja (oculto no Comparativo) */}
        {showStoreTabs && (
          <div className="flex flex-wrap gap-2 mb-6">
            {STORE_IDS.map(storeId => (
              <button
                key={storeId}
                onClick={() => setActiveStore(storeId)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  activeStore === storeId
                    ? 'bg-[#2a2a2e] text-white border-[#4a4a50]'
                    : 'bg-transparent text-gray-500 border-[#2a2a2e] hover:border-[#374151] hover:text-gray-300'
                }`}
              >
                {STORES[storeId]}
              </button>
            ))}
          </div>
        )}

        {/* Indicador de fluxo (apenas decorativo, visível em desktop) */}
        {section !== 'comparativo' && (
          <div className="hidden lg:flex items-center gap-2 mb-6 px-1">
            {['Ingredientes', 'Receitas', 'Produtos'].map((label, idx) => {
              const sectionId = ['ingredientes', 'receitas', 'produtos'][idx] as Section;
              const isCurrent = section === sectionId;
              const isPast =
                (section === 'receitas' && idx === 0) ||
                (section === 'produtos' && idx < 2);

              return (
                <div key={label} className="flex items-center gap-2">
                  <button
                    onClick={() => setSection(sectionId)}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      isCurrent
                        ? 'text-white'
                        : isPast
                        ? 'text-gray-400 hover:text-white'
                        : 'text-gray-600 hover:text-gray-400'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCurrent
                          ? 'bg-white text-black'
                          : isPast
                          ? 'bg-green-600/30 text-green-400 border border-green-600/50'
                          : 'bg-[#2a2a2e] text-gray-600'
                      }`}
                    >
                      {isPast ? '✓' : idx + 1}
                    </span>
                    {label}
                  </button>
                  {idx < 2 && (
                    <div className={`w-8 h-px ${isPast ? 'bg-green-600/40' : 'bg-[#2a2a2e]'}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Conteúdo da seção ativa */}
        {section === 'ingredientes' && <IngredientsTab storeId={activeStore} />}
        {section === 'receitas' && <ReceitasTab storeId={activeStore} />}
        {section === 'produtos' && <StoreTab storeId={activeStore} />}
        {section === 'comparativo' && <ComparisonTab />}
      </div>

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
