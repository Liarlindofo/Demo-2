'use client';

import { useState } from 'react';
import { X, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import type { FlavorGroup } from '../utils';
import type { ProductCMV, Sabor, StoreData } from '../types';
import { formatCurrency, formatPercent } from '../utils';
import { CMV_COLORS, CMV_META } from '../constants';
import { PizzaModal } from './PizzaModal';

interface FlavorGroupModalProps {
  group: FlavorGroup;
  data: StoreData;
  onClose: () => void;
  onSave: (newData: StoreData) => void;
  onDelete: (saborId: string) => void;
}

const STATUS_BADGE: Record<string, string> = {
  otimo: 'bg-green-500/15 text-green-400 border-green-500/25',
  atencao: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  critico: 'bg-red-500/15 text-red-400 border-red-500/25',
};

const STATUS_LABEL: Record<string, string> = {
  otimo: 'Ótimo',
  atencao: 'Atenção',
  critico: 'Acima da meta',
};

export const FlavorGroupModal = ({
  group,
  data,
  onClose,
  onSave,
  onDelete,
}: FlavorGroupModalProps) => {
  const [selectedSabor, setSelectedSabor] = useState<Sabor | null>(null);

  const metaBarWidth = 100 - CMV_META;

  const handleClickProduct = (product: ProductCMV) => {
    const sabor = data.sabores.find(s => s.id === product.id);
    if (sabor) setSelectedSabor(sabor);
  };

  const handleSave = (newData: StoreData) => {
    onSave(newData);
    setSelectedSabor(null);
  };

  const handleDelete = (saborId: string) => {
    onDelete(saborId);
    setSelectedSabor(null);
    // Se era o último produto do grupo, fechar o modal do grupo
    if (group.produtos.length <= 1) onClose();
  };

  // Estatísticas do grupo
  const custoTotal = group.produtos.reduce((s, p) => s + p.custo, 0);
  const melhor = group.produtos.reduce((a, b) => a.cmvPercent < b.cmvPercent ? a : b);
  const pior = group.produtos.reduce((a, b) => a.cmvPercent > b.cmvPercent ? a : b);
  const categoriaLabel = [...new Set(group.produtos.map(p => p.categoria))].join(' · ');

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2e]">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white">{group.nome}</h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate" title={categoriaLabel}>
                {categoriaLabel}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {group.produtos.length} {group.produtos.length === 1 ? 'variação' : 'variações'} · CMV médio {formatPercent(group.cmvMedio)}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Resumo do grupo */}
          <div className="grid grid-cols-3 gap-px bg-[#2a2a2e] border-b border-[#2a2a2e]">
            <div className="bg-[#141416] px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">CMV Médio</p>
              <p className="text-lg font-bold" style={{ color: CMV_COLORS[group.statusGeral] }}>
                {formatPercent(group.cmvMedio)}
              </p>
            </div>
            <div className="bg-[#141416] px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-green-400" /> Melhor
              </p>
              <p className="text-sm font-semibold text-green-400">{formatPercent(melhor.cmvPercent)}</p>
              <p className="text-xs text-gray-600 truncate">{melhor.nome.replace(group.nome, '').trim() || melhor.nome}</p>
            </div>
            <div className="bg-[#141416] px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-red-400" /> Pior
              </p>
              <p className="text-sm font-semibold text-red-400">{formatPercent(pior.cmvPercent)}</p>
              <p className="text-xs text-gray-600 truncate">{pior.nome.replace(group.nome, '').trim() || pior.nome}</p>
            </div>
          </div>

          {/* Lista de variações */}
          <div className="flex-1 overflow-y-auto">
            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-[1fr_80px_80px_80px_72px_32px] gap-3 px-5 py-2.5 border-b border-[#2a2a2e] sticky top-0 bg-[#1c1c1e] z-10">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Variação</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Custo</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Venda</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">CMV</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Status</span>
              <span />
            </div>

            {group.produtos.map((product, idx) => {
              const cmvColor = CMV_COLORS[product.status];
              const varName = product.nome.replace(group.nome, '').trim() || product.nome;
              const barWidth = Math.min(100, Math.max(0, 100 - product.cmvPercent));

              return (
                <div
                  key={product.id}
                  onClick={() => handleClickProduct(product)}
                  className={`grid grid-cols-[1fr_80px_80px_80px_72px_32px] gap-3 px-5 py-3.5 items-center cursor-pointer hover:bg-white/[0.03] transition-colors ${
                    idx % 2 !== 0 ? 'bg-[#141416]' : ''
                  }`}
                >
                  {/* Nome + barra */}
                  <div>
                    <p className="text-sm font-medium text-white">{varName}</p>
                    <div className="relative h-1 bg-[#2a2a2e] rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${barWidth}%`, backgroundColor: cmvColor }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-px bg-red-500/50"
                        style={{ left: `${metaBarWidth}%` }}
                      />
                    </div>
                  </div>

                  <span className="text-sm text-white text-right font-medium">{formatCurrency(product.custo)}</span>
                  <span className="text-sm text-gray-400 text-right">{product.precoVenda > 0 ? formatCurrency(product.precoVenda) : '—'}</span>
                  <span className="text-sm font-bold text-right" style={{ color: cmvColor }}>
                    {formatPercent(product.cmvPercent)}
                  </span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border text-center ${STATUS_BADGE[product.status]}`}>
                    {STATUS_LABEL[product.status]}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[#2a2a2e] flex items-center justify-between text-xs text-gray-500 bg-[#141416]">
            <span>Clique em uma variação para editar</span>
            <span>Meta CMV: <span className="text-red-400 font-medium">{CMV_META}%</span></span>
          </div>
        </div>
      </div>

      {/* PizzaModal abre em cima do FlavorGroupModal */}
      {selectedSabor && (
        <PizzaModal
          sabor={selectedSabor}
          data={data}
          onClose={() => setSelectedSabor(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};
