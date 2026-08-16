'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, BarChart3, CheckCircle2, Clock,
  XCircle, AlertTriangle, Loader2, RefreshCw, Search,
  Camera, MessageSquare, MapPin, FileText, Eye, X, BrainCircuit,
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

interface AnaliseIA {
  objeto_identificado?: string;
  corresponde_ao_esperado?: boolean;
  valor_lido?: string;
  legivel?: boolean;
  confianca?: number;
  observacao?: string;
  divergencia?: boolean;
}

interface EvidenciaDetalhe {
  id: string;
  tipo: 'FOTO' | 'CONFIRMACAO_TEXTO' | 'LOCALIZACAO' | 'ARQUIVO' | string;
  conteudoTexto: string | null;
  urlArquivo: string | null;
  latitude: number | null;
  longitude: number | null;
  analiseIA: AnaliseIA | null;
  recebidaEm: string;
}

interface DetalheTarefa {
  id: string;
  dataAgendada: string;
  concluidaEm: string | null;
  minutosAtraso: number;
  status: string;
  emRevisaoAdm: boolean;
  template: { titulo: string; descricao: string | null };
  funcionario: { nome: string; cargo: { nome: string } | null };
  loja: { nome: string };
  evidencias: EvidenciaDetalhe[];
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

/** Retorna "YYYY-MM-DD" no fuso America/Sao_Paulo (evita virar o dia às 21h BRT). */
function isoData(d: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
}

function ptDataHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function ptHorario(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
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

function AnaliseIABlock({ ia }: { ia: AnaliseIA }) {
  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-1.5">
      <div className="flex items-center gap-1.5 text-violet-300 text-xs font-semibold uppercase tracking-wider">
        <BrainCircuit className="w-3.5 h-3.5" /> Análise da IA
      </div>
      {ia.objeto_identificado && (
        <p className="text-sm text-gray-300">Objeto: {ia.objeto_identificado}</p>
      )}
      {ia.valor_lido && <p className="text-sm text-gray-300">Valor lido: {ia.valor_lido}</p>}
      {ia.observacao && <p className="text-sm text-gray-400">{ia.observacao}</p>}
      {ia.divergencia && (
        <p className="text-xs text-orange-400">Divergência detectada entre texto e imagem.</p>
      )}
    </div>
  );
}

function EvidenciaBlock({ ev }: { ev: EvidenciaDetalhe }) {
  const [expandida, setExpandida] = useState(false);

  if (ev.tipo === 'FOTO') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider">
          <Camera className="w-4 h-4" /> Foto
        </div>
        {ev.urlArquivo ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ev.urlArquivo}
              alt="Evidência"
              className={`rounded-xl border border-[#2a2a2e] object-cover cursor-pointer ${expandida ? 'max-h-[480px] w-full object-contain' : 'max-h-48 w-full'}`}
              onClick={() => setExpandida((v) => !v)}
            />
            <a
              href={ev.urlArquivo}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 bg-black/60 rounded-lg p-1.5 hover:bg-black/80"
              title="Abrir"
            >
              <Eye className="w-3.5 h-3.5 text-white" />
            </a>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">Foto indisponível.</p>
        )}
        {ev.analiseIA && <AnaliseIABlock ia={ev.analiseIA} />}
      </div>
    );
  }

  if (ev.tipo === 'CONFIRMACAO_TEXTO') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-green-300 text-xs font-semibold uppercase tracking-wider">
          <MessageSquare className="w-4 h-4" /> Texto
        </div>
        <div className="bg-[#0a0a0a] rounded-xl p-3 border border-[#2a2a2e]">
          <p className="text-sm text-gray-200 whitespace-pre-wrap">
            {ev.conteudoTexto ?? '—'}
          </p>
        </div>
      </div>
    );
  }

  if (ev.tipo === 'LOCALIZACAO') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-yellow-300 text-xs font-semibold uppercase tracking-wider">
          <MapPin className="w-4 h-4" /> Localização
        </div>
        {ev.latitude != null && ev.longitude != null ? (
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-gray-300">
              {ev.latitude.toFixed(6)}, {ev.longitude.toFixed(6)}
            </p>
            <a
              href={`https://maps.google.com/?q=${ev.latitude},${ev.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Ver no mapa
            </a>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">Coordenadas indisponíveis.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-wider">
        <FileText className="w-4 h-4" /> {ev.tipo}
      </div>
      {ev.urlArquivo ? (
        <a
          href={ev.urlArquivo}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-400 underline"
        >
          Abrir arquivo
        </a>
      ) : (
        <p className="text-xs text-gray-500">{ev.conteudoTexto ?? '—'}</p>
      )}
    </div>
  );
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
  const [detalhe, setDetalhe] = useState<DetalheTarefa | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

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

  async function abrirDetalhe(id: string) {
    setLoadingDetalhe(true);
    setDetalhe(null);
    try {
      const res = await fetch(`/api/tarefas/atribuicoes/${id}`);
      if (!res.ok) {
        showToast('Não foi possível carregar o detalhe da tarefa.');
        return;
      }
      setDetalhe(await res.json());
    } catch {
      showToast('Falha de rede ao carregar o detalhe.');
    } finally {
      setLoadingDetalhe(false);
    }
  }

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
                          onClick={() => abrirDetalhe(item.id)}
                          className={`border-b border-[#2a2a2e] hover:bg-[#222224] transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-[#141416]'}`}
                          title="Clique para ver evidências e resultado"
                        >
                          <td className="px-4 py-3 text-white">
                            <p>{item.funcionario.nome}</p>
                            {item.funcionario.cargo && (
                              <p className="text-xs text-gray-500">{item.funcionario.cargo}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{item.loja.nome}</td>
                          <td className="px-4 py-3 text-amber-300/90 max-w-[160px] truncate underline-offset-2 hover:underline" title={item.template.titulo}>
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

      {/* Modal detalhe */}
      {(loadingDetalhe || detalhe) && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg mt-10 mb-10 bg-[#111113] border border-[#2a2a2e] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2e]">
              <h3 className="text-sm font-semibold text-white">Resultado da tarefa</h3>
              <button
                type="button"
                onClick={() => { setDetalhe(null); setLoadingDetalhe(false); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#1c1c1e]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDetalhe && !detalhe ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
              </div>
            ) : detalhe ? (
              <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
                <div>
                  <p className="text-base font-semibold text-white">{detalhe.template.titulo}</p>
                  {detalhe.template.descricao && (
                    <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">
                      {detalhe.template.descricao}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Funcionário</p>
                    <p className="text-white">{detalhe.funcionario.nome}</p>
                    {detalhe.funcionario.cargo?.nome && (
                      <p className="text-xs text-gray-500">{detalhe.funcionario.cargo.nome}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Loja</p>
                    <p className="text-white">{detalhe.loja.nome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Agendado</p>
                    <p className="text-gray-300">{ptDataHora(detalhe.dataAgendada)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Concluído</p>
                    <p className="text-gray-300">
                      {detalhe.concluidaEm ? ptDataHora(detalhe.concluidaEm) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Status</p>
                    <span
                      className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[detalhe.status] ?? 'bg-gray-500/20 text-gray-300'}`}
                    >
                      {STATUS_LABELS[detalhe.status] ?? detalhe.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Atraso</p>
                    <p className="text-gray-300">
                      {detalhe.minutosAtraso > 0 ? `+${detalhe.minutosAtraso} min` : '—'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#2a2a2e] pt-4 space-y-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Evidências ({detalhe.evidencias.length})
                  </p>
                  {detalhe.evidencias.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma evidência registrada ainda.</p>
                  ) : (
                    detalhe.evidencias.map((ev) => (
                      <div key={ev.id} className="rounded-xl border border-[#2a2a2e] bg-[#0a0a0a] p-3">
                        <EvidenciaBlock ev={ev} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
