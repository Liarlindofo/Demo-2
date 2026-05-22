'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle } from 'lucide-react';

const TIPOS_DOCUMENTO = [
  { value: 'contrato_experiencia_45', label: 'Contrato de Experiência (45d)' },
  { value: 'contrato_experiencia_90', label: 'Contrato de Experiência (90d)' },
  { value: 'contrato_efetivacao', label: 'Contrato de Efetivação' },
  { value: 'termo_admissao', label: 'Termo de Admissão' },
  { value: 'exame_admissional', label: 'Exame Admissional' },
  { value: 'exame_periodico', label: 'Exame Periódico' },
  { value: 'exame_demissional', label: 'Exame Demissional' },
  { value: 'ctps_digital', label: 'CTPS Digital' },
  { value: 'comprovante_residencia', label: 'Comprovante de Residência' },
  { value: 'rg_cpf', label: 'RG/CPF' },
  { value: 'foto_3x4', label: 'Foto 3x4' },
  { value: 'ficha_registro', label: 'Ficha de Registro' },
  { value: 'advertencia', label: 'Advertência' },
  { value: 'suspensao', label: 'Suspensão' },
  { value: 'holerite', label: 'Holerite' },
  { value: 'ferias_aviso', label: 'Aviso de Férias' },
  { value: 'ferias_recibo', label: 'Recibo de Férias' },
  { value: 'rescisao', label: 'Rescisão' },
  { value: 'outros', label: 'Outros' },
];

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const TIPOS_COM_VENCIMENTO = ['exame_admissional', 'exame_periodico', 'exame_demissional'];

interface Props {
  funcionarioId: string;
  uploadadoPor: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DrawerDocumento({ funcionarioId, uploadadoPor, onClose, onSuccess }: Props) {
  const [tipo, setTipo] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [mesReferencia, setMesReferencia] = useState('');
  const [anoReferencia, setAnoReferencia] = useState(String(new Date().getFullYear()));
  const [observacoes, setObservacoes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.size > 10 * 1024 * 1024) { setError('Arquivo muito grande (máx 10MB)'); return; }
    setFile(f);
    setError('');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!tipo || !file) { setError('Selecione o tipo e o arquivo'); return; }
    setLoading(true);
    setError('');
    setUploadProgress(10);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch('/api/rh/documentos/upload', { method: 'POST', body: fd });
      setUploadProgress(60);
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error ?? 'Erro no upload');
      }
      const uploadData = await uploadRes.json();
      setUploadProgress(80);

      const docRes = await fetch('/api/rh/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funcionarioId, tipo, nome: uploadData.nome, url: uploadData.url,
          tamanhoBytes: uploadData.tamanhoBytes,
          dataVencimento: dataVencimento || undefined,
          mesReferencia: mesReferencia ? Number(mesReferencia) : undefined,
          anoReferencia: anoReferencia ? Number(anoReferencia) : undefined,
          observacoes: observacoes || undefined,
          uploadadoPor,
        }),
      });
      if (!docRes.ok) {
        const err = await docRes.json().catch(() => ({}));
        throw new Error(err.error ?? 'Erro ao salvar');
      }
      setUploadProgress(100);
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const isHolerite = tipo === 'holerite';
  const hasVencimento = TIPOS_COM_VENCIMENTO.includes(tipo);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111113] border-l border-[#2a2a2e] flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2e]">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            Adicionar Documento
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#2a2a2e] flex items-center justify-center hover:bg-[#3a3a3e]">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Tipo de Documento *
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Selecione...</option>
              {TIPOS_DOCUMENTO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Holerite: mês/ano */}
          {isHolerite && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Mês</label>
                <select
                  value={mesReferencia}
                  onChange={(e) => setMesReferencia(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecione</option>
                  {MESES.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Ano</label>
                <input
                  type="number"
                  value={anoReferencia}
                  onChange={(e) => setAnoReferencia(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  min={2020} max={2099}
                />
              </div>
            </div>
          )}

          {/* Data de vencimento */}
          {hasVencimento && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                Data de Vencimento
              </label>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Opcional..."
            />
          </div>

          {/* Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Arquivo * (PDF, JPG, PNG, WEBP — máx 10MB)
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-500/10'
                  : file
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-[#3a3a3e] hover:border-amber-500/50 hover:bg-[#1c1c1e]'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">{file.name}</span>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">
                    Arraste o arquivo ou <span className="text-amber-400">clique para selecionar</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {loading && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Enviando...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-[#2a2a2e] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Documento salvo com sucesso!
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#2a2a2e] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#2a2a2e] text-gray-300 text-sm font-medium hover:bg-[#3a3a3e] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !tipo || !file}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {loading ? 'Enviando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
