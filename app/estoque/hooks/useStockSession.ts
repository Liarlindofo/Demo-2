'use client';

import { useState, useCallback, useEffect } from 'react';
import type { StockSession, StockCategory, StockItem } from '../types';
import { criarSessoesPadrao } from '../data/mockInsumos';

export type { StockCategory };

// ── Helpers de API ─────────────────────────────────────────────────────────────

async function apiGet(): Promise<StockSession[]> {
  const res = await fetch('/api/estoque/contagens');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(sessoes: StockCategory[], criadoPor: string): Promise<StockSession> {
  const res = await fetch('/api/estoque/contagens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessoes, criadoPor }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPatch(id: string, patch: { sessoes?: StockCategory[]; status?: string }): Promise<void> {
  await fetch(`/api/estoque/contagens/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

async function apiDelete(id: string): Promise<void> {
  await fetch(`/api/estoque/contagens/${id}`, { method: 'DELETE' });
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useStockSession() {
  const [sessions, setSessions] = useState<StockSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Carrega sessões do banco ao montar
  useEffect(() => {
    apiGet()
      .then(data => {
        setSessions(data);
        // Retoma automaticamente se havia uma sessão em andamento
        const emAndamento = data.find(s => s.status === 'em_andamento');
        if (emAndamento) setActiveSessionId(emAndamento.id);
      })
      .catch(err => console.error('[Estoque] Falha ao carregar contagens:', err))
      .finally(() => setHydrated(true));
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null;

  // ── Criar nova contagem ────────────────────────────────────────────────────
  const iniciarContagem = useCallback(
    async (sessoesIniciais?: StockCategory[], gerente = 'Gerente'): Promise<StockSession> => {
      // Se já existe uma em andamento, retoma
      const existente = sessions.find(s => s.status === 'em_andamento');
      if (existente) {
        setActiveSessionId(existente.id);
        return existente;
      }

      const nova = await apiPost(sessoesIniciais ?? criarSessoesPadrao(), gerente);
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

  // ── Função interna para aplicar uma mutação e salvar ──────────────────────
  const mutarSessaoAtiva = useCallback(
    (mutate: (s: StockSession) => StockSession) => {
      setSessions(prev => {
        const session = prev.find(s => s.id === activeSessionId);
        if (!session) return prev;
        const updated = mutate(session);
        // Salva no banco (fire and forget)
        apiPatch(updated.id, { sessoes: updated.sessoes, status: updated.status }).catch(console.error);
        return prev.map(s => (s.id === activeSessionId ? updated : s));
      });
    },
    [activeSessionId],
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
  const finalizarContagem = useCallback(() => {
    if (!activeSessionId) return;
    setSessions(prev =>
      prev.map(s => {
        if (s.id !== activeSessionId) return s;
        const updated = { ...s, status: 'concluida' as const };
        apiPatch(updated.id, { status: 'concluida' }).catch(console.error);
        return updated;
      }),
    );
    setActiveSessionId(null);
  }, [activeSessionId]);

  // ── Excluir contagem ──────────────────────────────────────────────────────
  const excluirContagem = useCallback(
    (sessionId: string) => {
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
