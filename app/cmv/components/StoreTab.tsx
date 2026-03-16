'use client';

import { useState } from 'react';
import type { StoreId, ChatMessage } from '../types';
import { useStoreState } from '../hooks/useStoreState';
import { useChatHistory } from '../hooks/useChatHistory';
import { useOpenRouter } from '../hooks/useOpenRouter';
import { calculateAllProductsCMV, calculateStoreMetrics } from '../utils';
import { STORES } from '../constants';
import { MetricCards } from './MetricCards';
import { ChartsPanel } from './ChartsPanel';
import { CMVTable } from './CMVTable';
import { ChatPanel } from './ChatPanel';

interface StoreTabProps {
  storeId: StoreId;
}

export const StoreTab = ({ storeId }: StoreTabProps) => {
  const { state, updateState, isLoading: stateLoading } = useStoreState(storeId);
  const { messages, addMessage, clearHistory, isLoading: chatLoading } = useChatHistory(storeId);
  const { sendMessage: sendToOpenRouter, isLoading: apiLoading } = useOpenRouter(storeId, state);

  const [error, setError] = useState<string | null>(null);

  const productsCMV = calculateAllProductsCMV(state);
  const metrics = calculateStoreMetrics(state);

  const handleSendMessage = async (userMessage: string) => {
    setError(null);

    // Adicionar mensagem do usuário
    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);

    try {
      // Enviar para OpenRouter
      const response = await sendToOpenRouter(userMessage, messages);

      // Adicionar resposta da IA
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
      };
      addMessage(assistantMsg);

      // Atualizar estado
      updateState(response.state);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Não consegui conectar. Tente novamente.');

      // Adicionar mensagem de erro
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: 'Não consegui conectar. Tente novamente.',
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMsg);
    }
  };

  const handleClearHistory = () => {
    clearHistory();
  };

  return (
    <div className="grid grid-cols-[60%_40%] gap-6 h-[calc(100vh-200px)]">
      {/* Painel Esquerdo - Métricas e Gráficos */}
      <div className="overflow-y-auto pr-2">
        <MetricCards metrics={metrics} isLoading={stateLoading} />
        <ChartsPanel products={productsCMV} />
        <CMVTable products={productsCMV} />
      </div>

      {/* Painel Direito - Chat */}
      <div className="h-full">
        <ChatPanel
          storeName={STORES[storeId]}
          messages={messages}
          onSendMessage={handleSendMessage}
          onClearHistory={handleClearHistory}
          isLoading={apiLoading}
        />
      </div>
    </div>
  );
};
