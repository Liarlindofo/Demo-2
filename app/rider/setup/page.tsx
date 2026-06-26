'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Bike, Loader2, Check, Eye, EyeOff, LogIn } from 'lucide-react';

const inputCls = 'w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors';

function SetupForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState<{ email: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('As senhas não coincidem'); return; }
    if (password.length < 6) { setError('A senha deve ter ao menos 6 caracteres'); return; }
    if (!token) { setError('Token inválido. Use o link enviado pelo gestor.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/rider/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup', token, newPassword: password }),
      });
      let data: { error?: string; email?: string } = {};
      try { data = await res.json(); } catch { /* resposta não-JSON */ }
      if (!res.ok) { setError(data.error ?? 'Erro ao configurar senha. Tente novamente.'); return; }
      setSucesso({ email: data.email ?? '' });
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-red-400">Link inválido ou expirado.</p>
        <p className="text-sm text-gray-500">Peça um novo convite ao seu gestor.</p>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
          <Check className="w-7 h-7 text-green-400" />
        </div>
        <div className="space-y-1">
          <p className="text-white font-semibold">Senha criada com sucesso!</p>
          <p className="text-sm text-gray-400">
            Agora acesse o portal com seu e-mail e a senha que você acabou de criar.
          </p>
        </div>
        {sucesso.email && (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-gray-300 text-left">
            <span className="text-gray-500 text-xs block mb-0.5">Seu e-mail de acesso</span>
            {sucesso.email}
          </div>
        )}
        <Link
          href="/rider/login"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Entrar no portal
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">Nova senha</label>
        <div className="relative">
          <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres" required className={`${inputCls} pr-11`} />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-400 mb-1.5 block">Confirmar senha</label>
        <input type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
          placeholder="Repita a senha" required className={inputCls} />
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 disabled:opacity-50 transition-colors">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Criar senha
      </button>
    </form>
  );
}

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <Bike className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Criar sua senha</h1>
          <p className="text-sm text-gray-500 mt-1">Defina a senha para acessar o portal do motoboy</p>
        </div>
        <Suspense fallback={<div className="text-center text-gray-500 text-sm">Carregando...</div>}>
          <SetupForm />
        </Suspense>
      </div>
    </div>
  );
}
