'use client';

import { useState } from 'react';
import { X, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

interface Loja { id: string; nome: string }

interface Props {
  funcionarioId: string;
  funcionarioNome: string;
  lojaAtualId: string;
  lojaAtualNome: string;
  lojas: Loja[];
  aprovadoPor: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DrawerTransferencia({
  funcionarioId, funcionarioNome, lojaAtualId, lojaAtualNome,
  lojas, aprovadoPor, onClose, onSuccess,
}: Props) {
  const [lojaDestinoId, setLojaDestinoId] = useState('');
  const [dataTransferencia, setDataTransferencia] = useState(new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = useState('');
  const [aprovadoPorEdit, setAprovadoPorEdit] = useState(aprovadoPor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const lojaDestino = lojas.find((l) => l.id === lojaDestinoId);
  const lojasDisponiveis = lojas.filter((l) => l.id !== lojaAtualId);

  const handleSubmit = async () => {
    if (!lojaDestinoId || !dataTransferencia) {
      setError('Selecione a loja de destino e a data');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rh/transferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funcionarioId, lojaDestinoId, dataTransferencia,
          motivo: motivo || undefined,
          aprovadoPor: aprovadoPorEdit || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Erro ao transferir');
      }
      const data = await res.json();
      setSuccess(data.mensagem ?? 'Transferência realizada!');
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111113] border-l border-[#2a2a2e] flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2e]">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-amber-400" />
            Transferir para outra loja
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#2a2a2e] flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Funcionário */}
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Funcionário</p>
            <p className="text-sm font-semibold text-white">{funcionarioNome}</p>
            <p className="text-xs text-gray-400 mt-0.5">Loja atual: {lojaAtualNome}</p>
          </div>

          {/* Seta de transferência */}
          {lojaDestino && (
            <div className="flex items-center justify-center gap-3 py-2">
              <span className="text-sm text-gray-400 font-medium">{lojaAtualNome}</span>
              <ArrowRight className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-amber-400 font-semibold">{lojaDestino.nome}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Loja de Destino *
            </label>
            <select
              value={lojaDestinoId}
              onChange={(e) => setLojaDestinoId(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Selecione a loja destino...</option>
              {lojasDisponiveis.map((l) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Data da Transferência *
            </label>
            <input
              type="date"
              value={dataTransferencia}
              onChange={(e) => setDataTransferencia(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Motivo (opcional)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Motivo da transferência..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Aprovado por
            </label>
            <input
              type="text"
              value={aprovadoPorEdit}
              onChange={(e) => setAprovadoPorEdit(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {success}
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#2a2a2e] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-[#2a2a2e] text-gray-300 text-sm font-medium hover:bg-[#3a3a3e]">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !lojaDestinoId}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {loading ? 'Transferindo...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
