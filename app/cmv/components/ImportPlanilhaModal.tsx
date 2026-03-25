'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, CheckCircle, AlertCircle, FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { StoreData, Ingrediente, SaborItem, Receita, ReceitaItem } from '../types';

interface ImportPlanilhaModalProps {
  data: StoreData;
  onClose: () => void;
  onSave: (newData: StoreData) => void;
}

type Status = 'idle' | 'parsing' | 'importing' | 'done';

interface ImportProgress {
  status: Status;
  phase: string;
  total: number;
  current: number;
  ingNew: number;
  ingUpdated: number;
  recNew: number;
  recUpdated: number;
  saborNew: number;
  saborUpdated: number;
  errors: string[];
}

interface ParsedIngrediente {
  nome: string;
  unidade: 'g' | 'ml' | 'un';
  preco: number;
}

interface ParsedReceitaItem {
  ingrediente: string;
  quantidade: number;
  unidade: 'g' | 'ml' | 'un';
}

interface ParsedReceita {
  nome: string;
  rendimento: number;
  unidade: 'g' | 'ml' | 'un';
  itens: ParsedReceitaItem[];
}

interface ProdRow {
  sabor: string;
  tamanho: string;
  referencia: string;
  quantidade: number;
  unidade: 'g' | 'ml' | 'un';
  precoKg: number;
}

const INITIAL_PROGRESS: ImportProgress = {
  status: 'idle',
  phase: '',
  total: 0,
  current: 0,
  ingNew: 0,
  ingUpdated: 0,
  recNew: 0,
  recUpdated: 0,
  saborNew: 0,
  saborUpdated: 0,
  errors: [],
};

const MAX_REF_LENGTH = 60;

function getRawUnit(raw: string): 'kg' | 'g' | 'ml' | 'un' {
  const u = raw.toLowerCase().trim();
  if (u === 'un' || u === 'unid' || u === 'unidade' || u === 'und') return 'un';
  if (u === 'ml' || u === 'mililitro' || u === 'mililitros') return 'ml';
  if (u === 'g' || u === 'gr' || u === 'grama' || u === 'gramas') return 'g';
  return 'kg';
}

function convertQty(
  qty: number,
  rawUnit: 'kg' | 'g' | 'ml' | 'un',
): { quantidade: number; unidade: 'g' | 'ml' | 'un' } {
  if (rawUnit === 'kg') return { quantidade: qty * 1000, unidade: 'g' };
  return { quantidade: qty, unidade: rawUnit };
}

// ─── Template ─────────────────────────────────────────────────────────────────

function downloadTemplate() {
  const wb = XLSX.utils.book_new();

  const ingData = [
    ['Nome', 'Unidade (g / ml / un)', 'Preço (por kg / L / un)'],
    ['FARINHA DE TRIGO', 'g', 4.5],
    ['MUSSARELA', 'g', 30.0],
    ['MOLHO DE TOMATE', 'g', 8.0],
    ['AZEITE', 'ml', 15.0],
    ['OVO', 'un', 1.2],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ingData), 'Ingredientes');

  const recData = [
    ['Receita', 'Rendimento', 'Unidade', 'Ingrediente', 'Quantidade', 'Unidade Ingrediente'],
    ['MASSA TRADICIONAL', 1000, 'g', 'FARINHA DE TRIGO', 500, 'g'],
    ['MASSA TRADICIONAL', 1000, 'g', 'AZEITE', 50, 'ml'],
    ['MOLHO BASE', 500, 'g', 'MOLHO DE TOMATE', 400, 'g'],
    ['MOLHO BASE', 500, 'g', 'AZEITE', 30, 'ml'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(recData), 'Receitas');

  const prodData = [
    ['Sabor', 'Tamanho', 'Ingrediente ou Receita', 'Quantidade', 'Unidade', 'Preço/kg (se ingrediente direto)'],
    ['MARGHERITA', 'G', 'MASSA TRADICIONAL', 200, 'g', ''],
    ['MARGHERITA', 'G', 'MOLHO BASE', 80, 'g', ''],
    ['MARGHERITA', 'G', 'MUSSARELA', 150, 'g', 30.0],
    ['CALABRESA', 'G', 'MASSA TRADICIONAL', 200, 'g', ''],
    ['CALABRESA', 'G', 'MUSSARELA', 100, 'g', 30.0],
    ['CALABRESA', 'P', 'MASSA TRADICIONAL', 120, 'g', ''],
    ['CALABRESA', 'P', 'MUSSARELA', 70, 'g', 30.0],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodData), 'Produtos');

  XLSX.writeFile(wb, 'modelo_cmv_completo.xlsx');
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseIngredientesSheet(sheet: XLSX.WorkSheet): ParsedIngrediente[] {
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const result: ParsedIngrediente[] = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i] as unknown[];
    const nome = String(row[0] ?? '').trim().toUpperCase();
    const rawUnit = getRawUnit(String(row[1] ?? 'g'));
    const preco = parseFloat(String(row[2] ?? 0).replace(',', '.')) || 0;
    if (!nome) continue;
    const unidade: 'g' | 'ml' | 'un' = rawUnit === 'kg' ? 'g' : rawUnit;
    result.push({ nome, unidade, preco });
  }
  return result;
}

function parseReceitasSheet(sheet: XLSX.WorkSheet): ParsedReceita[] {
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const map = new Map<string, ParsedReceita>();
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i] as unknown[];
    const nome = String(row[0] ?? '').trim().toUpperCase();
    const rendimento = parseFloat(String(row[1] ?? 1000).replace(',', '.')) || 1000;
    const rawRendUnit = getRawUnit(String(row[2] ?? 'g'));
    const ingrediente = String(row[3] ?? '').trim().toUpperCase();
    const qtdRaw = parseFloat(String(row[4] ?? 0).replace(',', '.')) || 0;
    const rawIngUnit = getRawUnit(String(row[5] ?? 'g'));
    if (!nome || !ingrediente) continue;

    const { quantidade, unidade: unidadeIng } = convertQty(qtdRaw, rawIngUnit);
    const unidadeRend: 'g' | 'ml' | 'un' = rawRendUnit === 'kg' ? 'g' : rawRendUnit;

    if (!map.has(nome)) {
      map.set(nome, { nome, rendimento, unidade: unidadeRend, itens: [] });
    }
    map.get(nome)!.itens.push({ ingrediente, quantidade, unidade: unidadeIng });
  }
  return Array.from(map.values());
}

function parseProdutosSheet(sheet: XLSX.WorkSheet, legacy = false): ProdRow[] {
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const rows: ProdRow[] = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i] as unknown[];
    if (!row || row.length < (legacy ? 6 : 4)) continue;
    const sabor = String(row[0] ?? '').trim().toUpperCase();
    const tamanho = String(row[1] ?? '').trim();
    const referencia = String(row[2] ?? '').trim().toUpperCase();
    const qtdRaw = parseFloat(String(row[3]).replace(',', '.')) || 0;
    const rawUnit = getRawUnit(String(row[4] ?? 'g'));
    const precoKg = parseFloat(String(row[5] ?? 0).replace(',', '.')) || 0;
    if (!sabor || !tamanho || !referencia) continue;
    if (referencia.length > MAX_REF_LENGTH) continue;
    if (legacy && qtdRaw === 0 && precoKg === 0) continue;
    const { quantidade, unidade } = convertQty(qtdRaw, rawUnit);
    rows.push({ sabor, tamanho, referencia, quantidade, unidade, precoKg });
  }
  return rows;
}

// ─── Main component ───────────────────────────────────────────────────────────

export const ImportPlanilhaModal = ({ data, onClose, onSave }: ImportPlanilhaModalProps) => {
  const [progress, setProgress] = useState<ImportProgress>(INITIAL_PROGRESS);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImport = async (file: File) => {
    setProgress({ ...INITIAL_PROGRESS, status: 'parsing', phase: 'Lendo arquivo...' });

    let workbook: XLSX.WorkBook;
    try {
      workbook = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
          try { resolve(XLSX.read(e.target?.result, { type: 'array' })); }
          catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
        reader.readAsArrayBuffer(file);
      });
    } catch (err) {
      setProgress(prev => ({
        ...prev,
        status: 'done',
        errors: [`Erro ao ler arquivo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`],
      }));
      return;
    }

    // Detectar formato
    const ingSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('ingrediente'));
    const recSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('receita'));
    const prodSheetName = workbook.SheetNames.find(
      n => n.toLowerCase().includes('produto') || n.toLowerCase().includes('sabor'),
    );
    const isMultiSheet = !!(ingSheetName || recSheetName || prodSheetName);

    let parsedIngredientes: ParsedIngrediente[] = [];
    let parsedReceitas: ParsedReceita[] = [];
    let prodRows: ProdRow[] = [];

    if (isMultiSheet) {
      if (ingSheetName) parsedIngredientes = parseIngredientesSheet(workbook.Sheets[ingSheetName]);
      if (recSheetName) parsedReceitas = parseReceitasSheet(workbook.Sheets[recSheetName]);
      const prodSheet = prodSheetName
        ? workbook.Sheets[prodSheetName]
        : workbook.Sheets[workbook.SheetNames[0]];
      prodRows = parseProdutosSheet(prodSheet);
    } else {
      prodRows = parseProdutosSheet(workbook.Sheets[workbook.SheetNames[0]], true);
    }

    const totalItems =
      parsedIngredientes.length + parsedReceitas.length + new Set(prodRows.map(r => `${r.sabor}|||${r.tamanho}`)).size;

    if (totalItems === 0) {
      setProgress(prev => ({
        ...prev,
        status: 'done',
        errors: ['Nenhuma linha válida encontrada. Verifique o formato da planilha.'],
      }));
      return;
    }

    setProgress(prev => ({
      ...prev,
      status: 'importing',
      phase: 'Processando...',
      total: totalItems,
    }));

    const workingData: StoreData = {
      sabores: data.sabores.map(s => ({ ...s, itens: [...(s.itens ?? [])] })),
      ingredientes: data.ingredientes.map(i => ({ ...i })),
      receitas: (data.receitas ?? []).map(r => ({ ...r, itens: [...r.itens] })),
    };

    let ingNew = 0, ingUpdated = 0;
    let recNew = 0, recUpdated = 0;
    let saborNew = 0, saborUpdated = 0;
    const errors: string[] = [];
    let current = 0;

    // ── 1. Ingredientes ────────────────────────────────────────────────────────
    if (parsedIngredientes.length > 0) {
      setProgress(prev => ({ ...prev, phase: 'Importando ingredientes...' }));
      await new Promise(r => setTimeout(r, 8));

      for (const pi of parsedIngredientes) {
        const existing = workingData.ingredientes.find(
          ing => ing.nome.toUpperCase() === pi.nome && ing.unidade === pi.unidade,
        );
        if (existing) {
          workingData.ingredientes = workingData.ingredientes.map(ing =>
            ing.id === existing.id ? { ...ing, precoPorKg: pi.preco } : ing,
          );
          ingUpdated++;
        } else {
          workingData.ingredientes.push({
            id: crypto.randomUUID(),
            nome: pi.nome,
            unidade: pi.unidade,
            precoPorKg: pi.preco,
          } as Ingrediente);
          ingNew++;
        }
        current++;
        setProgress(prev => ({ ...prev, current, ingNew, ingUpdated }));
      }
    }

    // ── 2. Receitas ────────────────────────────────────────────────────────────
    if (parsedReceitas.length > 0) {
      setProgress(prev => ({ ...prev, phase: 'Importando receitas...', current }));
      await new Promise(r => setTimeout(r, 8));

      for (const pr of parsedReceitas) {
        try {
          const receitaItens: ReceitaItem[] = [];
          for (const item of pr.itens) {
            let ing = workingData.ingredientes.find(
              i => i.nome.toUpperCase() === item.ingrediente && i.unidade === item.unidade,
            );
            if (!ing) {
              ing = {
                id: crypto.randomUUID(),
                nome: item.ingrediente,
                unidade: item.unidade,
                precoPorKg: 0,
              } as Ingrediente;
              workingData.ingredientes.push(ing);
              ingNew++;
            }
            receitaItens.push({ ingredienteId: ing.id, quantidade: item.quantidade });
          }

          const existingRec = workingData.receitas.find(r => r.nome.toUpperCase() === pr.nome);
          if (existingRec) {
            workingData.receitas = workingData.receitas.map(r =>
              r.id === existingRec.id
                ? { ...r, rendimento: pr.rendimento, unidade: pr.unidade, itens: receitaItens }
                : r,
            );
            recUpdated++;
          } else {
            workingData.receitas.push({
              id: crypto.randomUUID(),
              nome: pr.nome,
              rendimento: pr.rendimento,
              unidade: pr.unidade,
              itens: receitaItens,
            } as Receita);
            recNew++;
          }
        } catch (err) {
          errors.push(
            `Receita "${pr.nome}": ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
          );
        }
        current++;
        setProgress(prev => ({ ...prev, current, recNew, recUpdated, ingNew }));
      }
    }

    // ── 3. Produtos / Sabores ──────────────────────────────────────────────────
    if (prodRows.length > 0) {
      const groups = new Map<string, ProdRow[]>();
      prodRows.forEach(row => {
        const key = `${row.sabor}|||${row.tamanho}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(row);
      });
      const groupArray = Array.from(groups.entries());

      for (const [key, groupRows] of groupArray) {
        const [sabor, tamanho] = key.split('|||');
        const nomeProduto = `${sabor} ${tamanho}`;

        setProgress(prev => ({ ...prev, phase: `Produto: ${nomeProduto}`, current }));
        await new Promise(r => setTimeout(r, 4));

        try {
          const saborItens: SaborItem[] = [];

          for (const row of groupRows) {
            const matchingReceita = workingData.receitas.find(
              r => r.nome.toUpperCase() === row.referencia,
            );

            if (matchingReceita) {
              saborItens.push({
                id: crypto.randomUUID(),
                tipo: 'receita',
                referenciaId: matchingReceita.id,
                quantidade: row.quantidade,
              });
            } else {
              let ing = workingData.ingredientes.find(
                i => i.nome.toUpperCase() === row.referencia && i.unidade === row.unidade,
              );
              if (!ing) {
                ing = {
                  id: crypto.randomUUID(),
                  nome: row.referencia,
                  unidade: row.unidade,
                  precoPorKg: row.precoKg,
                } as Ingrediente;
                workingData.ingredientes.push(ing);
                ingNew++;
              } else if (row.precoKg > 0) {
                workingData.ingredientes = workingData.ingredientes.map(i =>
                  i.id === ing!.id ? { ...i, precoPorKg: row.precoKg } : i,
                );
              }
              saborItens.push({
                id: crypto.randomUUID(),
                tipo: 'ingrediente',
                referenciaId: ing.id,
                quantidade: row.quantidade,
              });
            }
          }

          const existingIdx = workingData.sabores.findIndex(
            s => s.nome.toUpperCase() === nomeProduto.toUpperCase(),
          );
          if (existingIdx >= 0) {
            workingData.sabores[existingIdx] = {
              ...workingData.sabores[existingIdx],
              itens: saborItens,
            };
            saborUpdated++;
          } else {
            workingData.sabores.push({
              id: crypto.randomUUID(),
              nome: nomeProduto,
              categoria: 'tradicional',
              precoVenda: 0,
              itens: saborItens,
            });
            saborNew++;
          }
        } catch (err) {
          errors.push(
            `"${nomeProduto}": ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
          );
        }
        current++;
        setProgress(prev => ({ ...prev, current, saborNew, saborUpdated, ingNew }));
      }
    }

    onSave(workingData);

    setProgress({
      status: 'done',
      phase: '',
      total: current,
      current,
      ingNew,
      ingUpdated,
      recNew,
      recUpdated,
      saborNew,
      saborUpdated,
      errors,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImport(file);
    e.target.value = '';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processImport(file);
    },
    [data], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const progressPercent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const isImporting = progress.status === 'parsing' || progress.status === 'importing';
  const totalNew = progress.ingNew + progress.recNew + progress.saborNew;
  const totalUpdated = progress.ingUpdated + progress.recUpdated + progress.saborUpdated;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2e]">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-green-400" />
            <h2 className="text-base font-bold text-white">Importar Planilha</h2>
          </div>
          {!isImporting && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors rounded-lg p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-5">
          {/* ── IDLE ── */}
          {progress.status === 'idle' && (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-[#374151] hover:border-green-500/50 hover:bg-green-500/5'
                }`}
              >
                <Upload
                  className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? 'text-green-400' : 'text-gray-500'}`}
                />
                <p className="text-sm font-medium text-white mb-1">Selecionar planilha</p>
                <p className="text-xs text-gray-500">CSV ou XLSX · Arraste ou clique</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Formatos */}
              <div className="bg-[#141416] border border-[#2a2a2e] rounded-xl p-4 text-xs space-y-3">
                <p className="font-semibold text-gray-300">Formatos suportados:</p>

                <div>
                  <p className="text-gray-400 font-medium mb-1.5">
                    📊 Completo — 3 abas separadas:
                  </p>
                  <div className="space-y-1 pl-2">
                    <p>
                      <span className="text-blue-400 font-medium">Ingredientes</span>
                      <span className="text-gray-600"> → </span>
                      <span className="text-gray-400">Nome · Unidade · Preço</span>
                    </p>
                    <p>
                      <span className="text-purple-400 font-medium">Receitas</span>
                      <span className="text-gray-600"> → </span>
                      <span className="text-gray-400">Receita · Rendimento · Unidade · Ingrediente · Qtd · Unidade</span>
                    </p>
                    <p>
                      <span className="text-green-400 font-medium">Produtos</span>
                      <span className="text-gray-600"> → </span>
                      <span className="text-gray-400">Sabor · Tamanho · Ingrediente/Receita · Qtd · Unidade · Preço/kg</span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#2a2a2e] pt-2">
                  <p className="text-gray-400 font-medium mb-1">📄 Simples — 1 aba:</p>
                  <p className="text-gray-500 pl-2">Sabor · Tamanho · Ingrediente · Qtd · Unidade · Preço/kg</p>
                </div>
              </div>

              <button
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#374151] hover:border-[#4a4a50] rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar modelo Excel
              </button>
            </div>
          )}

          {/* ── IMPORTING ── */}
          {isImporting && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-sm font-medium text-white mb-0.5">
                  {progress.status === 'parsing' ? 'Lendo arquivo…' : progress.phase}
                </p>
                {progress.total > 0 && (
                  <p className="text-xs text-gray-500">
                    {progress.current} de {progress.total} itens
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 bg-[#2a2a2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {totalNew} novos · {totalUpdated} atualizados
                  </span>
                  <span>{progressPercent}%</span>
                </div>
              </div>
              {progress.phase && progress.status === 'importing' && (
                <div className="bg-[#141416] border border-[#2a2a2e] rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Processando:</p>
                  <p className="text-sm text-white font-medium truncate">{progress.phase}</p>
                </div>
              )}
            </div>
          )}

          {/* ── DONE ── */}
          {progress.status === 'done' && (
            <div className="space-y-4">
              {totalNew + totalUpdated > 0 ? (
                <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <p className="text-sm font-semibold text-white">Importação concluída!</p>
                    {(progress.ingNew + progress.ingUpdated) > 0 && (
                      <p className="text-xs text-gray-400">
                        🥚 Ingredientes: {progress.ingNew} novos · {progress.ingUpdated} atualizados
                      </p>
                    )}
                    {(progress.recNew + progress.recUpdated) > 0 && (
                      <p className="text-xs text-gray-400">
                        👨‍🍳 Receitas: {progress.recNew} novas · {progress.recUpdated} atualizadas
                      </p>
                    )}
                    {(progress.saborNew + progress.saborUpdated) > 0 && (
                      <p className="text-xs text-gray-400">
                        🍕 Produtos: {progress.saborNew} novos · {progress.saborUpdated} atualizados
                      </p>
                    )}
                    {progress.saborNew > 0 && (
                      <p className="text-xs text-gray-500 pt-1">
                        💡 Configure o preço de venda clicando em cada produto
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-white">
                    Nenhum dado importado. Verifique o formato da planilha.
                  </p>
                </div>
              )}

              {progress.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-xs font-semibold text-red-400">
                      {progress.errors.length} erro{progress.errors.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {progress.errors.map((err, i) => (
                      <p key={i} className="text-xs text-gray-400 leading-relaxed">
                        {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Concluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
