'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { StockSession, StockCategory, StockItem } from '../types';

export type { StockCategory };
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ── Helpers de API ─────────────────────────────────────────────────────────────

async function apiGet(): Promise<StockSession[]> {
  const res = await fetch('/api/estoque/contagens');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(sessoes: StockCategory[], criadoPor: string, lojaNome?: string): Promise<StockSession> {
  const res = await fetch('/api/estoque/contagens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessoes, criadoPor, lojaNome }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPatch(
  id: string,
  patch: { sessoes?: StockCategory[]; status?: string },
  keepalive = false,
): Promise<void> {
  const res = await fetch(`/api/estoque/contagens/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
    keepalive,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

async function apiDelete(id: string): Promise<void> {
  await fetch(`/api/estoque/contagens/${id}`, { method: 'DELETE' });
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useStockSession() {
  const [sessions, setSessions] = useState<StockSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Fila de salvamento: armazena apenas o estado mais recente por sessão.
  // Descarta estados intermediários — só o último importa.
  const pendingSave = useRef<Map<string, { sessoes?: StockCategory[]; status?: string }>>(new Map());
  // Conjunto de sessões com loop de drain em execução
  const savingIds = useRef<Set<string>>(new Set());
  // Timer para resetar o status "salvo" para "idle"
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fila sequencial de saves ────────────────────────────────────────────────
  const scheduleSave = useCallback(
    (sessionId: string, patch: { sessoes?: StockCategory[]; status?: string }) => {
      // Sobrescreve qualquer estado pendente — apenas o mais recente é enviado
      pendingSave.current.set(sessionId, patch);

      // Se já há um drain em andamento para esta sessão, ele vai pegar o novo estado
      if (savingIds.current.has(sessionId)) return;

      const drain = async () => {
        savingIds.current.add(sessionId);

        // Cancela timer de "salvo" para não sobrepor o status "salvando"
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        setSaveStatus('saving');

        while (pendingSave.current.has(sessionId)) {
          const next = pendingSave.current.get(sessionId)!;
          pendingSave.current.delete(sessionId);

          try {
            await apiPatch(sessionId, next);
            // Só mostra "salvo" se não há mais nada na fila
            if (!pendingSave.current.has(sessionId)) {
              setSaveStatus('saved');
              savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
            }
          } catch {
            setSaveStatus('error');
            // Uma tentativa de retry após 2 segundos
            await new Promise(r => setTimeout(r, 2000));
            try {
              await apiPatch(sessionId, next);
              if (!pendingSave.current.has(sessionId)) {
                setSaveStatus('saved');
                savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
              }
            } catch (err) {
              console.error('[Estoque] Falha definitiva ao salvar contagem:', err);
              setSaveStatus('error');
            }
          }
        }

        savingIds.current.delete(sessionId);
      };

      drain();
    },
    [],
  );

  // ── Flush garantido ao sair/minimizar ──────────────────────────────────────
  // Usa fetch com keepalive:true — o browser garante o envio mesmo durante unload
  useEffect(() => {
    const flushAll = () => {
      for (const [id, patch] of pendingSave.current.entries()) {
        fetch(`/api/estoque/contagens/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
          keepalive: true,
        }).catch(() => {});
      }
      pendingSave.current.clear();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushAll();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', flushAll);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', flushAll);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // Carrega sessões do banco ao montar
  useEffect(() => {
    apiGet()
      .then(data => {
        setSessions(data);
        const emAndamento = data.find(s => s.status === 'em_andamento');
        if (emAndamento) setActiveSessionId(emAndamento.id);
      })
      .catch(err => console.error('[Estoque] Falha ao carregar contagens:', err))
      .finally(() => setHydrated(true));
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null;

  // ── Criar nova contagem ────────────────────────────────────────────────────
  const iniciarContagem = useCallback(
    async (sessoesIniciais?: StockCategory[], gerente = 'Gerente', forceNew = false, lojaNome?: string): Promise<StockSession> => {
      const existente = sessions.find(
        s => s.status === 'em_andamento' && s.lojaNome === (lojaNome ?? null),
      );

      if (existente && !forceNew) {
        setActiveSessionId(existente.id);
        return existente;
      }

      if (existente && forceNew) {
        await apiDelete(existente.id);
        setSessions(prev => prev.filter(s => s.id !== existente.id));
      }

      const nova = await apiPost(sessoesIniciais ?? [], gerente, lojaNome);
      setSessions(prev => [nova, ...prev]);
      setActiveSessionId(nova.id);
      return nova;
    },
    [sessions],
  );

  // ── Retomar contagem existente ─────────────────────────────────────────────
  const retomarContagem = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  // ── Fechar sessão ativa (sem concluir) ────────────────────────────────────
  const fecharContagem = useCallback(() => {
    setActiveSessionId(null);
  }, []);

  // ── Mutação + agendamento na fila ─────────────────────────────────────────
  const mutarSessaoAtiva = useCallback(
    (mutate: (s: StockSession) => StockSession) => {
      setSessions(prev => {
        const session = prev.find(s => s.id === activeSessionId);
        if (!session) return prev;
        const updated = mutate(session);
        scheduleSave(updated.id, { sessoes: updated.sessoes, status: updated.status });
        return prev.map(s => (s.id === activeSessionId ? updated : s));
      });
    },
    [activeSessionId, scheduleSave],
  );

  // ── Atualizar quantidade de um item ───────────────────────────────────────
  const atualizarQuantidade = useCallback(
    (categoriaId: string, insumoId: string, quantidade: number | null) => {
      mutarSessaoAtiva(s => ({
        ...s,
        sessoes: s.sessoes.map(cat =>
          cat.id !== categoriaId ? cat : {
            ...cat,
            itens: cat.itens.map((item: StockItem) =>
              item.insumoId !== insumoId ? item : { ...item, quantidadeContada: quantidade },
            ),
          },
        ),
      }));
    },
    [mutarSessaoAtiva],
  );

  // ── Atualizar observação de um item ──────────────────────────────────────
  const atualizarObservacao = useCallback(
    (categoriaId: string, insumoId: string, observacao: string) => {
      mutarSessaoAtiva(s => ({
        ...s,
        sessoes: s.sessoes.map(cat =>
          cat.id !== categoriaId ? cat : {
            ...cat,
            itens: cat.itens.map((item: StockItem) =>
              item.insumoId !== insumoId ? item : { ...item, observacao },
            ),
          },
        ),
      }));
    },
    [mutarSessaoAtiva],
  );

  // ── Concluir categoria ────────────────────────────────────────────────────
  const concluirCategoria = useCallback(
    (categoriaId: string) => {
      mutarSessaoAtiva(s => ({
        ...s,
        sessoes: s.sessoes.map(cat =>
          cat.id !== categoriaId ? cat : { ...cat, status: 'concluida' as const },
        ),
      }));
    },
    [mutarSessaoAtiva],
  );

  // ── Reabrir categoria ─────────────────────────────────────────────────────
  const reabrirCategoria = useCallback(
    (categoriaId: string) => {
      mutarSessaoAtiva(s => ({
        ...s,
        sessoes: s.sessoes.map(cat =>
          cat.id !== categoriaId ? cat : { ...cat, status: 'pendente' as const },
        ),
      }));
    },
    [mutarSessaoAtiva],
  );

  // ── Finalizar toda a contagem ─────────────────────────────────────────────
  // Inclui sessoes completas no patch para garantir que o estado mais recente
  // seja persistido mesmo que haja saves pendentes na fila
  const finalizarContagem = useCallback(() => {
    if (!activeSessionId) return;
    setSessions(prev => {
      const session = prev.find(s => s.id === activeSessionId);
      if (!session) return prev;
      const updated = { ...session, status: 'concluida' as const };
      scheduleSave(updated.id, { sessoes: updated.sessoes, status: 'concluida' });
      return prev.map(s => (s.id === activeSessionId ? updated : s));
    });
    setActiveSessionId(null);
  }, [activeSessionId, scheduleSave]);

  // ── Excluir contagem ──────────────────────────────────────────────────────
  const excluirContagem = useCallback(
    (sessionId: string) => {
      pendingSave.current.delete(sessionId); // cancela save pendente
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) setActiveSessionId(null);
      apiDelete(sessionId).catch(console.error);
    },
    [activeSessionId],
  );

  // ── Estatísticas ──────────────────────────────────────────────────────────
  const calcularProgresso = (session: StockSession) => {
    const total = session.sessoes.length;
    const concluidas = session.sessoes.filter(s => s.status === 'concluida').length;
    return { total, concluidas, percentual: total > 0 ? (concluidas / total) * 100 : 0 };
  };

  const calcularAlertasReposicao = (session: StockSession) =>
    session.sessoes.flatMap(cat =>
      cat.itens
        .filter(
          item =>
            item.quantidadeContada !== null &&
            item.estoqueMinimo !== undefined &&
            item.quantidadeContada < item.estoqueMinimo,
        )
        .map(item => ({ ...item, categoriaNome: cat.nome, categoriaIcone: cat.icone })),
    );

  return {
    sessions,
    activeSession,
    activeSessionId,
    hydrated,
    saveStatus,
    iniciarContagem,
    retomarContagem,
    fecharContagem,
    atualizarQuantidade,
    atualizarObservacao,
    concluirCategoria,
    reabrirCategoria,
    finalizarContagem,
    excluirContagem,
    calcularProgresso,
    calcularAlertasReposicao,
  };
}
