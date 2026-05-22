'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight, Loader2, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import DrawerOcorrencia from './DrawerOcorrencia';

interface Ocorrencia {
  id: string;
  tipo: string;
  data: string;
  descricao: string;
  gravidade: string | null;
  testemunhas: string | null;
  providencia: string | null;
  cidAfastamento: string | null;
  dataInicioAfastamento: string | null;
  dataFimAfastamento: string | null;
  registradoPor: string;
  createdAt: string;
}

interface Resumo {
  faltasMes: number;
  totalAdvertencias: number;
  ultimaOcorrencia: Ocorrencia | null;
}

const TIPO_LABELS: Record<string, string> = {
  falta_justificada: 'Falta Justificada',
  falta_injustificada: 'Falta Injustificada',
  atraso: 'Atraso',
  saida_antecipada: 'Saída Antecipada',
  advertencia_verbal: 'Advertência Verbal',
  advertencia_escrita: 'Advertência Escrita',
  suspensao: 'Suspensão',
  atestado_medico: 'Atestado Médico',
  acidente_trabalho: 'Acidente de Trabalho',
  licenca_maternidade: 'Lic. Maternidade',
  licenca_paternidade: 'Lic. Paternidade',
  afastamento_inss: 'Afastamento INSS',
  elogio: 'Elogio',
  outros: 'Outros',
};

function tipoBadgeClass(tipo: string): string {
  if (['advertencia_verbal', 'advertencia_escrita', 'suspensao'].includes(tipo))
    return 'bg-red-500/15 text-red-400 border border-red-500/20';
  if (['falta_justificada', 'falta_injustificada', 'atraso', 'saida_antecipada'].includes(tipo))
    return 'bg-amber-500/15 text-amber-400 border border-amber-500/20';
  if (['atestado_medico', 'acidente_trabalho', 'licenca_maternidade', 'licenca_paternidade', 'afastamento_inss'].includes(tipo))
    return 'bg-blue-500/15 text-blue-400 border border-blue-500/20';
  if (tipo === 'elogio') return 'bg-green-500/15 text-green-400 border border-green-500/20';
  return 'bg-gray-500/15 text-gray-400 border border-gray-500/20';
}

interface Props {
  funcionarioId: string;
  registradoPor: string;
}

export default function OcorrenciasTab({ funcionarioId, registradoPor }: Props) {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchOcorrencias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rh/funcionarios/${funcionarioId}/ocorrencias`);
      if (res.ok) {
        const data = await res.json();
        setOcorrencias(data.ocorrencias ?? []);
        setResumo(data.resumo ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [funcionarioId]);

  useEffect(() => { fetchOcorrencias(); }, [fetchOcorrencias]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/rh/ocorrencias/${id}`, { method: 'DELETE' });
      setOcorrencias((o) => o.filter((oc) => oc.id !== id));
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards resumo */}
      {resumo && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Faltas no mês</p>
            <p className="text-2xl font-bold text-amber-400">{resumo.faltasMes}</p>
          </div>
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Advertências</p>
            <p className="text-2xl font-bold text-red-400">{resumo.totalAdvertencias}</p>
          </div>
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total registros</p>
            <p className="text-2xl font-bold text-white">{ocorrencias.length}</p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setShowDrawer(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black text-sm font-bold rounded-xl hover:bg-amber-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar Ocorrência
        </button>
      </div>

      {/* Timeline */}
      {ocorrencias.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma ocorrência registrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ocorrencias.map((oc) => (
            <div
              key={oc.id}
              className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === oc.id ? null : oc.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#222224] transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tipoBadgeClass(oc.tipo)}`}>
                      {TIPO_LABELS[oc.tipo] ?? oc.tipo}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(oc.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 truncate">{oc.descricao}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {expandedId === oc.id ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedId === oc.id && (
                <div className="px-5 pb-4 pt-0 border-t border-[#2a2a2e] space-y-2">
                  <p className="text-sm text-gray-300 mt-3">{oc.descricao}</p>
                  {oc.gravidade && (
                    <p className="text-xs text-gray-400"><span className="text-gray-500">Gravidade:</span> {oc.gravidade}</p>
                  )}
                  {oc.testemunhas && (
                    <p className="text-xs text-gray-400"><span className="text-gray-500">Testemunhas:</span> {oc.testemunhas}</p>
                  )}
                  {oc.providencia && (
                    <p className="text-xs text-gray-400"><span className="text-gray-500">Providência:</span> {oc.providencia}</p>
                  )}
                  {oc.cidAfastamento && (
                    <p className="text-xs text-gray-400"><span className="text-gray-500">CID:</span> {oc.cidAfastamento}</p>
                  )}
                  {(oc.dataInicioAfastamento || oc.dataFimAfastamento) && (
                    <p className="text-xs text-gray-400">
                      <span className="text-gray-500">Afastamento:</span>{' '}
                      {oc.dataInicioAfastamento && new Date(oc.dataInicioAfastamento).toLocaleDateString('pt-BR')}
                      {' → '}
                      {oc.dataFimAfastamento && new Date(oc.dataFimAfastamento).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Registrado por: {oc.registradoPor}</p>

                  <div className="flex gap-2 mt-3">
                    {confirmDelete === oc.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(oc.id)}
                          disabled={deletingId === oc.id}
                          className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-400"
                        >
                          {deletingId === oc.id ? '...' : 'Confirmar exclusão'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 text-xs bg-[#2a2a2e] text-gray-400 rounded-lg"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(oc.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#2a2a2e] text-red-400 rounded-lg hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showDrawer && (
        <DrawerOcorrencia
          funcionarioId={funcionarioId}
          registradoPor={registradoPor}
          onClose={() => setShowDrawer(false)}
          onSuccess={fetchOcorrencias}
        />
      )}
    </div>
  );
}
