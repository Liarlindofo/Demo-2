'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Upload, CheckSquare, Square, Trash2, X, AlertTriangle, LayoutGrid, List, Package2 } from 'lucide-react';
import type { StoreId, ProductCMV, Sabor, Combo, ComboCMV } from '../types';
import { useStoreData } from '../hooks/useStoreData';
import { calcularTodosCMV, calcularMetricasLoja, calcularMetricasCombos, agruparPorSabor, calcularTodosCombos, type FlavorGroup } from '../utils';
import { CMV_META, CMV_COLORS } from '../constants';
import { MetricCards } from './MetricCards';
import { PizzaCard } from './PizzaCard';
import { PizzaModal } from './PizzaModal';
import { AddProductModal } from './AddProductModal';
import { ImportPlanilhaModal } from './ImportPlanilhaModal';
import { FlavorGroupCard } from './FlavorGroupCard';
import { FlavorGroupModal } from './FlavorGroupModal';
import { ComboCard } from './ComboCard';
import { ComboModal } from './ComboModal';

interface StoreTabProps {
  storeId: StoreId;
}

type FilterStatus = 'todos' | 'otimo' | 'atencao' | 'critico';
type ViewMode = 'agrupado' | 'lista' | 'combos';

const FILTER_LABELS: Record<FilterStatus, string> = {
  todos: 'Todos',
  otimo: 'Ótimo',
  atencao: 'Atenção',
  critico: 'Acima da meta',
};

/** Filtro de categoria: '' = todas, 'bebidas' = só bebidas, ou id da CategoriaPreco de pizza */
type FilterCategoria = string;

export const StoreTab = ({ storeId }: StoreTabProps) => {
  const { data, updateData, isLoading } = useStoreData(storeId);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('todos');
  const [filterCategoria, setFilterCategoria] = useState<FilterCategoria>('');
  const [viewMode, setViewMode] = useState<ViewMode>('agrupado');

  // Vista lista — produto individual selecionado
  const [selectedSabor, setSelectedSabor] = useState<Sabor | null>(null);
  // Vista agrupada — grupo selecionado
  const [selectedGroup, setSelectedGroup] = useState<FlavorGroup | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // ── Combos ─────────────────────────────────────────────────────────────────
  const [selectedCombo, setSelectedCombo] = useState<Combo | null | undefined>(undefined);
  // undefined = modal fechado, null = novo combo, Combo = editar

  const combos = useMemo(() => calcularTodosCombos(data), [data]);
  const filteredCombos = combos.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSaveCombo = (combo: Combo) => {
    const exists = (data.combos ?? []).some(c => c.id === combo.id);
    const newCombos = exists
      ? (data.combos ?? []).map(c => (c.id === combo.id ? combo : c))
      : [...(data.combos ?? []), combo];
    updateData({ ...data, combos: newCombos });
    setSelectedCombo(undefined);
  };

  const handleDeleteCombo = (comboId: string) => {
    updateData({ ...data, combos: (data.combos ?? []).filter(c => c.id !== comboId) });
    setSelectedCombo(undefined);
  };

  // ── Seleção múltipla (somente na vista lista) ──────────────────────────────
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const products = calcularTodosCMV(data);
  const metricsProdutos = useMemo(() => calcularMetricasLoja(data), [data]);
  const metricsCombos = useMemo(() => calcularMetricasCombos(data), [data]);
  const metrics = viewMode === 'combos' ? metricsCombos : metricsProdutos;

  // Categorias de pizza ordenadas para os filtros de categoria
  const categoriasPizzaFiltro = useMemo(() => {
    return [...data.categorias]
      .filter(c => (c.tipoPrecificacao ?? 'pizza') === 'pizza')
      .sort((a, b) => {
        const ga = a.grupo ?? '';
        const gb = b.grupo ?? '';
        if (ga !== gb) return ga.localeCompare(gb, 'pt-BR');
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
  }, [data.categorias]);

  // Grupos de pizza com 2+ categorias → ganham botão de filtro de grupo
  const gruposDePizzaFiltro = useMemo(() => {
    const contagem = new Map<string, number>();
    categoriasPizzaFiltro.forEach(cat => {
      if (cat.grupo) contagem.set(cat.grupo, (contagem.get(cat.grupo) ?? 0) + 1);
    });
    return [...contagem.entries()]
      .filter(([, total]) => total >= 2)
      .map(([grupo]) => grupo)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [categoriasPizzaFiltro]);

  const filtered = products.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    // Filtro de status
    if (filter === 'otimo' && p.status !== 'otimo') return false;
    if (filter === 'atencao' && p.status !== 'atencao') return false;
    if (filter === 'critico' && p.status !== 'critico') return false;

    // Filtro de categoria
    if (filterCategoria === 'bebidas') return p.tipoPrecificacao === 'bebidas';
    if (filterCategoria === 'entradas') return p.tipoPrecificacao === 'entradas';
    if (filterCategoria.startsWith('grupo:')) {
      const grupo = filterCategoria.slice(6);
      const sabor = data.sabores.find(s => s.id === p.id);
      const cat = data.categorias.find(c => c.id === sabor?.categoriaId);
      return cat?.grupo === grupo;
    }
    if (filterCategoria) {
      const sabor = data.sabores.find(s => s.id === p.id);
      return sabor?.categoriaId === filterCategoria;
    }

    return true;
  });

  const temBebidas = data.categorias.some(c => c.tipoPrecificacao === 'bebidas');
  const temEntradas = data.categorias.some(c => c.tipoPrecificacao === 'entradas');

  const groups = agruparPorSabor(filtered);

  // Filtra grupos pelo search também (pelo nome do grupo)
  const filteredGroups = search
    ? groups.filter(g =>
        g.nome.toLowerCase().includes(search.toLowerCase()) ||
        g.produtos.some(p => p.nome.toLowerCase().includes(search.toLowerCase()))
      )
    : groups;

  // ── Select mode ────────────────────────────────────────────────────────────
  const allFilteredSelected =
    filtered.length > 0 && filtered.every(p => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const enterSelectMode = () => {
    setSelectMode(true);
    setSelectedIds(new Set());
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setShowConfirmDelete(false);
  };

  const deleteSelected = () => {
    updateData({ ...data, sabores: data.sabores.filter(s => !selectedIds.has(s.id)) });
    exitSelectMode();
  };

  const handleClickCard = (product: ProductCMV) => {
    if (selectMode) {
      toggleSelect(product.id);
      return;
    }
    const sabor = data.sabores.find(s => s.id === product.id);
    if (sabor) setSelectedSabor(sabor);
  };

  const handleClickGroup = (group: FlavorGroup) => {
    if (selectMode) {
      const groupIds = group.produtos.map(p => p.id);
      const allSelected = groupIds.every(id => selectedIds.has(id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (allSelected) {
          groupIds.forEach(id => next.delete(id));
        } else {
          groupIds.forEach(id => next.add(id));
        }
        return next;
      });
      return;
    }
    setSelectedGroup(group);
  };

  const handleDeleteSabor = (saborId: string) => {
    updateData({ ...data, sabores: data.sabores.filter(s => s.id !== saborId) });
  };

  const handleCloneSabor = (saborId: string) => {
    const original = data.sabores.find(s => s.id === saborId);
    if (!original) return;
    const clone = {
      ...original,
      id: crypto.randomUUID(),
      nome: `${original.nome} (cópia)`,
      itens: original.itens ? original.itens.map(i => ({ ...i, id: crypto.randomUUID() })) : [],
    };
    updateData({ ...data, sabores: [...data.sabores, clone] });
  };

  const handleRenameSabor = (saborId: string, newName: string) => {
    updateData({
      ...data,
      sabores: data.sabores.map(s => s.id === saborId ? { ...s, nome: newName } : s),
    });
  };

  const handleSwitchView = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'combos') {
      exitSelectMode();
      setFilterCategoria('');
    }
  };

  // Quando salva de dentro do FlavorGroupModal, precisamos atualizar o grupo aberto
  const handleSaveFromGroup = (newData: Parameters<typeof updateData>[0]) => {
    updateData(newData);
    // Re-calcular e atualizar o grupo selecionado
    if (selectedGroup) {
      const newProducts = calcularTodosCMV(newData);
      const newGroups = agruparPorSabor(newProducts);
      const updatedGroup = newGroups.find(g => g.nome === selectedGroup.nome);
      setSelectedGroup(updatedGroup ?? null);
    }
  };

  const handleDeleteFromGroup = (saborId: string) => {
    const newData = { ...data, sabores: data.sabores.filter(s => s.id !== saborId) };
    updateData(newData);
    if (selectedGroup) {
      const newProducts = calcularTodosCMV(newData);
      const newGroups = agruparPorSabor(newProducts);
      const updatedGroup = newGroups.find(g => g.nome === selectedGroup.nome);
      if (!updatedGroup || updatedGroup.produtos.length === 0) {
        setSelectedGroup(null);
      } else {
        setSelectedGroup(updatedGroup);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Métricas */}
      <MetricCards
        metrics={metrics}
        isLoading={isLoading}
        variant={viewMode === 'combos' ? 'combos' : 'produtos'}
      />

      {/* Controles */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto ou sabor..."
            className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#374151]"
          />
        </div>

        {/* Toggle de visualização */}
        <div className="flex items-center gap-1 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl p-1">
          <button
            onClick={() => handleSwitchView('agrupado')}
            title="Visualização agrupada por sabor"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'agrupado'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Sabores</span>
          </button>
          <button
            onClick={() => handleSwitchView('lista')}
            title="Visualização de todos os produtos"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'lista'
                ? 'bg-white text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Todos</span>
          </button>
          <button
            onClick={() => handleSwitchView('combos')}
            title="Combos de produtos"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'combos'
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Package2 className="w-4 h-4" />
            <span className="hidden sm:inline">Combos</span>
            {(data.combos ?? []).length > 0 && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                viewMode === 'combos' ? 'bg-white/20 text-white' : 'bg-[#2a2a2e] text-gray-400'
              }`}>
                {(data.combos ?? []).length}
              </span>
            )}
          </button>
        </div>

        {(viewMode === 'lista' || viewMode === 'agrupado') && !selectMode ? (
          <>
            {products.length > 0 && (
              <button
                onClick={enterSelectMode}
                className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-[#374151] text-gray-400 hover:text-white rounded-xl px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap"
              >
                <CheckSquare className="w-4 h-4" />
                Selecionar
              </button>
            )}
          </>
        ) : (viewMode === 'lista' || viewMode === 'agrupado') && selectMode ? (
          <>
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-[#374151] text-gray-400 hover:text-white rounded-xl px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap"
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-red-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Selecionar tudo
            </button>
            <span className="text-sm text-gray-400 whitespace-nowrap">
              {selectedIds.size > 0
                ? `${selectedIds.size} selecionado${selectedIds.size !== 1 ? 's' : ''}`
                : 'Nenhum selecionado'}
            </span>
            {someSelected && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                Excluir {selectedIds.size}
              </button>
            )}
            <button
              onClick={exitSelectMode}
              className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-[#374151] text-gray-400 hover:text-white rounded-xl px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </>
        ) : null}

        {viewMode === 'combos' ? (
          <button
            onClick={() => setSelectedCombo(null)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Novo Combo
          </button>
        ) : !selectMode && (viewMode === 'lista' || viewMode === 'agrupado') && (
          <>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-blue-500/50 hover:bg-blue-500/10 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              Importar
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-green-500/50 hover:bg-green-500/10 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Produto
            </button>
          </>
        )}
      </div>

      {/* Filtros de status */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as FilterStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
              filter === f
                ? 'bg-white text-black border-white'
                : 'bg-transparent text-gray-400 border-[#2a2a2e] hover:border-[#374151] hover:text-white'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Filtros de categoria (só aparece se houver categorias cadastradas) */}
      {(categoriasPizzaFiltro.length > 0 || temBebidas || temEntradas) && viewMode !== 'combos' && (
        <div className="flex flex-wrap gap-2">
          {/* Todas as categorias */}
          <button
            onClick={() => setFilterCategoria('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              filterCategoria === ''
                ? 'bg-[#374151] text-white border-[#374151]'
                : 'bg-transparent text-gray-500 border-[#2a2a2e] hover:border-[#374151] hover:text-gray-300'
            }`}
          >
            Todas as categorias
          </button>

          {/* Botões de grupo (ex: TRADICIONAL agrupa TRADICIONAL I, II...) */}
          {gruposDePizzaFiltro.map(grupo => (
            <button
              key={`grupo:${grupo}`}
              onClick={() => setFilterCategoria(`grupo:${grupo}`)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                filterCategoria === `grupo:${grupo}`
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                  : 'bg-transparent text-gray-500 border-[#2a2a2e] hover:border-orange-500/30 hover:text-gray-300'
              }`}
            >
              🍕 {grupo}
            </button>
          ))}

          {/* Uma por categoria de pizza */}
          {categoriasPizzaFiltro.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategoria(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                filterCategoria === cat.id
                  ? 'bg-red-500/20 text-red-300 border-red-500/50'
                  : 'bg-transparent text-gray-500 border-[#2a2a2e] hover:border-red-500/30 hover:text-gray-300'
              }`}
            >
              {cat.nome}
            </button>
          ))}

          {/* Bebidas */}
          {temBebidas && (
            <button
              onClick={() => setFilterCategoria('bebidas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                filterCategoria === 'bebidas'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-transparent text-gray-500 border-[#2a2a2e] hover:border-cyan-500/30 hover:text-gray-300'
              }`}
            >
              🥤 Bebidas
            </button>
          )}

          {/* Entradas */}
          {temEntradas && (
            <button
              onClick={() => setFilterCategoria('entradas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                filterCategoria === 'entradas'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-transparent text-gray-500 border-[#2a2a2e] hover:border-amber-500/30 hover:text-gray-300'
              }`}
            >
              🍽️ Entradas
            </button>
          )}
        </div>
      )}

      {/* Linha de meta */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="w-6 h-0.5 bg-red-500" />
        <span>Linha vermelha = meta de {CMV_META}% CMV</span>
        {viewMode === 'agrupado' && filteredGroups.length > 0 && (
          <span className="ml-auto text-gray-600">
            {filteredGroups.length} {filteredGroups.length === 1 ? 'sabor' : 'sabores'} · {filtered.length} variações
          </span>
        )}
      </div>

      {/* ── Vista Agrupada ──────────────────────────────────────────────────── */}
      {viewMode === 'agrupado' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-3 w-3/4" />
                  <div className="h-1.5 bg-white/10 rounded mb-4" />
                  <div className="flex gap-1 mb-3">
                    {[...Array(4)].map((_, j) => (<div key={j} className="h-5 w-12 bg-white/10 rounded-md" />))}
                  </div>
                  <div className="h-8 bg-white/10 rounded mt-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <EmptyState hasData={data.sabores.length > 0} onAdd={() => setShowAddModal(true)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredGroups.map(group => {
                const selectedCount = group.produtos.filter(p => selectedIds.has(p.id)).length;
                return (
                  <FlavorGroupCard
                    key={group.nome}
                    group={group}
                    onClick={() => handleClickGroup(group)}
                    selectMode={selectMode}
                    selectedCount={selectedCount}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Vista Lista (todos os produtos) ────────────────────────────────── */}
      {viewMode === 'lista' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-3 w-3/4" />
                  <div className="h-1.5 bg-white/10 rounded mb-4" />
                  <div className="space-y-2">
                    {[...Array(3)].map((_, j) => (<div key={j} className="h-3 bg-white/10 rounded" />))}
                  </div>
                  <div className="h-8 bg-white/10 rounded mt-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasData={data.sabores.length > 0} onAdd={() => setShowAddModal(true)} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(product => (
                <PizzaCard
                  key={product.id}
                  product={product}
                  onClick={() => handleClickCard(product)}
                  selectMode={selectMode}
                  selected={selectedIds.has(product.id)}
                  onClone={!selectMode ? () => handleCloneSabor(product.id) : undefined}
                  onRename={!selectMode ? (name) => handleRenameSabor(product.id, name) : undefined}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Vista Combos ─────────────────────────────────────────────────── */}
      {viewMode === 'combos' && (
        <>
          {filteredCombos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {(data.combos ?? []).length === 0 ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                    <Package2 className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Nenhum combo ainda</h3>
                  <p className="text-sm text-gray-400 mb-6 max-w-sm">
                    Agrupe produtos em combos para calcular o CMV do conjunto e definir um preço de venda.
                  </p>
                  <button
                    onClick={() => setSelectedCombo(null)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Criar primeiro combo
                  </button>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-sm text-gray-400">Nenhum combo encontrado</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCombos.map(combo => (
                <ComboCard
                  key={combo.id}
                  combo={combo}
                  onClick={() => {
                    const raw = (data.combos ?? []).find(c => c.id === combo.id);
                    if (raw) setSelectedCombo(raw);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modais ─────────────────────────────────────────────────────────── */}

      {/* Modal de combo */}
      {selectedCombo !== undefined && (
        <ComboModal
          combo={selectedCombo}
          data={data}
          onClose={() => setSelectedCombo(undefined)}
          onSave={handleSaveCombo}
          onDelete={handleDeleteCombo}
        />
      )}

      {/* Modal de grupo */}
      {selectedGroup && (
        <FlavorGroupModal
          group={selectedGroup}
          data={data}
          onClose={() => setSelectedGroup(null)}
          onSave={handleSaveFromGroup}
          onDelete={handleDeleteFromGroup}
        />
      )}

      {/* Modal de produto individual (vista lista) */}
      {selectedSabor && (
        <PizzaModal
          sabor={selectedSabor}
          data={data}
          onClose={() => setSelectedSabor(null)}
          onSave={updateData}
          onDelete={handleDeleteSabor}
        />
      )}

      {showAddModal && (
        <AddProductModal
          data={data}
          onClose={() => setShowAddModal(false)}
          onSave={newData => {
            updateData(newData);
            setShowAddModal(false);
          }}
        />
      )}

      {showImportModal && (
        <ImportPlanilhaModal
          data={data}
          onClose={() => setShowImportModal(false)}
          onSave={newData => {
            updateData(newData);
            setShowImportModal(false);
          }}
        />
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Excluir produtos?</h3>
                <p className="text-xs text-gray-400 mt-0.5">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-6">
              Você está prestes a excluir{' '}
              <span className="font-semibold text-white">
                {selectedIds.size} produto{selectedIds.size !== 1 ? 's' : ''}
              </span>{' '}
              permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-2.5 bg-[#2a2a2e] hover:bg-[#333] text-white rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={deleteSelected}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Excluir de vez
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Componente auxiliar de estado vazio ────────────────────────────────────────
const EmptyState = ({ hasData, onAdd }: { hasData: boolean; onAdd: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    {!hasData ? (
      <>
        <div className="text-5xl mb-4">🍕</div>
        <h3 className="text-lg font-semibold text-white mb-2">Nenhum produto ainda</h3>
        <p className="text-sm text-gray-400 mb-6 max-w-sm">
          Adicione seus sabores de pizza manualmente ou importe de uma planilha.
          <br />
          <span className="text-gray-500">
            Dica: cadastre ingredientes e receitas primeiro para montar a ficha técnica completa.
          </span>
        </p>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar primeiro produto
        </button>
      </>
    ) : (
      <>
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="text-base font-semibold text-white mb-1">Nenhum produto encontrado</h3>
        <p className="text-sm text-gray-400">Tente ajustar a busca ou os filtros</p>
      </>
    )}
  </div>
);
