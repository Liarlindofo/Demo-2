'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useLoja } from '@/contexts/LojaContext';
import {
  Clock,
  AlertTriangle,
  MapPin,
  Calendar,
  RefreshCw,
  Link2,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  Download,
  X,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RegistroPonto {
  id: string;
  data: string;
  entrada1: string | null;
  saida1: string | null;
  entrada2: string | null;
  saida2: string | null;
  entrada3: string | null;
  saida3: string | null;
  compensado: boolean;
  neutro: boolean;
  folga: boolean;
  observacoes: string | null;
  funcionario: {
    id: string;
    nome: string;
    lojaId: string | null;
    loja: { id: string; nome: string } | null;
  };
}

interface PendenciaResumo {
  numeroFolhaOrigem: string;
  count: number;
  nomeSugerido: string | null;
}

interface Loja {
  id: string;
  nome: string;
  ativo: boolean;
}

interface FechamentoLinha {
  id: string;
  funcionarioId: string;
  funcionario: { id: string; nome: string; loja: { nome: string } | null };
  ex60: string | null;
  ex100: string | null;
  en60: string | null;
  en100: string | null;
  atraso: string | null;
  faltas: string | null;
  faltaDsr: string | null;
  valeTransporte: string | null;
  descDiversos: string | null;
  descRefeicao: string | null;
  descCompras: string | null;
  status: string; // pendente | aprovado | rejeitado
  observacao: string | null;
  origemErro: string | null;
}

interface FechamentoMensal {
  id: string;
  mes: number;
  ano: number;
  status: string;
  linhas: FechamentoLinha[];
}

type Aba = 'registros' | 'pendencias' | 'relatorio';

// ─── Helpers ────────────────────────────────────────────────────────────────

const inputCls =
  'bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors';

const cellCls = 'px-3 py-2.5 text-sm text-gray-200 whitespace-nowrap';
const headCls = 'px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide text-left whitespace-nowrap';

function Badge({ label, color }: { label: string; color: 'amber' | 'blue' | 'green' }) {
  const cls = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
  }[color];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

function Horario({ value }: { value: string | null }) {
  if (!value) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <span className="font-mono text-xs font-semibold text-white bg-[#2a2a2e] px-2 py-0.5 rounded-lg">
      {value}
    </span>
  );
}

function mesLabel(mes: number, ano: number) {
  return new Date(ano, mes - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

// ─── Tabela de Registros (Fase 6) ───────────────────────────────────────────

function TabelaRegistros({ registros }: { registros: RegistroPonto[] }) {
  if (registros.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <Clock className="w-10 h-10 text-gray-700 mb-3" />
        <p className="text-gray-400 font-medium">Nenhum registro de ponto</p>
        <p className="text-sm text-gray-600 mt-1">
          Nenhum dado recebido do Secullum para esta seleção.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-[#2a2a2e] bg-[#111113]">
          <tr>
            <th className={headCls}>Funcionário</th>
            <th className={headCls}>Loja</th>
            <th className={headCls}>E1</th>
            <th className={headCls}>S1</th>
            <th className={headCls}>E2</th>
            <th className={headCls}>S2</th>
            <th className={headCls}>E3</th>
            <th className={headCls}>S3</th>
            <th className={headCls}>Status</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((r, i) => (
            <tr
              key={r.id}
              className={`border-b border-[#2a2a2e] last:border-0 ${
                i % 2 === 0 ? '' : 'bg-[#111113]/60'
              }`}
            >
              <td className={`${cellCls} font-medium text-white`}>{r.funcionario.nome}</td>
              <td className={`${cellCls} text-gray-400`}>
                {r.funcionario.loja?.nome ?? <span className="text-gray-600 text-xs">—</span>}
              </td>
              <td className={cellCls}><Horario value={r.entrada1} /></td>
              <td className={cellCls}><Horario value={r.saida1} /></td>
              <td className={cellCls}><Horario value={r.entrada2} /></td>
              <td className={cellCls}><Horario value={r.saida2} /></td>
              <td className={cellCls}><Horario value={r.entrada3} /></td>
              <td className={cellCls}><Horario value={r.saida3} /></td>
              <td className={`${cellCls}`}>
                <div className="flex flex-wrap gap-1">
                  {r.folga && <Badge label="Folga" color="green" />}
                  {r.compensado && <Badge label="Compensado" color="blue" />}
                  {r.neutro && <Badge label="Neutro" color="amber" />}
                  {!r.folga && !r.compensado && !r.neutro && (
                    <span className="text-gray-600 text-xs">—</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Linha editável do Fechamento (Fase 9) ───────────────────────────────────

interface LinhaEditada {
  ex60: string;
  ex100: string;
  en60: string;
  en100: string;
  atraso: string;
  faltas: string;
  faltaDsr: string;
  valeTransporte: string;
  descDiversos: string;
  descRefeicao: string;
  descCompras: string;
}

function initEdits(linha: FechamentoLinha): LinhaEditada {
  return {
    ex60: linha.ex60 ?? '',
    ex100: linha.ex100 ?? '',
    en60: linha.en60 ?? '',
    en100: linha.en100 ?? '',
    atraso: linha.atraso ?? '',
    faltas: linha.faltas ?? '',
    faltaDsr: linha.faltaDsr ?? '',
    valeTransporte: linha.valeTransporte ?? '',
    descDiversos: linha.descDiversos ?? '',
    descRefeicao: linha.descRefeicao ?? '',
    descCompras: linha.descCompras ?? '',
  };
}

function FechamentoLinhaRow({
  linha,
  fechamentoId,
  onUpdated,
}: {
  linha: FechamentoLinha;
  fechamentoId: string;
  onUpdated: (updated: FechamentoLinha) => void;
}) {
  const [edits, setEdits] = useState<LinhaEditada>(() => initEdits(linha));
  const [saving, setSaving] = useState(false);
  const [rejeitandoObs, setRejeitandoObs] = useState(false);
  const [obsText, setObsText] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setField = (field: keyof LinhaEditada, value: string) => {
    const next = { ...edits, [field]: value };
    setEdits(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => patchLinha(next, undefined), 800);
  };

  const patchLinha = async (data: Partial<LinhaEditada>, statusOverride?: string, obs?: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pontos/fechamento/${fechamentoId}/linhas/${linha.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          ...(statusOverride !== undefined ? { status: statusOverride } : {}),
          ...(obs !== undefined ? { observacao: obs } : {}),
        }),
      });
      if (res.ok) {
        const updated: FechamentoLinha = await res.json();
        onUpdated(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAprovar = () => patchLinha(edits, 'aprovado');
  const handleRejeitar = () => {
    if (!obsText.trim()) return;
    patchLinha(edits, 'rejeitado', obsText.trim());
    setRejeitandoObs(false);
    setObsText('');
  };

  const fieldInput = (field: keyof LinhaEditada, placeholder = '') => (
    <input
      className="w-[72px] bg-[#0a0a0a] border border-[#2a2a2e] rounded-lg px-2 py-1 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-amber-500/50"
      value={edits[field]}
      placeholder={placeholder}
      onChange={(e) => setField(field, e.target.value)}
    />
  );

  const statusIcon = () => {
    if (linha.status === 'aprovado') return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (linha.status === 'rejeitado') return <XCircle className="w-4 h-4 text-red-400" />;
    return <AlertCircle className="w-4 h-4 text-amber-400" />;
  };

  return (
    <>
      <tr
        className={`border-b border-[#2a2a2e] last:border-0 ${
          linha.origemErro ? 'bg-red-500/5' : ''
        }`}
        title={linha.origemErro ?? undefined}
      >
        <td className={`${cellCls} font-medium text-white sticky left-0 bg-[#111113]`}>
          <div className="flex flex-col">
            <span>{linha.funcionario.nome}</span>
            {linha.funcionario.loja && (
              <span className="text-[10px] text-gray-500">{linha.funcionario.loja.nome}</span>
            )}
            {linha.origemErro && (
              <span className="text-[10px] text-red-400 mt-0.5 truncate max-w-[140px]" title={linha.origemErro}>
                ⚠ {linha.origemErro}
              </span>
            )}
          </div>
        </td>
        <td className={cellCls}>{fieldInput('ex60', '00:00')}</td>
        <td className={cellCls}>{fieldInput('ex100', '00:00')}</td>
        <td className={cellCls}>{fieldInput('en60', '00:00')}</td>
        <td className={cellCls}>{fieldInput('en100', '00:00')}</td>
        <td className={cellCls}>{fieldInput('atraso', '00:00')}</td>
        <td className={cellCls}>{fieldInput('faltas', '00:00')}</td>
        <td className={cellCls}>{fieldInput('faltaDsr', '00:00')}</td>
        <td className={cellCls}>{fieldInput('valeTransporte', '0,00')}</td>
        <td className={cellCls}>{fieldInput('descDiversos', '0,00')}</td>
        <td className={cellCls}>{fieldInput('descRefeicao', '0,00')}</td>
        <td className={cellCls}>{fieldInput('descCompras', '0,00')}</td>
        <td className={cellCls}>
          <div className="flex items-center gap-1">
            {statusIcon()}
            <span className="text-xs capitalize text-gray-400">{linha.status}</span>
            {saving && <Loader2 className="w-3 h-3 text-gray-600 animate-spin" />}
          </div>
          {linha.observacao && (
            <p className="text-[10px] text-gray-500 mt-0.5 max-w-[120px] truncate" title={linha.observacao}>
              {linha.observacao}
            </p>
          )}
        </td>
        <td className={cellCls}>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleAprovar}
              disabled={linha.status === 'aprovado' || saving}
              className="px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Aprovar
            </button>
            <button
              type="button"
              onClick={() => setRejeitandoObs(true)}
              disabled={linha.status === 'rejeitado' || saving}
              className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Rejeitar
            </button>
          </div>
        </td>
      </tr>
      {rejeitandoObs && (
        <tr className="bg-[#1a1a1e]">
          <td colSpan={14} className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Motivo da rejeição (obrigatório):</span>
              <input
                className="flex-1 bg-[#0a0a0a] border border-red-500/40 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500"
                placeholder="Ex.: PIS inválido, erro no cálculo..."
                value={obsText}
                onChange={(e) => setObsText(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={handleRejeitar}
                disabled={!obsText.trim()}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold disabled:opacity-40"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setRejeitandoObs(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Aba Relatório (Fase 9) ──────────────────────────────────────────────────

function AbaRelatorio() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [mes, setMes] = useState(mesAtual);
  const [ano, setAno] = useState(anoAtual);
  const [gerando, setGerando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [fechamento, setFechamento] = useState<FechamentoMensal | null>(null);
  const [loadingFechamento, setLoadingFechamento] = useState(false);
  const [erroGerar, setErroGerar] = useState<string | null>(null);

  const fetchFechamento = useCallback(async (m: number, a: number) => {
    setLoadingFechamento(true);
    setErroGerar(null);
    try {
      const res = await fetch(`/api/pontos/fechamento?mes=${m}&ano=${a}`);
      if (res.ok) {
        const data = await res.json();
        setFechamento(data.fechamento ?? null);
      } else {
        setFechamento(null);
      }
    } finally {
      setLoadingFechamento(false);
    }
  }, []);

  useEffect(() => {
    fetchFechamento(mes, ano);
  }, [mes, ano, fetchFechamento]);

  const handleGerar = async () => {
    setGerando(true);
    setErroGerar(null);
    try {
      const res = await fetch('/api/pontos/fechamento/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes, ano }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErroGerar(data.error ?? 'Erro ao gerar fechamento.');
        return;
      }
      await fetchFechamento(mes, ano);
    } finally {
      setGerando(false);
    }
  };

  const handleExportar = async () => {
    if (!fechamento) return;
    const pendentes = fechamento.linhas.filter((l) => l.status === 'pendente').length;
    if (pendentes > 0) {
      const ok = window.confirm(
        `${pendentes} de ${fechamento.linhas.length} funcionário(s) ainda não foram revisados.\nDeseja continuar e gerar a planilha mesmo assim?`,
      );
      if (!ok) return;
    }
    setExportando(true);
    try {
      const res = await fetch(`/api/pontos/fechamento/${fechamento.id}/exportar`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? 'Erro ao exportar planilha.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fechamento-${String(mes).padStart(2, '0')}-${ano}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      // Recarrega para atualizar status concluido
      await fetchFechamento(mes, ano);
    } finally {
      setExportando(false);
    }
  };

  const onLinhaUpdated = (updated: FechamentoLinha) => {
    setFechamento((prev) =>
      prev
        ? { ...prev, linhas: prev.linhas.map((l) => (l.id === updated.id ? updated : l)) }
        : prev,
    );
  };

  const semPis = fechamento
    ? (fechamento as any).funcionariosSemPis as Array<{ id: string; nome: string }> ?? []
    : [];

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const anos = Array.from({ length: 4 }, (_, i) => anoAtual - 1 + i);

  return (
    <div className="space-y-5">
      {/* Seletor mês/ano + botão gerar */}
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Mês</label>
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className={inputCls}
          >
            {meses.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Ano</label>
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className={inputCls}
          >
            {anos.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleGerar}
          disabled={gerando || loadingFechamento}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors"
        >
          {gerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          {fechamento ? 'Regerar Fechamento' : 'Gerar Fechamento'}
        </button>
        {fechamento && (
          <button
            type="button"
            onClick={handleExportar}
            disabled={exportando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold hover:bg-green-500/30 disabled:opacity-50 transition-colors"
          >
            {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Gerar Planilha (.xlsx)
          </button>
        )}
        {fechamento && (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-lg border font-medium ${
                fechamento.status === 'concluido'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              {fechamento.status}
            </span>
          </div>
        )}
      </div>

      {erroGerar && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
          {erroGerar}
        </div>
      )}

      {/* Aviso funcionários sem PIS */}
      {semPis.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-amber-400 font-medium">
              {semPis.length} funcionário(s) sem PIS do Secullum — não aparecem neste fechamento:
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {semPis.map((f) => f.nome).join(', ')}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Eles aparecerão automaticamente após registrarem o primeiro ponto.
            </p>
          </div>
        </div>
      )}

      {loadingFechamento && !fechamento && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      )}

      {!loadingFechamento && !fechamento && !gerando && (
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl flex flex-col items-center justify-center py-16 text-center px-4">
          <FileSpreadsheet className="w-10 h-10 text-gray-700 mb-3" />
          <p className="text-gray-400 font-medium">Nenhum fechamento para {mesLabel(mes, ano)}</p>
          <p className="text-sm text-gray-600 mt-1">
            Clique em "Gerar Fechamento" para consultar o Secullum e montar a tabela de revisão.
          </p>
        </div>
      )}

      {fechamento && fechamento.linhas.length > 0 && (
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
          {/* Sumário */}
          <div className="px-4 py-3 border-b border-[#2a2a2e] flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-white">{mesLabel(mes, ano)}</span>
            <span className="text-xs text-gray-500">
              {fechamento.linhas.length} funcionário(s)
            </span>
            <span className="text-xs text-green-400">
              {fechamento.linhas.filter((l) => l.status === 'aprovado').length} aprovados
            </span>
            <span className="text-xs text-amber-400">
              {fechamento.linhas.filter((l) => l.status === 'pendente').length} pendentes
            </span>
            {fechamento.linhas.filter((l) => l.status === 'rejeitado').length > 0 && (
              <span className="text-xs text-red-400">
                {fechamento.linhas.filter((l) => l.status === 'rejeitado').length} rejeitados
              </span>
            )}
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#2a2a2e] bg-[#111113]">
                <tr>
                  <th className={`${headCls} sticky left-0 bg-[#111113]`}>Funcionário</th>
                  <th className={headCls} title="Código 37">HE 60% Diurna</th>
                  <th className={headCls} title="Código 49">HE 100% Diurna</th>
                  <th className={headCls} title="Código 38">HE 60% Noturna</th>
                  <th className={headCls} title="Código 50">HE 100% Noturna</th>
                  <th className={headCls} title="Código 29">Atraso</th>
                  <th className={headCls} title="Código 23">Horas Faltas</th>
                  <th className={headCls} title="Código 25">Horas Falta DSR</th>
                  <th className={headCls} title="Código 816">Vale Transporte</th>
                  <th className={headCls} title="Código 814">Desc Diversos</th>
                  <th className={headCls} title="Código 813">Desc. Refeição</th>
                  <th className={headCls} title="Código 1199">Desc. Compras</th>
                  <th className={headCls}>Status</th>
                  <th className={headCls}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {fechamento.linhas.map((linha) => (
                  <FechamentoLinhaRow
                    key={linha.id}
                    linha={linha}
                    fechamentoId={fechamento.id}
                    onUpdated={onLinhaUpdated}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function PontosPage() {
  const { lojas, lojaSelecionada } = useLoja();

  const [aba, setAba] = useState<Aba>('registros');
  const [lojaId, setLojaId] = useState<string>('');
  const [data, setData] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [pendencias, setPendencias] = useState<PendenciaResumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPontos = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ data });
      if (lojaId) params.set('loja', lojaId);
      const res = await fetch(`/api/pontos?${params}`);
      if (res.ok) {
        const d = await res.json();
        setRegistros(d.registros ?? []);
        setPendencias(d.pendencias ?? []);
        setLastUpdated(new Date());
      }
    } catch {
      /* silently fail */
    } finally {
      if (!silent) setLoading(false);
    }
  }, [data, lojaId]);

  // Carga inicial
  useEffect(() => {
    fetchPontos();
  }, [fetchPontos]);

  // Poll a cada 60 segundos (aba registros ou pendências)
  useEffect(() => {
    if (aba === 'relatorio') return;
    const id = setInterval(() => fetchPontos(true), 60_000);
    return () => clearInterval(id);
  }, [aba, fetchPontos]);

  useEffect(() => {
    if (lojaSelecionada && !lojaId) setLojaId(lojaSelecionada.id);
  }, [lojaSelecionada, lojaId]);

  const hoje = new Date().toISOString().split('T')[0];
  const dataFormatada = new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-500" />
              Pontos
            </h1>
            {aba !== 'relatorio' && (
              <p className="text-sm text-gray-400 capitalize mt-0.5">{dataFormatada}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && aba !== 'relatorio' && (
              <span className="text-xs text-gray-600">
                Atualizado {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => fetchPontos()}
              disabled={loading || aba === 'relatorio'}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-sm text-gray-300 hover:bg-[#2a2a2e] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Filtros (só nas abas de registros/pendências) */}
        {aba !== 'relatorio' && (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Loja
                </label>
                <select
                  value={lojaId}
                  onChange={(e) => setLojaId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Todas as lojas</option>
                  {(lojas as Loja[]).map((l) => (
                    <option key={l.id} value={l.id}>{l.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Data
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className={`${inputCls} flex-1`}
                  />
                  {data !== hoje && (
                    <button
                      onClick={() => setData(hoje)}
                      className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                    >
                      Hoje
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-1 mb-4 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl p-1">
          {(['registros', 'pendencias', 'relatorio'] as Aba[]).map((a) => {
            const active = aba === a;
            const label = a === 'registros' ? 'Registros' : a === 'pendencias' ? 'Pendências' : 'Relatório';
            const Icon = a === 'registros' ? Clock : a === 'pendencias' ? AlertTriangle : FileSpreadsheet;
            const count = a === 'registros' ? registros.length : a === 'pendencias' ? pendencias.length : null;
            return (
              <button
                key={a}
                onClick={() => setAba(a)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 inline mr-1.5" />
                {label}
                {count !== null && count > 0 && (
                  <span
                    className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      active
                        ? 'bg-black/20 text-black'
                        : a === 'pendencias'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-[#2a2a2e] text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Conteúdo */}
        {aba === 'relatorio' ? (
          <AbaRelatorio />
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : aba === 'registros' ? (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
            {registros.length > 0 && (
              <div className="px-4 py-3 border-b border-[#2a2a2e]">
                <span className="text-xs text-gray-500">
                  {registros.length} funcionário{registros.length !== 1 ? 's' : ''}
                  {' · '}poll automático a cada 60s
                </span>
              </div>
            )}
            <TabelaRegistros registros={registros} />
          </div>
        ) : (
          /* Aba Pendências */
          <div className="space-y-3">
            {pendencias.length === 0 ? (
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl flex flex-col items-center justify-center py-16 text-center px-4">
                <AlertTriangle className="w-10 h-10 text-gray-700 mb-3" />
                <p className="text-gray-400 font-medium">Sem pendências</p>
                <p className="text-sm text-gray-600 mt-1">
                  Todas as matrículas recebidas estão vinculadas a funcionários.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400">
                    As matrículas abaixo foram recebidas do Secullum mas não correspondem a nenhum
                    funcionário cadastrado. Acesse o mapeamento para vinculá-las.
                  </p>
                </div>
                {pendencias.map((p) => (
                  <div
                    key={p.numeroFolhaOrigem}
                    className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-sm font-semibold text-white">
                          Folha #{p.numeroFolhaOrigem}
                        </span>
                        <span className="text-xs text-gray-500 bg-[#2a2a2e] px-2 py-0.5 rounded-full">
                          {p.count} registro{p.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {p.nomeSugerido && (
                        <p className="text-xs text-gray-400 mt-1 ml-6">
                          Nome: <span className="text-amber-400">{p.nomeSugerido}</span>
                        </p>
                      )}
                    </div>
                    <Link
                      href="/rh/mapeamento-ponto"
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                    >
                      Mapear →
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
