'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Check, Loader2, DollarSign, Bike, Tag, FileText, Info } from 'lucide-react';

interface Rider { id: string; name: string; loja: { nome: string } }

const inputCls = 'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors';
const labelCls = 'text-xs font-medium text-gray-400 mb-1.5 block';

function fmt(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseCents(display: string): number {
  const nums = display.replace(/\D/g, '');
  return parseInt(nums || '0', 10);
}

function maskMoney(v: string): string {
  const nums = v.replace(/\D/g, '');
  const cents = parseInt(nums || '0', 10);
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function currentQuinzena() {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString('pt-BR', { month: 'long' });
  const year = now.getFullYear();
  const half = day <= 15 ? '1ª' : '2ª';
  const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
  return {
    label: `${half} Quinzena ${monthCap}/${year}`,
    start: day <= 15
      ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      : new Date(now.getFullYear(), now.getMonth(), 16).toISOString().split('T')[0],
    end: day <= 15
      ? new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split('T')[0]
      : new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
  };
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-[#2a2a2e] mb-4">
      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function NovaQuinzenaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [rider, setRider] = useState<Rider | null>(null);
  const q = currentQuinzena();

  // Período
  const [periodLabel, setPeriodLabel] = useState(q.label);
  const [periodStart, setPeriodStart] = useState(q.start);
  const [periodEnd, setPeriodEnd] = useState(q.end);

  // Pagamento
  const [deliveryCount, setDeliveryCount] = useState('');
  const [totalDisplay, setTotalDisplay] = useState('');   // valor total bruto
  const [totalCents, setTotalCents] = useState(0);
  const [dailyDisplay, setDailyDisplay] = useState('');  // valor por entrega/diária
  const [dailyCents, setDailyCents] = useState(0);

  // Descontos
  const [discountDisplay, setDiscountDisplay] = useState('');
  const [discountCents, setDiscountCents] = useState(0);
  const [discountNotes, setDiscountNotes] = useState('');

  // Mensagem
  const [summary, setSummary] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Valor líquido a receber = total - desconto
  const netCents = Math.max(0, totalCents - discountCents);

  // Valor por entrega automático quando total e qtd estão preenchidos
  const autoDaily = totalCents > 0 && parseInt(deliveryCount || '0') > 0
    ? Math.round(totalCents / parseInt(deliveryCount))
    : 0;

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
    const cents = parseCents(v);
    setDisplay(maskMoney(v));
    setCents(cents);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (totalCents <= 0) { setError('Informe o valor total da quinzena'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/rh/motoboys/${id}/quinzenas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodLabel,
          periodStart,
          periodEnd,
          deliveryCount: parseInt(deliveryCount || '0', 10),
          amountCents: totalCents,
          dailyRateCents: dailyCents || autoDaily,
          discountCents,
          discountNotes: discountNotes || undefined,
          summary: summary || undefined,
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
            className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e]"
          >
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
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
            <SectionTitle icon={<Bike className="w-4 h-4 text-orange-400" />} title="Período" />
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Rótulo *</label>
                <input value={periodLabel} onChange={e => setPeriodLabel(e.target.value)}
                  placeholder="1ª Quinzena Junho/2026" required className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Data início *</label>
                  <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                    required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Data fim *</label>
                  <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
                    required className={inputCls} />
                </div>
              </div>
            </div>
          </div>

          {/* Pagamento */}
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
            <SectionTitle
              icon={<DollarSign className="w-4 h-4 text-orange-400" />}
              title="Pagamento"
              subtitle="O valor total já inclui todas as diárias do período"
            />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Qtd. de entregas</label>
                  <input type="number" min="0" value={deliveryCount}
                    onChange={e => setDeliveryCount(e.target.value)}
                    placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Valor total bruto *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <input value={totalDisplay}
                      onChange={e => handleMoney(e.target.value, setTotalDisplay, setTotalCents)}
                      placeholder="0,00" className={`${inputCls} pl-9`} />
                  </div>
                </div>
              </div>

              {/* Valor por diária */}
              <div>
                <label className={labelCls}>
                  Valor por entrega / diária
                  <span className="text-gray-600 font-normal ml-1">(informativo para o motoboy)</span>
                </label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <input value={dailyDisplay}
                      onChange={e => handleMoney(e.target.value, setDailyDisplay, setDailyCents)}
                      placeholder={autoDaily > 0 ? (autoDaily / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                  {autoDaily > 0 && !dailyCents && (
                    <button type="button"
                      onClick={() => {
                        setDailyDisplay(maskMoney(String(autoDaily)));
                        setDailyCents(autoDaily);
                      }}
                      className="flex-shrink-0 px-3 py-3 text-xs text-orange-400 border border-orange-500/30 rounded-xl hover:bg-orange-500/10 transition-colors whitespace-nowrap"
                    >
                      Usar {fmt(autoDaily)}
                    </button>
                  )}
                </div>
                {autoDaily > 0 && (
                  <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Calculado automaticamente: {fmt(totalCents)} ÷ {deliveryCount} entregas = {fmt(autoDaily)} por entrega
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Descontos */}
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
            <SectionTitle
              icon={<Tag className="w-4 h-4 text-orange-400" />}
              title="Descontos"
              subtitle="Consumo de produtos na loja (pizza, refrigerante, etc.)"
            />
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Valor de desconto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                  <input value={discountDisplay}
                    onChange={e => handleMoney(e.target.value, setDiscountDisplay, setDiscountCents)}
                    placeholder="0,00" className={`${inputCls} pl-9`} />
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  Detalhamento do consumo
                  <span className="text-gray-600 font-normal ml-1">(opcional — especifica o que foi consumido)</span>
                </label>
                <textarea value={discountNotes}
                  onChange={e => setDiscountNotes(e.target.value)}
                  placeholder={"2x Pizza Calabresa (R$ 15,00 cada)\n1x Refrigerante 2L (R$ 12,00)"}
                  rows={3} className={`${inputCls} resize-none`} />
              </div>
            </div>
          </div>

          {/* Mensagem para o motoboy */}
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
            <SectionTitle
              icon={<FileText className="w-4 h-4 text-orange-400" />}
              title="Mensagem para o motoboy"
              subtitle="Opcional — observações gerais sobre a quinzena"
            />
            <textarea value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Inclui bônus de assiduidade, adiantamento já realizado..."
              rows={3} className={`${inputCls} resize-none`} />
          </div>

          {/* Resumo calculado — sempre visível quando há valor */}
          {totalCents > 0 && (
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Resumo da quinzena</p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Valor total bruto</span>
                  <span className="text-white font-medium">{fmt(totalCents)}</span>
                </div>
                {(dailyCents || autoDaily) > 0 && parseInt(deliveryCount || '0') > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 text-xs pl-3">
                      ↳ {deliveryCount} entregas × {fmt(dailyCents || autoDaily)}
                    </span>
                    <span className="text-gray-500 text-xs">(diárias)</span>
                  </div>
                )}
                {discountCents > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Desconto (consumo)</span>
                    <span className="text-red-400 font-medium">− {fmt(discountCents)}</span>
                  </div>
                )}
                <div className="border-t border-[#2a2a2e] pt-2 flex justify-between">
                  <span className="text-sm font-semibold text-white">Valor a receber</span>
                  <span className="text-xl font-bold text-green-400">{fmt(netCents)}</span>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Lançar Quinzena
          </button>
        </form>
      </div>
    </div>
  );
}
