'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bike, Loader2, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';

const inputCls =
  'w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors';

// ─── Formulário de recuperação de senha ──────────────────────────────────────

function ForgotPasswordForm({ onVoltar }: { onVoltar: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await fetch('/api/rider/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Sempre mostra sucesso — não revelamos se o e-mail existe
      setEnviado(true);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-7 h-7 text-green-400" />
        </div>
        <div className="space-y-1">
          <p className="text-white font-semibold">E-mail enviado!</p>
          <p className="text-sm text-gray-400">
            Se o e-mail <span className="text-white">{email}</span> estiver cadastrado,
            você receberá um link para redefinir sua senha em instantes.
          </p>
        </div>
        <p className="text-xs text-gray-600">O link expira em 24 horas.</p>
        <button
          onClick={onVoltar}
          className="w-full py-3 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-gray-300 text-sm font-medium hover:bg-[#2a2a2e] transition-colors"
        >
          Voltar ao login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button onClick={onVoltar} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao login
      </button>

      <div>
        <h2 className="text-lg font-bold text-white">Esqueceu a senha?</h2>
        <p className="text-sm text-gray-400 mt-1">
          Digite seu e-mail cadastrado e enviaremos um link para criar uma nova senha.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">E-mail</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com" required autoComplete="email"
            className={inputCls}
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
        )}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 disabled:opacity-50 transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Enviar link de redefinição
        </button>
      </form>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function RiderLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [telaForgot, setTelaForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/rider/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* ok */ }
      if (!res.ok) { setError(data.error ?? 'Credenciais inválidas'); return; }
      router.replace('/rider/dashboard');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <Bike className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Portal do Motoboy</h1>
          <p className="text-sm text-gray-500 mt-1">Acesse suas quinzenas e documentos</p>
        </div>

        {/* Conteúdo — login ou recuperação */}
        {telaForgot ? (
          <ForgotPasswordForm onVoltar={() => setTelaForgot(false)} />
        ) : (
          <>
            {/* Formulário de login */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">E-mail</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" required autoComplete="email"
                  className={inputCls}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-400">Senha</label>
                  <button
                    type="button"
                    onClick={() => setTelaForgot(true)}
                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••" required autoComplete="current-password"
                    className={`${inputCls} pr-11`}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
              )}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 disabled:opacity-50 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Entrar
              </button>
            </form>

            {/* Rodapé */}
            <p className="text-center text-xs text-gray-600">
              Primeiro acesso? Use o link enviado por e-mail ou WhatsApp pelo seu gestor.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
