'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, ExternalLink, Trash2, AlertTriangle, CheckCircle,
  ChevronDown, ChevronRight, Loader2,
} from 'lucide-react';
import DrawerDocumento from './DrawerDocumento';

interface Documento {
  id: string;
  tipo: string;
  nome: string;
  url: string;
  tamanhoBytes: number | null;
  dataVencimento: string | null;
  mesReferencia: number | null;
  anoReferencia: number | null;
  observacoes: string | null;
  uploadadoPor: string;
  createdAt: string;
}

const TIPO_LABELS: Record<string, string> = {
  contrato_experiencia_45: 'Contrato Exp. 45d',
  contrato_experiencia_90: 'Contrato Exp. 90d',
  contrato_efetivacao: 'Contrato Efetivação',
  termo_admissao: 'Termo de Admissão',
  exame_admissional: 'Exame Admissional',
  exame_periodico: 'Exame Periódico',
  exame_demissional: 'Exame Demissional',
  ctps_digital: 'CTPS Digital',
  comprovante_residencia: 'Comp. Residência',
  rg_cpf: 'RG/CPF',
  foto_3x4: 'Foto 3x4',
  ficha_registro: 'Ficha de Registro',
  advertencia: 'Advertência',
  suspensao: 'Suspensão',
  holerite: 'Holerite',
  ferias_aviso: 'Aviso de Férias',
  ferias_recibo: 'Recibo de Férias',
  rescisao: 'Rescisão',
  outros: 'Outros',
};

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const DOCS_OBRIGATORIOS: { tipo: string; label: string }[] = [
  { tipo: 'contrato_experiencia_45', label: 'Contrato Exp. 45d' },
  { tipo: 'termo_admissao', label: 'Termo de Admissão' },
  { tipo: 'exame_admissional', label: 'Exame Admissional' },
  { tipo: 'rg_cpf', label: 'RG/CPF' },
  { tipo: 'foto_3x4', label: 'Foto 3x4' },
  { tipo: 'comprovante_residencia', label: 'Comp. Residência' },
];

function vencimentoStatus(dataVencimento: string | null): 'vencido' | 'proximo' | null {
  if (!dataVencimento) return null;
  const diff = (new Date(dataVencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'vencido';
  if (diff <= 30) return 'proximo';
  return null;
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface Props {
  funcionarioId: string;
  uploadadoPor: string;
}

export default function DocumentosTab({ funcionarioId, uploadadoPor }: Props) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [anosExpandidos, setAnosExpandidos] = useState<Set<number>>(new Set());

  const fetchDocumentos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rh/funcionarios/${funcionarioId}/documentos`);
      if (res.ok) setDocumentos(await res.json());
    } finally {
      setLoading(false);
    }
  }, [funcionarioId]);

  useEffect(() => { fetchDocumentos(); }, [fetchDocumentos]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/rh/documentos/${id}`, { method: 'DELETE' });
      setDocumentos((d) => d.filter((doc) => doc.id !== id));
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const tiposPresentes = new Set(documentos.map((d) => d.tipo));
  const docsFaltando = DOCS_OBRIGATORIOS.filter((d) => !tiposPresentes.has(d.tipo));

  const holerites = documentos.filter((d) => d.tipo === 'holerite');
  const outrosDocs = documentos.filter((d) => d.tipo !== 'holerite');

  const holéritesPorAno = holerites.reduce<Record<number, Documento[]>>((acc, h) => {
    const ano = h.anoReferencia ?? new Date(h.createdAt).getFullYear();
    acc[ano] = [...(acc[ano] ?? []), h];
    return acc;
  }, {});

  const toggleAno = (ano: number) => {
    setAnosExpandidos((prev) => {
      const next = new Set(prev);
      next.has(ano) ? next.delete(ano) : next.add(ano);
      return next;
    });
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
      {/* Checklist de obrigatórios */}
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          Documentos Obrigatórios
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DOCS_OBRIGATORIOS.map((doc) => {
            const presente = tiposPresentes.has(doc.tipo);
            return (
              <div
                key={doc.tipo}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                  presente
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {presente ? (
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                {doc.label}
              </div>
            );
          })}
        </div>
        {docsFaltando.length > 0 && (
          <p className="text-xs text-red-400 mt-3">
            {docsFaltando.length} documento(s) obrigatório(s) faltando
          </p>
        )}
      </div>

      {/* Botão adicionar */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowDrawer(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black text-sm font-bold rounded-xl hover:bg-amber-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar Documento
        </button>
      </div>

      {/* Lista de documentos (não holerites) */}
      {outrosDocs.length > 0 && (
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-[#2a2a2e] text-xs font-medium text-gray-500 uppercase tracking-wider">
            <span className="col-span-3">Tipo</span>
            <span className="col-span-3">Arquivo</span>
            <span className="col-span-2 text-center">Enviado em</span>
            <span className="col-span-2 text-center">Vencimento</span>
            <span className="col-span-2 text-right">Ações</span>
          </div>
          {outrosDocs.map((doc) => {
            const vs = vencimentoStatus(doc.dataVencimento);
            return (
              <div key={doc.id} className="grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-[#2a2a2e] last:border-0 items-center hover:bg-[#222224]">
                <span className="col-span-3 text-sm text-white">{TIPO_LABELS[doc.tipo] ?? doc.tipo}</span>
                <div className="col-span-3">
                  <p className="text-xs text-gray-300 truncate">{doc.nome}</p>
                  {doc.tamanhoBytes && <p className="text-xs text-gray-500">{formatBytes(doc.tamanhoBytes)}</p>}
                </div>
                <span className="col-span-2 text-xs text-gray-400 text-center">
                  {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                </span>
                <div className="col-span-2 text-center">
                  {doc.dataVencimento ? (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      vs === 'vencido'
                        ? 'bg-red-500/15 text-red-400'
                        : vs === 'proximo'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'text-gray-400'
                    }`}>
                      {new Date(doc.dataVencimento).toLocaleDateString('pt-BR')}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-xs">—</span>
                  )}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-[#2a2a2e] flex items-center justify-center hover:bg-[#3a3a3e] transition-colors"
                    title="Visualizar"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                  {confirmDelete === doc.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-400"
                      >
                        {deletingId === doc.id ? '...' : 'Sim'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 text-xs bg-[#2a2a2e] text-gray-400 rounded-lg hover:bg-[#3a3a3e]"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(doc.id)}
                      className="w-7 h-7 rounded-lg bg-[#2a2a2e] flex items-center justify-center hover:bg-red-500/20 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Holerites agrupados por ano */}
      {Object.keys(holéritesPorAno).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Holerites</h3>
          <div className="space-y-2">
            {Object.entries(holéritesPorAno)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([ano, docs]) => (
                <div key={ano} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleAno(Number(ano))}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#222224] transition-colors"
                  >
                    <span className="text-sm font-semibold text-white">{ano}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{docs.length} holerite(s)</span>
                      {anosExpandidos.has(Number(ano)) ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  {anosExpandidos.has(Number(ano)) && (
                    <div className="border-t border-[#2a2a2e]">
                      {docs
                        .sort((a, b) => (b.mesReferencia ?? 0) - (a.mesReferencia ?? 0))
                        .map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a2e] last:border-0 hover:bg-[#222224]"
                          >
                            <div>
                              <p className="text-sm text-white">
                                {doc.mesReferencia ? MESES[doc.mesReferencia - 1] : ''}/{ano}
                              </p>
                              <p className="text-xs text-gray-500">{doc.nome}</p>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-7 h-7 rounded-lg bg-[#2a2a2e] flex items-center justify-center hover:bg-[#3a3a3e]"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                              </a>
                              <button
                                onClick={() => setConfirmDelete(doc.id)}
                                className="w-7 h-7 rounded-lg bg-[#2a2a2e] flex items-center justify-center hover:bg-red-500/20"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {documentos.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum documento enviado ainda.</p>
        </div>
      )}

      {showDrawer && (
        <DrawerDocumento
          funcionarioId={funcionarioId}
          uploadadoPor={uploadadoPor}
          onClose={() => setShowDrawer(false)}
          onSuccess={fetchDocumentos}
        />
      )}
    </div>
  );
}
