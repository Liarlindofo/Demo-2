'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, XCircle, Loader2,
  Camera, MessageSquare, MapPin, FileText,
  AlertTriangle, RefreshCw, Eye, BrainCircuit,
  ClipboardCheck,
} from 'lucide-react';

// ─── Tipos ─────────────────────────────────────────────────────────────────

interface Evidencia {
  id: string;
  tipo: 'FOTO' | 'CONFIRMACAO_TEXTO' | 'LOCALIZACAO' | 'ARQUIVO';
  conteudoTexto: string | null;
  urlArquivo: string | null;
  latitude: number | null;
  longitude: number | null;
  analiseIA: AnaliseIA | null;
  recebidaEm: string;
}

interface AnaliseIA {
  objeto_identificado?: string;
  corresponde_ao_esperado?: boolean;
  valor_lido?: string;
  legivel?: boolean;
  confianca?: number;
  observacao?: string;
  divergencia?: boolean;
}

interface ItemRevisao {
  id: string;
  dataAgendada: string;
  status: string;
  template: { titulo: string; descricao: string };
  funcionario: { id: string; nome: string };
  loja: { id: string; nome: string };
  evidencias: Evidencia[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function ptDataHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Sub-componentes ───────────────────────────────────────────────────────

function EvidenciaCard({ ev }: { ev: Evidencia }) {
  const [fotoExpandida, setFotoExpandida] = useState(false);

  if (ev.tipo === 'FOTO') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Foto enviada</span>
        </div>
        {ev.urlArquivo ? (
          <div className="relative">
            <img
              src={ev.urlArquivo}
              alt="Evidência fotográfica"
              className={`rounded-xl border border-[#2a2a2e] object-cover cursor-pointer transition-all ${fotoExpandida ? 'max-h-[480px] w-full object-contain' : 'max-h-48 w-full'}`}
              onClick={() => setFotoExpandida((v) => !v)}
            />
            <a
              href={ev.urlArquivo}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 bg-black/60 rounded-lg p-1.5 hover:bg-black/80 transition-colors"
              title="Abrir em nova aba"
            >
              <Eye className="w-3.5 h-3.5 text-white" />
            </a>
            <p className="text-xs text-gray-500 mt-1">
              {fotoExpandida ? 'Clique para reduzir' : 'Clique para ampliar'}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">URL da foto não disponível.</p>
        )}
        {ev.analiseIA && <AnaliseIACard ia={ev.analiseIA} />}
      </div>
    );
  }

  if (ev.tipo === 'CONFIRMACAO_TEXTO') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-green-400" />
          <span className="text-xs font-semibold text-green-300 uppercase tracking-wider">Confirmação por texto</span>
        </div>
        <div className="bg-[#0a0a0a] rounded-xl p-3 border border-[#2a2a2e]">
          <p className="text-sm text-gray-200 whitespace-pre-wrap">
            {ev.conteudoTexto ?? <span className="text-gray-500 italic">Sem conteúdo</span>}
          </p>
        </div>
      </div>
    );
  }

  if (ev.tipo === 'LOCALIZACAO') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-semibold text-yellow-300 uppercase tracking-wider">Localização</span>
        </div>
        {ev.latitude != null && ev.longitude != null ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-300">
              {ev.latitude.toFixed(6)}, {ev.longitude.toFixed(6)}
            </p>
            <a
              href={`https://maps.google.com/?q=${ev.latitude},${ev.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Ver no mapa
            </a>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">Coordenadas não disponíveis.</p>
        )}
      </div>
    );
  }

  if (ev.tipo === 'ARQUIVO') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Arquivo</span>
        </div>
        {ev.urlArquivo ? (
          <a
            href={ev.urlArquivo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 underline"
          >
            <FileText className="w-4 h-4" /> Abrir arquivo
          </a>
        ) : (
          <p className="text-xs text-gray-500 italic">URL do arquivo não disponível.</p>
        )}
      </div>
    );
  }

  return null;
}

function AnaliseIACard({ ia }: { ia: AnaliseIA }) {
  return (
    <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-2.5 mt-2">
      <div className="flex items-center gap-2">
        <BrainCircuit className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Análise da IA</span>
        <span
          className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-lg ${ia.divergencia ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}
        >
          {ia.divergencia ? '⚠ Divergência detectada' : '✓ Conforme'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {ia.objeto_identificado && (
          <>
            <span className="text-gray-500">Objeto identificado</span>
            <span className="text-white">{ia.objeto_identificado}</span>
          </>
        )}
        {ia.valor_lido && (
          <>
            <span className="text-gray-500">Valor lido</span>
            <span className="text-white">{ia.valor_lido}</span>
          </>
        )}
        {ia.legivel !== undefined && (
          <>
            <span className="text-gray-500">Legível</span>
            <span className={ia.legivel ? 'text-green-400' : 'text-red-400'}>
              {ia.legivel ? 'Sim' : 'Não'}
            </span>
          </>
        )}
        {ia.corresponde_ao_esperado !== undefined && (
          <>
            <span className="text-gray-500">Conforme esperado</span>
            <span className={ia.corresponde_ao_esperado ? 'text-green-400' : 'text-red-400'}>
              {ia.corresponde_ao_esperado ? 'Sim' : 'Não'}
            </span>
          </>
        )}
        {ia.confianca !== undefined && (
          <>
            <span className="text-gray-500">Confiança da IA</span>
            <span className="text-white">
              {Math.round(ia.confianca <= 1 ? ia.confianca * 100 : ia.confianca)}%
            </span>
          </>
        )}
      </div>

      {ia.observacao && (
        <div className="pt-1.5 border-t border-purple-500/15">
          <p className="text-xs text-gray-400 mb-1">Observação</p>
          <p className="text-sm text-amber-300 leading-relaxed">{ia.observacao}</p>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────

export default function RevisaoTarefasPage() {
  const router = useRouter();

  const [itens, setItens] = useState<ItemRevisao[]>([]);
  const [loading, setLoading] = useState(true);
  const [executando, setExecutando] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tarefas/revisao');
      if (res.ok) setItens(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const executarAcao = async (id: string, acao: 'aprovar' | 'nao_conforme') => {
    setExecutando(id + acao);
    try {
      const res = await fetch(`/api/tarefas/revisao/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao }),
      });

      if (res.ok) {
        showToast(
          acao === 'aprovar'
            ? 'Tarefa aprovada. Evidência aceita mesmo com divergência.'
            : 'Tarefa marcada como não conforme.',
        );
        setItens((prev) => prev.filter((i) => i.id !== id));
      } else {
        showToast('Erro ao processar a ação.');
      }
    } finally {
      setExecutando(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white shadow-xl z-50">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/tarefas')}
              className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e]"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <ClipboardCheck className="w-6 h-6 text-amber-400" /> Fila de Revisão
              </h1>
              <p className="text-sm text-gray-400">
                Tarefas com divergência detectada pela IA aguardando análise
              </p>
            </div>
          </div>
          <button
            onClick={carregar}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-[#1c1c1e] border border-[#2a2a2e] text-gray-400 text-sm rounded-xl hover:bg-[#2a2a2e] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Banner informativo */}
        <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-200/80">
            Estas tarefas foram sinalizadas pela IA como divergentes (ex.: valor lido fora da faixa esperada).
            A revisão é estritamente interna — nenhuma mensagem é enviada ao funcionário.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        )}

        {/* Lista vazia */}
        {!loading && itens.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <CheckCircle2 className="w-12 h-12 text-green-500/40" />
            <p className="text-gray-400 font-medium">Nenhuma tarefa aguardando revisão.</p>
            <p className="text-sm text-gray-600">A fila está limpa.</p>
          </div>
        )}

        {/* Cards de revisão */}
        {!loading && itens.map((item) => (
          <div
            key={item.id}
            className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden"
          >
            {/* Header do card */}
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#2a2a2e]">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-white truncate">
                  {item.template.titulo}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-400">
                  <span className="font-medium text-gray-300">{item.funcionario.nome}</span>
                  <span>·</span>
                  <span>{item.loja.nome}</span>
                  <span>·</span>
                  <span>{new Date(item.dataAgendada).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}</span>
                </div>
              </div>
              <span className="flex-shrink-0 text-xs bg-red-500/15 text-red-300 border border-red-500/20 px-2.5 py-1 rounded-lg font-medium">
                ⚠ Em revisão
              </span>
            </div>

            {/* Corpo do card */}
            <div className="px-5 py-4 space-y-5">
              {/* Descrição da tarefa */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  O que era esperado
                </p>
                <p className="text-sm text-gray-200 leading-relaxed">{item.template.descricao}</p>
              </div>

              {/* Evidências */}
              {item.evidencias.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Evidências enviadas ({item.evidencias.length})
                  </p>
                  {item.evidencias.map((ev) => (
                    <div key={ev.id} className="bg-[#141416] rounded-xl p-4">
                      <EvidenciaCard ev={ev} />
                      <p className="text-xs text-gray-600 mt-2">
                        Recebida em {new Date(ev.recebidaEm).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-3 px-5 py-4 border-t border-[#2a2a2e] bg-[#141416]">
              <button
                onClick={() => executarAcao(item.id, 'aprovar')}
                disabled={executando !== null}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {executando === item.id + 'aprovar' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Aprovar mesmo assim
              </button>
              <button
                onClick={() => executarAcao(item.id, 'nao_conforme')}
                disabled={executando !== null}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {executando === item.id + 'nao_conforme' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Marcar como não conforme
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
