'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Bike, Plus, Clock, X,
  FileText, Eye, Download, Loader2, ChevronDown, ChevronUp, DollarSign,
  Copy, RefreshCw, MessageCircle, CheckCircle2, ShieldCheck, ShieldOff, Trash2, AlertTriangle, Pencil,
} from 'lucide-react';

interface Document { id: string; documentType: string; status: string; fileName: string; uploadedAt: string }
interface Period {
  id: string; periodLabel: string; periodStart: string; periodEnd: string;
  deliveryCount: number; amountCents: number; dailyRateCents?: number;
  discountCents?: number; status: string;
  documents: Document[];
}

function netCents(p: Period) {
  return Math.max(0, p.amountCents - (p.discountCents ?? 0));
}
interface Rider {
  id: string; name: string; cnpj: string; email: string; phone: string | null;
  status: string; passwordHash: string | null; createdAt: string;
  lojaId: string; loja: { nome: string }; paymentPeriods: Period[];
}
interface InviteData {
  link: string;
  expiresAt: string;
  whatsappLink: string | null;
}
interface Loja { id: string; nome: string }

const PERIOD_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_documents: { label: 'Aguardando documentos', color: 'text-amber-400', icon: <Clock className="w-4 h-4" /> },
  documents_received: { label: 'Docs recebidos', color: 'text-blue-400', icon: <FileText className="w-4 h-4" /> },
  approved: { label: 'Docs recebidos', color: 'text-blue-400', icon: <FileText className="w-4 h-4" /> },
  paid: { label: 'Pago', color: 'text-green-500', icon: <DollarSign className="w-4 h-4" /> },
};

const RIDER_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'text-green-400' },
  pending_setup: { label: 'Aguardando ativação', className: 'text-amber-400' },
  inactive: { label: 'Inativo', className: 'text-gray-400' },
};

const fmtCNPJ = (s: string) => s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
const fmtMoney = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR');

function maskCNPJ(v: string) {
  return v.replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/(\d{2}\.\d{3}\.\d{3})(\d)/, '$1/$2')
    .replace(/(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
}

export default function MotoboiDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [rider, setRider] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState<Record<string, boolean>>({});
  const [docsSigned, setDocsSigned] = useState<Record<string, { id: string; documentType: string; signedUrl: string | null; status: string; fileName: string }[]>>({});

  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  const handleDownloadDoc = async (signedUrl: string, fileName: string, docId: string) => {
    setDownloadingDoc(docId);
    try {
      const res = await fetch(signedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingDoc(null);
    }
  };

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', cnpj: '', lojaId: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [lojas, setLojas] = useState<Loja[]>([]);

  // Invite state
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Reset senha state
  const [resetData, setResetData] = useState<InviteData | null>(null);
  const [loadingReset, setLoadingReset] = useState(false);
  const [resetCopiado, setResetCopiado] = useState(false);
  const [resetError, setResetError] = useState('');

  // Editar quinzena state
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [editPeriodForm, setEditPeriodForm] = useState({
    periodLabel: '', periodStart: '', periodEnd: '',
    deliveryCount: '', totalDisplay: '', totalCents: 0,
    dailyDisplay: '', dailyCents: 0,
    discountDisplay: '', discountCents: 0,
    discountNotes: '', summary: '',
  });
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [periodError, setPeriodError] = useState('');

  const fetchRider = useCallback(() => {
    setLoading(true);
    fetch(`/api/rh/motoboys/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setRider)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchRider(); }, [fetchRider]);

  const togglePeriod = async (periodId: string) => {
    if (expandedPeriod === periodId) { setExpandedPeriod(null); return; }
    setExpandedPeriod(periodId);
    if (docsSigned[periodId]) return;
    setLoadingDocs(p => ({ ...p, [periodId]: true }));
    const res = await fetch(`/api/rh/motoboys/quinzenas/${periodId}/documentos`);
    if (res.ok) {
      const docs = await res.json();
      setDocsSigned(p => ({ ...p, [periodId]: docs }));
    }
    setLoadingDocs(p => ({ ...p, [periodId]: false }));
  };

  const handleGetInvite = async (regenerar = false) => {
    setLoadingInvite(true);
    setInviteError('');
    try {
      const res = await fetch(
        `/api/rh/motoboys/${id}/invite`,
        regenerar ? { method: 'POST' } : undefined
      );
      if (res.ok) {
        setInviteData(await res.json());
      } else {
        const d = await res.json().catch(() => ({}));
        setInviteError(d.error ?? 'Erro ao carregar link');
      }
    } finally {
      setLoadingInvite(false);
    }
  };

  const copiarLink = () => {
    if (!inviteData?.link) return;
    navigator.clipboard.writeText(inviteData.link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleResetSenha = async () => {
    setLoadingReset(true);
    setResetError('');
    setResetData(null);
    try {
      const res = await fetch(`/api/rh/motoboys/${id}/reset-password`, { method: 'POST' });
      if (res.ok) {
        setResetData(await res.json());
      } else {
        const d = await res.json().catch(() => ({}));
        setResetError(d.error ?? 'Erro ao gerar link de redefinição');
      }
    } finally {
      setLoadingReset(false);
    }
  };

  const copiarReset = () => {
    if (!resetData?.link) return;
    navigator.clipboard.writeText(resetData.link);
    setResetCopiado(true);
    setTimeout(() => setResetCopiado(false), 2000);
  };

  const maskMoneyCents = (v: string) => {
    const nums = v.replace(/\D/g, '');
    const cents = parseInt(nums || '0', 10);
    return { display: (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }), cents };
  };

  const openEditPeriod = (period: Period) => {
    setEditingPeriod(period);
    setPeriodError('');
    const toDisplay = (c: number) => (c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    setEditPeriodForm({
      periodLabel:    period.periodLabel,
      periodStart:    period.periodStart.split('T')[0],
      periodEnd:      period.periodEnd.split('T')[0],
      deliveryCount:  String(period.deliveryCount),
      totalDisplay:   toDisplay(period.amountCents),
      totalCents:     period.amountCents,
      dailyDisplay:   toDisplay(period.dailyRateCents ?? 0),
      dailyCents:     period.dailyRateCents ?? 0,
      discountDisplay: toDisplay(period.discountCents ?? 0),
      discountCents:  period.discountCents ?? 0,
      discountNotes:  (period as Period & { discountNotes?: string }).discountNotes ?? '',
      summary:        (period as Period & { summary?: string }).summary ?? '',
    });
  };

  const handleSavePeriod = async () => {
    if (!editingPeriod) return;
    setPeriodError('');
    setSavingPeriod(true);
    try {
      const res = await fetch(`/api/rh/motoboys/quinzenas/${editingPeriod.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodLabel:   editPeriodForm.periodLabel,
          periodStart:   editPeriodForm.periodStart,
          periodEnd:     editPeriodForm.periodEnd,
          deliveryCount: parseInt(editPeriodForm.deliveryCount || '0', 10),
          amountCents:   editPeriodForm.totalCents,
          dailyRateCents: editPeriodForm.dailyCents,
          discountCents:  editPeriodForm.discountCents,
          discountNotes:  editPeriodForm.discountNotes || null,
          summary:        editPeriodForm.summary || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setPeriodError(d.error ?? 'Erro ao salvar');
        return;
      }
      setEditingPeriod(null);
      fetchRider();
    } finally {
      setSavingPeriod(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/rh/motoboys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.replace('/rh/motoboys');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusRider = async (newStatus: string) => {
    await fetch(`/api/rh/motoboys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchRider();
  };

  const openEditModal = async () => {
    if (!rider) return;
    setEditForm({
      name: rider.name,
      email: rider.email,
      phone: rider.phone ?? '',
      cnpj: fmtCNPJ(rider.cnpj),
      lojaId: rider.lojaId,
    });
    setEditError('');
    if (lojas.length === 0) {
      const res = await fetch('/api/rh/lojas');
      if (res.ok) setLojas(await res.json());
    }
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim()) { setEditError('Nome é obrigatório'); return; }
    setEditSaving(true);
    setEditError('');
    try {
      // Com senha criada, não envia e-mail/CNPJ (bloqueados) — evita 409 que impede troca de loja
      const payload: Record<string, unknown> = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || null,
        lojaId: editForm.lojaId,
      };
      if (!rider?.passwordHash) {
        payload.email = editForm.email.trim();
        payload.cnpj = editForm.cnpj;
      }

      const res = await fetch(`/api/rh/motoboys/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setEditError(data.error ?? 'Erro ao salvar'); return; }
      setShowEditModal(false);
      fetchRider();
    } finally {
      setEditSaving(false);
    }
  };

  // Modal de edição de quinzena
  const netEdit = Math.max(0, editPeriodForm.totalCents - editPeriodForm.discountCents);
  const modalEdit = editingPeriod && (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 pt-5 pb-3 border-b border-[#2a2a2e] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Editar quinzena</h3>
            <p className="text-xs text-gray-500 mt-0.5">{editingPeriod.periodLabel}</p>
          </div>
          <button onClick={() => setEditingPeriod(null)} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Rótulo do período</label>
            <input value={editPeriodForm.periodLabel}
              onChange={e => setEditPeriodForm(f => ({ ...f, periodLabel: e.target.value }))}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Início</label>
              <input type="date" value={editPeriodForm.periodStart}
                onChange={e => setEditPeriodForm(f => ({ ...f, periodStart: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Fim</label>
              <input type="date" value={editPeriodForm.periodEnd}
                onChange={e => setEditPeriodForm(f => ({ ...f, periodEnd: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Qtd. entregas</label>
              <input type="number" min="0" value={editPeriodForm.deliveryCount}
                onChange={e => setEditPeriodForm(f => ({ ...f, deliveryCount: e.target.value }))}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Valor total bruto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input value={editPeriodForm.totalDisplay}
                  onChange={e => { const { display, cents } = maskMoneyCents(e.target.value); setEditPeriodForm(f => ({ ...f, totalDisplay: display, totalCents: cents })); }}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Valor da diária</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
              <input value={editPeriodForm.dailyDisplay}
                onChange={e => { const { display, cents } = maskMoneyCents(e.target.value); setEditPeriodForm(f => ({ ...f, dailyDisplay: display, dailyCents: cents })); }}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Valor de desconto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
              <input value={editPeriodForm.discountDisplay}
                onChange={e => { const { display, cents } = maskMoneyCents(e.target.value); setEditPeriodForm(f => ({ ...f, discountDisplay: display, discountCents: cents })); }}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors" />
            </div>
          </div>
          {editPeriodForm.discountCents > 0 && (
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Detalhamento do desconto</label>
              <textarea value={editPeriodForm.discountNotes}
                onChange={e => setEditPeriodForm(f => ({ ...f, discountNotes: e.target.value }))}
                rows={2} placeholder="ex: 2x Pizza Calabresa R$15,00..."
                className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-orange-500/50 transition-colors" />
            </div>
          )}
          {editPeriodForm.totalCents > 0 && (
            <div className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Valor bruto</span>
                <span className="text-white">{fmtMoney(editPeriodForm.totalCents)}</span>
              </div>
              {editPeriodForm.discountCents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Desconto</span>
                  <span className="text-red-400">− {fmtMoney(editPeriodForm.discountCents)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#2a2a2e] pt-1.5">
                <span className="text-sm font-medium text-white">A receber</span>
                <span className="text-green-400 font-bold">{fmtMoney(netEdit)}</span>
              </div>
            </div>
          )}
          {periodError && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{periodError}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setEditingPeriod(null)}
              className="flex-1 py-2.5 rounded-xl bg-[#2a2a2e] text-gray-300 text-sm font-medium hover:bg-[#3a3a3e] transition-colors">
              Cancelar
            </button>
            <button onClick={handleSavePeriod} disabled={savingPeriod}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 text-black text-sm font-bold hover:bg-orange-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {savingPeriod ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );

  if (!rider) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-gray-400">Motoboy não encontrado</p>
    </div>
  );

  const riderSt = RIDER_STATUS[rider.status] ?? RIDER_STATUS.inactive;
  const canInvite = !rider.passwordHash;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {modalEdit}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) router.back();
                else router.push('/rh/motoboys');
              }}
              className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e]"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Bike className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{rider.name}</h1>
                <p className="text-xs text-gray-500">{rider.loja?.nome}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-4 h-4" /> Apagar
            </button>
            <button onClick={openEditModal}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-300 border border-[#2a2a2e] rounded-xl hover:bg-[#2a2a2e] transition-colors">
              <Pencil className="w-4 h-4" /> Editar
            </button>
            {rider.status === 'active' ? (
              <button onClick={() => handleStatusRider('inactive')}
                className="px-4 py-2 text-sm text-gray-400 border border-[#2a2a2e] rounded-xl hover:bg-[#2a2a2e] transition-colors">
                Desativar
              </button>
            ) : (
              <button onClick={() => handleStatusRider('pending_setup')}
                className="px-4 py-2 text-sm text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/10 transition-colors">
                Reativar
              </button>
            )}
            <Link href={`/rh/motoboys/${id}/quinzena/nova`}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 transition-colors">
              <Plus className="w-4 h-4" /> Lançar Quinzena
            </Link>
          </div>
        </div>

        {/* Dados cadastrais */}
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Dados Cadastrais</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div><p className="text-gray-500 text-xs mb-0.5">CNPJ</p><p className="text-white">{fmtCNPJ(rider.cnpj)}</p></div>
            <div><p className="text-gray-500 text-xs mb-0.5">E-mail</p><p className="text-white">{rider.email}</p></div>
            <div><p className="text-gray-500 text-xs mb-0.5">Telefone</p><p className="text-white">{rider.phone ?? '—'}</p></div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Status</p>
              <span className={`text-xs font-medium ${riderSt.className}`}>{riderSt.label}</span>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Cadastrado em</p>
              <p className="text-white text-xs">{fmtDate(rider.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Acesso ao portal */}
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Acesso ao Portal</h2>

          <div className="flex items-center gap-3">
            {rider.passwordHash ? (
              <>
                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-400">Acesso configurado</p>
                  <p className="text-xs text-gray-500">O motoboy criou sua senha e pode acessar o portal em <span className="text-orange-400">/rider/login</span></p>
                </div>
                <button
                  onClick={handleResetSenha}
                  disabled={loadingReset}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-xl hover:bg-amber-500/20 transition-colors disabled:opacity-50 shrink-0"
                >
                  {loadingReset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Redefinir senha
                </button>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <ShieldOff className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-400">Aguardando ativação</p>
                  <p className="text-xs text-gray-500">Envie o link de convite para o motoboy criar sua senha.</p>
                </div>
              </>
            )}
          </div>

          {/* Painel de convite */}
          {canInvite && (
            <div className="pt-1 space-y-3">
              {inviteData ? (
                <>
                  <div className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-xs text-gray-300 break-all">
                    {inviteData.link}
                  </div>
                  <p className="text-xs text-gray-500">
                    Válido até {new Date(inviteData.expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={copiarLink}
                      className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/10 text-orange-400 text-xs rounded-lg hover:bg-orange-500/20 transition-colors">
                      {copiado ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiado ? 'Copiado!' : 'Copiar link'}
                    </button>
                    {inviteData.whatsappLink && (
                      <a href={inviteData.whatsappLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-400 text-xs rounded-lg hover:bg-green-500/20 transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" /> Abrir WhatsApp
                      </a>
                    )}
                    <button onClick={() => handleGetInvite(true)} disabled={loadingInvite}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#2a2a2e] text-gray-400 text-xs rounded-lg hover:text-white transition-colors disabled:opacity-50">
                      {loadingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Gerar novo link
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleGetInvite(false)} disabled={loadingInvite}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-xl hover:bg-amber-500/20 transition-colors disabled:opacity-50">
                    {loadingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                    Ver link de convite
                  </button>
                  <button onClick={() => handleGetInvite(true)} disabled={loadingInvite}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#2a2a2e] border border-[#2a2a2e] text-gray-400 text-sm rounded-xl hover:text-white transition-colors disabled:opacity-50">
                    {loadingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Reenviar convite por e-mail
                  </button>
                </div>
              )}
              {inviteError && <p className="text-xs text-red-400">{inviteError}</p>}
            </div>
          )}

          {/* Painel de redefinição de senha */}
          {(resetData || resetError) && (
            <div className="pt-1 space-y-3 border-t border-[#2a2a2e]">
              <p className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Link de redefinição de senha gerado
              </p>
              {resetData ? (
                <>
                  <div className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-xs text-gray-300 break-all">
                    {resetData.link}
                  </div>
                  <p className="text-xs text-gray-500">
                    Válido por 24 horas (até {new Date(resetData.expiresAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={copiarReset}
                      className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/10 text-orange-400 text-xs rounded-lg hover:bg-orange-500/20 transition-colors">
                      {resetCopiado ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {resetCopiado ? 'Copiado!' : 'Copiar link'}
                    </button>
                    {resetData.whatsappLink && (
                      <a href={resetData.whatsappLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-400 text-xs rounded-lg hover:bg-green-500/20 transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" /> Enviar pelo WhatsApp
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-red-400">{resetError}</p>
              )}
            </div>
          )}
        </div>

        {/* Quinzenas */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Histórico de Quinzenas ({rider.paymentPeriods.length})
          </h2>
          {rider.paymentPeriods.length === 0 ? (
            <div className="bg-[#1c1c1e] border border-dashed border-[#2a2a2e] rounded-2xl p-8 text-center">
              <p className="text-gray-500 text-sm">Nenhuma quinzena lançada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rider.paymentPeriods.map((period) => {
                const st = PERIOD_STATUS[period.status] ?? { label: period.status, color: 'text-gray-400', icon: null };
                const isOpen = expandedPeriod === period.id;
                const docs = docsSigned[period.id] ?? [];

                return (
                  <div key={period.id} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
                    <button onClick={() => togglePeriod(period.id)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#1e1e20] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
                          {st.icon}{st.label}
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold text-white">{period.periodLabel}</span>
                          <span className="text-gray-500 ml-2 text-xs">{fmtDate(period.periodStart)} – {fmtDate(period.periodEnd)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-green-400 text-sm">{fmtMoney(netCents(period))}</span>
                        <button
                          onClick={e => { e.stopPropagation(); openEditPeriod(period); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#2a2a2e] text-gray-400 hover:text-white hover:bg-[#3a3a3e] transition-colors text-xs"
                          title="Editar quinzena"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-[#2a2a2e] px-5 py-4 space-y-4">
                        <div className="space-y-2 text-sm">
                          {(() => {
                            const daily = period.dailyRateCents ?? 0;
                            const discount = period.discountCents ?? 0;
                            const deliveries = Math.max(0, period.amountCents - daily);
                            return (
                              <>
                                {deliveries > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Entregas</span>
                                    <span className="text-white">{fmtMoney(deliveries)}</span>
                                  </div>
                                )}
                                {daily > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Diárias</span>
                                    <span className="text-white">+ {fmtMoney(daily)}</span>
                                  </div>
                                )}
                                {discount > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Desconto</span>
                                    <span className="text-red-400">− {fmtMoney(discount)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t border-[#2a2a2e] pt-2">
                                  <span className="text-gray-400 font-medium">A receber</span>
                                  <span className="text-green-400 font-bold">{fmtMoney(netCents(period))}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Documentos</p>
                          {loadingDocs[period.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              {(['nf', 'boleto'] as const).map((tipo) => {
                                const doc = docs.find(d => d.documentType === tipo);
                                return (
                                  <div key={tipo} className="bg-[#141416] rounded-xl p-3 space-y-2">
                                    <p className="text-xs text-gray-400 font-medium uppercase">
                                      {tipo === 'nf' ? 'Nota Fiscal' : 'Boleto'}
                                    </p>
                                    {doc ? (
                                      <div className="space-y-2">
                                        <p className="text-xs text-gray-300 truncate">{doc.fileName}</p>
                                        <span className="text-xs font-medium text-green-400">Enviado</span>
                                        <div className="flex gap-1.5">
                                          {doc.signedUrl && (
                                            <>
                                              <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center gap-1 px-2 py-1 bg-[#2a2a2e] text-gray-300 text-xs rounded-lg hover:text-white">
                                                <Eye className="w-3 h-3" /> Ver
                                              </a>
                                              <button
                                                onClick={() => handleDownloadDoc(doc.signedUrl!, doc.fileName, doc.id)}
                                                disabled={downloadingDoc === doc.id}
                                                className="flex items-center gap-1 px-2 py-1 bg-[#2a2a2e] text-gray-300 text-xs rounded-lg hover:text-white disabled:opacity-50">
                                                {downloadingDoc === doc.id
                                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                                  : <Download className="w-3 h-3" />}
                                                Baixar
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-600">Não enviado</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => { if (!deleting) { setShowDeleteModal(false); setDeleteConfirmText(''); } }}>
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 w-full max-w-md space-y-5"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Apagar motoboy permanentemente?</p>
                <p className="text-sm text-gray-400 mt-1">
                  Esta ação é <strong className="text-red-400">irreversível</strong>. Serão apagados:
                </p>
                <ul className="text-sm text-gray-500 mt-2 space-y-0.5 list-disc list-inside">
                  <li>Cadastro de <strong className="text-white">{rider.name}</strong></li>
                  <li>Todas as quinzenas ({rider.paymentPeriods.length})</li>
                  <li>Todos os documentos vinculados</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">
                Digite <span className="text-white font-mono">APAGAR</span> para confirmar
              </label>
              <input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="APAGAR"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm text-gray-400 border border-[#2a2a2e] rounded-xl hover:bg-[#2a2a2e] transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText !== 'APAGAR' || deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-red-500 text-white rounded-xl hover:bg-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Apagar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {showEditModal && rider && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => { if (!editSaving) setShowEditModal(false); }}>
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 w-full max-w-lg space-y-5"
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Editar motoboy</p>
                <p className="text-xs text-gray-500">Atualize os dados cadastrais</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Nome */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nome completo</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>

              {/* CNPJ */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  CNPJ {rider.passwordHash && <span className="text-amber-400">(bloqueado — senha já criada)</span>}
                </label>
                <input
                  value={editForm.cnpj}
                  onChange={e => setEditForm(f => ({ ...f, cnpj: maskCNPJ(e.target.value) }))}
                  disabled={!!rider.passwordHash}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  E-mail {rider.passwordHash && <span className="text-amber-400">(bloqueado — senha já criada)</span>}
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  disabled={!!rider.passwordHash}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Telefone</label>
                <input
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>

              {/* Loja */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Loja vinculada</label>
                <select
                  value={editForm.lojaId}
                  onChange={e => setEditForm(f => ({ ...f, lojaId: e.target.value }))}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors">
                  {lojas.map(l => (
                    <option key={l.id} value={l.id}>{l.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {editError && <p className="text-xs text-red-400">{editError}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={editSaving}
                className="flex-1 px-4 py-2.5 text-sm text-gray-400 border border-[#2a2a2e] rounded-xl hover:bg-[#2a2a2e] transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-orange-500 text-black rounded-xl hover:bg-orange-400 transition-colors disabled:opacity-50">
                {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
