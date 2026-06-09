'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bot,
  Send,
  Trash2,
  User,
  AlertCircle,
  Loader2,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citacoes?: string[];
  error?: boolean;
  acoesExecutadas?: string[];
}

interface Conversa {
  id: string;
  titulo: string | null;
  updatedAt: string;
  mensagens: { content: string }[];
}

const QUICK_QUESTIONS = [
  'Alíquotas INSS patronal 2025',
  'Custo total funcionário R$ 1.800',
  'Obrigações escala 6x1 CLT',
  'Migração 6x1 → 5x2 — o que muda?',
  'Salário mínimo e piso PR 2025',
  'Calcular IRRF progressivo',
  'Encargos FGTS e RAT Simples Nacional',
];

const QUICK_BONIFICACOES = [
  'Quem perde a assiduidade esse mês?',
  'Confirmar assiduidade de todos',
  'Lançar PLR da loja AHU — R$ 500 por funcionário',
  'Ver pagamentos do trimestre atual',
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

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function IaPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loadingConversas, setLoadingConversas] = useState(true);
  const [loadingConversa, setLoadingConversa] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchConversas = useCallback(async () => {
    try {
      const res = await fetch('/api/rh/ia/conversas');
      if (res.ok) {
        const data = await res.json();
        setConversas(data.conversas ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoadingConversas(false);
    }
  }, []);

  useEffect(() => {
    fetchConversas();
  }, [fetchConversas]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadConversa = async (id: string) => {
    if (id === conversaId) return;
    setLoadingConversa(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/rh/ia/conversas/${id}`);
      if (res.ok) {
        const data = await res.json();
        const msgs: Message[] = data.conversa.mensagens.map((m: any) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          citacoes: Array.isArray(m.citacoes) ? m.citacoes : [],
          error: m.isError,
        }));
        setMessages(msgs);
        setConversaId(id);
      }
    } catch {
      // silent
    } finally {
      setLoadingConversa(false);
    }
  };

  const novaConversa = () => {
    setMessages([]);
    setConversaId(null);
    inputRef.current?.focus();
  };

  const deleteConversa = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await fetch(`/api/rh/ia/conversas/${id}`, { method: 'DELETE' });
      setConversas((prev) => prev.filter((c) => c.id !== id));
      if (conversaId === id) {
        setMessages([]);
        setConversaId(null);
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

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
          conversaId: conversaId ?? undefined,
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

      const data: { resposta: string; citacoes?: string[]; conversaId: string; acoesExecutadas?: string[] } = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.resposta,
          citacoes: data.citacoes,
          acoesExecutadas: data.acoesExecutadas,
        },
      ]);

      // Atualizar conversaId se foi criado agora
      if (!conversaId && data.conversaId) {
        setConversaId(data.conversaId);
        // Recarregar lista de conversas para mostrar a nova
        fetchConversas();
      } else {
        // Atualizar updatedAt na lista local
        setConversas((prev) =>
          prev.map((c) => (c.id === data.conversaId ? { ...c, updatedAt: new Date().toISOString() } : c))
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        );
      }
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
    <div className="h-screen overflow-hidden bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 flex flex-col border-r border-[#2a2a2e] bg-[#0d0d0f] h-full transition-all duration-200 ${
          sidebarOpen ? 'w-64' : 'w-12'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-3 border-b border-[#2a2a2e]">
          {sidebarOpen && (
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Histórico
            </span>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#2a2a2e] transition-colors ml-auto"
            title={sidebarOpen ? 'Recolher' : 'Expandir'}
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {sidebarOpen && (
          <>
            {/* Nova conversa */}
            <div className="p-2">
              <button
                onClick={novaConversa}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-[#1c1c1e] border border-dashed border-[#2a2a2e] hover:border-pink-500/30 transition-all"
              >
                <Plus className="w-4 h-4 text-pink-400" />
                Nova conversa
              </button>
            </div>

            {/* Lista de conversas */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingConversas ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                </div>
              ) : conversas.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Nenhuma conversa ainda</p>
                </div>
              ) : (
                conversas.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => loadConversa(c.id)}
                    className={`group w-full text-left px-3 py-2.5 rounded-xl transition-all flex flex-col gap-0.5 relative ${
                      conversaId === c.id
                        ? 'bg-pink-500/10 border border-pink-500/20'
                        : 'hover:bg-[#1c1c1e] border border-transparent'
                    }`}
                  >
                    <span className="text-sm text-gray-200 truncate pr-6 leading-tight">
                      {c.titulo ?? c.mensagens[0]?.content ?? 'Conversa'}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatRelativeDate(c.updatedAt)}
                    </span>
                    <button
                      onClick={(e) => deleteConversa(c.id, e)}
                      disabled={deletingId === c.id}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {/* Collapsed: ícones verticais */}
        {!sidebarOpen && (
          <div className="flex flex-col items-center gap-2 p-2 mt-1">
            <button
              onClick={novaConversa}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-pink-400 hover:bg-[#1c1c1e] transition-colors"
              title="Nova conversa"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-[#2a2a2e] bg-[#0a0a0a] z-10">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
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
                onClick={novaConversa}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-[#1c1c1e] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova conversa
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loadingConversa ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
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
                  <div className="w-full max-w-xl">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center mb-3">
                      Perguntas rápidas
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="px-4 py-2.5 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-sm text-gray-300 text-left hover:border-pink-500/40 hover:text-white hover:bg-[#222224] transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center mb-3 mt-6">
                      Bonificações
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_BONIFICACOES.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="px-4 py-2.5 rounded-xl bg-[#1c1c1e] border border-amber-500/20 text-sm text-gray-300 text-left hover:border-amber-500/50 hover:text-amber-100 hover:bg-amber-500/5 transition-all"
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

                    {msg.acoesExecutadas && msg.acoesExecutadas.length > 0 && (
                      <div className="mt-2 px-1 space-y-1">
                        {msg.acoesExecutadas.map((acao, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                            {acao}
                          </div>
                        ))}
                      </div>
                    )}

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
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-[#2a2a2e] bg-[#0a0a0a]">
          <div className="max-w-3xl mx-auto px-4 py-4">
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
    </div>
  );
}
