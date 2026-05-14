'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, Search, Package } from 'lucide-react';
import type { EstoqueConfigMap } from '../hooks/useEstoqueConfig';
import { construirSessoesFromProdutos } from '../hooks/useProdutosEstoque';

interface ProdutoAPI {
  id: string;
  nome: string;
  unidadeMedida: string | null;
  tipoArmazenamentoPadrao: string | null;
  isAtivo: number;
  categoria?: { nome: string; temperaturaArmazenamento: string } | null;
}

interface GerenciarProdutosProps {
  produtos: ProdutoAPI[];
  config: EstoqueConfigMap;
  onVoltar: () => void;
  onSetAtivo: (insumoId: string, ativo: boolean) => void;
  onSetMinimo: (insumoId: string, minimo: number | undefined) => void;
  onSetModoContagem: (insumoId: string, modo: 'kg' | 'unidade') => void;
  onSetKgPorUnidade: (insumoId: string, kg: number | undefined) => void;
}

function Toggle({ ativo, onChange }: { ativo: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!ativo)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        ativo ? 'bg-amber-500' : 'bg-[#374151]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          ativo ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function GerenciarProdutos({
  produtos,
  config,
  onVoltar,
  onSetAtivo,
  onSetMinimo,
  onSetModoContagem,
  onSetKgPorUnidade,
}: GerenciarProdutosProps) {
  const [search, setSearch] = useState('');

  // Agrupar produtos pelas mesmas sessões do estoque
  const grupos = useMemo(() => {
    const sessoes = construirSessoesFromProdutos(
      produtos.filter(p => p.isAtivo === 1),
      {}, // sem filtro de config aqui — mostramos todos
    );

    // Adicionar de volta os produtos inativos em cada grupo
    const sessoesMap = new Map(sessoes.map(s => [s.id, s]));
    return sessoes;
  }, [produtos]);

  const produtosAtivos = produtos.filter(p => p.isAtivo === 1);

  const filtrados = search.trim()
    ? produtosAtivos.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()))
    : null; // null = mostrar por grupo

  const totalAtivos = produtosAtivos.filter(p => {
    const cfg = config[p.id];
    return cfg === undefined || cfg.ativo !== false;
  }).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="bg-[#1c1c1e] border-b border-[#2a2a2e] px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onVoltar} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-white text-lg">Produtos da Contagem</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalAtivos} de {produtosAtivos.length} produto{produtosAtivos.length !== 1 ? 's' : ''} habilitado{totalAtivos !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto…"
            className="w-full bg-[#141416] border border-[#374151] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
          />
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3 bg-[#141416] border-b border-[#2a2a2e]">
        <p className="text-xs text-gray-500">
          Produtos <span className="text-white">desabilitados</span> não aparecem nas próximas contagens.
          O <span className="text-white">estoque mínimo</span> gera alerta quando a quantidade contada estiver abaixo.
        </p>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto pb-6">
        {produtosAtivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <Package className="w-12 h-12 text-gray-700 mb-3" />
            <p className="text-white font-semibold">Nenhum produto cadastrado</p>
            <p className="text-sm text-gray-500 mt-1">
              Cadastre produtos na ferramenta <span className="text-amber-400">Produtos</span> para que apareçam aqui
            </p>
          </div>
        ) : filtrados ? (
          // Resultado de busca — lista plana
          <div className="px-4 pt-4 space-y-2">
            {filtrados.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">Nenhum produto encontrado</p>
            ) : (
              filtrados.map(p => (
                <ProdutoRow
                  key={p.id}
                  produto={p}
                  config={config[p.id]}
                  onSetAtivo={onSetAtivo}
                  onSetMinimo={onSetMinimo}
                  onSetModoContagem={onSetModoContagem}
                  onSetKgPorUnidade={onSetKgPorUnidade}
                />
              ))
            )}
          </div>
        ) : (
          // Agrupado por sessão
          grupos.map(grupo => {
            const produtosDoGrupo = produtosAtivos.filter(p => {
              const item = grupo.itens.find(i => i.insumoId === p.id);
              return !!item;
            });
            if (produtosDoGrupo.length === 0) return null;

            return (
              <div key={grupo.id}>
                <div className="flex items-center gap-2 px-4 pt-5 pb-2">
                  <span className="text-base">{grupo.icone}</span>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {grupo.nome}
                  </p>
                  <span className="text-xs text-gray-600 ml-auto">
                    {produtosDoGrupo.filter(p => {
                      const cfg = config[p.id];
                      return cfg === undefined || cfg.ativo !== false;
                    }).length}/{produtosDoGrupo.length}
                  </span>
                </div>
                <div className="px-4 space-y-2">
                  {produtosDoGrupo.map(p => (
                    <ProdutoRow
                      key={p.id}
                      produto={p}
                      config={config[p.id]}
                      onSetAtivo={onSetAtivo}
                      onSetMinimo={onSetMinimo}
                      onSetModoContagem={onSetModoContagem}
                      onSetKgPorUnidade={onSetKgPorUnidade}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Linha de produto ──────────────────────────────────────────────────────────

interface ProdutoRowProps {
  produto: { id: string; nome: string; unidadeMedida: string | null };
  config: { ativo: boolean; estoqueMinimo?: number; modoContagem?: 'kg' | 'unidade'; kgPorUnidade?: number } | undefined;
  onSetAtivo: (id: string, v: boolean) => void;
  onSetMinimo: (id: string, v: number | undefined) => void;
  onSetModoContagem: (id: string, modo: 'kg' | 'unidade') => void;
  onSetKgPorUnidade: (id: string, kg: number | undefined) => void;
}

function ProdutoRow({ produto, config, onSetAtivo, onSetMinimo, onSetModoContagem, onSetKgPorUnidade }: ProdutoRowProps) {
  const ativo = config?.ativo !== false;
  const minimo = config?.estoqueMinimo;
  const modo = config?.modoContagem ?? 'kg';
  const kgPorUnidade = config?.kgPorUnidade;

  const handleMinimo = (raw: string) => {
    if (raw === '') { onSetMinimo(produto.id, undefined); return; }
    const n = parseFloat(raw.replace(',', '.'));
    if (!isNaN(n) && n >= 0) onSetMinimo(produto.id, n);
  };

  const handleKgPorUnidade = (raw: string) => {
    if (raw === '') { onSetKgPorUnidade(produto.id, undefined); return; }
    const n = parseFloat(raw.replace(',', '.'));
    if (!isNaN(n) && n > 0) onSetKgPorUnidade(produto.id, n);
  };

  return (
    <div
      className={`rounded-2xl border px-4 py-3 transition-colors ${
        ativo ? 'bg-[#1c1c1e] border-[#2a2a2e]' : 'bg-[#141416] border-[#2a2a2e] opacity-50'
      }`}
    >
      {/* Linha principal */}
      <div className="flex items-center gap-3">
        <Toggle ativo={ativo} onChange={v => onSetAtivo(produto.id, v)} />

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${ativo ? 'text-white' : 'text-gray-500'}`}>
            {produto.nome}
          </p>
          <p className="text-xs text-gray-600">{produto.unidadeMedida ?? 'un'}</p>
        </div>

        {/* Mínimo — sempre em kg */}
        {ativo && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-gray-500">mín:</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={minimo ?? ''}
              onChange={e => handleMinimo(e.target.value)}
              placeholder="—"
              className="w-16 text-right text-sm font-medium bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1 text-white focus:outline-none focus:border-amber-500/60 placeholder-gray-700"
            />
            <span className="text-xs text-gray-600">kg</span>
          </div>
        )}
      </div>

      {/* Linha de modo de contagem */}
      {ativo && (
        <div className="mt-2.5 flex items-center gap-2 pl-14">
          <span className="text-xs text-gray-500 shrink-0">Contar por:</span>

          {/* Segmented control kg / un */}
          <div className="flex rounded-lg overflow-hidden border border-[#374151] shrink-0">
            {(['kg', 'unidade'] as const).map(m => (
              <button
                key={m}
                onClick={() => onSetModoContagem(produto.id, m)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  modo === m
                    ? 'bg-amber-500 text-black'
                    : 'bg-[#2a2a2e] text-gray-400 hover:text-white'
                }`}
              >
                {m === 'kg' ? 'kg' : 'unidade'}
              </button>
            ))}
          </div>

          {/* Campo kg por unidade — só aparece quando modo = unidade */}
          {modo === 'unidade' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 shrink-0">1 un =</span>
              <input
                type="number"
                inputMode="decimal"
                min="0.001"
                step="0.1"
                value={kgPorUnidade ?? ''}
                onChange={e => handleKgPorUnidade(e.target.value)}
                placeholder="0,0"
                className="w-16 text-right text-sm font-medium bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1 text-white focus:outline-none focus:border-amber-500/60 placeholder-gray-700"
              />
              <span className="text-xs text-gray-600">kg</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
