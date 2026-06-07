'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Bike, Clock, CheckCircle, FileText, Upload,
  Loader2, DollarSign, Check, AlertCircle,
} from 'lucide-react';

interface Doc { documentType: string; status: string; fileName: string; uploadedAt: string }
interface Period {
  id: string; periodLabel: string; periodStart: string; periodEnd: string;
  deliveryCount: number; amountCents: number; status: string; summary: string | null;
  documents: Doc[];
}

const fmtMoney = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR');

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending_documents: { label: 'Aguardando seus documentos', color: 'text-amber-400' },
  documents_received: { label: 'Documentos recebidos — em análise', color: 'text-blue-400' },
  approved: { label: 'Aprovado pelo RH', color: 'text-green-400' },
  paid: { label: 'Pago', color: 'text-green-500' },
};

type DocType = 'nf' | 'boleto';

export default function RiderQuinzenaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [period, setPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<DocType, boolean>>({ nf: false, boleto: false });
  const [uploadError, setUploadError] = useState<Record<DocType, string>>({ nf: '', boleto: '' });
  const nfRef = useRef<HTMLInputElement>(null);
  const boletoRef = useRef<HTMLInputElement>(null);

  const fetchPeriod = () => {
    fetch(`/api/rider/quinzenas/${id}`)
      .then(r => { if (r.status === 401) { router.push('/rider/login'); return null; } return r.json(); })
      .then(d => d && setPeriod(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPeriod(); }, [id]);

  const handleUpload = async (tipo: DocType, file: File) => {
    if (file.type !== 'application/pdf') {
      setUploadError(e => ({ ...e, [tipo]: 'Apenas PDF é aceito' }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(e => ({ ...e, [tipo]: 'Arquivo maior que 10MB' }));
      return;
    }
    setUploadError(e => ({ ...e, [tipo]: '' }));
    setUploading(u => ({ ...u, [tipo]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('documentType', tipo);
      const res = await fetch(`/api/rider/quinzenas/${id}/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadError(e => ({ ...e, [tipo]: data.error ?? 'Erro no upload' })); return; }
      fetchPeriod();
    } finally { setUploading(u => ({ ...u, [tipo]: false })); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );
  if (!period) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-gray-400">Quinzena não encontrada</p>
    </div>
  );

  const st = STATUS_LABEL[period.status] ?? { label: period.status, color: 'text-gray-400' };
  const nfDoc = period.documents.find(d => d.documentType === 'nf');
  const boletoDoc = period.documents.find(d => d.documentType === 'boleto');
  const canUpload = ['pending_documents', 'documents_received'].includes(period.status);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#111113] border-b border-[#2a2a2e] px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/rider/dashboard" className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Bike className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">{period.periodLabel}</h1>
              <p className={`text-xs ${st.color}`}>{st.label}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Resumo */}
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Período</p>
              <p className="text-white">{fmtDate(period.periodStart)} – {fmtDate(period.periodEnd)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Entregas realizadas</p>
              <p className="text-white font-medium">{period.deliveryCount}</p>
            </div>
          </div>
          <div className="bg-[#0a0a0a] rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Valor a receber</p>
            <p className="text-3xl font-bold text-green-400">{fmtMoney(period.amountCents)}</p>
          </div>
          {period.summary && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs text-blue-400 font-medium mb-1">Mensagem do RH</p>
              <p className="text-sm text-gray-300">{period.summary}</p>
            </div>
          )}
        </div>

        {/* Upload de documentos */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Documentos</h2>

          {(['nf', 'boleto'] as DocType[]).map((tipo) => {
            const doc = tipo === 'nf' ? nfDoc : boletoDoc;
            const isUploading = uploading[tipo];
            const err = uploadError[tipo];
            const ref = tipo === 'nf' ? nfRef : boletoRef;
            const isApproved = doc?.status === 'approved';

            return (
              <div key={tipo} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-white text-sm">
                      {tipo === 'nf' ? 'Nota Fiscal de Serviço' : 'Boleto Bancário'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">PDF, máximo 10MB</p>
                  </div>
                  {doc ? (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      doc.status === 'approved' ? 'text-green-400 bg-green-500/10' :
                      doc.status === 'rejected' ? 'text-red-400 bg-red-500/10' :
                      'text-amber-400 bg-amber-500/10'
                    }`}>
                      {doc.status === 'approved' ? '✓ Aprovado' : doc.status === 'rejected' ? '✗ Rejeitado' : '⏳ Em análise'}
                    </span>
                  ) : null}
                </div>

                {doc && (
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate">{doc.fileName}</span>
                  </div>
                )}

                {err && (
                  <div className="flex items-center gap-2 mb-3 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{err}
                  </div>
                )}

                {canUpload && !isApproved && (
                  <>
                    <input ref={ref} type="file" accept="application/pdf" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(tipo, f); e.target.value = ''; }} />
                    <button onClick={() => ref.current?.click()} disabled={isUploading}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        doc ? 'bg-[#2a2a2e] text-gray-300 hover:bg-[#3a3a3e]' :
                        'bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                      } disabled:opacity-50`}>
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {doc ? 'Substituir arquivo' : `Enviar ${tipo === 'nf' ? 'Nota Fiscal' : 'Boleto'}`}
                    </button>
                  </>
                )}

                {isApproved && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Documento aprovado pelo RH</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {period.status === 'approved' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="font-semibold text-green-400">Quinzena aprovada!</p>
            <p className="text-sm text-gray-400 mt-1">O pagamento de {fmtMoney(period.amountCents)} será processado em breve.</p>
          </div>
        )}

        {period.status === 'paid' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center">
            <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-green-500">Pagamento realizado!</p>
            <p className="text-sm text-gray-400 mt-1">{fmtMoney(period.amountCents)} pago.</p>
          </div>
        )}
      </div>
    </div>
  );
}
