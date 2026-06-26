'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bike, LogOut, Clock, FileText, CheckCircle, DollarSign, ChevronRight, History } from 'lucide-react';

interface Document { documentType: string; status: string }
interface Period {
  id: string; periodLabel: string; periodStart: string; periodEnd: string;
  deliveryCount: number; amountCents: number; status: string;
  documents: Document[];
}

const STATUS_CONFIG = {
  pending_documents: { label: 'Aguardando seus documentos', color: 'text-amber-400 bg-amber-500/10', icon: Clock, action: 'Enviar documentos' },
  documents_received: { label: 'Documentos enviados — em análise', color: 'text-blue-400 bg-blue-500/10', icon: FileText, action: null },
  approved: { label: 'Aprovado', color: 'text-green-400 bg-green-500/10', icon: CheckCircle, action: null },
  paid: { label: 'Pago', color: 'text-green-500 bg-green-500/10', icon: DollarSign, action: null },
};

const fmtMoney = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

export default function RiderDashboard() {
  const router = useRouter();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    fetch('/api/rider/quinzenas', { credentials: 'include' })
      .then(r => {
        if (r.status === 401) {
          setAuthError(true);
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then(d => d && setPeriods(d))
      .catch(() => setAuthError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/rider/auth', { method: 'DELETE' });
    router.push('/rider/login');
  };

  const recentes = periods.slice(0, 5);
  const pendente = periods.find(p => p.status === 'pending_documents');

  if (authError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
            <LogOut className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <p className="text-white font-semibold">Sessão inválida ou expirada</p>
            <p className="text-sm text-gray-500 mt-1">Faça login novamente para continuar.</p>
          </div>
          <a href="/rider/login"
            className="block w-full py-3 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 transition-colors">
            Ir para o login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#111113] border-b border-[#2a2a2e] px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Bike className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Portal do Motoboy</h1>
              <p className="text-xs text-gray-500">Plateful RH</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center text-gray-400 hover:text-red-400">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Ação principal */}
        {pendente && (
          <Link href={`/rider/quinzena/${pendente.id}`}
            className="block bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 hover:bg-amber-500/15 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <p className="font-semibold text-amber-400">Ação necessária</p>
            </div>
            <p className="text-white font-medium">{pendente.periodLabel}</p>
            <p className="text-sm text-gray-400 mt-1">
              {fmtDate(pendente.periodStart)} – {fmtDate(pendente.periodEnd)} · {pendente.deliveryCount} entregas · {fmtMoney(pendente.amountCents)}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-amber-400">Enviar NF e boleto</span>
              <ChevronRight className="w-5 h-5 text-amber-400" />
            </div>
          </Link>
        )}

        {/* Quinzenas recentes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Quinzenas Recentes</h2>
            <Link href="/rider/historico" className="text-xs text-orange-400 flex items-center gap-1 hover:underline">
              <History className="w-3 h-3" /> Ver tudo
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0,1,2].map(i => <div key={i} className="h-16 bg-[#1c1c1e] rounded-xl animate-pulse" />)}
            </div>
          ) : recentes.length === 0 ? (
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-8 text-center">
              <p className="text-gray-500 text-sm">Nenhuma quinzena disponível ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentes.map((period) => {
                const cfg = STATUS_CONFIG[period.status as keyof typeof STATUS_CONFIG]
                  ?? { label: period.status, color: 'text-gray-400 bg-gray-500/10', icon: FileText, action: null };
                const Icon = cfg.icon;
                return (
                  <Link key={period.id} href={`/rider/quinzena/${period.id}`}
                    className="flex items-center justify-between bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3.5 hover:bg-[#1e1e20] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                        <Icon className="w-3.5 h-3.5" />{cfg.label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{fmtMoney(period.amountCents)}</p>
                      <p className="text-xs text-gray-500">{period.periodLabel}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
