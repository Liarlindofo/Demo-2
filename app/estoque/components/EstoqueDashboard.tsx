'use client';

import { useState } from 'react';
import { History, AlertTriangle, RefreshCw, Package } from 'lucide-react';
import { useStockSession } from '../hooks/useStockSession';
import { useProdutosEstoque } from '../hooks/useProdutosEstoque';
import { useEstoqueConfig } from '../hooks/useEstoqueConfig';
import { criarSessoesPadrao } from '../data/mockInsumos';
import { HomeScreen } from './HomeScreen';
import { AlertBadge } from './AlertBadge';
import { Contagem } from '../pages/Contagem';
import { Historico } from '../pages/Historico';
import { Alertas } from '../pages/Alertas';
import { GerenciarProdutos } from '../pages/GerenciarProdutos';

type Screen = 'home' | 'counting' | 'history' | 'alerts' | 'products';

export function EstoqueDashboard() {
  const [screen, setScreen] = useState<Screen>('home');

  const { config, hydrated: configHydrated, getConfig, setAtivo, setMinimo, setModoContagem, setKgPorUnidade } = useEstoqueConfig();

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

  const {
    produtos,
    sessoes: sessoesProdutos,
    isLoading: produtosLoading,
    error: produtosError,
    refetch,
  } = useProdutosEstoque(config);

  const totalAlertas = sessions
    .filter(s => s.status === 'concluida')
    .flatMap(s => calcularAlertasReposicao(s))
    .length;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!hydrated || !configHydrated || produtosLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500">Carregando…</p>
      </div>
    );
  }

  const handleIniciar = async () => {
    await iniciarContagem(criarSessoesPadrao());
    setScreen('counting');
  };

  const handleRetomar = (sessionId: string) => {
    retomarContagem(sessionId);
    setScreen('counting');
  };

  // ── Telas sem bottom nav ───────────────────────────────────────────────────
  if (screen === 'counting' && activeSession) {
    return (
      <Contagem
        session={activeSession}
        onFechar={() => { fecharContagem(); setScreen('home'); }}
        onQuantidade={atualizarQuantidade}
        onObservacao={atualizarObservacao}
        onConcluirCategoria={concluirCategoria}
        onReabrirCategoria={reabrirCategoria}
        onFinalizar={() => { finalizarContagem(); setScreen('home'); }}
      />
    );
  }

  if (screen === 'history') {
    return (
      <Historico
        sessions={sessions}
        onVoltar={() => setScreen('home')}
        onRetomar={handleRetomar}
        onExcluir={excluirContagem}
      />
    );
  }

  if (screen === 'alerts') {
    return (
      <Alertas
        sessions={sessions}
        onVoltar={() => setScreen('home')}
      />
    );
  }

  if (screen === 'products') {
    return (
      <GerenciarProdutos
        produtos={produtos}
        config={config}
        onVoltar={() => setScreen('home')}
        onSetAtivo={setAtivo}
        onSetMinimo={setMinimo}
        onSetModoContagem={setModoContagem}
        onSetKgPorUnidade={setKgPorUnidade}
      />
    );
  }

  // ── Home + bottom nav ──────────────────────────────────────────────────────
  return (
    <div className="relative">
      <HomeScreen
        sessions={sessions}
        onIniciar={handleIniciar}
        onRetomar={handleRetomar}
      />

      {produtosError && (
        <div className="mx-4 -mt-2 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-amber-400">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-300 font-medium">Usando lista padrão de insumos</p>
            <p className="text-xs text-gray-500 truncate">Não foi possível carregar os produtos</p>
          </div>
          <button onClick={refetch} className="p-1.5 text-amber-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1c1c1e] border-t border-[#2a2a2e] flex">
        <button
          onClick={() => setScreen('history')}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-500 hover:text-white transition-colors"
        >
          <History className="w-5 h-5" />
          <span className="text-xs">Histórico</span>
        </button>
        <button
          onClick={() => setScreen('products')}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-500 hover:text-white transition-colors"
        >
          <Package className="w-5 h-5" />
          <span className="text-xs">Produtos</span>
        </button>
        <button
          onClick={() => setScreen('alerts')}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-gray-500 hover:text-white transition-colors"
        >
          <div className="relative">
            <AlertTriangle className="w-5 h-5" />
            <AlertBadge count={totalAlertas} className="absolute -top-2 -right-2 scale-75" />
          </div>
          <span className="text-xs">Alertas</span>
        </button>
      </div>

      <div className="h-20" />
    </div>
  );
}
