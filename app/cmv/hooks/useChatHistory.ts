'use client';

import { useState, useEffect } from 'react';
import type { ChatMessage, StoreId } from '../types';
import { getStorageKey } from '../constants';

export const useChatHistory = (storeId: StoreId) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar do localStorage ao montar
    const key = getStorageKey(storeId, 'chat');
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        setMessages(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico do localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storeId]);

  const addMessage = (message: ChatMessage) => {
    const newMessages = [...messages, message];
    setMessages(newMessages);
    // Salvar no localStorage
    const key = getStorageKey(storeId, 'chat');
    try {
      localStorage.setItem(key, JSON.stringify(newMessages));
    } catch (error) {
      console.error('Erro ao salvar histórico no localStorage:', error);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    const key = getStorageKey(storeId, 'chat');
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Erro ao limpar histórico do localStorage:', error);
    }
  };

  return { messages, addMessage, clearHistory, isLoading };
};
