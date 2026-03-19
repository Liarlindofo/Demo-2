'use client';

import { useState, useEffect } from 'react';
import type { StoreData, StoreId } from '../types';
import { getStorageKey } from '../constants';

const INITIAL_DATA: StoreData = {
  sabores: [],
  ingredientes: [],
};

export const useStoreData = (storeId: StoreId) => {
  const [data, setData] = useState<StoreData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const key = getStorageKey(storeId);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as StoreData;
        setData(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  const updateData = (newData: StoreData) => {
    setData(newData);
    const key = getStorageKey(storeId);
    try {
      localStorage.setItem(key, JSON.stringify(newData));
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  };

  return { data, updateData, isLoading };
};
