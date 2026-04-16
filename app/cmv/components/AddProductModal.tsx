'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Download, Upload, Pizza } from 'lucide-react';
import type { StoreData, Sabor, Categoria, SaborItem, SaborItemTipo, CategoriaPreco, PizzaTamanho, Tamanho } from '../types';
import { TAMANHO_LABELS, TAMANHOS_PIZZA } from '../types';
import { parseCSVReceitas, calcularCustoPorKgReceita, detectarTamanho, resolverPrecoVendaCategoria, formatCurrency } from '../utils';
import { SearchableSelect } from './SearchableSelect';

// Sufixo a ser adicionado ao nome base para cada tamanho
const TAMANHO_SUFIXO: Record<PizzaTamanho, string> = {
  broto: 'Broto',
  pequena: 'Pequena',
  media: 'Média',
  grande: 'Grande',
  gigante: 'Gigante',
  calzone: 'Calzone',
};

interface AddProductModalProps {
  data: StoreData;
  onClose: () => void;
  onSave: (newData: StoreData) => void;
}

type Tab = 'manual' | 'importar';

const makeItem = (): SaborItem => ({
  id: crypto.randomUUID(),
  tipo: 'ingrediente',
  referenciaId: '',
  quantidade: 0,
});

export const AddProductModal = ({ data, onClose, onSave }: AddProductModalProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('manual');

  // Manual form
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('tradicional');
  const [categoriaId, setCategoriaId] = useState('');
  const [itens, setItens] = useState<SaborItem[]>([makeItem()]);

  // Seleção de múltiplos tamanhos
  const [selectedTamanhos, setSelectedTamanhos] = useState<PizzaTamanho[]>([]);
  const isMultiSize = selectedTamanhos.length > 0;

  // Filtro rápido de tipo preço único: 'bebidas' | 'entradas' | null
  const [filtroTipo, setFiltroTipo] = useState<'bebidas' | 'entradas' | null>(null);

  const toggleTamanho = (t: PizzaTamanho) => {
    if (filtroTipo) setFiltroTipo(null);
    setSelectedTamanhos(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t],
    );
  };

  const handleFiltroTipo = (tipo: 'bebidas' | 'entradas') => {
    if (filtroTipo === tipo) {
      setFiltroTipo(null);
    } else {
      setSelectedTamanhos([]);
      const primeiraCategoria = data.categorias.find(c => c.tipoPrecificacao === tipo);
      if (primeiraCategoria) setCategoriaId(primeiraCategoria.id);
      setFiltroTipo(tipo);
    }
  };

  const categoriaAtual: CategoriaPreco | undefined = data.categorias.find(c => c.id === categoriaId);
  const tamanhoDetectado = isMultiSize ? null : detectarTamanho(nome);
  const precoResolvido =
    !isMultiSize && categoriaAtual
      ? resolverPrecoVendaCategoria(categoriaAtual, nome)
      : 0;

  const isPrecounico =
    filtroTipo !== null ||
    categoriaAtual?.tipoPrecificacao === 'bebidas' ||
    categoriaAtual?.tipoPrecificacao === 'entradas';

  useEffect(() => {
    if (
      categoriaAtual?.tipoPrecificacao === 'bebidas' ||
      categoriaAtual?.tipoPrecificacao === 'entradas'
    ) {
      setSelectedTamanhos([]);
    }
  }, [categoriaId, categoriaAtual?.tipoPrecificacao]);

  // Preview dos nomes que serão criados
  const nomesParaCriar: string[] = isMultiSize
    ? selectedTamanhos.map(t => `${nome.trim()} ${TAMANHO_SUFIXO[t]}`)
    : nome.trim()
    ? [nome.trim()]
    : [];

  const getPrecoParaTamanho = (t: Tamanho): number => {
    if (!categoriaAtual) return 0;
    if (categoriaAtual.tipoPrecificacao === 'bebidas') {
      return categoriaAtual.precos.bebidas ?? categoriaAtual.precoVenda ?? 0;
    }
    if (categoriaAtual.tipoPrecificacao === 'entradas') {
      return categoriaAtual.precos.entradas ?? categoriaAtual.precoVenda ?? 0;
    }
    return categoriaAtual.precos[t] ?? categoriaAtual.precoVenda ?? 0;
  };

  // Import state
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasIngredientes = data.ingredientes.length > 0;
  const hasReceitas = data.receitas.length > 0;
  const hasOpcoes = hasIngredientes || hasReceitas;

  const toCompositeId = (tipo: SaborItemTipo, id: string) => `${tipo}::${id}`;
  const fromCompositeId = (value: string): { tipo: SaborItemTipo; referenciaId: string } => {
    const [tipo, ...rest] = value.split('::');
    return { tipo: tipo as SaborItemTipo, referenciaId: rest.join('::') };
  };

  const addItem = () => setItens(prev => [...prev, makeItem()]);
  const removeItem = (id: string) => setItens(prev => prev.filter(it => it.id !== id));

  const updateReferencia = (id: string, compositeValue: string) => {
    if (!compositeValue) {
      setItens(prev => prev.map(it => it.id === id ? { ...it, referenciaId: '' } : it));
      return;
    }
    const { tipo, referenciaId } = fromCompositeId(compositeValue);
    setItens(prev =>
      prev.map(it => (it.id === id ? { ...it, tipo, referenciaId } : it)),
    );
  };

  const updateQuantidade = (id: string, valor: string) =>
    setItens(prev =>
      prev.map(it =>
        it.id === id ? { ...it, quantidade: parseFloat(valor) || 0 } : it,
      ),
    );

  const handleSaveManual = () => {
    if (!nome.trim()) { alert('Informe o nome do produto'); return; }

    const validItens = itens.filter(it => it.referenciaId && it.quantidade > 0);

    const novosSabores: Sabor[] = isMultiSize
      ? selectedTamanhos.map(t => ({
          id: crypto.randomUUID(),
          nome: `${nome.trim()} ${TAMANHO_SUFIXO[t]}`,
          categoria,
          categoriaId: categoriaId || undefined,
          precoVenda: getPrecoParaTamanho(t),
          itens: validItens.map(it => ({ ...it, id: crypto.randomUUID() })),
        }))
      : [{
          id: crypto.randomUUID(),
          nome: nome.trim(),
          categoria,
          categoriaId: categoriaId || undefined,
          precoVenda: precoResolvido,
          itens: validItens,
        }];

    onSave({ ...data, sabores: [...data.sabores, ...novosSabores] });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCsvContent(ev.target?.result as string || '');
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = () => {
    if (!csvContent.trim()) { alert('Selecione um arquivo CSV primeiro'); return; }
    setImporting(true);
    try {
      const rows = parseCSVReceitas(csvContent);
      if (rows.length === 0) {
        setImportResult('Nenhuma linha válida encontrada. Verifique o formato do arquivo.');
        setImporting(false);
        return;
      }

      const newIngredientes = [...data.ingredientes];
      const saboresMap = new Map<string, Sabor>();
      data.sabores.forEach(s =>
        saboresMap.set(s.nome.toLowerCase(), { ...s, itens: [...(s.itens ?? [])] }),
      );

      rows.forEach(row => {
        const saborKey = row.nome.toLowerCase();
        if (!saboresMap.has(saborKey)) {
          saboresMap.set(saborKey, {
            id: crypto.randomUUID(),
            nome: row.nome,
            categoria: row.categoria,
            precoVenda: row.precoVenda,
            itens: [],
          });
        } else {
          const s = saboresMap.get(saborKey)!;
          s.categoria = row.categoria;
          s.precoVenda = row.precoVenda;
        }

        const sabor = saboresMap.get(saborKey)!;
        const nomeNorm = row.ingrediente.toLowerCase();

        let ing = newIngredientes.find(
          i => i.nome.toLowerCase() === nomeNorm && i.unidade === row.unidade,
        );
        if (!ing) {
          ing = { id: crypto.randomUUID(), nome: row.ingrediente, unidade: row.unidade, precoPorKg: 0 };
          newIngredientes.push(ing);
        }

        const jaExiste = sabor.itens.some(
          it => it.tipo === 'ingrediente' && it.referenciaId === ing!.id,
        );
        if (!jaExiste) {
          sabor.itens.push({
            id: crypto.randomUUID(),
            tipo: 'ingrediente',
            referenciaId: ing.id,
            quantidade: row.quantidade,
          });
        }
      });

      const newSabores = Array.from(saboresMap.values());
      onSave({ ...data, ingredientes: newIngredientes, sabores: newSabores });
      setImportResult(`✓ ${newSabores.length} sabores importados com sucesso!`);
      setTimeout(() => onClose(), 1500);
    } catch {
      setImportResult('Erro ao processar o arquivo. Verifique o formato.');
    }
    setImporting(false);
  };

  const downloadTemplate = () => {
    const template = [
      'Nome do Sabor;Categoria;Preço Venda;Ingrediente;Quantidade;Unidade',
      'Frango com Catupiry G;Tradicional;60.90;Massa;200;g',
      'Frango com Catupiry G;Tradicional;60.90;Frango;150;g',
      'Frango com Catupiry G;Tradicional;60.90;Catupiry;100;g',
      '4 Queijos G;Especial;59.50;Massa;200;g',
      '4 Queijos G;Especial;59.50;Mussarela;80;g',
    ].join('\n');
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_cmv.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const itensPreenchidos = itens.filter(it => it.referenciaId).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
              <Pizza className="w-4 h-4 text-green-400" />
            </div>
            <h2 className="text-base font-bold text-white">Adicionar Produto</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex border-b border-[#2a2a2e] shrink-0 px-6">
          {(['manual', 'importar'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`py-3 px-1 mr-6 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === t
                  ? 'text-green-400 border-green-500'
                  : 'text-gray-400 hover:text-white border-transparent'
              }`}
            >
              {t === 'manual' ? 'Adicionar Manualmente' : 'Importar Planilha'}
            </button>
          ))}
        </div>

        {/* ── Conteúdo ─────────────────────────────────────────────────────── */}
        {activeTab === 'manual' ? (
          <div className="flex flex-1 overflow-hidden min-h-0">

            {/* Coluna esquerda — dados do produto */}
            <div className="w-80 shrink-0 border-r border-[#2a2a2e] flex flex-col gap-5 p-5 overflow-y-auto">

              {/* Nome */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">
                  {isMultiSize ? 'Nome base (sem tamanho) *' : 'Nome do Produto *'}
                </label>
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  autoFocus
                  placeholder={isMultiSize ? 'Ex: Frango com Catupiry' : 'Ex: Frango com Catupiry G'}
                  className="w-full bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>

              {/* Tamanhos */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">
                  Tamanhos
                  {isPrecounico && (
                    <span className="ml-1.5 text-gray-600">
                      — {categoriaAtual?.tipoPrecificacao === 'entradas' || filtroTipo === 'entradas'
                        ? 'modo entradas'
                        : 'modo bebidas'} (preço único)
                    </span>
                  )}
                </label>

                {/* Botões de pizza */}
                {!isPrecounico && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {TAMANHOS_PIZZA.map(t => {
                      const selected = selectedTamanhos.includes(t);
                      const temPreco = categoriaAtual?.precos[t] != null;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => toggleTamanho(t)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            selected
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'bg-transparent border-[#374151] text-gray-400 hover:border-green-500/50 hover:text-white'
                          }`}
                        >
                          {TAMANHO_SUFIXO[t]}
                          {categoriaAtual && temPreco && (
                            <span className={`ml-1 ${selected ? 'text-green-200' : 'text-gray-600'}`}>
                              {formatCurrency(categoriaAtual.precos[t]!)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Botões especiais */}
                {categoriaAtual?.tipoPrecificacao !== 'bebidas' && categoriaAtual?.tipoPrecificacao !== 'entradas' && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleFiltroTipo('bebidas')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        filtroTipo === 'bebidas'
                          ? 'bg-cyan-600 border-cyan-600 text-white'
                          : 'bg-transparent border-[#374151] text-cyan-500/70 hover:border-cyan-500/50 hover:text-cyan-400'
                      }`}
                    >
                      🥤 Bebidas
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFiltroTipo('entradas')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        filtroTipo === 'entradas'
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'bg-transparent border-[#374151] text-amber-500/70 hover:border-amber-500/50 hover:text-amber-400'
                      }`}
                    >
                      🍽️ Entradas
                    </button>
                  </div>
                )}

                {/* Avisos */}
                {filtroTipo === 'bebidas' && data.categorias.filter(c => c.tipoPrecificacao === 'bebidas').length === 0 && (
                  <p className="text-xs text-amber-400 mt-1.5">⚠️ Crie uma categoria Bebidas na aba Categorias primeiro.</p>
                )}
                {filtroTipo === 'entradas' && data.categorias.filter(c => c.tipoPrecificacao === 'entradas').length === 0 && (
                  <p className="text-xs text-amber-400 mt-1.5">⚠️ Crie uma categoria Entradas na aba Categorias primeiro.</p>
                )}
              </div>

              {/* Info modo preço único */}
              {categoriaAtual?.tipoPrecificacao === 'bebidas' && (
                <p className="text-xs text-cyan-400/70 bg-cyan-500/5 border border-cyan-500/15 rounded-xl px-3 py-2">
                  Categoria de bebidas: preço único — nenhum tamanho será criado.
                </p>
              )}
              {categoriaAtual?.tipoPrecificacao === 'entradas' && (
                <p className="text-xs text-amber-400/70 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2">
                  Categoria de entradas: preço único — nenhum tamanho será criado.
                </p>
              )}

              {/* Preview nomes no modo multi */}
              {isMultiSize && nome.trim() && !isPrecounico && (
                <div className="bg-[#141416] border border-[#2a2a2e] rounded-xl px-3 py-2.5">
                  <p className="text-xs text-gray-500 mb-1.5">Produtos que serão criados:</p>
                  <div className="flex flex-wrap gap-1">
                    {nomesParaCriar.map(n => (
                      <span key={n} className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-md px-2 py-0.5">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Categoria de Preço */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Categoria de Preço</label>
                <SearchableSelect
                  value={categoriaId}
                  onChange={v => setCategoriaId(v)}
                  options={(filtroTipo
                    ? data.categorias.filter(c => c.tipoPrecificacao === filtroTipo)
                    : data.categorias
                  ).map(cat => {
                    const modoBebidas = cat.tipoPrecificacao === 'bebidas';
                    const modoEntradas = cat.tipoPrecificacao === 'entradas';
                    const precoUnicoBebidas = cat.precos.bebidas ?? cat.precoVenda;
                    const precoUnicoEntradas = cat.precos.entradas ?? cat.precoVenda;
                    const precoParaTamanho =
                      !modoBebidas && !modoEntradas && tamanhoDetectado && cat.precos[tamanhoDetectado];
                    const sublabel = modoBebidas
                      ? (precoUnicoBebidas != null && precoUnicoBebidas > 0
                        ? `Preço: ${formatCurrency(precoUnicoBebidas)}`
                        : 'sem preço')
                      : modoEntradas
                      ? (precoUnicoEntradas != null && precoUnicoEntradas > 0
                        ? `Preço: ${formatCurrency(precoUnicoEntradas)}`
                        : 'sem preço')
                      : precoParaTamanho
                      ? `${TAMANHO_LABELS[tamanhoDetectado!]}: ${formatCurrency(precoParaTamanho)}`
                      : cat.precoVenda
                      ? formatCurrency(cat.precoVenda)
                      : Object.keys(cat.precos).length > 0
                      ? `${Object.keys(cat.precos).length} tamanho(s)`
                      : 'sem preço';
                    return {
                      value: cat.id,
                      label: cat.nome,
                      sublabel,
                      group: modoBebidas
                        ? (cat.grupo || 'Bebidas')
                        : modoEntradas
                        ? (cat.grupo || 'Entradas')
                        : (cat.grupo || undefined),
                    };
                  })}
                  placeholder="— Sem categoria —"
                  accentColor="green"
                />
                {data.categorias.length === 0 && (
                  <p className="text-xs text-amber-400 mt-1">⚠️ Crie categorias na aba "Categorias" para definir o preço de venda</p>
                )}
                {/* Preview de preço */}
                {categoriaAtual && !isMultiSize && (
                  <p className="text-xs text-green-400 mt-1">
                    {categoriaAtual.tipoPrecificacao === 'bebidas'
                      ? (categoriaAtual.precos.bebidas != null || categoriaAtual.precoVenda
                        ? `Preço: ${formatCurrency(resolverPrecoVendaCategoria(categoriaAtual, nome))}`
                        : '⚠️ Defina o preço na aba Categorias (modo Bebidas)')
                      : categoriaAtual.tipoPrecificacao === 'entradas'
                      ? (categoriaAtual.precos.entradas != null || categoriaAtual.precoVenda
                        ? `Preço: ${formatCurrency(resolverPrecoVendaCategoria(categoriaAtual, nome))}`
                        : '⚠️ Defina o preço na aba Categorias (modo Entradas)')
                      : tamanhoDetectado && categoriaAtual.precos[tamanhoDetectado] != null
                      ? `Preço para ${TAMANHO_LABELS[tamanhoDetectado]}: ${formatCurrency(categoriaAtual.precos[tamanhoDetectado]!)}`
                      : tamanhoDetectado
                      ? `⚠️ Sem preço para ${TAMANHO_LABELS[tamanhoDetectado]} nesta categoria`
                      : 'Tamanho não detectado no nome'
                    }
                  </p>
                )}
                {categoriaAtual && isMultiSize && selectedTamanhos.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {selectedTamanhos.map(t => (
                      <p key={t} className="text-xs text-green-400">
                        {TAMANHO_SUFIXO[t]}: {categoriaAtual.precos[t] != null
                          ? formatCurrency(categoriaAtual.precos[t]!)
                          : <span className="text-yellow-500">sem preço</span>}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna direita — Ficha Técnica */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <div>
                  <p className="text-sm font-semibold text-white">Ficha Técnica</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {itensPreenchidos > 0
                      ? `${itensPreenchidos} item${itensPreenchidos !== 1 ? 'ns' : ''} adicionado${itensPreenchidos !== 1 ? 's' : ''}`
                      : 'Opcional — pode preencher depois'}
                  </p>
                </div>
                {hasOpcoes && (
                  <button
                    onClick={addItem}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar
                  </button>
                )}
              </div>

              {!hasOpcoes ? (
                <div className="flex-1 flex flex-col items-center justify-center px-5 pb-5 text-center">
                  <div className="text-3xl mb-2">🧂</div>
                  <p className="text-sm text-amber-400 font-medium">Sem ingredientes ou receitas</p>
                  <p className="text-xs text-gray-500 mt-1">Cadastre na Etapa 1 ou 2 para montar a ficha técnica.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
                  {/* Cabeçalho */}
                  <div className="grid grid-cols-[1fr_80px_28px] gap-2 px-3 pb-1">
                    <span className="text-xs text-gray-600 uppercase tracking-wide">Ingrediente / Receita</span>
                    <span className="text-xs text-gray-600 uppercase tracking-wide">Qtd</span>
                    <span />
                  </div>

                  {itens.map(item => {
                    const itemOptions = [
                      ...data.ingredientes.map(i => ({
                        value: toCompositeId('ingrediente', i.id),
                        label: i.nome,
                        group: 'Ingredientes',
                        sublabel: i.precoPorKg > 0 ? `${formatCurrency(i.precoPorKg)}/kg` : 'sem preço',
                      })),
                      ...data.receitas.map(r => ({
                        value: toCompositeId('receita', r.id),
                        label: r.nome,
                        group: 'Receitas',
                        badge: 'receita',
                        badgeClass: 'bg-purple-500/15 text-purple-400',
                        sublabel: (() => {
                          const c = calcularCustoPorKgReceita(r, data.ingredientes);
                          return c > 0 ? `${formatCurrency(c)}/kg` : 'sem preço';
                        })(),
                      })),
                    ];

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-[1fr_80px_28px] gap-2 items-center bg-[#141416] border border-[#2a2a2e] rounded-xl px-3 py-2.5 hover:border-[#374151] transition-colors"
                      >
                        <SearchableSelect
                          value={item.referenciaId ? toCompositeId(item.tipo, item.referenciaId) : ''}
                          onChange={v => updateReferencia(item.id, v)}
                          options={itemOptions}
                          placeholder="Buscar ingrediente ou receita…"
                          accentColor="green"
                        />
                        <input
                          type="number"
                          value={item.quantidade || ''}
                          onChange={e => updateQuantidade(item.id, e.target.value)}
                          placeholder="Qtd"
                          className="w-full bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1.5 text-sm text-white text-right focus:outline-none focus:border-green-500"
                          min="0"
                          step="any"
                        />
                        {itens.length > 1 ? (
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-gray-600 hover:text-red-400 transition-colors rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Importação CSV ──────────────────────────────────────────────── */
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-[#141416] border border-[#2a2a2e] rounded-xl p-4">
              <p className="text-sm font-medium text-white mb-1">Formato esperado (CSV)</p>
              <p className="text-xs text-gray-400 mb-3">
                Colunas: Nome do Sabor, Categoria, Preço Venda, Ingrediente, Quantidade, Unidade
                <br />
                <span className="text-gray-500">Separador: ; ou ,</span>
              </p>
              <div className="bg-[#0d0d0f] rounded-lg p-3 font-mono text-xs text-green-400 overflow-x-auto">
                <p>Nome do Sabor;Categoria;Preço Venda;Ingrediente;Qtd;Unidade</p>
                <p className="text-gray-500">Frango G;Tradicional;60.90;Massa;200;g</p>
                <p className="text-gray-500">Frango G;Tradicional;60.90;Frango;150;g</p>
              </div>
              <button
                onClick={downloadTemplate}
                className="mt-3 flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar modelo CSV
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-2">Selecionar arquivo</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#374151] rounded-xl p-6 text-center cursor-pointer hover:border-green-500/50 hover:bg-green-500/5 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {csvContent ? '✓ Arquivo carregado' : 'Clique para selecionar o arquivo CSV'}
                </p>
                <p className="text-xs text-gray-600 mt-1">CSV, TXT</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {importResult && (
              <div className={`rounded-xl p-3 text-sm ${
                importResult.startsWith('✓')
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {importResult}
              </div>
            )}

            <p className="text-xs text-gray-500">
              ℹ️ A importação cria ingredientes se não existirem. Os preços são definidos na aba Ingredientes.
            </p>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-[#2a2a2e] flex gap-3 justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-xl"
          >
            Cancelar
          </button>
          {activeTab === 'manual' ? (
            <button
              onClick={handleSaveManual}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              {isMultiSize && selectedTamanhos.length > 0
                ? `Adicionar ${selectedTamanhos.length} produto${selectedTamanhos.length !== 1 ? 's' : ''}`
                : 'Adicionar'}
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={!csvContent || importing}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Importando…' : 'Importar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
