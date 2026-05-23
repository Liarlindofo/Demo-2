'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export interface BonificacaoTrimestral {
  id: string;
  valor: number;
  trimestre: number;
  ano: number;
  dataPagamento: string;
  motivo?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  funcionarioId: string;
  onSaved: () => void;
  edit?: BonificacaoTrimestral | null;
}

const inputCls =
  'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

export default function DrawerBonificacaoTrimestral({
  open,
  onClose,
  funcionarioId,
  onSaved,
  edit,
}: Props) {
  const [trimestre, setTrimestre] = useState(edit?.trimestre ?? 1);
  const [ano, setAno] = useState(edit?.ano ?? new Date().getFullYear());
  const [valor, setValor] = useState(edit?.valor?.toFixed(2).replace('.', ',') ?? '');
  const [dataPagamento, setDataPagamento] = useState(
    edit?.dataPagamento ? edit.dataPagamento.split('T')[0] : ''
  );
  const [motivo, setMotivo] = useState(edit?.motivo ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const parseValor = () => parseFloat(valor.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const v = parseValor();
    if (v <= 0) {
      setError('Informe um valor válido');
      return;
    }
    if (!dataPagamento) {
      setError('Data de pagamento é obrigatória');
      return;
    }

    setSaving(true);
    try {
      const url = edit
        ? `/api/rh/funcionarios/${funcionarioId}/bonificacoes/${edit.id}`
        : `/api/rh/funcionarios/${funcionarioId}/bonificacoes`;
      const res = await fetch(url, {
        method: edit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: v,
          trimestre,
          ano,
          dataPagamento,
          motivo: motivo || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? 'Erro ao salvar');
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#1c1c1e] border-l border-[#2a2a2e] h-full overflow-y-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {edit ? 'Editar' : 'Registrar'} Bonificação Trimestral
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#2a2a2e] flex items-center justify-center text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Trimestre</label>
            <select
              value={trimestre}
              onChange={(e) => setTrimestre(Number(e.target.value))}
              className={inputCls}
            >
              <option value={1}>Q1 (Jan–Mar)</option>
              <option value={2}>Q2 (Abr–Jun)</option>
              <option value={3}>Q3 (Jul–Set)</option>
              <option value={4}>Q4 (Out–Dez)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Ano</label>
            <input
              type="number"
              min={2000}
              max={2100}
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Valor (R$)</label>
            <input
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className={inputCls}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className={labelCls}>Data de pagamento</label>
            <input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Motivo (opcional)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Ex: Meta atingida Q1"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
}
