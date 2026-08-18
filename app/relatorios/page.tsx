'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileBarChart2,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  MessageSquareWarning,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  MessagesSquare,
} from 'lucide-react';
import ToolProtection from '@/components/auth/ToolProtection';
import { SystemTool } from '@/types/admin';

// ── Types ──────────────────────────────────────────────────────────────────

type EscopoLoja = 'POR_LOJA' | 'CONSOLIDADO' | 'AMBOS';
type Fonte = 'SAIPOS_DASHBOARD';
type TabId = 'agendados' | 'reclamacoes';

interface CatalogField {
  key: string;
  label: string;
  grupo: string;
  ordem: number;
}

interface UltimaExecucao {
  id: string;
  status: 'SUCESSO' | 'FALHA';
  executadoEm: string;
  erro: string | null;
}

interface ReportRow {
  id: string;
  nome: string;
  fonte: Fonte;
  horario: string;
  escopoLoja: EscopoLoja;
  destinoWhatsapp: string;
  sessionSlot: number | null;
  ativo: boolean;
  campos: { campoKey: string; ordem: number }[];
  ultimaExecucao: UltimaExecucao | null;
}

interface ComplaintRunRow {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalConversas: number | null;
  conversasProcessadas?: number | null;
  totalReclamacoes: number | null;
  ataStoragePath: string | null;
  executadoEm: string;
  erro: string | null;
  confirmadasCount?: number;
}

interface ComplaintEvidence {
  id: string;
  messageType: string;
  snippet: string;
  hasMedia?: boolean;
  timestamp: string;
}

interface ComplaintReviewItem {
  id: string;
  contactId: string;
  contactName: string | null;
  contactPhone: string;
  clientLabel: string;
  numeroPedido: string | null;
  resumo: string;
  dataOcorrencia: string;
  confirmadoPorHumano: boolean;
  evidencias: ComplaintEvidence[];
}

interface ComplaintConversationMessage {
  id: string;
  direction: string;
  speaker: 'CLIENTE' | 'ATENDENTE' | 'IA';
  messageType: string;
  snippet: string;
  hasMedia?: boolean;
  timestamp: string;
}

interface ComplaintConversation {
  contactId: string;
  contactPhone: string;
  contactName: string | null;
  clientLabel: string;
  truncated: boolean;
  messages: ComplaintConversationMessage[];
}

interface ComplaintReviewData {
  id: string;
  periodStart: string;
  status: string;
  totalReclamacoes: number | null;
  confirmadasCount: number;
  hasAta: boolean;
  complaints: ComplaintReviewItem[];
}

interface ReportForm {
  nome: string;
  fonte: Fonte;
  horario: string;
  escopoLoja: EscopoLoja;
  destinoWhatsapp: string;
  sessionSlot: number | null;
  ativo: boolean;
  /** Ordem de seleção preservada */
  campos: string[];
}

interface WhatsSessionOpt {
  slot: number;
  label: string;
  isConnected: boolean;
  connectedNumber: string | null;
}

const EMPTY_FORM: ReportForm = {
  nome: '',
  fonte: 'SAIPOS_DASHBOARD',
  horario: '23:30',
  escopoLoja: 'AMBOS',
  destinoWhatsapp: '',
  sessionSlot: null,
  ativo: true,
  campos: [],
};

const ESCOPO_LABELS: Record<EscopoLoja, string> = {
  POR_LOJA: 'Por loja',
  CONSOLIDADO: 'Consolidado',
  AMBOS: 'Ambos',
};

const GRUPO_LABELS: Record<string, string> = {
  geral: 'Geral',
  cupons: 'Cupons',
  ticket_medio: 'Ticket médio',
  canal: 'Canais',
};

const GRUPO_ORDER = ['geral', 'cupons', 'ticket_medio', 'canal'];

const inputCls =
  'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-colors';

const labelCls = 'text-xs font-medium text-gray-400 mb-1.5 block';

const sectionCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3';

// ── Helpers ────────────────────────────────────────────────────────────────

function ptDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function periodLabel(isoStart: string): string {
  const d = new Date(isoStart);
  const month = d.toLocaleString('pt-BR', { month: 'long', timeZone: 'America/Sao_Paulo' });
  const year = d.toLocaleString('pt-BR', { year: 'numeric', timeZone: 'America/Sao_Paulo' });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)}/${year}`;
}

function statusBadge(status: string) {
  if (status === 'CONCLUIDO') return 'text-green-400 bg-green-500/10 border-green-500/20';
  if (status === 'ERRO') return 'text-red-400 bg-red-500/10 border-red-500/20';
  return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#111113] border border-[#2a2a2e] rounded-2xl w-full max-w-2xl shadow-2xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2e]">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#2a2a2e] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConversationMedia({
  messageId,
  messageType,
}: {
  messageId: string;
  messageType: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/whatsapp-messages/${messageId}/media`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          if (!cancelled) setFailed(true);
          return;
        }
        if (!cancelled) setUrl(data.url as string);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [messageId]);

  if (failed) {
    return <p className="text-xs text-gray-500 mt-1">Foto indisponível</p>;
  }
  if (!url) {
    return <Loader2 className="w-4 h-4 text-gray-500 animate-spin mt-2" />;
  }
  return (
    <img
      src={url}
      alt="Foto da conversa"
      className="mt-2 max-h-72 w-auto max-w-full rounded-lg border border-[#2a2a2e]"
    />
  );
}

// ── Página ─────────────────────────────────────────────────────────────────

function RelatoriosContent() {
  const router = useRouter();

  const [tab, setTab] = useState<TabId>('agendados');
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [complaintRuns, setComplaintRuns] = useState<ComplaintRunRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogField[]>([]);
  const [sessions, setSessions] = useState<WhatsSessionOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [reviewRunId, setReviewRunId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<ComplaintReviewData | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [togglingComplaintId, setTogglingComplaintId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ComplaintConversation | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ReportRow | null>(null);
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM);

  const catalogByGrupo = useMemo(() => {
    const map = new Map<string, CatalogField[]>();
    for (const c of catalog) {
      const list = map.get(c.grupo) ?? [];
      list.push(c);
      map.set(c.grupo, list);
    }
    const ordered = GRUPO_ORDER.filter((g) => map.has(g));
    for (const g of map.keys()) {
      if (!ordered.includes(g)) ordered.push(g);
    }
    return ordered.map((grupo) => ({
      grupo,
      label: GRUPO_LABELS[grupo] ?? grupo,
      campos: (map.get(grupo) ?? []).sort((a, b) => a.ordem - b.ordem),
    }));
  }, [catalog]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [resReports, resCatalog, resSessions] = await Promise.all([
        fetch('/api/admin/reports'),
        fetch('/api/admin/reports/catalog'),
        fetch('/api/whatsapp-sessions'),
      ]);
      if (resReports.ok) {
        const data = await resReports.json();
        setReports(Array.isArray(data) ? data : []);
      }
      if (resCatalog.ok) {
        const data = await resCatalog.json();
        setCatalog(Array.isArray(data) ? data : []);
      }
      if (resSessions.ok) {
        const data = await resSessions.json();
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fetchComplaintRuns = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoadingComplaints(true);
    try {
      const res = await fetch('/api/reports/complaints');
      if (res.ok) {
        const data = await res.json();
        setComplaintRuns(Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    } finally {
      if (!opts?.silent) setLoadingComplaints(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'reclamacoes') fetchComplaintRuns();
  }, [tab, fetchComplaintRuns]);

  useEffect(() => {
    if (tab !== 'reclamacoes') return;
    const processing = complaintRuns.some((r) => r.status === 'PROCESSANDO');
    if (!processing) return;
    const id = window.setInterval(() => fetchComplaintRuns({ silent: true }), 2500);
    return () => window.clearInterval(id);
  }, [tab, complaintRuns, fetchComplaintRuns]);

  async function handleDownloadAta(runId: string) {
    setDownloadingId(runId);
    try {
      const res = await fetch(`/api/reports/complaints/${runId}/document`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        alert(data.error || 'Não foi possível baixar a ata.');
        return;
      }
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch {
      alert('Falha de rede ao baixar a ata.');
    } finally {
      setDownloadingId(null);
    }
  }

  async function openReview(runId: string) {
    if (reviewRunId === runId) {
      setReviewRunId(null);
      setReviewData(null);
      return;
    }

    setReviewRunId(runId);
    setLoadingReview(true);
    setReviewData(null);
    try {
      const res = await fetch(`/api/reports/complaints/${runId}/review`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Não foi possível carregar a revisão.');
        setReviewRunId(null);
        return;
      }
      setReviewData(data as ComplaintReviewData);
    } catch {
      alert('Falha de rede ao carregar revisão.');
      setReviewRunId(null);
    } finally {
      setLoadingReview(false);
    }
  }

  async function toggleComplaintConfirm(complaintId: string, next: boolean) {
    if (!reviewData) return;
    setTogglingComplaintId(complaintId);
    try {
      const res = await fetch(`/api/reports/complaints/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmadoPorHumano: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Não foi possível salvar.');
        return;
      }

      setReviewData((prev) => {
        if (!prev) return prev;
        const complaints = prev.complaints.map((c) =>
          c.id === complaintId ? { ...c, confirmadoPorHumano: next } : c,
        );
        const confirmadasCount = complaints.filter((c) => c.confirmadoPorHumano).length;
        setComplaintRuns((runs) =>
          runs.map((r) =>
            r.id === prev.id ? { ...r, confirmadasCount } : r,
          ),
        );
        return { ...prev, complaints, confirmadasCount };
      });
    } catch {
      alert('Falha de rede ao salvar.');
    } finally {
      setTogglingComplaintId(null);
    }
  }

  async function handleGenerateAta(runId: string) {
    setGeneratingId(runId);
    try {
      const res = await fetch(`/api/reports/complaints/${runId}/document`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Não foi possível gerar a ata.');
        return;
      }
      setComplaintRuns((runs) =>
        runs.map((r) =>
          r.id === runId ? { ...r, ataStoragePath: data.ataStoragePath ?? 'generated' } : r,
        ),
      );
      if (reviewData?.id === runId) {
        setReviewData((prev) => (prev ? { ...prev, hasAta: true } : prev));
      }
      alert('Ata gerada com sucesso. Use "Baixar ata" para obter o arquivo.');
    } catch {
      alert('Falha de rede ao gerar a ata.');
    } finally {
      setGeneratingId(null);
    }
  }

  async function openConversation(runId: string, contactId: string) {
    setConversation(null);
    setLoadingConversation(true);
    try {
      const res = await fetch(
        `/api/reports/complaints/${runId}/conversation?contactId=${encodeURIComponent(contactId)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Não foi possível carregar a conversa.');
        return;
      }
      setConversation(data as ComplaintConversation);
    } catch {
      alert('Falha de rede ao carregar a conversa.');
    } finally {
      setLoadingConversation(false);
    }
  }

  async function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
    try {
      const res = await fetch('/api/whatsapp-sessions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sessions)) setSessions(data.sessions);
      }
    } catch {
      // keep list already carregada
    }
  }

  function openEdit(r: ReportRow) {
    setEditing(r);
    setForm({
      nome: r.nome,
      fonte: r.fonte,
      horario: r.horario,
      escopoLoja: r.escopoLoja,
      destinoWhatsapp: r.destinoWhatsapp,
      sessionSlot: r.sessionSlot ?? null,
      ativo: r.ativo,
      campos: [...r.campos]
        .sort((a, b) => a.ordem - b.ordem)
        .map((c) => c.campoKey),
    });
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  function setField<K extends keyof ReportForm>(key: K, value: ReportForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleCampo(key: string) {
    setForm((f) => {
      if (f.campos.includes(key)) {
        return { ...f, campos: f.campos.filter((k) => k !== key) };
      }
      return { ...f, campos: [...f.campos, key] };
    });
  }

  function validate(): string | null {
    if (!form.nome.trim()) return 'O nome é obrigatório.';
    if (!/^\d{2}:\d{2}$/.test(form.horario)) return 'Horário inválido. Use HH:mm.';
    if (!form.destinoWhatsapp.trim()) return 'Informe o destino WhatsApp (ID do grupo/contato).';
    if (!form.sessionSlot) return 'Escolha a sessão WhatsApp que envia este relatório.';
    if (form.campos.length === 0) return 'Selecione ao menos um campo do catálogo.';
    return null;
  }

  async function handleSave() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        nome: form.nome.trim(),
        horario: form.horario,
        escopoLoja: form.escopoLoja,
        destinoWhatsapp: form.destinoWhatsapp.trim(),
        sessionSlot: form.sessionSlot,
        ativo: form.ativo,
        campos: form.campos,
      };

      const res = await fetch(
        editing ? `/api/admin/reports/${editing.id}` : '/api/admin/reports',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Erro ao salvar relatório.');
        return;
      }

      closeModal();
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(r: ReportRow) {
    setTogglingId(r.id);
    try {
      const res = await fetch(`/api/admin/reports/${r.id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        const updated = await res.json();
        setReports((prev) => prev.map((x) => (x.id === r.id ? { ...x, ...updated } : x)));
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-1 w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#1c1c1e] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <FileBarChart2 className="w-6 h-6 text-amber-400" />
                <h1 className="text-2xl font-bold text-white">Central de Relatórios</h1>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Relatórios Saipos agendados e atas mensais de reclamações
              </p>
            </div>
          </div>

          {tab === 'agendados' && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo relatório
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[#111113] border border-[#2a2a2e] w-fit">
          <button
            type="button"
            onClick={() => setTab('agendados')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'agendados'
                ? 'bg-amber-500 text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Agendados (Saipos)
          </button>
          <button
            type="button"
            onClick={() => setTab('reclamacoes')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'reclamacoes'
                ? 'bg-amber-500 text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquareWarning className="w-3.5 h-3.5" />
            Reclamações
          </button>
        </div>

        {tab === 'reclamacoes' ? (
          loadingComplaints ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
            </div>
          ) : complaintRuns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <MessageSquareWarning className="w-8 h-8 text-amber-400/50" />
              <p className="text-white font-medium">Nenhuma revisão de reclamações ainda</p>
              <p className="text-sm text-gray-500 max-w-md">
                Após a classificação mensal, revise as reclamações detectadas, marque quais
                entram na ata e gere o documento manualmente.
              </p>
            </div>
          ) : (
            <div className="bg-[#111113] border border-[#2a2a2e] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2a2e] text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Período
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Reclamações
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Executado em
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaintRuns.map((run) => {
                      const canReview =
                        run.status === 'CONCLUIDO' && (run.totalReclamacoes ?? 0) > 0;
                      const confirmadas = run.confirmadasCount ?? 0;
                      const canGenerate = canReview && confirmadas > 0;
                      const hasAta = Boolean(run.ataStoragePath);

                      return (
                      <tr key={run.id} className="border-b border-[#2a2a2e] last:border-0">
                        <td className="px-4 py-3.5 font-medium text-white">
                          {periodLabel(run.periodStart)}
                        </td>
                        <td className="px-4 py-3.5 text-gray-300">
                          {run.totalReclamacoes ?? '—'}
                          <span className="text-xs text-gray-500 ml-1">
                            / {run.totalConversas ?? '—'} conversas
                          </span>
                          {confirmadas > 0 && (
                            <span className="block text-xs text-green-400/80 mt-0.5">
                              {confirmadas} na ata
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex w-fit px-2 py-0.5 rounded-lg text-xs border ${statusBadge(run.status)}`}
                            >
                              {run.status}
                            </span>
                            {run.status === 'PROCESSANDO' && (
                              <span className="text-xs text-amber-300/90">
                                {run.conversasProcessadas ?? 0} de {run.totalConversas ?? '—'}{' '}
                                conversas processadas
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-400 text-xs">
                          {ptDateTime(run.executadoEm)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {run.status === 'PROCESSANDO' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 border border-[#2a2a2e] opacity-60">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Aguardando término
                              </span>
                            )}
                            {canReview && (
                              <button
                                type="button"
                                onClick={() => openReview(run.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1a1a1e] text-gray-200 border border-[#2a2a2e] hover:border-amber-500/30 transition-colors"
                              >
                                {reviewRunId === run.id ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                                Revisar
                              </button>
                            )}
                            {canReview && (
                              <button
                                type="button"
                                disabled={!canGenerate || generatingId === run.id}
                                title={
                                  canGenerate
                                    ? hasAta
                                      ? 'Regenerar ata com as marcações atuais'
                                      : 'Gerar ata com reclamações marcadas'
                                    : 'Marque ao menos uma reclamação na revisão'
                                }
                                onClick={() => handleGenerateAta(run.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              >
                                {generatingId === run.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5" />
                                )}
                                {hasAta ? 'Regenerar ata' : 'Gerar ata'}
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={!hasAta || downloadingId === run.id}
                              onClick={() => handleDownloadAta(run.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1a1a1e] text-gray-300 border border-[#2a2a2e] hover:border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              {downloadingId === run.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              Baixar ata
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>

              {reviewRunId && (
                <div className="border-t border-[#2a2a2e] p-4 md:p-6 bg-[#0d0d0f]">
                  {loadingReview ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                    </div>
                  ) : reviewData ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-white">
                            Revisão — {periodLabel(reviewData.periodStart)}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Marque quais reclamações detectadas pela IA entram na ata. Só mensagens
                            do cliente são usadas como evidência.
                          </p>
                        </div>
                        <p className="text-xs text-amber-300/90">
                          {reviewData.confirmadasCount} de {reviewData.complaints.length} incluídas
                        </p>
                      </div>

                      {reviewData.complaints.length === 0 ? (
                        <p className="text-sm text-gray-500">Nenhuma reclamação neste run.</p>
                      ) : (
                        <ul className="space-y-3">
                          {reviewData.complaints.map((c) => (
                            <li
                              key={c.id}
                              className="rounded-xl border border-[#2a2a2e] bg-[#111113] p-4"
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  disabled={togglingComplaintId === c.id}
                                  onClick={() =>
                                    toggleComplaintConfirm(c.id, !c.confirmadoPorHumano)
                                  }
                                  className="mt-0.5 shrink-0 text-amber-400 disabled:opacity-50"
                                  aria-label={
                                    c.confirmadoPorHumano
                                      ? 'Remover da ata'
                                      : 'Incluir na ata'
                                  }
                                >
                                  {togglingComplaintId === c.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : c.confirmadoPorHumano ? (
                                    <CheckSquare className="w-5 h-5" />
                                  ) : (
                                    <Square className="w-5 h-5 text-gray-500" />
                                  )}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-white">
                                      {c.clientLabel || `${c.contactName || 'Cliente'} — ${c.contactPhone || c.contactId}`}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(c.dataOcorrencia).toLocaleDateString('pt-BR', {
                                        timeZone: 'America/Sao_Paulo',
                                      })}
                                    </span>
                                    {c.numeroPedido && (
                                      <span className="text-xs text-amber-300/90">
                                        Pedido {c.numeroPedido}
                                      </span>
                                    )}
                                    {c.confirmadoPorHumano && (
                                      <span className="text-xs text-green-400/90">
                                        Incluir na ata
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-300 mt-1.5">{c.resumo}</p>
                                  {c.evidencias.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                                        Evidências (cliente)
                                      </p>
                                      {c.evidencias.map((ev) => (
                                        <div
                                          key={ev.id}
                                          className="text-xs text-gray-400 pl-2 border-l border-[#2a2a2e]"
                                        >
                                          {ev.hasMedia || ev.messageType === 'image' || ev.messageType === 'sticker' ? (
                                            <ConversationMedia
                                              messageId={ev.id}
                                              messageType={ev.messageType}
                                            />
                                          ) : (
                                            <p>
                                              {ev.messageType !== 'text' && (
                                                <span className="text-amber-400/80 mr-1">
                                                  [{ev.messageType}]
                                                </span>
                                              )}
                                              {ev.snippet}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      reviewData.id && openConversation(reviewData.id, c.contactId)
                                    }
                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-300/90 hover:text-amber-200"
                                  >
                                    <MessagesSquare className="w-3.5 h-3.5" />
                                    Ver conversa completa
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <FileBarChart2 className="w-8 h-8 text-amber-400/50" />
            </div>
            <div>
              <p className="text-white font-medium">Nenhum relatório cadastrado</p>
              <p className="text-sm text-gray-500 mt-1">
                Crie o primeiro relatório agendado do Saipos
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo relatório
            </button>
          </div>
        ) : (
          <div className="bg-[#111113] border border-[#2a2a2e] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a2e] text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Fonte
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Horário
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Escopo
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Ativo
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Última execução
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-b border-[#2a2a2e] last:border-0 ${
                        !r.ativo ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-white">{r.nome}</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {r.campos.length} campo{r.campos.length === 1 ? '' : 's'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-300">
                        <span className="px-2 py-0.5 rounded-lg bg-[#1c1c1e] text-xs border border-[#2a2a2e]">
                          {r.fonte === 'SAIPOS_DASHBOARD' ? 'Saipos' : r.fonte}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-300">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          {r.horario}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-300">
                        {ESCOPO_LABELS[r.escopoLoja] ?? r.escopoLoja}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggle(r)}
                          disabled={togglingId === r.id}
                          title={r.ativo ? 'Desativar' : 'Ativar'}
                          className="inline-flex items-center gap-1.5 text-xs disabled:opacity-40"
                        >
                          {togglingId === r.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                          ) : r.ativo ? (
                            <ToggleRight className="w-5 h-5 text-green-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-500" />
                          )}
                          <span className={r.ativo ? 'text-green-400' : 'text-gray-500'}>
                            {r.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        {r.ultimaExecucao ? (
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium ${
                                r.ultimaExecucao.status === 'SUCESSO'
                                  ? 'text-green-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {r.ultimaExecucao.status === 'SUCESSO' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5" />
                              )}
                              {r.ultimaExecucao.status === 'SUCESSO' ? 'Sucesso' : 'Falha'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {ptDateTime(r.ultimaExecucao.executadoEm)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">Nunca executado</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => openEdit(r)}
                          title="Editar"
                          className="inline-flex w-8 h-8 rounded-lg items-center justify-center text-gray-500 hover:text-white hover:bg-[#2a2a2e] transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      {showModal && (
        <Modal
          title={editing ? 'Editar relatório' : 'Novo relatório'}
          onClose={closeModal}
        >
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              <p className={sectionCls}>Configuração</p>

              <div>
                <label className={labelCls}>
                  Nome <span className="text-red-400">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={form.nome}
                  onChange={(e) => setField('nome', e.target.value)}
                  placeholder="Ex: Relatório diário Saipos"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Fonte</label>
                  <select value={form.fonte} disabled className={`${inputCls} opacity-70 cursor-not-allowed`}>
                    <option value="SAIPOS_DASHBOARD">Saipos Dashboard</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1.5">
                    Única fonte disponível por enquanto
                  </p>
                </div>

                <div>
                  <label className={labelCls}>
                    Horário <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.horario}
                    onChange={(e) => setField('horario', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Escopo de loja <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.escopoLoja}
                    onChange={(e) => setField('escopoLoja', e.target.value as EscopoLoja)}
                    className={inputCls}
                  >
                    <option value="POR_LOJA">Por loja</option>
                    <option value="CONSOLIDADO">Consolidado</option>
                    <option value="AMBOS">Ambos</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Ativo</label>
                  <button
                    type="button"
                    onClick={() => setField('ativo', !form.ativo)}
                    className="flex items-center gap-2.5 mt-1 select-none"
                  >
                    <span
                      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                        form.ativo ? 'bg-amber-500' : 'bg-[#3a3a3e]'
                      }`}
                      role="switch"
                      aria-checked={form.ativo}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: form.ativo ? '18px' : '2px' }}
                      />
                    </span>
                    <span className="text-sm text-gray-300">
                      {form.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Enviar via <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.sessionSlot ?? ''}
                  onChange={(e) =>
                    setField('sessionSlot', e.target.value ? Number(e.target.value) : null)
                  }
                  className={inputCls}
                >
                  <option value="">Selecione a sessão</option>
                  {sessions.map((s) => (
                    <option key={s.slot} value={s.slot}>
                      {s.label}
                      {s.connectedNumber ? ` · ${s.connectedNumber}` : ''}
                      {s.isConnected ? '' : ' (desconectada)'}
                    </option>
                  ))}
                </select>
                {form.sessionSlot &&
                  sessions.find((s) => s.slot === form.sessionSlot) &&
                  !sessions.find((s) => s.slot === form.sessionSlot)?.isConnected && (
                    <p className="text-xs text-amber-400 mt-1.5">
                      Esta sessão está desconectada. Reconecte em Conexões para o envio funcionar.
                    </p>
                  )}
                {sessions.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    Nenhuma sessão cadastrada. Conecte um número em Conexões.
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls}>
                  Destino WhatsApp <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.destinoWhatsapp}
                  onChange={(e) => setField('destinoWhatsapp', e.target.value)}
                  placeholder="ID do grupo ou contato (ex: 120363...@g.us)"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Campos do catálogo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className={sectionCls + ' mb-0'}>Campos do relatório</p>
                <span className="text-xs text-gray-500">
                  {form.campos.length} selecionado{form.campos.length === 1 ? '' : 's'}
                </span>
              </div>

              {catalog.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Catálogo vazio. Rode o seed do SaiposFieldCatalog.
                </p>
              ) : (
                <div className="space-y-5">
                  {catalogByGrupo.map(({ grupo, label, campos }) => (
                    <div key={grupo}>
                      <p className="text-xs font-semibold text-amber-400/80 mb-2">{label}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {campos.map((c) => {
                          const checked = form.campos.includes(c.key);
                          return (
                            <label
                              key={c.key}
                              className={`flex items-start gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-amber-500/10 border-amber-500/40'
                                  : 'bg-[#0a0a0a] border-[#2a2a2e] hover:border-[#3a3a3e]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCampo(c.key)}
                                className="mt-0.5 accent-amber-500"
                              />
                              <span className="text-sm text-gray-200 leading-snug">
                                {c.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-[#2a2a2e]">
            <button
              onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl border border-[#2a2a2e] text-sm text-gray-400 hover:text-white hover:bg-[#1c1c1e] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar relatório'}
            </button>
          </div>
        </Modal>
      )}

      {(loadingConversation || conversation) && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#111113] border border-[#2a2a2e] rounded-2xl w-full max-w-3xl shadow-2xl my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2e]">
              <h2 className="text-base font-semibold text-white">
                {conversation?.clientLabel || 'Conversa completa'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setConversation(null);
                  setLoadingConversation(false);
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#2a2a2e] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {loadingConversation ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                </div>
              ) : conversation?.messages.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma mensagem neste período.</p>
              ) : (
                <div className="space-y-3">
                  {conversation?.truncated && (
                    <p className="text-xs text-amber-300/80">
                      Conversa longa: mostrando as primeiras 500 mensagens do período.
                    </p>
                  )}
                  {conversation?.messages.map((m) => {
                    const isClient = m.speaker === 'CLIENTE';
                    const speakerCls =
                      m.speaker === 'CLIENTE'
                        ? 'text-sky-300'
                        : m.speaker === 'ATENDENTE'
                          ? 'text-amber-300'
                          : 'text-gray-400';
                    return (
                      <div
                        key={m.id}
                        className={`rounded-xl border px-3 py-2 ${
                          isClient
                            ? 'border-sky-500/20 bg-sky-500/5'
                            : 'border-[#2a2a2e] bg-[#0d0d0f]'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[11px] font-semibold uppercase ${speakerCls}`}>
                            {m.speaker}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {ptDateTime(m.timestamp)}
                          </span>
                          {m.messageType !== 'text' &&
                            m.messageType !== 'image' &&
                            m.messageType !== 'sticker' && (
                            <span className="text-[11px] text-gray-500">[{m.messageType}]</span>
                          )}
                        </div>
                        {m.messageType === 'image' || m.messageType === 'sticker' || m.hasMedia ? (
                          <>
                            <ConversationMedia messageId={m.id} messageType={m.messageType} />
                            {m.snippet &&
                              !/^\[.+\]$/.test(m.snippet) &&
                              !m.snippet.startsWith('/9j/') && (
                              <p className="text-sm text-gray-200 whitespace-pre-wrap break-words mt-1.5">
                                {m.snippet}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">
                            {m.snippet === `[${m.messageType}]` ? '' : m.snippet}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RelatoriosPage() {
  return (
    <ToolProtection
      tool={SystemTool.AGENDAMENTO_RELATORIOS}
      toolName="Central de Relatórios"
    >
      <RelatoriosContent />
    </ToolProtection>
  );
}
