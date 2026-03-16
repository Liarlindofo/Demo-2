'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { useStoreState } from '../hooks/useStoreState';
import { calculateAllProductsCMV, calculateStoreMetrics } from '../utils';
import { STORE_IDS, STORES, STORE_COLORS, CMV_COLORS, CMV_THRESHOLDS } from '../constants';
import { formatPercent } from '../utils';

export const ComparisonTab = () => {
  const ahuState = useStoreState('ahu');
  const pilarzinhoState = useStoreState('pilarzinho');
  const portaoState = useStoreState('portao');
  const uberabaState = useStoreState('uberaba');

  const stores = [
    { id: 'ahu' as const, name: STORES.ahu, color: STORE_COLORS.ahu, state: ahuState.state },
    { id: 'pilarzinho' as const, name: STORES.pilarzinho, color: STORE_COLORS.pilarzinho, state: pilarzinhoState.state },
    { id: 'portao' as const, name: STORES.portao, color: STORE_COLORS.portao, state: portaoState.state },
    { id: 'uberaba' as const, name: STORES.uberaba, color: STORE_COLORS.uberaba, state: uberabaState.state },
  ];

  // Calcular métricas de cada loja
  const storesMetrics = stores.map(store => ({
    ...store,
    metrics: calculateStoreMetrics(store.state),
  }));

  // Calcular produtos de cada loja
  const storesProducts = stores.map(store => ({
    ...store,
    products: calculateAllProductsCMV(store.state),
  }));

  // Gráfico 1: CMV médio por loja
  const averageCMVData = storesMetrics.map(store => ({
    loja: store.name,
    cmv: store.metrics.cmvMedio,
    status: store.metrics.cmvMedio < CMV_THRESHOLDS.otimo ? 'otimo' :
            store.metrics.cmvMedio < CMV_THRESHOLDS.critico ? 'atencao' : 'critico',
  }));

  // Gráfico 2: CMV por produto comparado entre lojas
  // Agrupar produtos pelo nome (case-insensitive)
  const productMap = new Map<string, Array<{ loja: string; cmv: number; color: string }>>();

  storesProducts.forEach(store => {
    store.products.forEach(product => {
      const key = product.produto.toLowerCase();
      if (!productMap.has(key)) {
        productMap.set(key, []);
      }
      productMap.get(key)!.push({
        loja: store.name,
        cmv: product.cmvPercent,
        color: store.color,
      });
    });
  });

  // Converter para formato do gráfico
  const productComparisonData: Array<{
    produto: string;
    [key: string]: string | number;
  }> = [];

  productMap.forEach((values, produto) => {
    const entry: any = { produto };
    values.forEach(({ loja, cmv }) => {
      entry[loja] = cmv;
    });
    productComparisonData.push(entry);
  });

  // Cards de resumo
  const melhorLoja = storesMetrics.reduce((best, current) =>
    current.metrics.cmvMedio < best.metrics.cmvMedio ? current : best
  );

  const piorLoja = storesMetrics.reduce((worst, current) =>
    current.metrics.cmvMedio > worst.metrics.cmvMedio ? current : worst
  );

  // Produto mais caro (maior CMV% médio)
  const produtoMaisCaro = productComparisonData
    .map(entry => {
      const cmvs = STORE_IDS.map(id => entry[STORES[id]] as number).filter(v => v !== undefined);
      const media = cmvs.reduce((sum, v) => sum + v, 0) / cmvs.length;
      return { produto: entry.produto, media };
    })
    .reduce((worst, current) => (current.media > worst.media ? current : worst), {
      produto: '-',
      media: 0,
    });

  // Produto mais eficiente (menor CMV% médio)
  const produtoMaisEficiente = productComparisonData
    .map(entry => {
      const cmvs = STORE_IDS.map(id => entry[STORES[id]] as number).filter(v => v !== undefined);
      const media = cmvs.reduce((sum, v) => sum + v, 0) / cmvs.length;
      return { produto: entry.produto, media };
    })
    .reduce((best, current) => (current.media < best.media ? current : best), {
      produto: '-',
      media: 100,
    });

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
    <div className="space-y-6">
      {/* Gráfico 1: CMV Médio por Loja */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">CMV Médio por Loja</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={averageCMVData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="loja" tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis
              domain={[0, 60]}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              label={{ value: 'CMV%', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <Tooltip
              formatter={(value: number) => formatPercent(value)}
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
            />
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
            <Bar
              dataKey="cmv"
              fill={(entry: any) => getBarColor(entry.status)}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico 2: CMV por Produto Comparado */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">CMV por Produto - Comparativo</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={productComparisonData.slice(0, 20)} // Limitar a 20 produtos para legibilidade
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis
              dataKey="produto"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
            />
            <YAxis
              domain={[0, 60]}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              label={{ value: 'CMV%', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <Tooltip
              formatter={(value: number) => formatPercent(value)}
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <Legend />
            {STORE_IDS.map(id => (
              <Bar
                key={id}
                dataKey={STORES[id]}
                fill={STORE_COLORS[id]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Melhor CMV Médio</p>
          <p className="text-lg font-semibold text-white">{melhorLoja.name}</p>
          <p className="text-sm text-green-500">
            {formatPercent(melhorLoja.metrics.cmvMedio)}
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Pior CMV Médio</p>
          <p className="text-lg font-semibold text-white">{piorLoja.name}</p>
          <p className="text-sm text-red-500">
            {formatPercent(piorLoja.metrics.cmvMedio)}
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Produto Mais Caro</p>
          <p className="text-lg font-semibold text-white truncate">{produtoMaisCaro.produto}</p>
          <p className="text-sm text-red-500">
            {formatPercent(produtoMaisCaro.media)}
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-1">Produto Mais Eficiente</p>
          <p className="text-lg font-semibold text-white truncate">{produtoMaisEficiente.produto}</p>
          <p className="text-sm text-green-500">
            {formatPercent(produtoMaisEficiente.media)}
          </p>
        </div>
      </div>
    </div>
  );
};
