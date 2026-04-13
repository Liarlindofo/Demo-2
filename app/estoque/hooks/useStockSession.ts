'use client';

import { useState, useCallback, useEffect } from 'react';
import type { StockSession, StockCategory, StockItem } from '../types';
import { criarSessoesPadrao } from '../data/mockInsumos';

export type { StockCategory };

const STORAGE_KEY = 'plateful_estoque_sessions_v2';
const ACTIVE_KEY  = 'plateful_estoque_active_v2';

function gerarId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function carregarSessions(): StockSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function salvarSessions(sessions: StockSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch { /* quota exceeded */ }
}

export function useStockSession() {
  const [sessions, setSessions] = useState<StockSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = carregarSessions();
    setSessions(stored);
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (activeId && stored.some(s => s.id === activeId)) {
      setActiveSessionId(activeId);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) salvarSessions(sessions);
  }, [sessions, hydrated]);

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null;

  // ── Criar nova contagem ────────────────────────────────────────────────────
  const iniciarContagem = useCallback(
    (sessoesIniciais?: StockCategory[], gerente = 'Gerente') => {
      // Se já existe uma em andamento, retoma
      const existente = sessions.find(s => s.status === 'em_andamento');
      if (existente) {
        setActiveSessionId(existente.id);
        localStorage.setItem(ACTIVE_KEY, existente.id);
        return existente;
      }

      const novaSession: StockSession = {
        id: gerarId(),
        dataCriacao: new Date().toISOString(),
        status: 'em_andamento',
        sessoes: sessoesIniciais ?? criarSessoesPadrao(),
        criadoPor: gerente,
      };

      setSessions(prev => [...prev, novaSession]);
      setActiveSessionId(novaSession.id);
      localStorage.setItem(ACTIVE_KEY, novaSession.id);
      return novaSession;
    },
    [sessions],
  );

  // ── Retomar contagem existente ─────────────────────────────────────────────
  const retomarContagem = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    localStorage.setItem(ACTIVE_KEY, sessionId);
  }, []);

  // ── Fechar sessão ativa sem concluir ──────────────────────────────────────
  const fecharContagem = useCallback(() => {
    setActiveSessionId(null);
    localStorage.removeItem(ACTIVE_KEY);
  }, []);

  // ── Atualizar quantidade ───────────────────────────────────────────────────
  const atualizarQuantidade = useCallback(
    (categoriaId: string, insumoId: string, quantidade: number | null) => {
      setSessions(prev =>
        prev.map(s =>
          s.id !== activeSessionId ? s : {
            ...s,
            sessoes: s.sessoes.map(cat =>
              cat.id !== categoriaId ? cat : {
                ...cat,
                itens: cat.itens.map(item =>
                  item.insumoId !== insumoId ? item : { ...item, quantidadeContada: quantidade },
                ),
              },
            ),
          },
        ),
      );
    },
    [activeSessionId],
  );

  // ── Atualizar observação ───────────────────────────────────────────────────
  const atualizarObservacao = useCallback(
    (categoriaId: string, insumoId: string, observacao: string) => {
      setSessions(prev =>
        prev.map(s =>
          s.id !== activeSessionId ? s : {
            ...s,
            sessoes: s.sessoes.map(cat =>
              cat.id !== categoriaId ? cat : {
                ...cat,
                itens: cat.itens.map(item =>
                  item.insumoId !== insumoId ? item : { ...item, observacao },
                ),
              },
            ),
          },
        ),
      );
    },
    [activeSessionId],
  );

  // ── Concluir categoria ────────────────────────────────────────────────────
  const concluirCategoria = useCallback((categoriaId: string) => {
    setSessions(prev =>
      prev.map(s =>
        s.id !== activeSessionId ? s : {
          ...s,
          sessoes: s.sessoes.map(cat =>
            cat.id !== categoriaId ? cat : { ...cat, status: 'concluida' },
          ),
        },
      ),
    );
  }, [activeSessionId]);

  // ── Reabrir categoria ─────────────────────────────────────────────────────
  const reabrirCategoria = useCallback((categoriaId: string) => {
    setSessions(prev =>
      prev.map(s =>
        s.id !== activeSessionId ? s : {
          ...s,
          sessoes: s.sessoes.map(cat =>
            cat.id !== categoriaId ? cat : { ...cat, status: 'pendente' },
          ),
        },
      ),
    );
  }, [activeSessionId]);

  // ── Finalizar toda a contagem ─────────────────────────────────────────────
  const finalizarContagem = useCallback(() => {
    setSessions(prev =>
      prev.map(s =>
        s.id !== activeSessionId ? s : { ...s, status: 'concluida' },
      ),
    );
    setActiveSessionId(null);
    localStorage.removeItem(ACTIVE_KEY);
  }, [activeSessionId]);

  // ── Excluir contagem ──────────────────────────────────────────────────────
  const excluirContagem = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      localStorage.removeItem(ACTIVE_KEY);
    }
  }, [activeSessionId]);

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
