'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { StoreData, Ingrediente } from '../types';

interface ImportPlanilhaModalProps {
  data: StoreData;
  onClose: () => void;
  onSave: (newData: StoreData) => void;
}

type Status = 'idle' | 'parsing' | 'importing' | 'done';

interface ImportProgress {
  status: Status;
  total: number;
  current: number;
  currentSabor: string;
  imported: number;
  updated: number;
  errors: string[];
}

interface PlanilhaRow {
  sabor: string;
  tamanho: string;
  ingrediente: string;
  quantidade: number; // valor bruto da planilha
  unidade: 'kg' | 'g' | 'ml' | 'un';
  precoKg: number;
}

const INITIAL_PROGRESS: ImportProgress = {
  status: 'idle',
  total: 0,
  current: 0,
  currentSabor: '',
  imported: 0,
  updated: 0,
  errors: [],
};

const MAX_INGREDIENTE_LENGTH = 40; // Ignora linhas com ingrediente muito longo (modo de preparo)

export const ImportPlanilhaModal = ({ data, onClose, onSave }: ImportPlanilhaModalProps) => {
  const [progress, setProgress] = useState<ImportProgress>(INITIAL_PROGRESS);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Parsing ──────────────────────────────────────────────────────────────

  const parseFileToRows = async (file: File): Promise<PlanilhaRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rawData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

          const rows: PlanilhaRow[] = [];

          // Linha 0 = cabeçalho, pular
          for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i] as unknown[];
            if (!row || row.length < 6) continue;

            const sabor = String(row[0] ?? '').trim().toUpperCase();
            const tamanho = String(row[1] ?? '').trim();
            const ingrediente = String(row[2] ?? '').trim().toUpperCase();
            const quantidade = parseFloat(String(row[3]).replace(',', '.')) || 0;
            const unidadeRaw = String(row[4] ?? 'kg').toLowerCase().trim();
            const precoKg = parseFloat(String(row[5]).replace(',', '.')) || 0;

            // Validações de filtro
            if (!sabor || !tamanho || !ingrediente) continue;
            if (ingrediente.length > MAX_INGREDIENTE_LENGTH) continue; // modo de preparo
            if (quantidade === 0 && precoKg === 0) continue;

            // Normalizar unidade: suportar kg, g, ml e un
            let unidade: PlanilhaRow['unidade'] = 'kg';
            if (unidadeRaw === 'un' || unidadeRaw === 'unid' || unidadeRaw === 'unidade') {
              unidade = 'un';
            } else if (unidadeRaw === 'g' || unidadeRaw === 'gr' || unidadeRaw === 'grama' || unidadeRaw === 'gramas') {
              unidade = 'g';
            } else if (unidadeRaw === 'ml' || unidadeRaw === 'mililitro' || unidadeRaw === 'mililitros') {
              unidade = 'ml';
            } else {
              unidade = 'kg'; // kg, kilo, quilograma, etc
            }

            rows.push({
              sabor,
              tamanho,
              ingrediente,
              quantidade,
              unidade,
              precoKg,
            });
          }

          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  // ─── Processamento ────────────────────────────────────────────────────────

  const processImport = async (file: File) => {
    setProgress({ ...INITIAL_PROGRESS, status: 'parsing', currentSabor: 'Lendo arquivo...' });

    let rows: PlanilhaRow[];
    try {
      rows = await parseFileToRows(file);
    } catch (err) {
      setProgress(prev => ({
        ...prev,
        status: 'done',
        errors: [`Erro ao ler arquivo: ${err instanceof Error ? err.message : 'Erro desconhecido'}`],
      }));
      return;
    }

    if (rows.length === 0) {
      setProgress(prev => ({
        ...prev,
        status: 'done',
        errors: ['Nenhuma linha válida encontrada. Verifique o formato da planilha.'],
      }));
      return;
    }

    // Agrupar por sabor + tamanho
    const groups = new Map<string, PlanilhaRow[]>();
    rows.forEach(row => {
      const key = `${row.sabor}|||${row.tamanho}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    });

    const groupArray = Array.from(groups.entries());

    setProgress(prev => ({
      ...prev,
      status: 'importing',
      total: groupArray.length,
      current: 0,
    }));

    // Cópia profunda dos dados para mutação segura
    let workingData: StoreData = {
      sabores: [...data.sabores.map(s => ({ ...s, ingredientes: [...s.ingredientes] }))],
      ingredientes: [...data.ingredientes.map(i => ({ ...i }))],
    };

    let imported = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < groupArray.length; i++) {
      const [key, groupRows] = groupArray[i];
      const [sabor, tamanho] = key.split('|||');
      const nomeProduto = `${sabor} ${tamanho}`;

      setProgress(prev => ({
        ...prev,
        current: i + 1,
        currentSabor: nomeProduto,
        imported,
        updated,
      }));

      // Pequena pausa para a UI renderizar o progresso
      await new Promise(resolve => setTimeout(resolve, 8));

      try {
        const ingredientesSabor: { ingredienteId: string; quantidade: number }[] = [];

        for (const row of groupRows) {
          // Converter unidade e quantidade para o sistema interno
          // Sistema interno: 'g' (quantidade em gramas), 'ml' (em ml), 'un' (unidades)
          let unidadeSistema: 'g' | 'ml' | 'un';
          let quantidadeSistema: number;

          if (row.unidade === 'kg') {
            // kg → converter para gramas multiplicando por 1000
            unidadeSistema = 'g';
            quantidadeSistema = row.quantidade * 1000;
          } else if (row.unidade === 'g') {
            // já está em gramas, sem conversão
            unidadeSistema = 'g';
            quantidadeSistema = row.quantidade;
          } else if (row.unidade === 'ml') {
            // já está em ml, sem conversão
            unidadeSistema = 'ml';
            quantidadeSistema = row.quantidade;
          } else {
            // 'un' → unidades, sem conversão
            unidadeSistema = 'un';
            quantidadeSistema = row.quantidade;
          }

          // Encontrar ingrediente existente (mesmo nome + mesma unidade)
          const nomeNorm = row.ingrediente.toUpperCase();
          let ingrediente = workingData.ingredientes.find(
            ing => ing.nome.toUpperCase() === nomeNorm && ing.unidade === unidadeSistema,
          );

          if (!ingrediente) {
            // Criar novo ingrediente
            ingrediente = {
              id: crypto.randomUUID(),
              nome: row.ingrediente,
              unidade: unidadeSistema,
              precoPorKg: row.precoKg,
            } as Ingrediente;
            workingData.ingredientes.push(ingrediente);
          } else {
            // Atualizar preço
            workingData.ingredientes = workingData.ingredientes.map(ing =>
              ing.id === ingrediente!.id
                ? { ...ing, precoPorKg: row.precoKg }
                : ing,
            );
          }

          ingredientesSabor.push({
            ingredienteId: ingrediente.id,
            quantidade: quantidadeSistema,
          });
        }

        // Upsert do sabor
        const existingIdx = workingData.sabores.findIndex(
          s => s.nome.toUpperCase() === nomeProduto.toUpperCase(),
        );

        if (existingIdx >= 0) {
          // Atualizar ingredientes mas preservar precoVenda e categoria existentes
          workingData.sabores[existingIdx] = {
            ...workingData.sabores[existingIdx],
            ingredientes: ingredientesSabor,
          };
          updated++;
        } else {
          workingData.sabores.push({
            id: crypto.randomUUID(),
            nome: nomeProduto,
            categoria: 'tradicional',
            precoVenda: 0,
            ingredientes: ingredientesSabor,
          });
          imported++;
        }
      } catch (err) {
        errors.push(
          `"${nomeProduto}": ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        );
      }
    }

    // Salvar dados finais
    onSave(workingData);

    setProgress({
      status: 'done',
      total: groupArray.length,
      current: groupArray.length,
      currentSabor: '',
      imported,
      updated,
      errors,
    });
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImport(file);
    // Reset input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImport(file);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const progressPercent = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  const isImporting = progress.status === 'parsing' || progress.status === 'importing';
  const totalSuccess = progress.imported + progress.updated;

  // ─── Render ───────────────────────────────────────────────────────────────

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
          {/* ── IDLE: seletor de arquivo ── */}
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
                <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? 'text-green-400' : 'text-gray-500'}`} />
                <p className="text-sm font-medium text-white mb-1">Selecionar planilha</p>
                <p className="text-xs text-gray-500">CSV ou XLSX · Arraste ou clique para selecionar</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="bg-[#141416] border border-[#2a2a2e] rounded-xl p-3 text-xs text-gray-500 space-y-1">
                <p className="font-medium text-gray-400 mb-2">Formato esperado (colunas):</p>
                <p><span className="text-gray-300">1.</span> Sabor · <span className="text-gray-300">2.</span> Tamanho · <span className="text-gray-300">3.</span> Ingrediente</p>
                <p><span className="text-gray-300">4.</span> Quantidade · <span className="text-gray-300">5.</span> Unidade · <span className="text-gray-300">6.</span> Preço/kg</p>
                <p className="text-gray-600 pt-1">Colunas a partir da 7ª são ignoradas automaticamente.</p>
              </div>
            </div>
          )}

          {/* ── PARSING / IMPORTING: barra de progresso ── */}
          {isImporting && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="text-sm font-medium text-white mb-0.5">
                  {progress.status === 'parsing' ? 'Lendo arquivo…' : 'Importando produtos…'}
                </p>
                {progress.status === 'importing' && (
                  <p className="text-xs text-gray-500">
                    {progress.current} de {progress.total} sabores processados
                  </p>
                )}
              </div>

              {/* Barra de progresso */}
              <div className="space-y-1.5">
                <div className="h-2.5 bg-[#2a2a2e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{progress.imported} novos · {progress.updated} atualizados</span>
                  <span>{progressPercent}%</span>
                </div>
              </div>

              {/* Sabor atual */}
              {progress.currentSabor && progress.status === 'importing' && (
                <div className="bg-[#141416] border border-[#2a2a2e] rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Processando:</p>
                  <p className="text-sm text-white font-medium truncate">{progress.currentSabor}</p>
                </div>
              )}
            </div>
          )}

          {/* ── DONE: resumo ── */}
          {progress.status === 'done' && (
            <div className="space-y-4">
              {/* Sucesso */}
              <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {totalSuccess} produto{totalSuccess !== 1 ? 's' : ''} importado{totalSuccess !== 1 ? 's' : ''} com sucesso
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {progress.imported} novo{progress.imported !== 1 ? 's' : ''} ·{' '}
                    {progress.updated} atualizado{progress.updated !== 1 ? 's' : ''}
                  </p>
                  {totalSuccess > 0 && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      💡 Configure o preço de venda clicando em cada produto
                    </p>
                  )}
                </div>
              </div>

              {/* Erros (se houver) */}
              {progress.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-xs font-semibold text-red-400">
                      {progress.errors.length} erro{progress.errors.length !== 1 ? 's' : ''} durante a importação
                    </p>
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {progress.errors.map((err, i) => (
                      <p key={i} className="text-xs text-gray-400 leading-relaxed">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão fechar */}
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
