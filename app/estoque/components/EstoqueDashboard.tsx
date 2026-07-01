'use client';

import { useState } from 'react';
import { History, AlertTriangle, Package } from 'lucide-react';
import { useStockSession } from '../hooks/useStockSession';
import { useProdutosEstoque } from '../hooks/useProdutosEstoque';
import { useEstoqueConfig } from '../hooks/useEstoqueConfig';
import { construirSessoes } from '../hooks/useProdutosEstoque';
import { HomeScreen } from './HomeScreen';
import { AlertBadge } from './AlertBadge';
import { Contagem } from '../pages/Contagem';
import { Historico } from '../pages/Historico';
import { Alertas } from '../pages/Alertas';
import { GerenciarProdutos } from '../pages/GerenciarProdutos';
import { ContagemResultado } from './ContagemResultado';
import type { StockSession } from '../types';

type Screen = 'home' | 'counting' | 'history' | 'alerts' | 'products' | 'resultado' | 'resultado-historico';

interface Loja { id: string; nome: string; }

export function EstoqueDashboard() {
  const [screen, setScreen] = useState<Screen>('home');
  const [sessaoFinalizada, setSessaoFinalizada] = useState<StockSession | null>(null);
  const [sessaoHistorico, setSessaoHistorico] = useState<StockSession | null>(null);
  const [showLojaModal, setShowLojaModal] = useState(false);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loadingLojas, setLoadingLojas] = useState(false);

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

  const abrirSelecaoLoja = async () => {
    setLoadingLojas(true);
    setShowLojaModal(true);
    try {
      const res = await fetch('/api/rh/lojas');
      if (res.ok) setLojas(await res.json());
    } catch { /* silencia */ } finally {
      setLoadingLojas(false);
    }
  };

  const handleIniciarComLoja = async (lojaNome?: string) => {
    setShowLojaModal(false);
    const sessoesIniciais =
      sessoesProdutos.length > 0
        ? sessoesProdutos
        : construirSessoes([], config, productOrder);
    const temAtiva = sessions.some(s => s.status === 'em_andamento');
    await iniciarContagem(sessoesIniciais, 'Gerente', temAtiva, lojaNome);
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
        onFinalizar={() => {
          setSessaoFinalizada(activeSession);
          finalizarContagem();
          setScreen('resultado');
        }}
      />
    );
  }

  if (screen === 'resultado' && sessaoFinalizada) {
    const contagens = sessaoFinalizada.sessoes.flatMap(cat =>
      cat.itens.map(item => ({
        nome: item.nome,
        quantidade: item.quantidadeContada,
        unidade: item.unidade,
      })),
    );
    return (
      <ContagemResultado
        storeId="loja"
        storeName="Loja"
        contagens={contagens}
        sessoes={sessaoFinalizada.sessoes.length}
        finalizadaEm={new Date()}
        onVoltar={() => { setSessaoFinalizada(null); setScreen('home'); }}
      />
    );
  }

  if (screen === 'resultado-historico' && sessaoHistorico) {
    const contagens = sessaoHistorico.sessoes.flatMap(cat =>
      cat.itens.map(item => ({
        nome: item.nome,
        quantidade: item.quantidadeContada,
        unidade: item.unidade,
      })),
    );
    return (
      <ContagemResultado
        storeId="loja"
        storeName="Loja"
        contagens={contagens}
        sessoes={sessaoHistorico.sessoes.length}
        finalizadaEm={new Date(sessaoHistorico.dataCriacao)}
        onVoltar={() => { setSessaoHistorico(null); setScreen('history'); }}
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
        onVerResultado={s => { setSessaoHistorico(s); setScreen('resultado-historico'); }}
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

      {/* Modal de seleção de loja */}
      {showLojaModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="px-5 pt-5 pb-3 border-b border-[#2a2a2e]">
              <h3 className="text-base font-semibold text-white">Qual loja está sendo contada?</h3>
              <p className="text-xs text-gray-500 mt-0.5">Selecione para identificar o histórico</p>
            </div>
            <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
              {loadingLojas ? (
                <div className="flex items-center justify-center py-6 gap-2 text-gray-500 text-sm">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  Carregando lojas…
                </div>
              ) : lojas.length > 0 ? (
                lojas.map(loja => (
                  <button
                    key={loja.id}
                    onClick={() => handleIniciarComLoja(loja.nome)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-[#2a2a2e] hover:bg-amber-500/10 hover:border-amber-500/30 border border-transparent text-white text-sm font-medium transition-all"
                  >
                    {loja.nome}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhuma loja cadastrada no RH
                </p>
              )}
            </div>
            <div className="px-3 pb-3 pt-1 border-t border-[#2a2a2e]">
              <button
                onClick={() => handleIniciarComLoja(undefined)}
                className="w-full py-2.5 rounded-xl text-sm text-gray-500 hover:text-white hover:bg-[#2a2a2e] transition-colors"
              >
                Continuar sem selecionar loja
              </button>
            </div>
          </div>
        </div>
      )}

      <HomeScreen
        sessions={sessions}
        onIniciar={abrirSelecaoLoja}
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
