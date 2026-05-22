'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Bell, AlertTriangle, Calendar, Gift, History,
  ChevronDown, ChevronUp, Clock, CheckCircle, RefreshCw,
} from 'lucide-react';

interface FuncionarioBasico {
  id: string;
  nome: string;
  loja: { id: string; nome: string };
  cargo: { id: string; nome: string };
}

interface AlertaExperiencia {
  funcionario: FuncionarioBasico;
  dataAdmissao: string;
  dataFimExperiencia1: string | null;
  dataFimExperiencia2: string | null;
  diasParaVenc1: number | null;
  diasParaVenc2: number | null;
  urgencia: 'critico' | 'atencao';
}

interface AlertaFerias {
  funcionario: FuncionarioBasico;
  dataInicioFerias: string;
  dataGozoFerias: string | null;
  vencimentoAquisitivo: string;
  diasParaVencimento: number;
  statusFerias: string | null;
  diasFeriasGozados: number | null;
  urgencia: 'vencido' | 'critico' | 'atencao';
}

interface Aniversariante {
  funcionario: FuncionarioBasico;
  dataNascimento: string;
  diaAniversario: number;
  idade: number;
  jaPassou: boolean;
}

interface Historico {
  id: string;
  createdAt: string;
  funcionarioId: string;
  campo: string;
  valorAnterior: string;
  valorNovo: string;
  alteradoPor: string;
  motivo: string | null;
}

interface AlertasData {
  resumo: { totalCriticos: number; totalFeriasVencidas: number; totalExperienciaMes: number };
  alertasExperiencia: AlertaExperiencia[];
  alertasFerias: AlertaFerias[];
  aniversariantesMes: Aniversariante[];
}

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

function BadgeUrgencia({ urgencia }: { urgencia: string }) {
  if (urgencia === 'vencido')
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">VENCIDO</span>;
  if (urgencia === 'critico')
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">≤ 7 dias</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">≤ 15 dias</span>;
}

function Section({
  title, icon: Icon, count, color, children, defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#111113] border border-[#2a2a2e] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#1a1a1c] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-semibold text-white text-sm">{title}</span>
          <span className="px-2 py-0.5 rounded-full bg-[#2a2a2e] text-gray-400 text-xs font-medium">
            {count}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="border-t border-[#2a2a2e]">{children}</div>}
    </div>
  );
}

const CAMPO_LABELS: Record<string, string> = {
  salarioBruto: 'Salário',
  cargoId: 'Cargo',
  lojaId: 'Loja',
  escala: 'Escala',
  turno: 'Turno',
  ativo: 'Status',
};

export default function AlertasPage() {
  const router = useRouter();
  const [data, setData] = useState<AlertasData | null>(null);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [programarFeriasId, setProgramarFeriasId] = useState<string | null>(null);
  const [dataGozo, setDataGozo] = useState('');
  const [salvandoFerias, setSalvandoFerias] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rh/alertas');
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistorico = useCallback(async () => {
    setLoadingHistorico(true);
    try {
      // Buscar últimas alterações de todos os funcionários via endpoint
      const res = await fetch('/api/rh/alertas/historico-recente');
      if (res.ok) setHistorico(await res.json());
    } finally {
      setLoadingHistorico(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  // Histórico recente — carregado separado
  useEffect(() => { fetchHistorico(); }, [fetchHistorico]);

  const handleProgramarFerias = async (funcionarioId: string) => {
    if (!dataGozo) { showToast('Informe a data de início do gozo'); return; }
    setSalvandoFerias(true);
    try {
      const res = await fetch(`/api/rh/funcionarios/${funcionarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataGozoFerias: dataGozo, statusFerias: 'a_gozar' }),
      });
      if (res.ok) {
        showToast('Férias programadas com sucesso');
        setProgramarFeriasId(null);
        setDataGozo('');
        fetchData();
      }
    } finally {
      setSalvandoFerias(false);
    }
  };

  const handleEfetivar = async (funcionarioId: string) => {
    const res = await fetch(`/api/rh/funcionarios/${funcionarioId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusFerias: 'gozadas', motivo: 'Período de experiência encerrado' }),
    });
    if (res.ok) { showToast('Funcionário efetivado'); fetchData(); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-[#1c1c1e] rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <div key={i} className="h-24 bg-[#1c1c1e] rounded-2xl" />)}
          </div>
          {[0, 1, 2].map(i => <div key={i} className="h-40 bg-[#1c1c1e] rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const { resumo, alertasExperiencia, alertasFerias, aniversariantesMes } = data ?? {
    resumo: { totalCriticos: 0, totalFeriasVencidas: 0, totalExperienciaMes: 0 },
    alertasExperiencia: [],
    alertasFerias: [],
    aniversariantesMes: [],
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white shadow-xl z-50">
          {toast}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/rh')}
              className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-amber-400" />
                Vencimentos e Alertas
              </h1>
              <p className="text-sm text-gray-400">Monitoramento de prazos críticos</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-gray-400 text-sm hover:bg-[#2a2a2e] transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1c1c1e] border border-red-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Alertas Críticos</p>
            </div>
            <p className="text-3xl font-bold text-red-400">{resumo.totalCriticos}</p>
            <p className="text-xs text-gray-500 mt-1">vencendo em ≤ 7 dias</p>
          </div>
          <div className="bg-[#1c1c1e] border border-amber-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Férias Vencidas</p>
            </div>
            <p className="text-3xl font-bold text-amber-400">{resumo.totalFeriasVencidas}</p>
            <p className="text-xs text-gray-500 mt-1">período aquisitivo expirado</p>
          </div>
          <div className="bg-[#1c1c1e] border border-blue-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Experiências</p>
            </div>
            <p className="text-3xl font-bold text-blue-400">{resumo.totalExperienciaMes}</p>
            <p className="text-xs text-gray-500 mt-1">vencendo este mês</p>
          </div>
        </div>

        {/* Seção 1: Experiência */}
        <Section
          title="Período de Experiência"
          icon={Clock}
          count={alertasExperiencia.length}
          color="bg-blue-500/10 text-blue-400"
        >
          {alertasExperiencia.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">Nenhum vencimento nos próximos 15 dias</div>
          ) : (
            <div className="divide-y divide-[#2a2a2e]">
              {alertasExperiencia.map((a) => (
                <div key={a.funcionario.id} className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white text-sm">{a.funcionario.nome}</span>
                      <BadgeUrgencia urgencia={a.urgencia} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {a.funcionario.loja.nome} • {a.funcionario.cargo.nome}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                      <span>Admissão: {fmtDate(a.dataAdmissao)}</span>
                      {a.dataFimExperiencia1 && (
                        <span className={a.diasParaVenc1 !== null && a.diasParaVenc1 <= 7 ? 'text-red-400' : 'text-amber-400'}>
                          45d: {fmtDate(a.dataFimExperiencia1)} ({a.diasParaVenc1}d)
                        </span>
                      )}
                      {a.dataFimExperiencia2 && (
                        <span className={a.diasParaVenc2 !== null && a.diasParaVenc2 <= 7 ? 'text-red-400' : 'text-amber-400'}>
                          90d: {fmtDate(a.dataFimExperiencia2)} ({a.diasParaVenc2}d)
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEfetivar(a.funcionario.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors flex-shrink-0"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Efetivado
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Seção 2: Férias */}
        <Section
          title="Controle de Férias"
          icon={Calendar}
          count={alertasFerias.length}
          color="bg-amber-500/10 text-amber-400"
        >
          {alertasFerias.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">Nenhuma férias vencendo nos próximos 60 dias</div>
          ) : (
            <div className="divide-y divide-[#2a2a2e]">
              {alertasFerias.map((a) => (
                <div key={a.funcionario.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white text-sm">{a.funcionario.nome}</span>
                        <BadgeUrgencia urgencia={a.urgencia} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{a.funcionario.loja.nome}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                        <span>Início aquisitivo: {fmtDate(a.dataInicioFerias)}</span>
                        <span className={a.urgencia !== 'atencao' ? 'text-red-400' : 'text-amber-400'}>
                          Vence: {fmtDate(a.vencimentoAquisitivo)} ({a.diasParaVencimento < 0 ? `${Math.abs(a.diasParaVencimento)}d atrás` : `em ${a.diasParaVencimento}d`})
                        </span>
                        {a.dataGozoFerias && <span>Gozo: {fmtDate(a.dataGozoFerias)}</span>}
                        <span>Gozados: {a.diasFeriasGozados ?? 0} dias</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setProgramarFeriasId(
                        programarFeriasId === a.funcionario.id ? null : a.funcionario.id
                      )}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors flex-shrink-0"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Programar gozo
                    </button>
                  </div>

                  {programarFeriasId === a.funcionario.id && (
                    <div className="flex items-center gap-3 bg-[#0a0a0a] rounded-xl p-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <label className="text-xs text-gray-400 whitespace-nowrap">Data início:</label>
                        <input
                          type="date"
                          value={dataGozo}
                          onChange={(e) => setDataGozo(e.target.value)}
                          className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setProgramarFeriasId(null); setDataGozo(''); }}
                          className="px-3 py-1.5 rounded-lg border border-[#2a2a2e] text-xs text-gray-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleProgramarFerias(a.funcionario.id)}
                          disabled={salvandoFerias}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 disabled:opacity-50"
                        >
                          {salvandoFerias ? 'Salvando...' : 'Salvar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Seção 3: Aniversários */}
        <Section
          title={`Aniversários do Mês`}
          icon={Gift}
          count={aniversariantesMes.length}
          color="bg-pink-500/10 text-pink-400"
          defaultOpen={false}
        >
          {aniversariantesMes.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">Nenhum aniversário este mês</div>
          ) : (
            <div className="divide-y divide-[#2a2a2e]">
              {aniversariantesMes.map((a) => (
                <div key={a.funcionario.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white text-sm">{a.funcionario.nome}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.funcionario.loja.nome}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-pink-400">Dia {a.diaAniversario}</p>
                    <p className="text-xs text-gray-500">{a.idade} anos {a.jaPassou ? '✓' : '🎂'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Seção 4: Histórico recente */}
        <Section
          title="Histórico de Alterações Recentes"
          icon={History}
          count={historico.length}
          color="bg-purple-500/10 text-purple-400"
          defaultOpen={false}
        >
          {loadingHistorico ? (
            <div className="divide-y divide-[#2a2a2e]">
              {[0, 1, 2].map(i => (
                <div key={i} className="px-5 py-3 flex gap-4 animate-pulse">
                  <div className="h-4 flex-1 bg-[#2a2a2e] rounded" />
                  <div className="h-4 w-20 bg-[#2a2a2e] rounded" />
                </div>
              ))}
            </div>
          ) : historico.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">Nenhuma alteração registrada</div>
          ) : (
            <div className="divide-y divide-[#2a2a2e]">
              {historico.map((h) => (
                <div key={h.id} className="px-5 py-3 flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="font-medium text-white">{CAMPO_LABELS[h.campo] ?? h.campo}</span>
                      <span className="text-gray-500 text-xs">{h.valorAnterior || '—'}</span>
                      <span className="text-gray-600 text-xs">→</span>
                      <span className="text-amber-400 text-xs font-medium">{h.valorNovo}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">por {h.alteradoPor}{h.motivo ? ` · ${h.motivo}` : ''}</p>
                  </div>
                  <p className="text-xs text-gray-600 flex-shrink-0">
                    {new Date(h.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
