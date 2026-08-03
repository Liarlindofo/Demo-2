'use client';

import { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ChevronLeft, Search, Loader2, WifiOff } from 'lucide-react';
import type { StockSession } from '../types';
import type { SaveStatus } from '../hooks/useStockSession';
import { ProgressBar } from '../components/ProgressBar';
import { SessionAccordion } from '../components/SessionAccordion';
import { StockItemRow } from '../components/StockItemRow';
import { formatQtd } from '../utils';

interface ContagemProps {
  session: StockSession;
  saveStatus: SaveStatus;
  onFechar: () => void;
  onQuantidade: (categoriaId: string, insumoId: string, qty: number | null) => void;
  onObservacao: (categoriaId: string, insumoId: string, obs: string) => void;
  onConcluirCategoria: (categoriaId: string) => void;
  onReabrirCategoria: (categoriaId: string) => void;
  onFinalizar: () => void;
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-[11px] text-gray-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        Salvando…
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1 text-[11px] text-green-500">
        <CheckCircle2 className="w-3 h-3" />
        Salvo
      </span>
    );
  }
  // error
  return (
    <span className="flex items-center gap-1 text-[11px] text-amber-400">
      <WifiOff className="w-3 h-3" />
      Erro ao salvar
    </span>
  );
}

export function Contagem({
  session,
  saveStatus,
  onFechar,
  onQuantidade,
  onObservacao,
  onConcluirCategoria,
  onReabrirCategoria,
  onFinalizar,
}: ContagemProps) {
  const [activeCatId, setActiveCatId] = useState<string | null>(
    session.sessoes.find(s => s.status === 'pendente')?.id ?? null,
  );
  const [showRevisao, setShowRevisao] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [itensFaltandoGlobal, setItensFaltandoGlobal] = useState<{ categoria: string; nome: string }[]>([]);

  const isSearching = searchTerm.trim().length > 0;
  const searchResults = isSearching
    ? session.sessoes.flatMap(cat =>
        cat.itens
          .filter(i => i.nome.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(i => ({ item: i, categoriaId: cat.id, categoriaNome: cat.nome, icone: cat.icone })),
      )
    : [];

  const concluidas = session.sessoes.filter(s => s.status === 'concluida').length;
  const total = session.sessoes.length;
  const todasConcluidas = concluidas === total;
  const alertas = session.sessoes.flatMap(cat =>
    cat.itens.filter(
      i =>
        i.quantidadeContada !== null &&
        i.estoqueMinimo !== undefined &&
        i.quantidadeContada < i.estoqueMinimo,
    ),
  );

  const dataFormatada = new Date(session.dataCriacao).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const toggleCategoria = (id: string) => {
    setActiveCatId(prev => (prev === id ? null : id));
  };

  const handleConcluirCategoria = (catId: string) => {
    onConcluirCategoria(catId);
    const idx = session.sessoes.findIndex(s => s.id === catId);
    const proxima = session.sessoes[idx + 1];
    if (proxima) setActiveCatId(proxima.id);
    else setActiveCatId(null);
  };

  const handleProxima = (catId: string) => {
    const idx = session.sessoes.findIndex(s => s.id === catId);
    const proxima = session.sessoes[idx + 1];
    if (proxima) setActiveCatId(proxima.id);
  };

  const handleAbrirRevisao = () => {
    const faltando = session.sessoes.flatMap(cat =>
      cat.itens
        .filter(i => i.quantidadeContada === null)
        .map(i => ({ categoria: cat.nome, nome: i.nome })),
    );
    if (faltando.length > 0) {
      setItensFaltandoGlobal(faltando);
      return;
    }
    setShowRevisao(true);
  };

  // ── Tela de revisão ───────────────────────────────────────────────────────
  if (showRevisao) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-4 pt-12 pb-4 flex items-center gap-3">
          <button onClick={() => setShowRevisao(false)} className="p-2 -ml-2 text-gray-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-white">Revisão</h2>
            <p className="text-xs text-gray-500">{dataFormatada}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
          {alertas.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <p className="text-amber-400 font-semibold text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {alertas.length} item{alertas.length !== 1 ? 'ns' : ''} abaixo do mínimo
              </p>
              <div className="space-y-1">
                {alertas.map(a => (
                  <p key={a.insumoId} className="text-xs text-gray-400">
                    • {a.nome}: {formatQtd(a.quantidadeContada)} {a.unidade} (mín: {formatQtd(a.estoqueMinimo ?? null)})
                  </p>
                ))}
              </div>
            </div>
          )}

          {session.sessoes.map(cat => (
            <div key={cat.id} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span>{cat.icone}</span>
                <p className="font-semibold text-white text-sm">{cat.nome}</p>
                {cat.status === 'concluida' && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />
                )}
              </div>
              <div className="space-y-1.5">
                {cat.itens.map(item => {
                  const abaixo =
                    item.quantidadeContada !== null &&
                    item.estoqueMinimo !== undefined &&
                    item.quantidadeContada < item.estoqueMinimo;
                  return (
                    <div key={item.insumoId} className="flex flex-col gap-0.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{item.nome}</span>
                        <span
                          className={`font-semibold ${
                            item.quantidadeContada === null
                              ? 'text-gray-600'
                              : abaixo
                              ? 'text-amber-400'
                              : 'text-white'
                          }`}
                        >
                          {item.quantidadeContada === null
                            ? '—'
                            : `${formatQtd(item.quantidadeContada)} ${item.unidade}`}
                          {abaixo && ' ⚠'}
                        </span>
                      </div>
                      {item.observacao && (
                        <p className="text-amber-400/70 italic pl-1">💬 {item.observacao}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            onClick={onFinalizar}
            className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-base transition-colors"
          >
            ✓ Confirmar e finalizar contagem
          </button>
          <div className="h-6" />
        </div>
      </div>
    );
  }

  // ── Tela principal de contagem ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Modal global — itens não preenchidos */}
      {itensFaltandoGlobal.length > 0 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {itensFaltandoGlobal.length} {itensFaltandoGlobal.length === 1 ? 'item não preenchido' : 'itens não preenchidos'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Todos os itens precisam ser preenchidos</p>
                </div>
              </div>
              <button onClick={() => setItensFaltandoGlobal([])} className="text-gray-600 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-1.5 max-h-64 overflow-y-auto mb-5">
              {itensFaltandoGlobal.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                  <span>
                    <span className="text-gray-500 text-xs">{item.categoria} · </span>
                    <span className="text-gray-300">{item.nome}</span>
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setItensFaltandoGlobal([])}
              className="w-full py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors"
            >
              Voltar e preencher
            </button>
          </div>
        </div>
      )}
      {/* Header fixo */}
      <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-4 pt-12 pb-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-bold text-white text-base">Contagem de Estoque</h1>
            <p className="text-xs text-gray-500">{dataFormatada}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={onFechar}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors border border-[#374151] rounded-xl px-3 py-2"
            >
              <X className="w-3.5 h-3.5" />
              Salvar e sair
            </button>
            <SaveIndicator status={saveStatus} />
          </div>
        </div>

        {/* Campo de pesquisa */}
        <div className="relative mt-2 mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#2a2a2e] text-white text-sm rounded-xl pl-9 pr-9 py-2.5 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Barra de progresso */}
        <ProgressBar concluidas={concluidas} total={total} />
        <p className="text-xs text-gray-600 mt-1">
          {concluidas} de {total} sessões concluídas
          {alertas.length > 0 && (
            <span className="ml-2 text-amber-500">· ⚠ {alertas.length} alerta{alertas.length !== 1 ? 's' : ''}</span>
          )}
        </p>
      </div>

      {/* Lista de sessões */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {isSearching ? (
          searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="w-10 h-10 text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">Nenhum produto encontrado</p>
              <p className="text-gray-600 text-xs mt-1">"{searchTerm}"</p>
            </div>
          ) : (
            <>
              {searchResults.map(({ item, categoriaId, categoriaNome, icone }) => (
                <div
                  key={`${categoriaId}-${item.insumoId}`}
                  className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden"
                >
                  <p className="px-4 pt-3 pb-1 text-xs text-gray-500 font-medium">
                    {icone} {categoriaNome}
                  </p>
                  <div className="px-4 pb-3">
                    <StockItemRow
                      item={item}
                      categoriaId={categoriaId}
                      onQuantidade={onQuantidade}
                      onObservacao={onObservacao}
                    />
                  </div>
                </div>
              ))}
            </>
          )
        ) : (
          session.sessoes.map((cat, idx) => (
            <SessionAccordion
              key={cat.id}
              categoria={cat}
              isActive={activeCatId === cat.id}
              onToggle={() => toggleCategoria(cat.id)}
              onQuantidade={onQuantidade}
              onObservacao={onObservacao}
              onConcluir={() => handleConcluirCategoria(cat.id)}
              onReabrir={() => onReabrirCategoria(cat.id)}
              onProxima={
                idx < session.sessoes.length - 1
                  ? () => handleProxima(cat.id)
                  : undefined
              }
            />
          ))
        )}

        {/* Botão finalizar */}
        <div className="pt-2 pb-8">
          {todasConcluidas ? (
            <button
              onClick={handleAbrirRevisao}
              className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-base transition-colors"
            >
              ✓ Revisar e finalizar
            </button>
          ) : (
            <button
              disabled
              className="w-full py-4 rounded-2xl bg-[#1c1c1e] border border-[#2a2a2e] text-gray-600 font-medium text-sm cursor-not-allowed"
            >
              Conclua todas as sessões para finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
