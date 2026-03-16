'use client';

import { useState } from 'react';
import type { StoreId } from '../types';
import { STORE_IDS, STORES } from '../constants';
import { StoreTab } from './StoreTab';
import { ComparisonTab } from './ComparisonTab';

export const CMVDashboard = () => {
  const [activeTab, setActiveTab] = useState<StoreId | 'comparativo'>('ahu');

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-[1920px] mx-auto">
        <h1 className="text-3xl font-bold mb-6">CMV Dashboard - Calenzano</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {STORE_IDS.map(storeId => (
            <button
              key={storeId}
              onClick={() => setActiveTab(storeId)}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === storeId
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {STORES[storeId]}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('comparativo')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'comparativo'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Comparativo
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'comparativo' ? (
            <ComparisonTab />
          ) : (
            <StoreTab storeId={activeTab} />
          )}
        </div>
      </div>
    </div>
  );
};
