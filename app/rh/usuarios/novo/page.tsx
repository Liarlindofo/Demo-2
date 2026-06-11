'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Mail, User, Send } from 'lucide-react';

export default function ConvidarUsuarioPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', displayName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/rh/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), displayName: form.displayName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erro ao convidar'); return; }
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="max-w-sm mx-auto text-center space-y-4 px-4">
          <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto">
            <Send className="w-7 h-7 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Convite registrado!</h2>
          <p className="text-sm text-gray-400">
            <strong className="text-white">{form.email}</strong> foi adicionado à equipe RH.
            Quando essa pessoa fizer login com este e-mail, terá acesso automático.
          </p>
          <p className="text-xs text-gray-500 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3">
            Link de acesso: <span className="text-amber-400 font-mono">{window.location.origin}/auth/login</span>
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/rh/usuarios')}
              className="px-4 py-2 bg-amber-500 text-black text-sm font-semibold rounded-xl hover:bg-amber-400 transition-colors"
            >
              Ver equipe
            </button>
            <button
              onClick={() => { setSuccess(false); setForm({ email: '', displayName: '' }); }}
              className="px-4 py-2 bg-[#1c1c1e] border border-[#2a2a2e] text-sm text-gray-300 rounded-xl hover:bg-[#2a2a2e] transition-colors"
            >
              Convidar outro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/rh/usuarios')}
            className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-amber-400" />
              Convidar usuário de RH
            </h1>
            <p className="text-sm text-gray-400">A pessoa receberá acesso ao módulo com as permissões que você configurar</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Nome (opcional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                placeholder="Ex: João Silva"
                className="w-full bg-[#252528] border border-[#2a2a2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-amber-500/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              E-mail <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
                className="w-full bg-[#252528] border border-[#2a2a2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-amber-500/50 focus:outline-none transition-colors"
              />
            </div>
            <p className="text-xs text-gray-500">
              A pessoa deve fazer login com exatamente este e-mail em{' '}
              <span className="text-amber-400">/auth/login</span> para ter acesso.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/rh/usuarios')}
              className="flex-1 py-2.5 bg-[#252528] border border-[#2a2a2e] text-sm text-gray-300 rounded-xl hover:bg-[#2a2a2e] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !form.email}
              className="flex-1 py-2.5 bg-amber-500 text-black text-sm font-semibold rounded-xl hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Convidar
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info card */}
        <div className="bg-[#1c1c1e] border border-amber-500/20 rounded-2xl p-4 text-sm text-gray-400 space-y-2">
          <p className="text-amber-400 font-medium text-xs uppercase tracking-wider">Como funciona</p>
          <ul className="space-y-1.5 text-xs">
            <li>• O usuário convidado começa <strong className="text-white">sem nenhuma permissão</strong></li>
            <li>• Após convidar, você configura individualmente quais permissões ele terá</li>
            <li>• O acesso é ativado automaticamente quando a pessoa fizer login com este e-mail</li>
            <li>• Role <strong className="text-white">RH</strong> — não pode criar outros usuários nem alterar permissões</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
