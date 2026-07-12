'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, BarChart3, CheckCircle2, Clock,
  XCircle, AlertTriangle, Loader2, RefreshCw, Search,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

// ─── Tipos ─────────────────────────────────────────────────────────────────

interface KPIs {
  total: number;
  concluidas: number;
  atrasadas: number;
  naoConcluidas: number;
  emRevisao: number;
  pctPrazo: number;
  pctAtraso: number;
  pctNaoConcluida: number;
}

interface PorLoja {
  loja: string;
  total: number;
  prazo: number;
  atraso: number;
  naoConcluida: number;
}

interface ItemRelatorio {
  id: string;
  dataAgendada: string;
  concluidaEm: string | null;
  minutosAtraso: number;
  status: string;
  emRevisaoAdm: boolean;
  template: { titulo: string };
  funcionario: { nome: string; cargo: string | null };
  loja: { nome: string };
  observacaoIA: string | null;
}

interface RelatorioData {
  kpis: KPIs;
  por_loja: PorLoja[];
  itens: ItemRelatorio[];
}

interface Loja { id: string; nome: string }
interface Funcionario { id: string; nome: string }

// ─── Helpers ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  AGENDADA: 'Agendada',
  ENVIADA: 'Enviada',
  AGUARDANDO_EVIDENCIA: 'Aguardando evidência',
  CONCLUIDA: 'Concluída',
  CONCLUIDA_COM_ATRASO: 'Concluída com atraso',
  NAO_CONCLUIDA: 'Não concluída',
};

const STATUS_COLORS: Record<string, string> = {
  AGENDADA: 'bg-blue-500/20 text-blue-300',
  ENVIADA: 'bg-purple-500/20 text-purple-300',
  AGUARDANDO_EVIDENCIA: 'bg-yellow-500/20 text-yellow-300',
  CONCLUIDA: 'bg-green-500/20 text-green-300',
  CONCLUIDA_COM_ATRASO: 'bg-orange-500/20 text-orange-300',
  NAO_CONCLUIDA: 'bg-red-500/20 text-red-300',
};

function isoData(d: Date) {
  return d.toISOString().slice(0, 10);
}

function ptDataHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function ptHorario(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function exportarCSV(itens: ItemRelatorio[]) {
  const cabecalhos = [
    'Funcionário', 'Cargo', 'Loja', 'Tarefa',
    'Horário Agendado', 'Horário Conclusão', 'Minutos Atraso',
    'Status', 'Em Revisão', 'Observação IA',
  ];
  const linhas = itens.map((item) => [
    item.funcionario.nome,
    item.funcionario.cargo ?? '',
    item.loja.nome,
    item.template.titulo,
    ptDataHora(item.dataAgendada),
    item.concluidaEm ? ptDataHora(item.concluidaEm) : '',
    String(item.minutosAtraso),
    STATUS_LABELS[item.status] ?? item.status,
    item.emRevisaoAdm ? 'Sim' : 'Não',
    item.observacaoIA ?? '',
  ]);

  const csv = [cabecalhos, ...linhas]
    .map((linha) =>
      linha.map((cel) => `"${String(cel).replace(/"/g, '""')}"`).join(','),
    )
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-tarefas-${isoData(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Página ────────────────────────────────────────────────────────────────

export default function RelatoriosTarefasPage() {
  const router = useRouter();

  const hoje = isoData(new Date());
  const seteDiasAtras = isoData(new Date(Date.now() - 7 * 24 * 3600 * 1000));

  const [inicio, setInicio] = useState(seteDiasAtras);
  const [fim, setFim] = useState(hoje);
  const [filtroLoja, setFiltroLoja] = useState('');
  const [filtroFuncionario, setFiltroFuncionario] = useState('');

  const [dados, setDados] = useState<RelatorioData | null>(null);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Carregar lojas e funcionários para os selects de filtro
  useEffect(() => {
    Promise.all([
      fetch('/api/rh/lojas').then((r) => r.json()),
      fetch('/api/rh/funcionarios').then((r) => r.json()),
    ]).then(([l, f]) => {
      setLojas(Array.isArray(l) ? l : []);
      setFuncionarios(Array.isArray(f) ? f : []);
    });
  }, []);

  const buscar = useCallback(async () => {
    if (!inicio || !fim) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ inicio, fim });
      if (filtroLoja) params.set('lojaId', filtroLoja);
      if (filtroFuncionario) params.set('funcionarioId', filtroFuncionario);

      const res = await fetch(`/api/tarefas/relatorios?${params}`);
      if (res.ok) {
        setDados(await res.json());
      } else {
        showToast('Erro ao carregar relatório.');
      }
    } finally {
      setLoading(false);
    }
  }, [inicio, fim, filtroLoja, filtroFuncionario]);

  useEffect(() => { buscar(); }, [buscar]);

  // Dados do gráfico de barras
  const chartData = (dados?.por_loja ?? []).map((l) => ({
    name: l.loja.length > 14 ? l.loja.slice(0, 14) + '…' : l.loja,
    'No prazo': l.prazo,
    'Com atraso': l.atraso,
    'Não concluída': l.naoConcluida,
  }));

  const { kpis, itens } = dados ?? { kpis: null, itens: [] };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white shadow-xl z-50">
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/tarefas')}
              className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e]"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-amber-400" /> Relatórios de Tarefas
              </h1>
              <p className="text-sm text-gray-400">Análise de desempenho e conformidade</p>
            </div>
          </div>
          {itens.length > 0 && (
            <button
              onClick={() => exportarCSV(itens)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1c1c1e] border border-[#2a2a2e] text-gray-300 text-sm font-medium rounded-xl hover:bg-[#2a2a2e] transition-colors"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Início</label>
              <input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Fim</label>
              <input
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Loja</label>
              <select
                value={filtroLoja}
                onChange={(e) => { setFiltroLoja(e.target.value); setFiltroFuncionario(''); }}
                className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Todas as lojas</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Funcionário</label>
              <select
                value={filtroFuncionario}
                onChange={(e) => setFiltroFuncionario(e.target.value)}
                className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Todos</option>
                {funcionarios
                  .filter((f) => {
                    if (!filtroLoja) return true;
                    const fi = f as unknown as { lojaId?: string };
                    return fi.lojaId === filtroLoja;
                  })
                  .map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
              </select>
            </div>
            <button
              onClick={buscar}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black text-sm font-bold rounded-xl transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Buscar
            </button>
          </div>
        </div>

        {loading && !dados && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        )}

        {kpis && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-gray-400 uppercase tracking-wider">No prazo</p>
                </div>
                <p className="text-3xl font-bold text-green-400">{kpis.pctPrazo}%</p>
                <p className="text-xs text-gray-500 mt-1">{kpis.concluidas} de {kpis.total}</p>
              </div>

              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Com atraso</p>
                </div>
                <p className="text-3xl font-bold text-orange-400">{kpis.pctAtraso}%</p>
                <p className="text-xs text-gray-500 mt-1">{kpis.atrasadas} de {kpis.total}</p>
              </div>

              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Não concluídas</p>
                </div>
                <p className="text-3xl font-bold text-red-400">{kpis.pctNaoConcluida}%</p>
                <p className="text-xs text-gray-500 mt-1">{kpis.naoConcluidas} de {kpis.total}</p>
              </div>

              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-purple-400" />
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Em revisão</p>
                </div>
                <p className="text-3xl font-bold text-purple-400">{kpis.emRevisao}</p>
                <p className="text-xs text-gray-500 mt-1">aguardando admin</p>
              </div>
            </div>

            {/* Gráfico de barras por loja */}
            {chartData.length > 0 && (
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold text-white">Conclusão por Loja</h2>
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs text-gray-500">
                      {inicio} até {fim}
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: '#1c1c1e',
                        border: '1px solid #2a2a2e',
                        borderRadius: 12,
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                    <Bar dataKey="No prazo" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Com atraso" fill="#F97316" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Não concluída" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tabela detalhada */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2e]">
                <h2 className="text-sm font-semibold text-white">
                  Detalhamento ({itens.length} registros)
                </h2>
                {itens.length > 0 && (
                  <button
                    onClick={() => exportarCSV(itens)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                )}
              </div>

              {itens.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
                  Nenhum registro no período selecionado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2a2a2e]">
                        {[
                          'Funcionário', 'Loja', 'Tarefa', 'Agendado',
                          'Concluído', 'Atraso', 'Status', 'Obs. IA',
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((item, i) => (
                        <tr
                          key={item.id}
                          className={`border-b border-[#2a2a2e] hover:bg-[#222224] transition-colors ${i % 2 === 0 ? '' : 'bg-[#141416]'}`}
                        >
                          <td className="px-4 py-3 text-white">
                            <p>{item.funcionario.nome}</p>
                            {item.funcionario.cargo && (
                              <p className="text-xs text-gray-500">{item.funcionario.cargo}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{item.loja.nome}</td>
                          <td className="px-4 py-3 text-gray-300 max-w-[160px] truncate" title={item.template.titulo}>
                            {item.template.titulo}
                          </td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                            {ptDataHora(item.dataAgendada)}
                          </td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                            {item.concluidaEm ? ptHorario(item.concluidaEm) : '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.minutosAtraso > 0 ? (
                              <span className="text-orange-400 font-medium text-xs">+{item.minutosAtraso}min</span>
                            ) : (
                              <span className="text-gray-600 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${STATUS_COLORS[item.status] ?? 'bg-gray-500/20 text-gray-300'}`}
                            >
                              {STATUS_LABELS[item.status] ?? item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px]">
                            {item.observacaoIA ?? <span className="text-gray-600">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
