'use client';

import { useState } from 'react';
import type { StoreId } from '../types';
import { STORE_IDS, STORES } from '../constants';
import { StoreTab } from './StoreTab';
import { ComparisonTab } from './ComparisonTab';

export const CMVDashboard = () => {
  const [activeTab, setActiveTab] = useState<StoreId | 'comparativo'>('ahu');

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">CMV por Produto</h1>
        </div>

        {/* Tabs das Lojas */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STORE_IDS.map(storeId => (
            <button
              key={storeId}
              onClick={() => setActiveTab(storeId)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                activeTab === storeId
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-gray-300 border-[#374151] hover:border-[#4a4a50] hover:text-white'
              }`}
            >
              {STORES[storeId]}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('comparativo')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              activeTab === 'comparativo'
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-gray-300 border-[#374151] hover:border-[#4a4a50] hover:text-white'
            }`}
          >
            Comparativo
          </button>
        </div>

        {/* Conteúdo */}
        {activeTab === 'comparativo' ? (
          <ComparisonTab />
        ) : (
          <StoreTab storeId={activeTab} />
        )}
      </div>
    </div>
  );
};
