'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { StoreData, StoreId } from '../types';
import { getStorageKey } from '../constants';
import { migrarStoreData } from '../utils';

const INITIAL_DATA: StoreData = {
  ingredientes: [],
  receitas: [],
  sabores: [],
  categorias: [],
};

const API_BASE = '/api/cmv';

// ─── helpers ──────────────────────────────────────────────────────────────────

function loadFromLocalStorage(storeId: StoreId): StoreData | null {
  try {
    const raw = localStorage.getItem(getStorageKey(storeId));
    if (!raw) return null;
    return migrarStoreData(JSON.parse(raw));
  } catch {
    return null;
  }
}

function saveToLocalStorage(storeId: StoreId, data: StoreData) {
  try {
    localStorage.setItem(getStorageKey(storeId), JSON.stringify(data));
  } catch {
    // quota exceeded — ignora
  }
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export const useStoreData = (storeId: StoreId) => {
  const [data, setData] = useState<StoreData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Carregamento inicial ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setSaveError(null);

    // 1. Exibe cache local instantaneamente
    const cached = loadFromLocalStorage(storeId);
    if (cached) setData(cached);

    // 2. Busca dados autoritativos do banco
    fetch(`${API_BASE}/${storeId}`)
      .then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(raw => {
        if (cancelled) return;
        // Migra dados antigos para o novo formato (cascata automática)
        const serverData = migrarStoreData(raw);
        setData(serverData);
        saveToLocalStorage(storeId, serverData);
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('[CMV] Não foi possível carregar dados do servidor, usando cache local:', err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storeId]);

  // ── Persistência ──────────────────────────────────────────────────────────
  const persistToServer = useCallback(async (newData: StoreData) => {
    try {
      setIsSaving(true);
      setSaveError(null);

      const res = await fetch(`${API_BASE}/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      setSaveError(msg);
      console.error('[CMV] Erro ao salvar no banco:', msg);
    } finally {
      setIsSaving(false);
    }
  }, [storeId]);

  // ── updateData: atualiza estado + cache local + banco (debounced) ─────────
  const updateData = useCallback((newData: StoreData) => {
    setData(newData);
    saveToLocalStorage(storeId, newData);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      persistToServer(newData);
    }, 400);
  }, [storeId, persistToServer]);

  return { data, updateData, isLoading, isSaving, saveError };
};
