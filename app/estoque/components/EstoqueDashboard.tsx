'use client';

import { useState } from 'react';
import { History, AlertTriangle, ArrowLeft } from 'lucide-react';
import type { LojaId } from '../types';
import { useStockSession } from '../hooks/useStockSession';
import { StoreSelector } from './StoreSelector';
import { AlertBadge } from './AlertBadge';
import { Contagem } from '../pages/Contagem';
import { Historico } from '../pages/Historico';
import { Alertas } from '../pages/Alertas';

type Screen = 'home' | 'counting' | 'history' | 'alerts';

export function EstoqueDashboard() {
  const [screen, setScreen] = useState<Screen>('home');
  const {
    sessions,
    activeSession,
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
    calcularAlertasReposicao,
  } = useStockSession();

  const totalAlertas = sessions
    .filter(s => s.status === 'concluida')
    .flatMap(s => calcularAlertasReposicao(s))
    .length;

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleIniciar = (lojaId: LojaId) => {
    iniciarContagem(lojaId);
    setScreen('counting');
  };

  const handleRetomar = (sessionId: string) => {
    retomarContagem(sessionId);
    setScreen('counting');
  };

  const handleFecharContagem = () => {
    fecharContagem();
    setScreen('home');
  };

  const handleFinalizar = () => {
    finalizarContagem();
    setScreen('home');
  };

  // ── Tela de contagem ────────────────────────────────────────────────────────
  if (screen === 'counting' && activeSession) {
    return (
      <Contagem
        session={activeSession}
        onFechar={handleFecharContagem}
        onQuantidade={atualizarQuantidade}
        onObservacao={atualizarObservacao}
        onConcluirCategoria={concluirCategoria}
        onReabrirCategoria={reabrirCategoria}
        onFinalizar={handleFinalizar}
      />
    );
  }

  // ── Histórico ───────────────────────────────────────────────────────────────
  if (screen === 'history') {
    return (
      <Historico
        sessions={sessions}
        onVoltar={() => setScreen('home')}
        onRetomar={(id) => { handleRetomar(id); }}
        onExcluir={excluirContagem}
      />
    );
  }

  // ── Alertas ─────────────────────────────────────────────────────────────────
  if (screen === 'alerts') {
    return (
      <Alertas
        sessions={sessions}
        onVoltar={() => setScreen('home')}
      />
    );
  }

  // ── Home (seleção de loja) ──────────────────────────────────────────────────
  return (
    <div className="relative">
      <StoreSelector
        sessions={sessions}
        onIniciar={handleIniciar}
        onRetomar={handleRetomar}
      />

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1c1c1e] border-t border-[#2a2a2e] flex safe-area-pb">
        <button
          onClick={() => setScreen('history')}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-500 hover:text-white transition-colors"
        >
          <History className="w-5 h-5" />
          <span className="text-xs">Histórico</span>
        </button>
        <button
          onClick={() => setScreen('alerts')}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-500 hover:text-white transition-colors relative"
        >
          <div className="relative">
            <AlertTriangle className="w-5 h-5" />
            <AlertBadge count={totalAlertas} className="absolute -top-2 -right-2 scale-75" />
          </div>
          <span className="text-xs">Alertas</span>
        </button>
      </div>

      {/* Espaço para a bottom nav */}
      <div className="h-20" />
    </div>
  );
}
