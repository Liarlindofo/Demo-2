'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Loader2, Building2 } from 'lucide-react';

interface Transferencia {
  id: string;
  dataTransferencia: string;
  motivo: string | null;
  aprovadoPor: string | null;
  createdAt: string;
  lojaOrigem: { nome: string };
  lojaDestino: { nome: string };
}

interface Props {
  funcionarioId: string;
}

export default function TransferenciasTab({ funcionarioId }: Props) {
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransferencias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rh/funcionarios/${funcionarioId}/transferencias`);
      if (res.ok) setTransferencias(await res.json());
    } finally {
      setLoading(false);
    }
  }, [funcionarioId]);

  useEffect(() => { fetchTransferencias(); }, [fetchTransferencias]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (transferencias.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Nenhuma transferência registrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transferencias.map((t) => (
        <div key={t.id} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-semibold text-white">{t.lojaOrigem.nome}</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">{t.lojaDestino.nome}</span>
          </div>
          <div className="space-y-1 text-xs text-gray-400">
            <p>
              <span className="text-gray-500">Data:</span>{' '}
              {new Date(t.dataTransferencia).toLocaleDateString('pt-BR')}
            </p>
            {t.motivo && (
              <p><span className="text-gray-500">Motivo:</span> {t.motivo}</p>
            )}
            {t.aprovadoPor && (
              <p><span className="text-gray-500">Aprovado por:</span> {t.aprovadoPor}</p>
            )}
            <p>
              <span className="text-gray-500">Registrado em:</span>{' '}
              {new Date(t.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
