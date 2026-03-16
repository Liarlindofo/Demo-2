'use client';

import { useState, useEffect } from 'react';
import type { StoreState, StoreId } from '../types';
import { getStorageKey } from '../constants';

const defaultState: StoreState = {
  insumos: [],
  fichas: [],
};

export const useStoreState = (storeId: StoreId) => {
  const [state, setState] = useState<StoreState>(defaultState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar do localStorage ao montar
    const key = getStorageKey(storeId, 'state');
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as StoreState;
        setState(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar estado do localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  const updateState = (newState: StoreState) => {
    setState(newState);
    // Salvar no localStorage
    const key = getStorageKey(storeId, 'state');
    try {
      localStorage.setItem(key, JSON.stringify(newState));
    } catch (error) {
      console.error('Erro ao salvar estado no localStorage:', error);
    }
  };

  return { state, updateState, isLoading };
};
