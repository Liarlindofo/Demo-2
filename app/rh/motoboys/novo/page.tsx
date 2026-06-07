'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bike, Check, Copy, Loader2 } from 'lucide-react';

interface Loja { id: string; nome: string }

const inputCls = 'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors';

function maskCPF(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
}

export default function NovoMotoboyPage() {
  const router = useRouter();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [form, setForm] = useState({ name: '', cpf: '', email: '', phone: '', lojaId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState<{ inviteToken: string; reativado?: boolean } | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch('/api/rh/lojas').then(r => r.ok ? r.json() : []).then((ls: Loja[]) => {
      setLojas(ls);
      if (ls.length > 0) setForm(f => ({ ...f, lojaId: ls[0].id }));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let data;
      try {
        const res = await fetch('/api/rh/motoboys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, cpf: form.cpf.replace(/\D/g, '') }),
        });
        data = await res.json();
        if (!res.ok) { setError(data.error ?? 'Erro ao cadastrar'); return; }
      } catch {
        setError('Erro de comunicação com o servidor. Tente novamente.');
        return;
      }
      setSucesso({ inviteToken: data.inviteToken, reativado: !!data.reativado });
    } finally { setSaving(false); }
  };

  const inviteUrl = sucesso
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/rider/setup?token=${sucesso.inviteToken}`
    : '';

  const copiarLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-8 space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
            <Check className="w-7 h-7 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {sucesso.reativado ? 'Motoboy reativado!' : 'Motoboy cadastrado!'}
          </h2>
          <p className="text-sm text-gray-400">
            {sucesso.reativado
              ? 'O motoboy foi reativado. Envie o novo link de convite para que ele defina sua senha:'
              : 'Envie o link abaixo para que o motoboy crie sua senha e acesse o portal:'}
          </p>
          <div className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-3 text-xs text-gray-300 break-all text-left">
            {inviteUrl}
          </div>
          <button
            onClick={copiarLink}
            className="flex items-center gap-2 mx-auto px-4 py-2.5 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 transition-colors"
          >
            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiado ? 'Copiado!' : 'Copiar link'}
          </button>
          <div className="flex gap-3 pt-2">
            <button onClick={() => router.push('/rh/motoboys')} className="flex-1 py-2.5 border border-[#2a2a2e] text-gray-300 text-sm rounded-xl hover:bg-[#2a2a2e] transition-colors">
              Ver lista
            </button>
            <button onClick={() => { setSucesso(null); setForm({ name: '', cpf: '', email: '', phone: '', lojaId: lojas[0]?.id ?? '' }); }}
              className="flex-1 py-2.5 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 transition-colors">
              Novo cadastro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e]">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Bike className="w-5 h-5 text-orange-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Cadastrar Motoboy</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Nome completo *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="João da Silva" required className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">CPF *</label>
              <input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: maskCPF(e.target.value) }))}
                placeholder="000.000.000-00" required className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Telefone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="(41) 99999-9999" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">E-mail * (será o login do portal)</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="joao@email.com" required className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Loja vinculada *</label>
            <select value={form.lojaId} onChange={e => setForm(f => ({ ...f, lojaId: e.target.value }))}
              required className={inputCls}>
              {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Cadastrar e gerar link de convite
          </button>
        </form>
      </div>
    </div>
  );
}
