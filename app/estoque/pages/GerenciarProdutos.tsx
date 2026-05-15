'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, Search, Package, Plus, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
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
  productOrder: string[];
  onVoltar: () => void;
  onSetAtivo: (insumoId: string, ativo: boolean) => void;
  onSetMinimo: (insumoId: string, minimo: number | undefined) => void;
  onSetModoContagem: (insumoId: string, modo: 'kg' | 'unidade') => void;
  onSetKgPorUnidade: (insumoId: string, kg: number | undefined) => void;
  onMoverAcima: (produtoId: string, allIds: string[]) => void;
  onMoverAbaixo: (produtoId: string, allIds: string[]) => void;
  onRefetch: () => void;
}

const UNIDADES = ['kg', 'g', 'L', 'ml', 'un'] as const;
const TIPOS_ARMAZENAMENTO = [
  { value: '', label: 'Sem classificação' },
  { value: 'CONGELADO', label: '🧊 Congelado' },
  { value: 'RESFRIADO', label: '❄️ Resfriado' },
  { value: 'AMBIENTE', label: '🌿 Temperatura Ambiente' },
] as const;

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

// ── Modal de novo produto ──────────────────────────────────────────────────────

interface NovoProdutoModalProps {
  onClose: () => void;
  onSalvo: () => void;
}

function NovoProdutoModal({ onClose, onSalvo }: NovoProdutoModalProps) {
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState<typeof UNIDADES[number]>('kg');
  const [pesoPadrao, setPesoPadrao] = useState('1');
  const [tipoArmazenamento, setTipoArmazenamento] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSalvar = async () => {
    const nomeTrimmed = nome.trim();
    if (nomeTrimmed.length < 2) {
      setErro('Nome deve ter pelo menos 2 caracteres');
      return;
    }
    const peso = parseFloat(pesoPadrao.replace(',', '.'));
    if (isNaN(peso) || peso <= 0) {
      setErro('Peso padrão deve ser um número maior que zero');
      return;
    }

    setSalvando(true);
    setErro('');

    try {
      const res = await fetch('/api/etiquetagem/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeTrimmed,
          unidadeMedida: unidade,
          pesoPadrao: peso,
          tipoArmazenamentoPadrao: tipoArmazenamento || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Erro ao criar produto');
        return;
      }

      onSalvo();
      onClose();
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-0">
      <div className="w-full max-w-lg bg-[#1c1c1e] rounded-t-3xl border-t border-[#2a2a2e] p-6 pb-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white text-lg">Novo produto</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Nome do produto *</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Queijo mussarela"
              autoFocus
              className="w-full bg-[#141416] border border-[#374151] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Unidade + Peso */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Unidade *</label>
              <select
                value={unidade}
                onChange={e => setUnidade(e.target.value as typeof UNIDADES[number])}
                className="w-full bg-[#141416] border border-[#374151] rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-amber-500/60"
              >
                {UNIDADES.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Peso padrão *</label>
              <input
                type="number"
                inputMode="decimal"
                min="0.001"
                step="0.1"
                value={pesoPadrao}
                onChange={e => setPesoPadrao(e.target.value)}
                placeholder="1"
                className="w-full bg-[#141416] border border-[#374151] rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Tipo de armazenamento */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Tipo de armazenamento</label>
            <select
              value={tipoArmazenamento}
              onChange={e => setTipoArmazenamento(e.target.value)}
              className="w-full bg-[#141416] border border-[#374151] rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-amber-500/60"
            >
              {TIPOS_ARMAZENAMENTO.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Erro */}
          {erro && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {erro}
            </p>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[#374151] text-gray-400 text-sm font-medium hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {salvando ? 'Criando…' : 'Criar produto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export function GerenciarProdutos({
  produtos,
  config,
  productOrder,
  onVoltar,
  onSetAtivo,
  onSetMinimo,
  onSetModoContagem,
  onSetKgPorUnidade,
  onMoverAcima,
  onMoverAbaixo,
  onRefetch,
}: GerenciarProdutosProps) {
  const [search, setSearch] = useState('');
  const [reordenando, setReordenando] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const produtosAtivos = produtos.filter(p => p.isAtivo === 1);
  const allIds = produtosAtivos.map(p => p.id);

  // Ordenar produtos ativos pela ordem customizada
  const produtosOrdenados = useMemo(() => {
    return [...produtosAtivos].sort((a, b) => {
      if (productOrder.length === 0) return a.nome.localeCompare(b.nome, 'pt-BR');
      const ia = productOrder.indexOf(a.id);
      const ib = productOrder.indexOf(b.id);
      if (ia === -1 && ib === -1) return a.nome.localeCompare(b.nome, 'pt-BR');
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [produtosAtivos, productOrder]);

  // Agrupar produtos pelas mesmas sessões do estoque
  const grupos = useMemo(() => {
    return construirSessoesFromProdutos(
      produtosAtivos,
      {},
      productOrder,
    );
  }, [produtosAtivos, productOrder]);

  const filtrados = search.trim()
    ? produtosOrdenados.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()))
    : null;

  const totalAtivos = produtosAtivos.filter(p => {
    const cfg = config[p.id];
    return cfg === undefined || cfg.ativo !== false;
  }).length;

  const handleProdutoCriado = () => {
    onRefetch();
  };

  return (
    <>
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReordenando(r => !r)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                  reordenando
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'border-[#374151] text-gray-400 hover:text-white'
                }`}
              >
                {reordenando ? 'Concluir' : 'Reordenar'}
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="p-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>

          {!reordenando && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar produto…"
                className="w-full bg-[#141416] border border-[#374151] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          )}
        </div>

        {/* Info */}
        {!reordenando && (
          <div className="px-4 py-3 bg-[#141416] border-b border-[#2a2a2e]">
            <p className="text-xs text-gray-500">
              Produtos <span className="text-white">desabilitados</span> não aparecem nas próximas contagens.
              O <span className="text-white">estoque mínimo</span> gera alerta quando a quantidade contada estiver abaixo.
            </p>
          </div>
        )}

        {reordenando && (
          <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
            <p className="text-xs text-amber-400">
              Use as setas para definir a ordem de exibição dos produtos na contagem.
            </p>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 overflow-y-auto pb-6">
          {produtosAtivos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Package className="w-12 h-12 text-gray-700 mb-3" />
              <p className="text-white font-semibold">Nenhum produto cadastrado</p>
              <p className="text-sm text-gray-500 mt-1">
                Toque em <span className="text-amber-400">+</span> para criar o primeiro produto
              </p>
            </div>
          ) : reordenando ? (
            // ── Modo reordenação: lista plana ─────────────────────────
            <div className="px-4 pt-4 space-y-2">
              {produtosOrdenados.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl px-4 py-3"
                >
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => onMoverAcima(p.id, allIds)}
                      disabled={idx === 0}
                      className="p-1 text-gray-400 hover:text-amber-400 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onMoverAbaixo(p.id, allIds)}
                      disabled={idx === produtosOrdenados.length - 1}
                      className="p-1 text-gray-400 hover:text-amber-400 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.nome}</p>
                    <p className="text-xs text-gray-600">{p.unidadeMedida ?? 'un'}</p>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">{idx + 1}</span>
                </div>
              ))}
            </div>
          ) : filtrados ? (
            // ── Resultado de busca: lista plana ───────────────────────
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
            // ── Agrupado por sessão ───────────────────────────────────
            grupos.map(grupo => {
              const produtosDoGrupo = produtosOrdenados.filter(p => {
                return grupo.itens.some(i => i.insumoId === p.id);
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

      {showModal && (
        <NovoProdutoModal
          onClose={() => setShowModal(false)}
          onSalvo={handleProdutoCriado}
        />
      )}
    </>
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

      {ativo && (
        <div className="mt-2.5 flex items-center gap-2 pl-14">
          <span className="text-xs text-gray-500 shrink-0">Contar por:</span>

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
