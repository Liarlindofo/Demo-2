'use client';

import { useState } from 'react';
import type { ProductCMV } from '../types';
import { getStatusLabel, CMV_COLORS } from '../constants';
import { formatCurrency, formatPercent } from '../utils';

interface CMVTableProps {
  products: ProductCMV[];
}

type SortField = 'produto' | 'custo' | 'precoVenda' | 'cmvPercent' | 'margem';
type SortDirection = 'asc' | 'desc';

export const CMVTable = ({ products }: CMVTableProps) => {
  const [sortField, setSortField] = useState<SortField>('produto');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortField) {
      case 'produto':
        aValue = a.produto.toLowerCase();
        bValue = b.produto.toLowerCase();
        break;
      case 'custo':
        aValue = a.custo;
        bValue = b.custo;
        break;
      case 'precoVenda':
        aValue = a.precoVenda;
        bValue = b.precoVenda;
        break;
      case 'cmvPercent':
        aValue = a.cmvPercent;
        bValue = b.cmvPercent;
        break;
      case 'margem':
        aValue = a.margem;
        bValue = b.margem;
        break;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const getStatusBadgeColor = (status: ProductCMV['status']) => {
    switch (status) {
      case 'otimo':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'atencao':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'critico':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0f0f0f] border-b border-white/10">
            <tr>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('produto')}
              >
                Produto <SortIcon field="produto" />
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('custo')}
              >
                Custo (R$) <SortIcon field="custo" />
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('precoVenda')}
              >
                Venda (R$) <SortIcon field="precoVenda" />
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('cmvPercent')}
              >
                CMV% <SortIcon field="cmvPercent" />
              </th>
              <th
                className="px-4 py-3 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('margem')}
              >
                Margem% <SortIcon field="margem" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product, index) => (
              <tr
                key={index}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3 text-white">{product.produto}</td>
                <td className="px-4 py-3 text-gray-300">
                  {formatCurrency(product.custo)}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {formatCurrency(product.precoVenda)}
                </td>
                <td
                  className="px-4 py-3 font-semibold"
                  style={{ color: CMV_COLORS[product.status] }}
                >
                  {formatPercent(product.cmvPercent)}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {formatPercent(product.margem)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadgeColor(
                      product.status
                    )}`}
                  >
                    {getStatusLabel(product.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
