'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bike, DollarSign, CheckCircle, Clock, FileText } from 'lucide-react';

interface Period {
  id: string; periodLabel: string; periodStart: string; periodEnd: string;
  deliveryCount: number; amountCents: number; status: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending_documents: { label: 'Aguardando docs', color: 'text-amber-400 bg-amber-500/10' },
  documents_received: { label: 'Em análise', color: 'text-blue-400 bg-blue-500/10' },
  approved: { label: 'Aprovado', color: 'text-green-400 bg-green-500/10' },
  paid: { label: 'Pago', color: 'text-green-500 bg-green-500/10' },
};

const fmtMoney = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR');

export default function RiderHistoricoPage() {
  const router = useRouter();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rider/quinzenas')
      .then(r => { if (r.status === 401) { router.push('/rider/login'); return null; } return r.json(); })
      .then(d => d && setPeriods(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const anoAtual = new Date().getFullYear();
  const totalAno = periods
    .filter(p => ['approved', 'paid'].includes(p.status) && new Date(p.periodEnd).getFullYear() === anoAtual)
    .reduce((s, p) => s + p.amountCents, 0);

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
            <h1 className="text-sm font-bold text-white">Histórico de Quinzenas</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Totalizador */}
        {totalAno > 0 && (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total recebido em {anoAtual}</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{fmtMoney(totalAno)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400/30" />
          </div>
        )}

        {/* Lista completa */}
        {loading ? (
          <div className="space-y-2">
            {[0,1,2,3].map(i => <div key={i} className="h-16 bg-[#1c1c1e] rounded-xl animate-pulse" />)}
          </div>
        ) : periods.length === 0 ? (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-10 text-center">
            <p className="text-gray-500 text-sm">Nenhuma quinzena encontrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {periods.map((period) => {
              const st = STATUS_LABEL[period.status] ?? { label: period.status, color: 'text-gray-400 bg-gray-500/10' };
              return (
                <Link key={period.id} href={`/rider/quinzena/${period.id}`}
                  className="flex items-center justify-between bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-4 hover:bg-[#1e1e20] transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-white">{period.periodLabel}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmtDate(period.periodStart)} – {fmtDate(period.periodEnd)} · {period.deliveryCount} entregas
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-bold text-green-400">{fmtMoney(period.amountCents)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
