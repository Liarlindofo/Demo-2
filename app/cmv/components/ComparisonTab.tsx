'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from 'recharts';
import { useStoreData } from '../hooks/useStoreData';
import { calcularTodosCMV, calcularMetricasLoja, formatPercent } from '../utils';
import { STORE_IDS, STORES, STORE_COLORS, CMV_COLORS, CMV_THRESHOLDS, CMV_META, getBarColor } from '../constants';

export const ComparisonTab = () => {
  const ahuData = useStoreData('ahu');
  const pilarzinhoData = useStoreData('pilarzinho');
  const portaoData = useStoreData('portao');
  const uberabaData = useStoreData('uberaba');

  const stores = [
    { id: 'ahu' as const, name: STORES.ahu, color: STORE_COLORS.ahu, data: ahuData.data },
    { id: 'pilarzinho' as const, name: STORES.pilarzinho, color: STORE_COLORS.pilarzinho, data: pilarzinhoData.data },
    { id: 'portao' as const, name: STORES.portao, color: STORE_COLORS.portao, data: portaoData.data },
    { id: 'uberaba' as const, name: STORES.uberaba, color: STORE_COLORS.uberaba, data: uberabaData.data },
  ];

  const storesMetrics = stores.map(store => ({
    ...store,
    metrics: calcularMetricasLoja(store.data),
  }));

  const storesProducts = stores.map(store => ({
    ...store,
    products: calcularTodosCMV(store.data),
  }));

  // Gráfico 1: CMV médio por loja
  const averageCMVData = storesMetrics.map(store => ({
    loja: store.name,
    cmv: parseFloat(store.metrics.cmvMedio.toFixed(1)),
    status:
      store.metrics.cmvMedio < CMV_THRESHOLDS.otimo ? 'otimo' :
      store.metrics.cmvMedio < CMV_THRESHOLDS.atencao ? 'atencao' : 'critico',
  }));

  // Gráfico 2: CMV por produto comparado
  const productMap = new Map<string, Array<{ loja: string; cmv: number; color: string }>>();
  storesProducts.forEach(store => {
    store.products.forEach(product => {
      const key = product.nome.toLowerCase();
      if (!productMap.has(key)) productMap.set(key, []);
      productMap.get(key)!.push({ loja: store.name, cmv: product.cmvPercent, color: store.color });
    });
  });

  const productComparisonData: Array<{ produto: string; [key: string]: string | number }> = [];
  productMap.forEach((values, _key) => {
    const nomeProduto = storesProducts
      .flatMap(s => s.products)
      .find(p => p.nome.toLowerCase() === _key)?.nome || _key;

    const entry: { produto: string; [key: string]: string | number } = { produto: nomeProduto };
    values.forEach(({ loja, cmv }) => { entry[loja] = parseFloat(cmv.toFixed(1)); });
    productComparisonData.push(entry);
  });

  // Cards de resumo
  const lojaComDados = storesMetrics.filter(s => s.metrics.totalProdutos > 0);

  const melhorLoja = lojaComDados.length > 0
    ? lojaComDados.reduce((best, cur) => cur.metrics.cmvMedio < best.metrics.cmvMedio ? cur : best)
    : null;

  const piorLoja = lojaComDados.length > 0
    ? lojaComDados.reduce((worst, cur) => cur.metrics.cmvMedio > worst.metrics.cmvMedio ? cur : worst)
    : null;

  const produtoMaisCaro = productComparisonData.length > 0
    ? productComparisonData
        .map(entry => {
          const cmvs = STORE_IDS.map(id => entry[STORES[id]] as number).filter(v => v !== undefined && !isNaN(v));
          const media = cmvs.length > 0 ? cmvs.reduce((s, v) => s + v, 0) / cmvs.length : 0;
          return { produto: entry['produto'] as string, media };
        })
        .reduce((worst, cur) => cur.media > worst.media ? cur : worst, { produto: '-', media: 0 })
    : null;

  const produtoMaisEficiente = productComparisonData.length > 0
    ? productComparisonData
        .map(entry => {
          const cmvs = STORE_IDS.map(id => entry[STORES[id]] as number).filter(v => v !== undefined && !isNaN(v));
          const media = cmvs.length > 0 ? cmvs.reduce((s, v) => s + v, 0) / cmvs.length : 100;
          return { produto: entry['produto'] as string, media };
        })
        .reduce((best, cur) => cur.media < best.media ? cur : best, { produto: '-', media: 100 })
    : null;

  const hasData = lojaComDados.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-white mb-2">Nenhum dado para comparar</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          Adicione produtos em pelo menos uma loja para ver o comparativo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico 1: CMV Médio por Loja */}
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
        <h3 className="text-base font-semibold text-white mb-4">CMV Médio por Loja</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={averageCMVData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="loja" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis
              domain={[0, 60]}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              label={{ value: 'CMV%', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'CMV']}
              contentStyle={{ backgroundColor: '#1c1c1e', border: '1px solid #2a2a2e', borderRadius: '12px' }}
              labelStyle={{ color: '#fff' }}
            />
            <ReferenceLine
              y={CMV_META}
              stroke={CMV_COLORS.critico}
              strokeDasharray="5 5"
              label={{ value: `${CMV_META}%`, position: 'right', fill: CMV_COLORS.critico, fontSize: 11 }}
            />
            <Bar dataKey="cmv" radius={[6, 6, 0, 0]}>
              {averageCMVData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico 2: CMV por Produto Comparado */}
      {productComparisonData.length > 0 && (
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">CMV por Produto – Comparativo entre Lojas</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={productComparisonData.slice(0, 20)}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis
                dataKey="produto"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: '#6b7280', fontSize: 10 }}
              />
              <YAxis
                domain={[0, 60]}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                label={{ value: 'CMV%', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                contentStyle={{ backgroundColor: '#1c1c1e', border: '1px solid #2a2a2e', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
              />
              <ReferenceLine
                y={CMV_META}
                stroke={CMV_COLORS.critico}
                strokeDasharray="5 5"
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
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
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Melhor CMV Médio</p>
          <p className="text-base font-semibold text-white">{melhorLoja?.name || '—'}</p>
          <p className="text-sm text-green-400">{melhorLoja ? formatPercent(melhorLoja.metrics.cmvMedio) : '—'}</p>
        </div>
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Pior CMV Médio</p>
          <p className="text-base font-semibold text-white">{piorLoja?.name || '—'}</p>
          <p className="text-sm text-red-400">{piorLoja ? formatPercent(piorLoja.metrics.cmvMedio) : '—'}</p>
        </div>
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Produto Mais Caro</p>
          <p className="text-base font-semibold text-white truncate">{produtoMaisCaro?.produto || '—'}</p>
          <p className="text-sm text-red-400">{produtoMaisCaro ? formatPercent(produtoMaisCaro.media) : '—'}</p>
        </div>
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-1">Produto Mais Eficiente</p>
          <p className="text-base font-semibold text-white truncate">{produtoMaisEficiente?.produto || '—'}</p>
          <p className="text-sm text-green-400">{produtoMaisEficiente ? formatPercent(produtoMaisEficiente.media) : '—'}</p>
        </div>
      </div>
    </div>
  );
};
