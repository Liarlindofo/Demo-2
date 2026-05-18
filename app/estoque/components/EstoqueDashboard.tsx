'use client';

import { useState } from 'react';
import { History, AlertTriangle, Package } from 'lucide-react';
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

  const { config, productOrder, hydrated: configHydrated, getConfig, setAtivo, setMinimo, setModoContagem, setKgPorUnidade, setProductOrder, moverProdutoAcima, moverProdutoAbaixo } = useEstoqueConfig();

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
  } = useProdutosEstoque(config, productOrder);

  const totalAlertas = sessions
    .filter(s => s.status === 'concluida')
    .flatMap(s => calcularAlertasReposicao(s))
    .length;

  // ── Loading (aguarda apenas config do banco) ──────────────────────────────
  if (!hydrated || !configHydrated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500">Carregando…</p>
      </div>
    );
  }

  const handleIniciar = async () => {
    const sessoesIniciais = sessoesProdutos.length > 0 ? sessoesProdutos : criarSessoesPadrao();
    // Se já há sessão ativa, força criação de uma nova (substitui a antiga)
    const temAtiva = sessions.some(s => s.status === 'em_andamento');
    await iniciarContagem(sessoesIniciais, 'Gerente', temAtiva);
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
        productOrder={productOrder}
        onVoltar={() => setScreen('home')}
        onSetAtivo={setAtivo}
        onSetMinimo={setMinimo}
        onSetModoContagem={setModoContagem}
        onSetKgPorUnidade={setKgPorUnidade}
        onMoverAcima={moverProdutoAcima}
        onMoverAbaixo={moverProdutoAbaixo}
        onRefetch={refetch}
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
