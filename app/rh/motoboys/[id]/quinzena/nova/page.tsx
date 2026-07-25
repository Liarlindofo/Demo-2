'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Check, Loader2, DollarSign } from 'lucide-react';

interface Rider { id: string; name: string; loja: { nome: string } }

const inputCls = 'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors';
const labelCls = 'text-xs font-medium text-gray-400 mb-1.5 block';

function fmt(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseCents(display: string): number {
  return parseInt(display.replace(/\D/g, '') || '0', 10);
}

function maskMoney(v: string): string {
  const cents = parseInt(v.replace(/\D/g, '') || '0', 10);
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function periodFromStart(startIso: string): { label: string; end: string } {
  const d = new Date(startIso + 'T12:00:00');
  const day = d.getDate();
  const month = d.toLocaleString('pt-BR', { month: 'long' });
  const year = d.getFullYear();
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
  if (day <= 15) {
    const end = new Date(year, d.getMonth(), 15).toISOString().split('T')[0];
    return { label: `1ª Quinzena ${monthCap}/${year}`, end };
  }
  const end = new Date(year, d.getMonth() + 1, 0).toISOString().split('T')[0];
  return { label: `2ª Quinzena ${monthCap}/${year}`, end };
}

function defaultStart(): string {
  const now = new Date();
  const day = now.getDate();
  return day <= 15
    ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    : new Date(now.getFullYear(), now.getMonth(), 16).toISOString().split('T')[0];
}

export default function NovaQuinzenaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [rider, setRider] = useState<Rider | null>(null);

  const [periodStart, setPeriodStart] = useState(defaultStart());
  const [periodEnd, setPeriodEnd] = useState(() => periodFromStart(defaultStart()).end);
  const [deliveriesDisplay, setDeliveriesDisplay] = useState('');
  const [deliveriesCents, setDeliveriesCents] = useState(0);

  const [dailyDisplay, setDailyDisplay] = useState('');
  const [dailyCents, setDailyCents] = useState(0);

  const [discountDisplay, setDiscountDisplay] = useState('');
  const [discountCents, setDiscountCents] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const totalBrutoCents = deliveriesCents + dailyCents;
  const netCents = Math.max(0, totalBrutoCents - discountCents);

  useEffect(() => {
    fetch(`/api/rh/motoboys/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setRider);
  }, [id]);

  const handleMoney = (
    v: string,
    setDisplay: (s: string) => void,
    setCents: (n: number) => void,
  ) => {
    setDisplay(maskMoney(v));
    setCents(parseCents(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (totalBrutoCents <= 0) { setError('Informe ao menos o valor das entregas ou das diárias'); return; }
    setSaving(true);
    const { label } = periodFromStart(periodStart);
    try {
      const res = await fetch(`/api/rh/motoboys/${id}/quinzenas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodLabel: label,
          periodStart,
          periodEnd,
          amountCents: totalBrutoCents,
          dailyRateCents: dailyCents,
          discountCents,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erro ao lançar quinzena'); return; }
      router.push(`/rh/motoboys/${id}`);
    } finally { setSaving(false); }
  };

  const { label: previewLabel } = periodFromStart(periodStart);

  const handleStartChange = (v: string) => {
    setPeriodStart(v);
    setPeriodEnd(periodFromStart(v).end);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e]">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Lançar Quinzena</h1>
              {rider && <p className="text-xs text-gray-500">{rider.name} · {rider.loja?.nome}</p>}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Campos principais */}
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 space-y-4">

            {/* Data de início + Data fim */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Data de início *</label>
                <input type="date" value={periodStart}
                  onChange={e => handleStartChange(e.target.value)}
                  required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Data fim *</label>
                <input type="date" value={periodEnd}
                  onChange={e => setPeriodEnd(e.target.value)}
                  required className={inputCls} />
              </div>
            </div>
            <p className="text-xs text-gray-600 -mt-2">{previewLabel}</p>

            <div className="border-t border-[#2a2a2e]" />

            {/* Valor total das entregas */}
            <div>
              <label className={labelCls}>Valor total das entregas *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input value={deliveriesDisplay}
                  onChange={e => handleMoney(e.target.value, setDeliveriesDisplay, setDeliveriesCents)}
                  placeholder="0,00" className={`${inputCls} pl-9`} />
              </div>
            </div>

            {/* Valor total de diárias */}
            <div>
              <label className={labelCls}>Valor total de diárias</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input value={dailyDisplay}
                  onChange={e => handleMoney(e.target.value, setDailyDisplay, setDailyCents)}
                  placeholder="0,00" className={`${inputCls} pl-9`} />
              </div>
            </div>

            <div className="border-t border-[#2a2a2e]" />

            {/* Desconto */}
            <div>
              <label className={labelCls}>Valor de desconto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input value={discountDisplay}
                  onChange={e => handleMoney(e.target.value, setDiscountDisplay, setDiscountCents)}
                  placeholder="0,00" className={`${inputCls} pl-9`} />
              </div>
            </div>
          </div>

          {/* Total a pagar — sempre visível */}
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total a pagar ao motoboy</p>
            <div className="space-y-2">
              {deliveriesCents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Entregas</span>
                  <span className="text-white">{fmt(deliveriesCents)}</span>
                </div>
              )}
              {dailyCents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Diárias</span>
                  <span className="text-white">+ {fmt(dailyCents)}</span>
                </div>
              )}
              {discountCents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Desconto</span>
                  <span className="text-red-400">− {fmt(discountCents)}</span>
                </div>
              )}
              <div className="border-t border-[#2a2a2e] pt-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-white">A receber</span>
                <span className={`text-2xl font-bold ${netCents > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                  {fmt(netCents)}
                </span>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Lançar Quinzena
          </button>
        </form>
      </div>
    </div>
  );
}
