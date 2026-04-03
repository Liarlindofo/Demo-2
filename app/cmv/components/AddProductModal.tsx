'use client';

import { useState, useRef } from 'react';
import { X, Plus, ChevronDown, Trash2, Download, Upload } from 'lucide-react';
import type { StoreData, Sabor, Categoria, SaborItem, SaborItemTipo, CategoriaPreco } from '../types';
// SaborItemTipo é resolvido via fromCompositeId (internamente)
import { parseCSVReceitas } from '../utils';

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

  // Categoria selecionada
  const categoriaAtual: CategoriaPreco | undefined = data.categorias.find(c => c.id === categoriaId);

  // Import state
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasIngredientes = data.ingredientes.length > 0;
  const hasReceitas = data.receitas.length > 0;
  const hasOpcoes = hasIngredientes || hasReceitas;

  // ── Seletor unificado (ingredientes + receitas) ────────────────────────────
  const toCompositeId = (tipo: SaborItemTipo, id: string) => `${tipo}::${id}`;
  const fromCompositeId = (value: string): { tipo: SaborItemTipo; referenciaId: string } => {
    const [tipo, ...rest] = value.split('::');
    return { tipo: tipo as SaborItemTipo, referenciaId: rest.join('::') };
  };

  // ── Itens CRUD ─────────────────────────────────────────────────────────────
  const addItem = () => setItens(prev => [...prev, makeItem()]);

  const removeItem = (id: string) =>
    setItens(prev => prev.filter(it => it.id !== id));

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

  // ── Salvar manual ──────────────────────────────────────────────────────────
  const handleSaveManual = () => {
    if (!nome.trim()) { alert('Informe o nome do produto'); return; }

    const validItens = itens.filter(it => it.referenciaId && it.quantidade > 0);

    const novoSabor: Sabor = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      categoria,
      categoriaId: categoriaId || undefined,
      precoVenda: categoriaAtual?.precoVenda ?? 0,
      itens: validItens,
    };

    onSave({ ...data, sabores: [...data.sabores, novoSabor] });
  };

  // ── Importação CSV (legado, cria ingredientes se não existirem) ────────────
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2e]">
          <h2 className="text-lg font-bold text-white">Adicionar Produto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2a2a2e]">
          {(['manual', 'importar'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors capitalize ${
                activeTab === t
                  ? 'text-green-400 border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'manual' ? 'Adicionar Manualmente' : 'Importar Planilha'}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'manual' ? (
            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="text-xs text-gray-400 block mb-1">Nome do Sabor *</label>
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Frango com Catupiry G"
                  className="w-full bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Categoria de preço + Grupo */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Categoria de Preço</label>
                  <div className="relative">
                    <select
                      value={categoriaId}
                      onChange={e => setCategoriaId(e.target.value)}
                      className="w-full appearance-none bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="">— Sem categoria —</option>
                      {data.categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome} ({cat.precoVenda > 0
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.precoVenda)
                            : 'sem preço'})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  {data.categorias.length === 0 && (
                    <p className="text-xs text-amber-400 mt-1">
                      ⚠️ Crie categorias na aba "Categorias" para definir o preço de venda
                    </p>
                  )}
                  {categoriaAtual && (
                    <p className="text-xs text-green-400 mt-1">
                      Preço: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(categoriaAtual.precoVenda)}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Grupo</label>
                  <div className="relative">
                    <select
                      value={categoria}
                      onChange={e => setCategoria(e.target.value as Categoria)}
                      className="w-full appearance-none bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="tradicional">Tradicional</option>
                      <option value="especial">Especial</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Ficha técnica */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400">
                    Ficha Técnica
                    <span className="text-gray-600 ml-1">(opcional — pode preencher depois)</span>
                  </label>
                  {hasOpcoes && (
                    <button
                      onClick={addItem}
                      className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </button>
                  )}
                </div>

                {!hasOpcoes ? (
                  <p className="text-xs text-amber-400 bg-amber-400/5 border border-amber-400/20 rounded-xl px-3 py-2">
                    ⚠️ Cadastre ingredientes (Etapa 1) ou receitas (Etapa 2) antes de montar a ficha técnica.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {itens.map(item => (
                      <div key={item.id} className="flex gap-2 items-center bg-[#141416] border border-[#2a2a2e] rounded-xl p-2">
                        {/* Seletor unificado: ingredientes + receitas no mesmo lugar */}
                        <div className="flex-1 relative">
                          <select
                            value={item.referenciaId ? toCompositeId(item.tipo, item.referenciaId) : ''}
                            onChange={e => updateReferencia(item.id, e.target.value)}
                            className="w-full appearance-none bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
                          >
                            <option value="">Selecionar ingrediente ou receita…</option>
                            {hasIngredientes && (
                              <optgroup label="── Ingredientes">
                                {data.ingredientes.map(i => (
                                  <option key={i.id} value={toCompositeId('ingrediente', i.id)}>
                                    {i.nome}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {hasReceitas && (
                              <optgroup label="── Receitas">
                                {data.receitas.map(r => (
                                  <option key={r.id} value={toCompositeId('receita', r.id)}>
                                    {r.nome}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                          <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Quantidade */}
                        <input
                          type="number"
                          value={item.quantidade || ''}
                          onChange={e => updateQuantidade(item.id, e.target.value)}
                          placeholder="Qtd"
                          className="w-20 bg-[#2a2a2e] border border-[#374151] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-green-500"
                          min="0"
                          step="any"
                        />

                        {itens.length > 1 && (
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors p-1 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── Importação CSV ────────────────────────────────────────── */
            <div className="space-y-4">
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
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#2a2a2e] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-xl"
          >
            Cancelar
          </button>
          {activeTab === 'manual' ? (
            <button
              onClick={handleSaveManual}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={!csvContent || importing}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
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
