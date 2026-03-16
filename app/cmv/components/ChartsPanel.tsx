'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import type { ProductCMV } from '../types';
import { CMV_COLORS, CMV_THRESHOLDS } from '../constants';
import { formatCurrency, formatPercent } from '../utils';

interface ChartsPanelProps {
  products: ProductCMV[];
}

export const ChartsPanel = ({ products }: ChartsPanelProps) => {
  const chartData = products.map(product => ({
    produto: product.produto,
    cmv: product.cmvPercent,
    custo: product.custo,
    precoVenda: product.precoVenda,
    margem: product.margem,
    status: product.status,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1a1a1a] border border-white/20 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-white mb-2">{data.produto}</p>
          <p className="text-sm text-gray-300">
            <span className="text-gray-400">Custo:</span> {formatCurrency(data.custo)}
          </p>
          <p className="text-sm text-gray-300">
            <span className="text-gray-400">Venda:</span> {formatCurrency(data.precoVenda)}
          </p>
          <p className="text-sm font-semibold" style={{ color: CMV_COLORS[data.status as keyof typeof CMV_COLORS] }}>
            <span className="text-gray-400">CMV:</span> {formatPercent(data.cmv)}
          </p>
          <p className="text-sm text-gray-300">
            <span className="text-gray-400">Margem:</span> {formatPercent(data.margem)}
          </p>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (status: string) => {
    switch (status) {
      case 'otimo':
        return CMV_COLORS.otimo;
      case 'atencao':
        return CMV_COLORS.atencao;
      case 'critico':
        return CMV_COLORS.critico;
      default:
        return CMV_COLORS.otimo;
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">CMV por Produto</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="produto"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
          />
          <YAxis
            domain={[0, 60]}
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            label={{ value: 'CMV%', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={CMV_THRESHOLDS.otimo}
            stroke={CMV_COLORS.atencao}
            strokeDasharray="5 5"
            label={{ value: '35%', position: 'right', fill: CMV_COLORS.atencao }}
          />
          <ReferenceLine
            y={CMV_THRESHOLDS.critico}
            stroke={CMV_COLORS.critico}
            strokeDasharray="5 5"
            label={{ value: '37%', position: 'right', fill: CMV_COLORS.critico }}
          />
          <Bar dataKey="cmv" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
