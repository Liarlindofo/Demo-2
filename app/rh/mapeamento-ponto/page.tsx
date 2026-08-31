'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Search, AlertTriangle, Link2 } from 'lucide-react';
import { distance } from 'fastest-levenshtein';

interface Pendencia {
  id: string;
  numeroFolhaOrigem: string;
  nomeSugerido: string | null;
  data: string;
  payloadBruto: Record<string, unknown>;
  resolvida: boolean;
  createdAt: string;
}

interface Grupo {
  numeroFolhaOrigem: string;
  nomeSugerido: string | null;
  registros: Pendencia[];
}

interface Funcionario {
  id: string;
  nome: string;
  numeroFolha: string | null;
}

const inputCls =
  'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

function scoreMatch(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const na = normalize(a);
  const nb = normalize(b);
  if (nb.includes(na) || na.includes(nb)) return 0;
  return distance(na, nb);
}

export default function MapeamentoPontoPage() {
  const router = useRouter();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState<Record<string, string>>({}); // numeroFolhaOrigem -> funcionarioId
  const [search, setSearch] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    fetch('/api/rh/mapeamento-ponto')
      .then((r) => r.json())
      .then((d) => {
        setGrupos(d.grupos ?? []);
        setFuncionarios(d.funcionarios ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredFuncionarios = useMemo(() => {
    return (folha: string, query: string) => {
      const nomeSugerido = grupos.find((g) => g.numeroFolhaOrigem === folha)?.nomeSugerido ?? '';
      const base = query.trim()
        ? funcionarios.filter((f) =>
            f.nome.toLowerCase().includes(query.toLowerCase())
          )
        : funcionarios;

      if (!nomeSugerido) return base;

      return [...base].sort((a, b) => scoreMatch(nomeSugerido, a.nome) - scoreMatch(nomeSugerido, b.nome));
    };
  }, [grupos, funcionarios]);

  const handleConfirm = async (numeroFolhaOrigem: string) => {
    const funcionarioId = matching[numeroFolhaOrigem];
    if (!funcionarioId) return;

    setSaving((prev) => ({ ...prev, [numeroFolhaOrigem]: true }));
    try {
      const res = await fetch('/api/rh/mapeamento-ponto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numeroFolhaOrigem, funcionarioId }),
      });
      if (res.ok) {
        setDone((prev) => ({ ...prev, [numeroFolhaOrigem]: true }));
        showToast(`Folha ${numeroFolhaOrigem} mapeada com sucesso!`);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error ?? 'Erro ao mapear');
      }
    } catch {
      showToast('Erro de conexão');
    } finally {
      setSaving((prev) => ({ ...prev, [numeroFolhaOrigem]: false }));
    }
  };

  const pendingCount = grupos.filter((g) => !done[g.numeroFolhaOrigem]).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white shadow-2xl">
          {toast}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/rh/funcionarios')}
            className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Mapeamento de Folhas</h1>
            <p className="text-sm text-gray-400">
              {pendingCount > 0
                ? `${pendingCount} matrícula${pendingCount !== 1 ? 's' : ''} sem funcionário vinculado`
                : 'Tudo mapeado'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : grupos.length === 0 ? (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-10 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-white font-semibold">Sem pendências</p>
            <p className="text-sm text-gray-500 mt-1">
              Todos os registros do Secullum foram vinculados a funcionários.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grupos.map((grupo) => {
              const isResolved = done[grupo.numeroFolhaOrigem];
              const selectedId = matching[grupo.numeroFolhaOrigem] ?? '';
              const query = search[grupo.numeroFolhaOrigem] ?? '';
              const lista = filteredFuncionarios(grupo.numeroFolhaOrigem, query);

              return (
                <div
                  key={grupo.numeroFolhaOrigem}
                  className={`bg-[#1c1c1e] border rounded-2xl p-5 transition-all ${
                    isResolved ? 'border-green-500/30 opacity-60' : 'border-[#2a2a2e]'
                  }`}
                >
                  {/* Cabeçalho do grupo */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-sm font-semibold text-white">
                          Folha #{grupo.numeroFolhaOrigem}
                        </span>
                        <span className="text-xs text-gray-500 bg-[#2a2a2e] px-2 py-0.5 rounded-full">
                          {grupo.registros.length} registro{grupo.registros.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {grupo.nomeSugerido && (
                        <p className="text-xs text-gray-400 mt-1 ml-6">
                          Nome recebido: <span className="text-amber-400">{grupo.nomeSugerido}</span>
                        </p>
                      )}
                    </div>
                    {isResolved && (
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    )}
                  </div>

                  {!isResolved && (
                    <>
                      {/* Busca de funcionário */}
                      <div className="mb-3">
                        <label className={labelCls}>
                          <Search className="w-3 h-3 inline mr-1" />
                          Buscar funcionário
                        </label>
                        <input
                          value={query}
                          onChange={(e) =>
                            setSearch((prev) => ({
                              ...prev,
                              [grupo.numeroFolhaOrigem]: e.target.value,
                            }))
                          }
                          placeholder="Digite o nome..."
                          className={inputCls}
                        />
                      </div>

                      {/* Lista de sugestões */}
                      <div className="mb-4">
                        <label className={labelCls}>Vincular a</label>
                        <select
                          value={selectedId}
                          onChange={(e) =>
                            setMatching((prev) => ({
                              ...prev,
                              [grupo.numeroFolhaOrigem]: e.target.value,
                            }))
                          }
                          className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                          size={Math.min(lista.length, 5)}
                        >
                          <option value="">— Selecionar funcionário —</option>
                          {lista.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.nome}
                              {f.numeroFolha ? ` (folha ${f.numeroFolha})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {!selectedId && grupo.nomeSugerido && (
                        <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2 mb-4">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-400">
                            Nenhum funcionário selecionado. Os funcionários acima estão ordenados por
                            similaridade com &quot;{grupo.nomeSugerido}&quot;.
                          </p>
                        </div>
                      )}

                      <button
                        disabled={!selectedId || saving[grupo.numeroFolhaOrigem]}
                        onClick={() => handleConfirm(grupo.numeroFolhaOrigem)}
                        className="w-full py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {saving[grupo.numeroFolhaOrigem]
                          ? 'Salvando...'
                          : 'Confirmar vínculo e reprocessar registros'}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
