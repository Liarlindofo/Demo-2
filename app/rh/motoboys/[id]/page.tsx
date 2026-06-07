'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Bike, Plus, Clock, CheckCircle, XCircle,
  FileText, Eye, Loader2, ChevronDown, ChevronUp, DollarSign,
  Copy, RefreshCw, Link2,
} from 'lucide-react';

interface Document { id: string; documentType: string; status: string; fileName: string; uploadedAt: string }
interface Period {
  id: string; periodLabel: string; periodStart: string; periodEnd: string;
  deliveryCount: number; amountCents: number; status: string;
  documents: Document[];
}
interface Rider {
  id: string; name: string; cpf: string; email: string; phone: string | null;
  status: string; passwordHash: string | null;
  loja: { nome: string }; paymentPeriods: Period[];
}

const STATUS_LABEL: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_documents: { label: 'Aguardando documentos', color: 'text-amber-400', icon: <Clock className="w-4 h-4" /> },
  documents_received: { label: 'Docs recebidos', color: 'text-blue-400', icon: <FileText className="w-4 h-4" /> },
  approved: { label: 'Aprovado', color: 'text-green-400', icon: <CheckCircle className="w-4 h-4" /> },
  paid: { label: 'Pago', color: 'text-green-500', icon: <DollarSign className="w-4 h-4" /> },
};

const fmtCPF = (s: string) => s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
const fmtMoney = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR');

export default function MotoboiDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [rider, setRider] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState<Record<string, boolean>>({});
  const [docsSigned, setDocsSigned] = useState<Record<string, { id: string; documentType: string; signedUrl: string | null; status: string; fileName: string }[]>>({});
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const fetchRider = () => {
    setLoading(true);
    fetch(`/api/rh/motoboys/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setRider)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRider(); }, [id]);

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

  const handleReviewDoc = async (periodId: string, documentId: string, status: 'approved' | 'rejected') => {
    await fetch(`/api/rh/motoboys/quinzenas/${periodId}/documentos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, status }),
    });
    // Recarregar docs
    const res = await fetch(`/api/rh/motoboys/quinzenas/${periodId}/documentos`);
    if (res.ok) {
      const docs = await res.json();
      setDocsSigned(p => ({ ...p, [periodId]: docs }));
    }
    fetchRider();
  };

  const handleGetInvite = async (regenerar = false) => {
    setLoadingInvite(true);
    try {
      const res = await fetch(
        `/api/rh/motoboys/${id}/invite`,
        regenerar ? { method: 'POST' } : undefined
      );
      if (res.ok) {
        const data = await res.json();
        setInviteToken(data.inviteToken);
      }
    } finally { setLoadingInvite(false); }
  };

  const inviteUrl = inviteToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/rider/setup?token=${inviteToken}`
    : '';

  const copiarLink = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleStatusRider = async (newStatus: string) => {
    await fetch(`/api/rh/motoboys/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchRider();
  };

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/rh/motoboys')} className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e]">
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
            {rider.status === 'active' ? (
              <button onClick={() => handleStatusRider('inactive')}
                className="px-4 py-2 text-sm text-gray-400 border border-[#2a2a2e] rounded-xl hover:bg-[#2a2a2e] transition-colors">
                Desativar
              </button>
            ) : (
              <button onClick={() => handleStatusRider('active')}
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
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Dados Cadastrais</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div><p className="text-gray-500 text-xs mb-0.5">CPF</p><p className="text-white">{fmtCPF(rider.cpf)}</p></div>
            <div><p className="text-gray-500 text-xs mb-0.5">E-mail</p><p className="text-white">{rider.email}</p></div>
            <div><p className="text-gray-500 text-xs mb-0.5">Telefone</p><p className="text-white">{rider.phone ?? '—'}</p></div>
            <div><p className="text-gray-500 text-xs mb-0.5">Status</p>
              <span className={`text-xs font-medium ${rider.status === 'active' ? 'text-green-400' : 'text-gray-400'}`}>
                {rider.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div><p className="text-gray-500 text-xs mb-0.5">Acesso ao portal</p>
              <span className={`text-xs font-medium ${rider.passwordHash ? 'text-green-400' : 'text-amber-400'}`}>
                {rider.passwordHash ? 'Ativo' : 'Aguardando convite'}
              </span>
            </div>
          </div>

          {/* Painel de convite — visível só enquanto o motoboy não definiu senha */}
          {!rider.passwordHash && (
            <div className="mt-4 pt-4 border-t border-[#2a2a2e]">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-amber-400" />
                <p className="text-sm font-medium text-amber-400">Link de convite pendente</p>
              </div>

              {inviteToken ? (
                <div className="space-y-2">
                  <div className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-xs text-gray-300 break-all">
                    {inviteUrl}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copiarLink}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 text-amber-400 text-xs rounded-lg hover:bg-amber-500/20 transition-colors"
                    >
                      {copiado ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiado ? 'Copiado!' : 'Copiar link'}
                    </button>
                    <button
                      onClick={() => handleGetInvite(true)}
                      disabled={loadingInvite}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#2a2a2e] text-gray-400 text-xs rounded-lg hover:text-white transition-colors disabled:opacity-50"
                    >
                      {loadingInvite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Gerar novo link
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleGetInvite(false)}
                  disabled={loadingInvite}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-xl hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  {loadingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  Ver link de convite
                </button>
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
                const st = STATUS_LABEL[period.status] ?? { label: period.status, color: 'text-gray-400', icon: null };
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
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-green-400 text-sm">{fmtMoney(period.amountCents)}</span>
                        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-[#2a2a2e] px-5 py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><p className="text-gray-500 text-xs mb-0.5">Entregas</p><p className="text-white">{period.deliveryCount}</p></div>
                          <div><p className="text-gray-500 text-xs mb-0.5">Valor</p><p className="text-green-400 font-bold">{fmtMoney(period.amountCents)}</p></div>
                        </div>

                        {/* Documentos */}
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
                                        <div className="flex items-center gap-2">
                                          <span className={`text-xs font-medium ${doc.status === 'approved' ? 'text-green-400' : doc.status === 'rejected' ? 'text-red-400' : 'text-amber-400'}`}>
                                            {doc.status === 'approved' ? '✓ Aprovado' : doc.status === 'rejected' ? '✗ Rejeitado' : '⏳ Pendente'}
                                          </span>
                                        </div>
                                        <div className="flex gap-1.5">
                                          {doc.signedUrl && (
                                            <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer"
                                              className="flex items-center gap-1 px-2 py-1 bg-[#2a2a2e] text-gray-300 text-xs rounded-lg hover:text-white">
                                              <Eye className="w-3 h-3" /> Ver
                                            </a>
                                          )}
                                          {doc.status === 'pending' && (
                                            <>
                                              <button onClick={() => handleReviewDoc(period.id, doc.id, 'approved')}
                                                className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-lg hover:bg-green-500/20">
                                                <CheckCircle className="w-3 h-3" /> Aprovar
                                              </button>
                                              <button onClick={() => handleReviewDoc(period.id, doc.id, 'rejected')}
                                                className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-lg hover:bg-red-500/20">
                                                <XCircle className="w-3 h-3" /> Rejeitar
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
    </div>
  );
}
