'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Check, Loader2, DollarSign } from 'lucide-react';

interface Rider { id: string; name: string; loja: { nome: string } }

const inputCls = 'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors';
const selectCls = 'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors appearance-none cursor-pointer';
const labelCls = 'text-xs font-medium text-gray-400 mb-1.5 block';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function calcPeriod(mes: number, ano: number, quinzena: 1 | 2) {
  // mes: 1–12
  const monthIdx = mes - 1;
  const monthName = MESES[monthIdx];
  if (quinzena === 1) {
    const start = new Date(ano, monthIdx, 1).toISOString().split('T')[0];
    const end   = new Date(ano, monthIdx, 15).toISOString().split('T')[0];
    return { label: `1ª Quinzena ${monthName}/${ano}`, start, end };
  }
  const start = new Date(ano, monthIdx, 16).toISOString().split('T')[0];
  const end   = new Date(ano, monthIdx + 1, 0).toISOString().split('T')[0]; // último dia do mês
  return { label: `2ª Quinzena ${monthName}/${ano}`, start, end };
}

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

export default function NovaQuinzenaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [rider, setRider] = useState<Rider | null>(null);

  // Período — mês, ano e quinzena
  const now = new Date();
  const [mes,      setMes]      = useState(now.getMonth() + 1);             // 1–12
  const [ano,      setAno]      = useState(now.getFullYear());
  const [quinzena, setQuinzena] = useState<1 | 2>(now.getDate() <= 15 ? 1 : 2);

  const { label, start: periodStart, end: periodEnd } = calcPeriod(mes, ano, quinzena);

  // Financeiro
  const [deliveriesDisplay, setDeliveriesDisplay] = useState('');
  const [deliveriesCents,   setDeliveriesCents]   = useState(0);
  const [dailyDisplay,      setDailyDisplay]       = useState('');
  const [dailyCents,        setDailyCents]         = useState(0);
  const [discountDisplay,   setDiscountDisplay]    = useState('');
  const [discountCents,     setDiscountCents]      = useState(0);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const totalBrutoCents = deliveriesCents + dailyCents;
  const netCents = Math.max(0, totalBrutoCents - discountCents);

  // Anos disponíveis: ano atual e os 2 anteriores
  const anos = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

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
    try {
      const res = await fetch(`/api/rh/motoboys/${id}/quinzenas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodLabel: label,
          periodStart,
          periodEnd,
          amountCents:    totalBrutoCents,
          dailyRateCents: dailyCents,
          discountCents,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erro ao lançar quinzena'); return; }
      router.push(`/rh/motoboys/${id}`);
    } finally { setSaving(false); }
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

          {/* Período */}
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 space-y-4">

            {/* Mês + Ano */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Mês *</label>
                <div className="relative">
                  <select
                    value={mes}
                    onChange={e => setMes(Number(e.target.value))}
                    className={selectCls}
                  >
                    {MESES.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Ano *</label>
                <div className="relative">
                  <select
                    value={ano}
                    onChange={e => setAno(Number(e.target.value))}
                    className={selectCls}
                  >
                    {anos.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quinzena */}
            <div>
              <label className={labelCls}>Quinzena *</label>
              <div className="grid grid-cols-2 gap-3">
                {([1, 2] as const).map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuinzena(q)}
                    className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                      quinzena === q
                        ? 'bg-orange-500 text-black border-orange-500'
                        : 'bg-[#0a0a0a] text-gray-300 border-[#2a2a2e] hover:border-orange-500/40'
                    }`}
                  >
                    {q === 1 ? '1ª Quinzena' : '2ª Quinzena'}
                    <span className={`block text-xs mt-0.5 font-normal ${quinzena === q ? 'text-black/70' : 'text-gray-600'}`}>
                      {q === 1 ? `01 – 15 ${MESES[mes - 1].slice(0, 3)}` : `16 – ${new Date(ano, mes, 0).getDate()} ${MESES[mes - 1].slice(0, 3)}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview do período */}
            <div className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-gray-500">Período gerado</span>
              <span className="text-xs font-semibold text-orange-400">{label}</span>
            </div>

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
              <label className={labelCls}>Valor da diária</label>
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

          {/* Total a pagar */}
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
