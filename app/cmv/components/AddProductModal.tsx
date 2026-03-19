'use client';

import { useState, useRef } from 'react';
import { X, Upload, Plus, Download, ChevronDown } from 'lucide-react';
import type { StoreData, Sabor, Ingrediente, Categoria } from '../types';
import { parseCSVReceitas } from '../utils';

interface AddProductModalProps {
  data: StoreData;
  onClose: () => void;
  onSave: (newData: StoreData) => void;
}

type Tab = 'manual' | 'importar';

export const AddProductModal = ({ data, onClose, onSave }: AddProductModalProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('manual');

  // Manual form state
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('tradicional');
  const [precoVenda, setPrecoVenda] = useState('');
  const [ingredienteRows, setIngredienteRows] = useState<Array<{
    nome: string;
    quantidade: string;
    unidade: 'g' | 'ml' | 'un';
  }>>([{ nome: '', quantidade: '', unidade: 'g' }]);

  // Import state
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddRow = () => {
    setIngredienteRows(prev => [...prev, { nome: '', quantidade: '', unidade: 'g' }]);
  };

  const handleRemoveRow = (index: number) => {
    setIngredienteRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (
    index: number,
    field: 'nome' | 'quantidade' | 'unidade',
    value: string
  ) => {
    setIngredienteRows(prev =>
      prev.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSaveManual = () => {
    if (!nome.trim()) {
      alert('Informe o nome do sabor');
      return;
    }
    if (!precoVenda || parseFloat(precoVenda) <= 0) {
      alert('Informe o preço de venda');
      return;
    }

    const validRows = ingredienteRows.filter(r => r.nome.trim() && r.quantidade);

    // Criar/reutilizar ingredientes
    const newIngredientes = [...data.ingredientes];
    const ingredientesSabor: Sabor['ingredientes'] = [];

    validRows.forEach(row => {
      const nomeNorm = row.nome.trim().toLowerCase();
      let ingrediente = newIngredientes.find(
        i => i.nome.toLowerCase() === nomeNorm && i.unidade === row.unidade
      );

      if (!ingrediente) {
        ingrediente = {
          id: crypto.randomUUID(),
          nome: row.nome.trim(),
          unidade: row.unidade,
          precoPorKg: 0,
        };
        newIngredientes.push(ingrediente);
      }

      ingredientesSabor.push({
        ingredienteId: ingrediente.id,
        quantidade: parseFloat(row.quantidade.replace(',', '.')) || 0,
      });
    });

    const novoSabor: Sabor = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      categoria,
      precoVenda: parseFloat(precoVenda.replace(',', '.')) || 0,
      ingredientes: ingredientesSabor,
    };

    onSave({
      sabores: [...data.sabores, novoSabor],
      ingredientes: newIngredientes,
    });
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      setCsvContent(ev.target?.result as string || '');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = () => {
    if (!csvContent.trim()) {
      alert('Selecione um arquivo CSV primeiro');
      return;
    }

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

      // Agrupamento existente
      data.sabores.forEach(s => saboresMap.set(s.nome.toLowerCase(), { ...s, ingredientes: [...s.ingredientes] }));

      rows.forEach(row => {
        const saborKey = row.nome.toLowerCase();
        if (!saboresMap.has(saborKey)) {
          saboresMap.set(saborKey, {
            id: crypto.randomUUID(),
            nome: row.nome,
            categoria: row.categoria,
            precoVenda: row.precoVenda,
            ingredientes: [],
          });
        } else {
          // Atualizar categoria e preço
          const s = saboresMap.get(saborKey)!;
          s.categoria = row.categoria;
          s.precoVenda = row.precoVenda;
        }

        const sabor = saboresMap.get(saborKey)!;
        const nomeNorm = row.ingrediente.toLowerCase();

        // Procurar ou criar ingrediente
        let ingrediente = newIngredientes.find(
          i => i.nome.toLowerCase() === nomeNorm && i.unidade === row.unidade
        );
        if (!ingrediente) {
          ingrediente = {
            id: crypto.randomUUID(),
            nome: row.ingrediente,
            unidade: row.unidade,
            precoPorKg: 0,
          };
          newIngredientes.push(ingrediente);
        }

        // Evitar duplicatas no sabor
        const jaExiste = sabor.ingredientes.some(i => i.ingredienteId === ingrediente!.id);
        if (!jaExiste) {
          sabor.ingredientes.push({
            ingredienteId: ingrediente.id,
            quantidade: row.quantidade,
          });
        }
      });

      const newSabores = Array.from(saboresMap.values());
      onSave({ sabores: newSabores, ingredientes: newIngredientes });
      setImportResult(`✓ ${newSabores.length} sabores importados com sucesso!`);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
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
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2e]">
          <h2 className="text-lg font-bold text-white">Adicionar Produto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2a2a2e]">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'manual'
                ? 'text-green-400 border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Adicionar Manualmente
          </button>
          <button
            onClick={() => setActiveTab('importar')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'importar'
                ? 'text-green-400 border-b-2 border-green-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Importar Planilha
          </button>
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

              {/* Categoria + Preço */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Categoria *</label>
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
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    value={precoVenda}
                    onChange={e => setPrecoVenda(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Ingredientes */}
              <div>
                <label className="text-xs text-gray-400 block mb-2">Ingredientes</label>
                <div className="space-y-2">
                  {ingredienteRows.map((row, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={row.nome}
                        onChange={e => handleRowChange(i, 'nome', e.target.value)}
                        placeholder="Ingrediente"
                        className="flex-1 bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                      />
                      <input
                        type="number"
                        value={row.quantidade}
                        onChange={e => handleRowChange(i, 'quantidade', e.target.value)}
                        placeholder="Qtd"
                        className="w-20 bg-[#2a2a2e] border border-[#374151] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                        min="0"
                      />
                      <div className="relative w-20">
                        <select
                          value={row.unidade}
                          onChange={e => handleRowChange(i, 'unidade', e.target.value as 'g' | 'ml' | 'un')}
                          className="w-full appearance-none bg-[#2a2a2e] border border-[#374151] rounded-xl px-2 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                        >
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="un">un</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                      {ingredienteRows.length > 1 && (
                        <button
                          onClick={() => handleRemoveRow(i)}
                          className="text-gray-500 hover:text-red-400 transition-colors px-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddRow}
                  className="mt-2 flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar ingrediente
                </button>
              </div>

              <p className="text-xs text-gray-500">
                💡 Os preços por kg serão configurados ao clicar em cada produto
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Template */}
              <div className="bg-[#141416] border border-[#2a2a2e] rounded-xl p-4">
                <p className="text-sm font-medium text-white mb-1">Formato esperado (CSV)</p>
                <p className="text-xs text-gray-400 mb-3">
                  A planilha deve ter as colunas: Nome do Sabor, Categoria, Preço Venda, Ingrediente, Quantidade, Unidade
                  <br />
                  <span className="text-gray-500">Separador: ponto-e-vírgula (;) ou vírgula (,)</span>
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

              {/* Upload */}
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
                ℹ️ A importação combina ingredientes existentes e cria novos. Os preços por kg são definidos manualmente em cada produto.
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
              {importing ? 'Importando...' : 'Importar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
