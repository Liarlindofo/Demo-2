'use client';

import { useState, useRef } from 'react';
import { Plus, Trash2, AlertTriangle, ChevronDown, ChevronRight, Tag, Info } from 'lucide-react';
import type { StoreId, CategoriaPreco, Tamanho } from '../types';
import { TAMANHOS_PIZZA, TAMANHO_LABELS, isCategoriaPrecoPizza } from '../types';
import { useStoreData } from '../hooks/useStoreData';
import { formatCurrency } from '../utils';

interface CategoriasTabProps {
  storeId: StoreId;
}

// ── Célula de preço inline (estilo planilha) ───────────────────────────────────
interface PriceCellProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  disabled?: boolean;
}

const PriceCell = ({ value, onChange, disabled }: PriceCellProps) => {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    if (disabled) return;
    setRaw(value != null ? String(value).replace('.', ',') : '');
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    const parsed = parseFloat(raw.replace(',', '.'));
    onChange(isNaN(parsed) || parsed < 0 ? undefined : parsed);
    setEditing(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setEditing(false); }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!editing) { onChange(undefined); }
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={raw}
        onChange={e => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        autoFocus
        className="w-full bg-yellow-500/10 border border-yellow-500/60 rounded px-1.5 py-1 text-sm text-white text-right focus:outline-none font-medium"
        placeholder="0,00"
      />
    );
  }

  return (
    <div
      onClick={startEdit}
      onKeyDown={handleKey}
      tabIndex={disabled ? -1 : 0}
      className={`w-full px-1.5 py-1 text-sm text-right rounded cursor-pointer select-none transition-colors
        ${value != null
          ? 'text-white font-medium hover:bg-white/5'
          : 'text-gray-600 hover:bg-white/5 hover:text-gray-400'
        }
      `}
    >
      {value != null ? formatCurrency(value) : '—'}
    </div>
  );
};

// ── Componente principal ───────────────────────────────────────────────────────

export const CategoriasTab = ({ storeId }: CategoriasTabProps) => {
  const { data, updateData, isLoading } = useStoreData(storeId);

  // ── Estado de UI ──────────────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newGrupo, setNewGrupo] = useState('');
  const [newTipoPrecificacao, setNewTipoPrecificacao] = useState<'pizza' | 'bebidas' | 'entradas'>('pizza');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const gruposOrdenadosDe = (lista: CategoriaPreco[]) => {
    const map = new Map<string, CategoriaPreco[]>();
    lista.forEach(cat => {
      const g = cat.grupo?.trim() || '';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(cat);
    });
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === '' && b !== '') return 1;
      if (a !== '' && b === '') return -1;
      return a.localeCompare(b, 'pt-BR');
    });
  };

  const catsPizza = data.categorias.filter(isCategoriaPrecoPizza);
  const catsBebidas = data.categorias.filter(c => c.tipoPrecificacao === 'bebidas');
  const catsEntradas = data.categorias.filter(c => c.tipoPrecificacao === 'entradas');
  const gruposPizza = gruposOrdenadosDe(catsPizza);
  const gruposBebidas = gruposOrdenadosDe(catsBebidas);
  const gruposEntradas = gruposOrdenadosDe(catsEntradas);

  const toggleGroup = (g: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });
  };

  // Grupos disponíveis (para o autocomplete do campo "Grupo")
  const gruposExistentes = Array.from(new Set(data.categorias.map(c => c.grupo).filter(Boolean))) as string[];

  // Quantos produtos usam cada categoria
  const contarUsos = (catId: string) => data.sabores.filter(s => s.categoriaId === catId).length;

  // ── Atualizar um preço específico ──────────────────────────────────────────
  const updatePreco = (catId: string, tamanho: Tamanho, value: number | undefined) => {
    const newCats = data.categorias.map(c => {
      if (c.id !== catId) return c;
      const novoPrecos = { ...c.precos };
      if (value == null) {
        delete novoPrecos[tamanho];
      } else {
        novoPrecos[tamanho] = value;
      }
      return { ...c, precos: novoPrecos };
    });
    updateData({ ...data, categorias: newCats });
  };

  // ── Atualizar nome ou grupo inline ─────────────────────────────────────────
  const updateCampo = (catId: string, campo: 'nome' | 'grupo', value: string) => {
    const newCats = data.categorias.map(c =>
      c.id === catId ? { ...c, [campo]: value } : c,
    );
    updateData({ ...data, categorias: newCats });
  };

  const updateTipoPrecificacao = (catId: string, tipo: 'pizza' | 'bebidas' | 'entradas') => {
    const newCats = data.categorias.map(c =>
      c.id === catId ? { ...c, tipoPrecificacao: tipo } : c,
    );
    updateData({ ...data, categorias: newCats });
  };

  // ── Adicionar nova categoria ───────────────────────────────────────────────
  const handleAdd = () => {
    if (!newNome.trim()) return;
    const nova: CategoriaPreco = {
      id: crypto.randomUUID(),
      nome: newNome.trim().toUpperCase(),
      grupo: newGrupo.trim().toUpperCase() || undefined,
      tipoPrecificacao: newTipoPrecificacao,
      precos: {},
    };
    updateData({ ...data, categorias: [...data.categorias, nova] });
    setNewNome('');
    setNewGrupo('');
    setNewTipoPrecificacao('pizza' as const);
    setShowAddForm(false);
  };

  // ── Deletar categoria ──────────────────────────────────────────────────────
  const handleDelete = (catId: string) => {
    const usos = contarUsos(catId);
    if (usos > 0) {
      setConfirmDeleteId(catId);
    } else {
      updateData({ ...data, categorias: data.categorias.filter(c => c.id !== catId) });
    }
  };

  const confirmDelete = (catId: string) => {
    updateData({
      ...data,
      categorias: data.categorias.filter(c => c.id !== catId),
      sabores: data.sabores.map(s =>
        s.categoriaId === catId ? { ...s, categoriaId: undefined } : s,
      ),
    });
    setConfirmDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl h-12 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Categorias de Preço</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.categorias.length} categoria{data.categorias.length !== 1 ? 's' : ''}
            {' · '}
            {catsPizza.length} pizza · {catsBebidas.length} bebida{catsBebidas.length !== 1 ? 's' : ''} · {catsEntradas.length} entrada{catsEntradas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] hover:border-green-500/50 hover:bg-green-500/10 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {/* Formulário de adição */}
      {showAddForm && (
        <div className="bg-[#1c1c1e] border border-green-500/30 rounded-xl p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-gray-400 block mb-1">Nome da Categoria *</label>
            <input
              value={newNome}
              onChange={e => setNewNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
              placeholder="Ex: TRADICIONAL I, ESPECIAL II, DOCE..."
              className="w-full bg-[#2a2a2e] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="w-52">
            <label className="text-xs text-gray-400 block mb-1">Grupo (opcional)</label>
            <input
              value={newGrupo}
              onChange={e => setNewGrupo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              list="grupos-list"
              placeholder="Ex: TRADICIONAL, ESPECIAL, DOCE..."
              className="w-full bg-[#2a2a2e] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            />
            <datalist id="grupos-list">
              {gruposExistentes.map(g => <option key={g} value={g} />)}
            </datalist>
          </div>
          <div className="w-44">
            <label className="text-xs text-gray-400 block mb-1">Tipo</label>
            <select
              value={newTipoPrecificacao}
              onChange={e => setNewTipoPrecificacao(e.target.value as 'pizza' | 'bebidas' | 'entradas')}
              className="w-full bg-[#2a2a2e] border border-[#374151] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
            >
              <option value="pizza">Pizza (tamanhos)</option>
              <option value="bebidas">Bebidas (preço único)</option>
              <option value="entradas">Entradas (preço único)</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newNome.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Adicionar
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewNome(''); setNewGrupo(''); setNewTipoPrecificacao('pizza' as const); }}
              className="text-gray-400 hover:text-white px-3 py-2 rounded-lg transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Aviso */}
      <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-300 leading-relaxed">
          <span className="text-white font-medium">Pizza:</span> matriz por tamanho (Broto… Calzone); o sistema lê o tamanho no fim do nome do produto.
          {' '}
          <span className="text-white font-medium">Bebidas:</span> uma coluna de preço único — sem Broto/Média/Grande.
          {' '}
          <span className="text-white font-medium">Entradas:</span> uma coluna de preço único, ideal para petiscos e entradas.
        </p>
      </div>

      {/* Estado vazio */}
      {data.categorias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">🏷️</div>
          <h3 className="text-base font-semibold text-white mb-1">Nenhuma categoria ainda</h3>
          <p className="text-sm text-gray-400 mb-4 max-w-sm">
            Crie uma categoria <span className="text-gray-300 font-medium">Pizza</span> (matriz por tamanho) e outra{' '}
            <span className="text-gray-300 font-medium">Bebidas</span> (preço único), para não misturar com Broto/Média/Grande.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar primeira categoria
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Pizza: matriz por tamanho ───────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
              Pizza — preço por tamanho
              <span className="text-xs font-normal text-gray-500">({catsPizza.length})</span>
            </h3>
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="bg-[#141416] border-b border-[#2a2a2e]">
                    <th className="text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider px-4 py-3 w-56">
                      Categoria
                    </th>
                    {TAMANHOS_PIZZA.map(t => (
                      <th key={t} className="text-center text-xs font-semibold text-red-400 uppercase tracking-wider px-2 py-3 w-28">
                        {TAMANHO_LABELS[t]}
                      </th>
                    ))}
                    <th
                      className="text-center text-xs font-semibold text-amber-400/90 uppercase tracking-wider px-2 py-3 w-24"
                      title="Preço quando o nome do produto não tem tamanho (fallback legado)"
                    >
                      S/tam.
                    </th>
                    <th className="w-16 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {gruposPizza.map(([grupo, cats]) => {
                    const isCollapsed = collapsedGroups.has(`pizza:${grupo}`);
                    return (
                      <>
                        {grupo ? (
                          <tr
                            key={`pizza-grp-${grupo}`}
                            onClick={() => toggleGroup(`pizza:${grupo}`)}
                            className="bg-[#1a1a1c] border-t border-[#2a2a2e] cursor-pointer hover:bg-[#1e1e21] transition-colors select-none"
                          >
                            <td colSpan={TAMANHOS_PIZZA.length + 3} className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                {isCollapsed
                                  ? <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                  : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                }
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                                  {grupo}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {cats.length} categori{cats.length === 1 ? 'a' : 'as'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          catsPizza.some(c => c.grupo) && (
                            <tr key="pizza-sem-grupo" className="bg-[#1a1a1c] border-t border-[#2a2a2e]">
                              <td colSpan={TAMANHOS_PIZZA.length + 3} className="px-4 py-1.5">
                                <span className="text-xs text-gray-600 uppercase tracking-widest">Sem grupo</span>
                              </td>
                            </tr>
                          )
                        )}
                        {!isCollapsed && cats.map((cat, rowIdx) => {
                          const usos = contarUsos(cat.id);
                          return (
                            <tr
                              key={cat.id}
                              className={`border-t border-[#2a2a2e] group transition-colors hover:bg-[#1e1e21]
                                ${rowIdx % 2 === 0 ? 'bg-transparent' : 'bg-[#141416]'}
                              `}
                            >
                              <td className="px-4 py-2 align-top">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-3 h-3 text-gray-600 shrink-0 mt-0.5" />
                                    <input
                                      value={cat.nome}
                                      onChange={e => updateCampo(cat.id, 'nome', e.target.value.toUpperCase())}
                                      className="flex-1 bg-transparent text-sm font-medium text-white focus:outline-none focus:bg-white/5 rounded px-1 -ml-1 min-w-0"
                                      placeholder="Nome..."
                                    />
                                    {usos > 0 && (
                                      <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-1.5 py-0.5 shrink-0">
                                        {usos}
                                      </span>
                                    )}
                                  </div>
                                  <select
                                    value={cat.tipoPrecificacao ?? 'pizza'}
                                    onChange={e => updateTipoPrecificacao(cat.id, e.target.value as 'pizza' | 'bebidas' | 'entradas')}
                                    onClick={e => e.stopPropagation()}
                                    className="w-max max-w-full text-[10px] bg-[#2a2a2e] border border-[#374151] rounded px-1.5 py-0.5 text-gray-300"
                                  >
                                    <option value="pizza">Modo pizza</option>
                                    <option value="bebidas">Modo bebidas</option>
                                    <option value="entradas">Modo entradas</option>
                                  </select>
                                </div>
                              </td>
                              {TAMANHOS_PIZZA.map(tamanho => (
                                <td key={tamanho} className="px-1 py-1">
                                  <PriceCell
                                    value={cat.precos[tamanho]}
                                    onChange={v => updatePreco(cat.id, tamanho, v)}
                                  />
                                </td>
                              ))}
                              <td className="px-1 py-1">
                                <PriceCell
                                  value={cat.precos.bebidas}
                                  onChange={v => updatePreco(cat.id, 'bebidas', v)}
                                />
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button
                                  onClick={() => handleDelete(cat.id)}
                                  className="p-1 text-gray-700 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                                  title="Excluir categoria"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {catsPizza.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">Nenhuma categoria no modo pizza. Crie com &quot;Nova categoria&quot; → tipo Pizza.</p>
            )}
          </div>

          {/* ── Bebidas: preço único ────────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
              Bebidas — preço único
              <span className="text-xs font-normal text-gray-500">({catsBebidas.length})</span>
            </h3>
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[360px] border-collapse">
                <thead>
                  <tr className="bg-[#141416] border-b border-[#2a2a2e]">
                    <th className="text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider px-4 py-3 w-56">
                      Categoria
                    </th>
                    <th className="text-center text-xs font-semibold text-cyan-400 uppercase tracking-wider px-2 py-3 w-36">
                      Preço
                    </th>
                    <th className="w-16 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {gruposBebidas.map(([grupo, cats]) => {
                    const isCollapsed = collapsedGroups.has(`beb:${grupo}`);
                    return (
                      <>
                        {grupo ? (
                          <tr
                            key={`beb-grp-${grupo}`}
                            onClick={() => toggleGroup(`beb:${grupo}`)}
                            className="bg-[#1a1a1c] border-t border-[#2a2a2e] cursor-pointer hover:bg-[#1e1e21] transition-colors select-none"
                          >
                            <td colSpan={3} className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                {isCollapsed
                                  ? <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                  : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                }
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                                  {grupo}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {cats.length} categori{cats.length === 1 ? 'a' : 'as'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          catsBebidas.some(c => c.grupo) && (
                            <tr key="beb-sem-grupo" className="bg-[#1a1a1c] border-t border-[#2a2a2e]">
                              <td colSpan={3} className="px-4 py-1.5">
                                <span className="text-xs text-gray-600 uppercase tracking-widest">Sem grupo</span>
                              </td>
                            </tr>
                          )
                        )}
                        {!isCollapsed && cats.map((cat, rowIdx) => {
                          const usos = contarUsos(cat.id);
                          return (
                            <tr
                              key={cat.id}
                              className={`border-t border-[#2a2a2e] group transition-colors hover:bg-[#1e1e21]
                                ${rowIdx % 2 === 0 ? 'bg-transparent' : 'bg-[#141416]'}
                              `}
                            >
                              <td className="px-4 py-2 align-top">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-3 h-3 text-gray-600 shrink-0 mt-0.5" />
                                    <input
                                      value={cat.nome}
                                      onChange={e => updateCampo(cat.id, 'nome', e.target.value.toUpperCase())}
                                      className="flex-1 bg-transparent text-sm font-medium text-white focus:outline-none focus:bg-white/5 rounded px-1 -ml-1 min-w-0"
                                      placeholder="Nome..."
                                    />
                                    {usos > 0 && (
                                      <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-1.5 py-0.5 shrink-0">
                                        {usos}
                                      </span>
                                    )}
                                  </div>
                                  <select
                                    value={cat.tipoPrecificacao ?? 'pizza'}
                                    onChange={e => updateTipoPrecificacao(cat.id, e.target.value as 'pizza' | 'bebidas' | 'entradas')}
                                    onClick={e => e.stopPropagation()}
                                    className="w-max max-w-full text-[10px] bg-[#2a2a2e] border border-[#374151] rounded px-1.5 py-0.5 text-gray-300"
                                  >
                                    <option value="pizza">Modo pizza</option>
                                    <option value="bebidas">Modo bebidas</option>
                                    <option value="entradas">Modo entradas</option>
                                  </select>
                                </div>
                              </td>
                              <td className="px-1 py-1">
                                <PriceCell
                                  value={cat.precos.bebidas}
                                  onChange={v => updatePreco(cat.id, 'bebidas', v)}
                                />
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button
                                  onClick={() => handleDelete(cat.id)}
                                  className="p-1 text-gray-700 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                                  title="Excluir categoria"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {catsBebidas.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">Nenhuma categoria no modo bebidas. Crie com &quot;Nova categoria&quot; → tipo Bebidas.</p>
            )}
          </div>

          {/* ── Entradas: preço único ───────────────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
              Entradas — preço único
              <span className="text-xs font-normal text-gray-500">({catsEntradas.length})</span>
            </h3>
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[360px] border-collapse">
                <thead>
                  <tr className="bg-[#141416] border-b border-[#2a2a2e]">
                    <th className="text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider px-4 py-3 w-56">
                      Categoria
                    </th>
                    <th className="text-center text-xs font-semibold text-amber-400 uppercase tracking-wider px-2 py-3 w-36">
                      Preço
                    </th>
                    <th className="w-16 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {gruposEntradas.map(([grupo, cats]) => {
                    const isCollapsed = collapsedGroups.has(`ent:${grupo}`);
                    return (
                      <>
                        {grupo ? (
                          <tr
                            key={`ent-grp-${grupo}`}
                            onClick={() => toggleGroup(`ent:${grupo}`)}
                            className="bg-[#1a1a1c] border-t border-[#2a2a2e] cursor-pointer hover:bg-[#1e1e21] transition-colors select-none"
                          >
                            <td colSpan={3} className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                {isCollapsed
                                  ? <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                                  : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                                }
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                                  {grupo}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {cats.length} categori{cats.length === 1 ? 'a' : 'as'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          catsEntradas.some(c => c.grupo) && (
                            <tr key="ent-sem-grupo" className="bg-[#1a1a1c] border-t border-[#2a2a2e]">
                              <td colSpan={3} className="px-4 py-1.5">
                                <span className="text-xs text-gray-600 uppercase tracking-widest">Sem grupo</span>
                              </td>
                            </tr>
                          )
                        )}
                        {!isCollapsed && cats.map((cat, rowIdx) => {
                          const usos = contarUsos(cat.id);
                          return (
                            <tr
                              key={cat.id}
                              className={`border-t border-[#2a2a2e] group transition-colors hover:bg-[#1e1e21]
                                ${rowIdx % 2 === 0 ? 'bg-transparent' : 'bg-[#141416]'}
                              `}
                            >
                              <td className="px-4 py-2 align-top">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-3 h-3 text-gray-600 shrink-0 mt-0.5" />
                                    <input
                                      value={cat.nome}
                                      onChange={e => updateCampo(cat.id, 'nome', e.target.value.toUpperCase())}
                                      className="flex-1 bg-transparent text-sm font-medium text-white focus:outline-none focus:bg-white/5 rounded px-1 -ml-1 min-w-0"
                                      placeholder="Nome..."
                                    />
                                    {usos > 0 && (
                                      <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-1.5 py-0.5 shrink-0">
                                        {usos}
                                      </span>
                                    )}
                                  </div>
                                  <select
                                    value={cat.tipoPrecificacao ?? 'pizza'}
                                    onChange={e => updateTipoPrecificacao(cat.id, e.target.value as 'pizza' | 'bebidas' | 'entradas')}
                                    onClick={e => e.stopPropagation()}
                                    className="w-max max-w-full text-[10px] bg-[#2a2a2e] border border-[#374151] rounded px-1.5 py-0.5 text-gray-300"
                                  >
                                    <option value="pizza">Modo pizza</option>
                                    <option value="bebidas">Modo bebidas</option>
                                    <option value="entradas">Modo entradas</option>
                                  </select>
                                </div>
                              </td>
                              <td className="px-1 py-1">
                                <PriceCell
                                  value={cat.precos.entradas}
                                  onChange={v => updatePreco(cat.id, 'entradas', v)}
                                />
                              </td>
                              <td className="px-2 py-2 text-center">
                                <button
                                  onClick={() => handleDelete(cat.id)}
                                  className="p-1 text-gray-700 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                                  title="Excluir categoria"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {catsEntradas.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">Nenhuma categoria no modo entradas. Crie com &quot;Nova categoria&quot; → tipo Entradas.</p>
            )}
          </div>
        </div>
      )}

      {/* Legenda de tamanhos */}
      {data.categorias.length > 0 && (
        <p className="text-xs text-gray-600 text-center">
          Clique em qualquer célula para editar · <kbd className="text-gray-500">Enter</kbd> ou <kbd className="text-gray-500">Tab</kbd> para confirmar · deixe vazio para marcar como indisponível
        </p>
      )}

      {/* Modal confirmação de exclusão */}
      {confirmDeleteId && (() => {
        const cat = data.categorias.find(c => c.id === confirmDeleteId);
        const usos = cat ? contarUsos(cat.id) : 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-sm shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Categoria em uso</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{usos} produto{usos !== 1 ? 's' : ''} vinculado{usos !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-6">
                A categoria <span className="font-semibold text-white">"{cat?.nome}"</span> está sendo usada
                por {usos} produto{usos !== 1 ? 's' : ''}. Ao remover, esses produtos perderão o preço de venda.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-2.5 bg-[#2a2a2e] hover:bg-[#333] text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmDelete(confirmDeleteId)}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Remover mesmo assim
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
