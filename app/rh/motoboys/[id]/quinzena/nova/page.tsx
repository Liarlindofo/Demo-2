'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Bike, Check, Loader2, DollarSign } from 'lucide-react';

interface Rider { id: string; name: string; loja: { nome: string } }

const inputCls = 'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors';

function maskMoney(v: string) {
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

export default function NovaQuinzenaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [rider, setRider] = useState<Rider | null>(null);
  const q = currentQuinzena();
  const [form, setForm] = useState({
    periodLabel: q.label,
    periodStart: q.start,
    periodEnd: q.end,
    deliveryCount: '',
    amountDisplay: '',
    amountCents: 0,
    summary: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/rh/motoboys/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(setRider);
  }, [id]);

  const handleMoney = (v: string) => {
    const nums = v.replace(/\D/g, '');
    const cents = parseInt(nums || '0', 10);
    setForm(f => ({ ...f, amountDisplay: maskMoney(v), amountCents: cents }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.amountCents <= 0) { setError('Informe um valor válido'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/rh/motoboys/${id}/quinzenas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodLabel: form.periodLabel,
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          deliveryCount: parseInt(form.deliveryCount || '0', 10),
          amountCents: form.amountCents,
          summary: form.summary || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erro ao lançar quinzena'); return; }
      router.push(`/rh/motoboys/${id}`);
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e]">
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

        <form onSubmit={handleSubmit} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Rótulo do período *</label>
            <input value={form.periodLabel} onChange={e => setForm(f => ({ ...f, periodLabel: e.target.value }))}
              placeholder="1ª Quinzena Junho/2026" required className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Data início *</label>
              <input type="date" value={form.periodStart} onChange={e => setForm(f => ({ ...f, periodStart: e.target.value }))}
                required className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Data fim *</label>
              <input type="date" value={form.periodEnd} onChange={e => setForm(f => ({ ...f, periodEnd: e.target.value }))}
                required className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Qtd. de entregas *</label>
              <input type="number" min="0" value={form.deliveryCount}
                onChange={e => setForm(f => ({ ...f, deliveryCount: e.target.value }))}
                placeholder="0" required className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Valor a receber (R$) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                <input value={form.amountDisplay}
                  onChange={e => handleMoney(e.target.value)}
                  placeholder="0,00" className={`${inputCls} pl-9`} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Mensagem para o motoboy (opcional)</label>
            <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="Inclui bônus de assiduidade, descontado adiantamento..."
              rows={3} className={`${inputCls} resize-none`} />
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

          {form.amountCents > 0 && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-400">Valor confirmado:</span>
              <span className="text-lg font-bold text-green-400">
                {(form.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Lançar Quinzena
          </button>
        </form>
      </div>
    </div>
  );
}
