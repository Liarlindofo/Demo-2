'use client';

import { useState, useMemo } from 'react';
import { Download, Search, Package } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ContagemResultadoProps {
  storeId: string;
  storeName: string;
  contagens: {
    nome: string;
    quantidade: number | null;
    unidade: string;
  }[];
  sessoes: number;
  finalizadaEm: Date;
  onVoltar?: () => void;
}

// ── CSV export ─────────────────────────────────────────────────────────────────

function formatNumberBR(value: number | null): string {
  if (value === null) return '';
  return value.toString().replace('.', ',');
}

function exportCSV(
  contagens: ContagemResultadoProps['contagens'],
  storeSlug: string,
  data: Date,
) {
  const DELIM = ';';
  const header = ['Insumo', 'Quantidade', 'Unidade'].join(DELIM) + '\n';
  const rows = contagens
    .map(c => [
      `"${c.nome.replace(/"/g, '""')}"`,
      formatNumberBR(c.quantidade),
      `"${c.unidade}"`,
    ].join(DELIM))
    .join('\n');
  const blob = new Blob(['\uFEFF' + header + rows], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contagem_${storeSlug}_${data.toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-[#1c1c1e] border border-[#2a2a2e]/60 rounded-2xl p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-2xl text-white tabular-nums">{value}</span>
      {sub && <span className="text-xs text-gray-600 truncate">{sub}</span>}
    </div>
  );
}

interface TooltipPayload {
  payload?: {
    nome: string;
    quantidade: number;
    unidade: string;
  };
}

function ChartTooltip({ payload }: TooltipPayload) {
  if (!payload) return null;
  const d = payload;
  return (
    <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-white font-medium mb-0.5">{d.nome}</p>
      <p className="text-gray-400">
        {d.quantidade.toLocaleString('pt-BR')} {d.unidade}
      </p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ContagemResultado({
  storeId,
  storeName,
  contagens,
  sessoes,
  finalizadaEm,
  onVoltar,
}: ContagemResultadoProps) {
  const [search, setSearch] = useState('');

  // ── Métricas ─────────────────────────────────────────────────────────────────

  const contados = useMemo(
    () => contagens.filter(c => c.quantidade !== null),
    [contagens],
  );
  const zerados = useMemo(
    () => contagens.filter(c => c.quantidade === 0),
    [contagens],
  );
  const naoContados = useMemo(
    () => contagens.filter(c => c.quantidade === null),
    [contagens],
  );
  const maiorItem = useMemo(() => {
    return contagens
      .filter(c => c.quantidade !== null && c.quantidade! > 0)
      .reduce<{ nome: string; quantidade: number; unidade: string } | null>(
        (acc, c) =>
          acc === null || c.quantidade! > acc.quantidade
            ? { nome: c.nome, quantidade: c.quantidade!, unidade: c.unidade }
            : acc,
        null,
      );
  }, [contagens]);

  // ── Gráfico: top 15 ───────────────────────────────────────────────────────────

  const top15 = useMemo(() => {
    return contagens
      .filter(c => c.quantidade !== null && c.quantidade! > 0)
      .sort((a, b) => b.quantidade! - a.quantidade!)
      .slice(0, 15)
      .map(c => ({
        nome: c.nome,
        nomeLabel:
          c.nome.length > 18 ? c.nome.slice(0, 17) + '…' : c.nome,
        quantidade: c.quantidade!,
        unidade: c.unidade,
      }));
  }, [contagens]);

  const chartHeight = Math.max(top15.length * 44 + 80, 300);

  // ── Tabela com busca ─────────────────────────────────────────────────────────

  const tabelaOrdenada = useMemo(() => {
    return [...contagens].sort((a, b) => {
      if (a.quantidade === null && b.quantidade === null) return 0;
      if (a.quantidade === null) return 1;
      if (b.quantidade === null) return -1;
      return b.quantidade - a.quantidade;
    });
  }, [contagens]);

  const tabelaFiltrada = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tabelaOrdenada;
    return tabelaOrdenada.filter(c => c.nome.toLowerCase().includes(term));
  }, [tabelaOrdenada, search]);

  const maxQtd = useMemo(
    () =>
      contagens
        .filter(c => c.quantidade !== null && c.quantidade! > 0)
        .reduce((m, c) => Math.max(m, c.quantidade!), 0),
    [contagens],
  );

  // ── Formatação ────────────────────────────────────────────────────────────────

  const dataFormatada = format(finalizadaEm, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  const sessaoLabel = sessoes === 1 ? '1 sessão' : `${sessoes} sessões`;

  const storeSlug = storeId
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-4 pt-12 pb-5 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">
              Plateful · Contagem de estoque
            </p>
            <h1 className="text-base text-white">Resultado da contagem</h1>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {dataFormatada} · {storeName} · {sessaoLabel}
            </p>
          </div>
          <button
            onClick={() => exportCSV(contagens, storeSlug, finalizadaEm)}
            className="shrink-0 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-[#374151] rounded-xl px-3 py-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Separador visual */}
        <div className="h-px bg-[#2a2a2e]" />

        {/* Cards de métricas */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Insumos contados"
            value={contados.length}
            sub={`de ${contagens.length} total`}
          />
          <MetricCard
            label="Zerados"
            value={zerados.length}
            sub={zerados.length > 0 ? 'precisam de reposição' : 'nenhum item'}
          />
          <MetricCard
            label="Não contados"
            value={naoContados.length}
            sub={
              naoContados.length > 0
                ? 'sem registro'
                : 'todos registrados'
            }
          />
          <MetricCard
            label="Maior estoque"
            value={
              maiorItem
                ? maiorItem.quantidade.toLocaleString('pt-BR')
                : '—'
            }
            sub={
              maiorItem ? `${maiorItem.nome} (${maiorItem.unidade})` : undefined
            }
          />
        </div>

        {/* Gráfico de barras */}
        {top15.length > 0 && (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e]/60 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-4">
              Top {top15.length} insumos por quantidade
            </p>
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={top15}
                  layout="vertical"
                  margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => v.toLocaleString('pt-BR')}
                  />
                  <YAxis
                    type="category"
                    dataKey="nomeLabel"
                    width={130}
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    content={({ payload }) =>
                      payload?.[0] ? (
                        <ChartTooltip payload={payload[0].payload} />
                      ) : null
                    }
                  />
                  <Bar dataKey="quantidade" radius={[0, 6, 6, 0]} maxBarSize={24}>
                    {top15.map((_, i) => (
                      <Cell key={i} fill="#378ADD" fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-[#1c1c1e] border border-[#2a2a2e]/60 rounded-2xl overflow-hidden">
          {/* Busca */}
          <div className="px-4 py-3 border-b border-[#2a2a2e]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar insumo…"
                className="w-full bg-[#2a2a2e] text-white text-sm rounded-xl pl-8 pr-4 py-2 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#378ADD]/40"
              />
            </div>
          </div>

          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 border-b border-[#2a2a2e] text-[10px] text-gray-600 uppercase tracking-wider">
            <span>Insumo</span>
            <span className="text-right">Quantidade</span>
            <span className="w-16 text-right hidden sm:block">Gráfico</span>
          </div>

          {/* Linhas */}
          <div className="divide-y divide-[#2a2a2e]/60">
            {tabelaFiltrada.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Package className="w-8 h-8 text-gray-700" />
                <p className="text-xs text-gray-600">Nenhum resultado para "{search}"</p>
              </div>
            ) : (
              tabelaFiltrada.map((c, i) => {
                const pct =
                  c.quantidade !== null && maxQtd > 0
                    ? (c.quantidade / maxQtd) * 100
                    : 0;
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_auto_auto] gap-3 items-center px-4 py-3"
                  >
                    {/* Nome */}
                    <span className="text-sm text-gray-300 truncate">
                      {c.nome}
                    </span>

                    {/* Quantidade + badge */}
                    <div className="flex items-center gap-1.5 justify-end">
                      {c.quantidade === null ? (
                        <span className="text-xs text-gray-600 bg-[#2a2a2e] rounded-full px-2 py-0.5">
                          não contado
                        </span>
                      ) : c.quantidade === 0 ? (
                        <span className="text-xs text-red-400/80 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                          zerado
                        </span>
                      ) : (
                        <>
                          <span className="text-sm text-white tabular-nums">
                            {c.quantidade.toLocaleString('pt-BR')}
                          </span>
                          <span className="text-[10px] text-gray-600 bg-[#2a2a2e] rounded-full px-1.5 py-0.5">
                            {c.unidade}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Mini barra de progresso */}
                    <div className="w-16 hidden sm:block">
                      {c.quantidade !== null && c.quantidade > 0 ? (
                        <div className="h-1.5 bg-[#2a2a2e] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#378ADD]/70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      ) : (
                        <div className="h-1.5 bg-[#2a2a2e] rounded-full" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Botão voltar */}
        {onVoltar && (
          <button
            onClick={onVoltar}
            className="w-full py-3.5 rounded-2xl bg-[#1c1c1e] border border-[#2a2a2e] text-gray-400 hover:text-white text-sm transition-colors"
          >
            Voltar ao início
          </button>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
