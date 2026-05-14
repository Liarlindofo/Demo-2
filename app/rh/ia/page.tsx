'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Send, Trash2, User, AlertCircle, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citacoes?: string[];
  error?: boolean;
}

const QUICK_QUESTIONS = [
  'Alíquotas INSS patronal 2025',
  'Custo total funcionário R$ 1.800',
  'Obrigações escala 6x1 CLT',
  'Migração 6x1 → 5x2 — o que muda?',
  'Salário mínimo e piso PR 2025',
  'Calcular IRRF progressivo',
  'Encargos Sistema S alimentação',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function IaPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (pergunta: string) => {
    if (!pergunta.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: pergunta.trim(),
    };

    const historico = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/rh/ia/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pergunta: pergunta.trim(),
          historico: historico.length > 0 ? historico : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const isKeyError =
          res.status === 500 &&
          (err.error?.includes('API') || err.error?.includes('key') || err.error?.includes('token'));
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: isKeyError
              ? 'A chave de API para a IA não está configurada. Configure a variável PERPLEXITY_API_KEY no .env para usar este recurso.'
              : err.error ?? 'Ocorreu um erro ao processar sua consulta.',
            error: true,
          },
        ]);
        return;
      }

      const data: { resposta: string; citacoes?: string[] } = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.resposta,
          citacoes: data.citacoes,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Erro de conexão. Verifique sua internet e tente novamente.',
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-[#2a2a2e] bg-[#0a0a0a] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/rh')}
              className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white leading-tight">IA Trabalhista</h1>
                <p className="text-xs text-gray-500">Consulte a legislação trabalhista vigente</p>
              </div>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-[#1c1c1e] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar conversa
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="w-20 h-20 rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                <Bot className="w-10 h-10 text-pink-400" />
              </div>
              <div className="text-center max-w-sm">
                <h2 className="text-xl font-bold text-white mb-2">IA Trabalhista</h2>
                <p className="text-sm text-gray-400">
                  Faça perguntas sobre legislação trabalhista, cálculo de encargos, escalas de
                  trabalho e obrigações CLT.
                </p>
              </div>

              {/* Quick questions */}
              <div className="w-full">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center mb-3">
                  Perguntas rápidas
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-4 py-2 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-sm text-gray-300 hover:border-pink-500/40 hover:text-white hover:bg-[#222224] transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div
                  className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 ${
                    msg.error ? 'bg-red-500/10' : 'bg-pink-500/10'
                  }`}
                >
                  {msg.error ? (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <Bot className="w-4 h-4 text-pink-400" />
                  )}
                </div>
              )}

              <div
                className={`max-w-[75%] ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-black font-medium rounded-br-md'
                      : msg.error
                      ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-bl-md'
                      : 'bg-[#1c1c1e] border border-[#2a2a2e] text-gray-200 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>

                {msg.citacoes && msg.citacoes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 px-1">
                    {msg.citacoes.map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-[#2a2a2e] text-xs text-gray-400 border border-[#3a3a3e]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl flex-shrink-0 bg-amber-500/10 flex items-center justify-center mt-0.5">
                  <User className="w-4 h-4 text-amber-400" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl flex-shrink-0 bg-pink-500/10 flex items-center justify-center mt-0.5">
                <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[#1c1c1e] border border-[#2a2a2e]">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick chips (shown in chat) */}
      {messages.length > 0 && !loading && (
        <div className="border-t border-[#2a2a2e] bg-[#0a0a0a]">
          <div className="max-w-4xl mx-auto px-4 pt-3 pb-1">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {QUICK_QUESTIONS.slice(0, 4).map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-xs text-gray-400 hover:text-white hover:border-pink-500/30 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[#2a2a2e] bg-[#0a0a0a] sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-3 focus-within:border-pink-500/30 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Faça uma pergunta sobre legislação trabalhista..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none resize-none leading-relaxed max-h-32"
              style={{ minHeight: '24px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-pink-500 flex items-center justify-center hover:bg-pink-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 self-end"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-xs text-gray-700 text-center mt-2">
            Enter para enviar • Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
