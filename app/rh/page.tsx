'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLoja, Loja } from '@/contexts/LojaContext';
import {
  Users,
  DollarSign,
  Calendar,
  BarChart3,
  Bot,
  Clock,
  TrendingUp,
  Building2,
  ChevronRight,
  Bell,
  ClipboardList,
  FileText,
  ArrowRight,
  Gift,
  Bike,
} from 'lucide-react';

interface Funcionario {
  id: string;
  nome: string;
  salarioBruto: number;
  composicaoSalarial?: { baseCalculoEncargos: number; valorAlimentacao: number; valorVT: number; bonificacaoAssiduidade: number };
  escala: '6x1' | '5x2';
  ativo: boolean;
}

interface Stats {
  total: number;
  custoMensal: number;
  escala6x1: number;
  escala5x2: number;
}

interface AlertasResumo {
  totalCriticos: number;
  totalFeriasVencidas: number;
  totalExperienciaMes: number;
}

interface ComparativoResumo {
  totalIdeal: number;
  totalOk: number;
  totalGaps: number;
}

interface BonificacoesResumo {
  mesLabel: string;
  comAssiduidade: number;
  semAssiduidade: number;
  plrsTrimestre: number;
}

function LojaSelector({
  lojas,
  lojaSelecionada,
  setLojaSelecionada,
}: {
  lojas: Loja[];
  lojaSelecionada: Loja | null;
  setLojaSelecionada: (l: Loja | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => setLojaSelecionada(null)}
        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          lojaSelecionada === null
            ? 'bg-amber-500 text-black'
            : 'bg-[#2a2a2e] text-gray-300 hover:bg-[#3a3a3e]'
        }`}
      >
        Todas as lojas
      </button>
      {lojas.map((loja) => (
        <button
          key={loja.id}
          onClick={() => setLojaSelecionada(loja)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            lojaSelecionada?.id === loja.id
              ? 'bg-amber-500 text-black'
              : 'bg-[#2a2a2e] text-gray-300 hover:bg-[#3a3a3e]'
          }`}
        >
          {loja.nome}
        </button>
      ))}
    </div>
  );
}

const navItems = [
  {
    href: '/rh/funcionarios',
    icon: Users,
    label: 'Funcionários',
    description: 'Cadastro e gestão de colaboradores',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    href: '/rh/lojas',
    icon: Building2,
    label: 'Lojas',
    description: 'Cadastro e gestão de unidades',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    href: '/rh/custos',
    icon: DollarSign,
    label: 'Custos',
    description: 'Folha de pagamento e encargos',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    href: '/rh/escala',
    icon: Calendar,
    label: 'Escala',
    description: 'Grade semanal de turnos',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    href: '/rh/alertas',
    icon: Bell,
    label: 'Alertas',
    description: 'Vencimentos, férias e aniversários',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  {
    href: '/rh/quadro-ideal',
    icon: ClipboardList,
    label: 'Quadro Ideal',
    description: 'Estrutura ideal por setor',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  {
    href: '/rh/simulacao',
    icon: BarChart3,
    label: 'Simulador',
    description: 'Impacto da mudança 6x1 → 5x2',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    href: '/rh/ia',
    icon: Bot,
    label: 'IA Trabalhista',
    description: 'Consulte a legislação CLT',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    href: '/rh/funcionarios',
    icon: FileText,
    label: 'Documentos',
    description: 'Gestão de documentos por funcionário',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    href: '/rh/funcionarios',
    icon: ArrowRight,
    label: 'Transferências',
    description: 'Histórico de transferências entre lojas',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
  },
];

export default function RhDashboard() {
  const { lojas, lojaSelecionada, setLojaSelecionada, loading: lojaLoading } = useLoja();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [alertasResumo, setAlertasResumo] = useState<AlertasResumo | null>(null);
  const [comparativoResumo, setComparativoResumo] = useState<ComparativoResumo | null>(null);
  const [ocorrenciasMes, setOcorrenciasMes] = useState<number | null>(null);
  const [custoTotal, setCustoTotal] = useState<number | null>(null);
  const [transferenciasMes, setTransferenciasMes] = useState<number | null>(null);
  const [bonificacoesResumo, setBonificacoesResumo] = useState<BonificacoesResumo | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const params = new URLSearchParams({ ativo: 'true' });
        if (lojaSelecionada) params.set('lojaId', lojaSelecionada.id);
        const [funcsRes, custosRes] = await Promise.all([
          fetch(`/api/rh/funcionarios?${params}`),
          fetch('/api/rh/custos/consolidado'),
        ]);
        if (!funcsRes.ok) throw new Error('Falha ao carregar');
        const data: Funcionario[] = await funcsRes.json();
        const total = data.length;
        const escala6x1 = data.filter((f) => f.escala === '6x1').length;
        const escala5x2 = data.filter((f) => f.escala === '5x2').length;

        let custoMensal = 0;
        if (custosRes.ok) {
          const custosData = await custosRes.json();
          custoMensal = lojaSelecionada
            ? (custosData.lojas?.find((l: { lojaId: string; totalCustoReal: number }) => l.lojaId === lojaSelecionada.id)?.totalCustoReal ?? 0)
            : (custosData.rede?.totalCustoReal ?? 0);
          setCustoTotal(custoMensal > 0 ? custoMensal : null);
        }

        setStats({ total, custoMensal, escala6x1, escala5x2 });
      } catch {
        setStats({ total: 0, custoMensal: 0, escala6x1: 0, escala5x2: 0 });
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [lojaSelecionada]);

  useEffect(() => {
    fetch('/api/rh/bonificacoes/resumo')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setBonificacoesResumo(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/rh/alertas')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setAlertasResumo(d.resumo))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!lojaSelecionada) { setComparativoResumo(null); return; }
    fetch(`/api/rh/quadro-ideal/comparativo?lojaId=${lojaSelecionada.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setComparativoResumo(d.resumo))
      .catch(() => {});
  }, [lojaSelecionada]);

  useEffect(() => {
    const lojaParam = lojaSelecionada ? `?lojaId=${lojaSelecionada.id}` : '';
    fetch(`/api/rh/ocorrencias/resumo${lojaParam}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setOcorrenciasMes(d.totalMes))
      .catch(() => {});
  }, [lojaSelecionada]);

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-500" />
              </div>
              <h1 className="text-3xl font-bold text-white">Plateful RH</h1>
            </div>
            <p className="text-gray-400 ml-[52px]">
              Gestão de Funcionários •{' '}
              <span className="text-amber-400">
                {lojaSelecionada ? lojaSelecionada.nome : 'Todas as lojas'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-300">
              {lojaLoading ? '...' : `${lojas.length} loja${lojas.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Loja Selector */}
        {!lojaLoading && (
          <LojaSelector
            lojas={lojas}
            lojaSelecionada={lojaSelecionada}
            setLojaSelecionada={setLojaSelecionada}
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingStats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 animate-pulse">
                <div className="w-8 h-8 bg-[#2a2a2e] rounded-lg mb-3" />
                <div className="h-7 w-20 bg-[#2a2a2e] rounded mb-1" />
                <div className="h-4 w-28 bg-[#2a2a2e] rounded" />
              </div>
            ))
          ) : (
            <>
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stats?.total ?? 0}</div>
                <div className="text-sm text-gray-400 mt-0.5">Total de Funcionários</div>
              </div>
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white">{fmt(stats?.custoMensal ?? 0)}</div>
                <div className="text-sm text-gray-400 mt-0.5">Custo Mensal</div>
              </div>
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stats?.escala6x1 ?? 0}</div>
                <div className="text-sm text-gray-400 mt-0.5">Escala 6x1</div>
              </div>
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">{stats?.escala5x2 ?? 0}</div>
                <div className="text-sm text-gray-400 mt-0.5">Escala 5x2</div>
              </div>
            </>
          )}
        </div>

        {/* ── Destaque: Custo da Rede + Escala Semanal ─────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/rh/custos"
            className="group bg-[#1c1c1e] border border-green-500/30 rounded-2xl p-6 hover:border-green-500/60 hover:bg-[#1e2420] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-green-500/15 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-green-400 transition-colors mt-0.5" />
            </div>
            <h3 className="text-lg font-bold text-white">Custos da Rede</h3>
            <p className="text-2xl font-bold text-green-400 mt-1">
              {custoTotal !== null ? fmt(custoTotal) : '—'}
            </p>
            <p className="text-sm text-gray-400 mt-1">custo total / mês</p>
          </Link>

          <Link
            href="/rh/escala"
            className="group bg-[#1c1c1e] border border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/60 hover:bg-[#1e1b24] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors mt-0.5" />
            </div>
            <h3 className="text-lg font-bold text-white">Escala Semanal</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-purple-400">{stats?.escala6x1 ?? 0}</span>
              <span className="text-sm text-gray-500">6x1</span>
              <span className="text-gray-600 mx-1">·</span>
              <span className="text-2xl font-bold text-amber-400">{stats?.escala5x2 ?? 0}</span>
              <span className="text-sm text-gray-500">5x2</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">distribuição por turno e loja</p>
          </Link>
        </div>

        {/* ── Cards secundários ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/rh/alertas" className="group bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 hover:border-red-500/30 hover:bg-[#222224] transition-all">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-red-400 transition-colors" />
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">Vencimentos e Alertas</h3>
                {alertasResumo && alertasResumo.totalCriticos > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">
                    {alertasResumo.totalCriticos} crítico{alertasResumo.totalCriticos !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {alertasResumo
                  ? `${alertasResumo.totalExperienciaMes} experiências · ${alertasResumo.totalFeriasVencidas} férias vencidas`
                  : 'Experiências, férias e aniversários'}
              </p>
            </div>
          </Link>

          <Link href="/rh/quadro-ideal" className="group bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 hover:border-cyan-500/30 hover:bg-[#222224] transition-all">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-cyan-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">Quadro Ideal</h3>
                {comparativoResumo && comparativoResumo.totalGaps > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                    {comparativoResumo.totalGaps} gap{comparativoResumo.totalGaps !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {lojaSelecionada
                  ? (comparativoResumo
                      ? `${comparativoResumo.totalOk}/${comparativoResumo.totalIdeal} posições preenchidas`
                      : 'Quadro não configurado para esta loja')
                  : 'Selecione uma loja para ver os gaps'}
              </p>
            </div>
          </Link>

          <Link href="/rh/motoboys" className="group bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 hover:border-orange-500/30 hover:bg-[#222224] transition-all">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Bike className="w-5 h-5 text-orange-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition-colors" />
            </div>
            <div className="mt-3">
              <h3 className="font-semibold text-white">Motoboys</h3>
              <p className="text-sm text-gray-400 mt-1">Gestão de entregadores e quinzenas</p>
            </div>
          </Link>

          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-semibold text-white">Ocorrências</h3>
              <p className="text-sm text-gray-400 mt-1">
                {ocorrenciasMes !== null
                  ? `${ocorrenciasMes} ocorrência${ocorrenciasMes !== 1 ? 's' : ''} este mês`
                  : 'Faltas, advertências e atestados'}
              </p>
              <p className="text-xs text-gray-500 mt-2">Acesse pelo perfil do funcionário</p>
            </div>
          </div>

          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="font-semibold text-white">Transferências</h3>
              <p className="text-sm text-gray-400 mt-1">
                {transferenciasMes !== null
                  ? `${transferenciasMes} transferência${transferenciasMes !== 1 ? 's' : ''} este mês`
                  : 'Movimentação entre lojas'}
              </p>
              <p className="text-xs text-gray-500 mt-2">Acesse pelo perfil do funcionário</p>
            </div>
          </div>
        </div>

        {/* ── Bonificações (movida para baixo) ──────────────────────────────── */}
        {bonificacoesResumo && (
          <Link
            href="/rh/ia"
            className="group block bg-[#1c1c1e] border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 hover:bg-[#222224] transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-amber-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-amber-400 transition-colors" />
            </div>
            <h3 className="font-semibold text-white mt-3">
              Bonificações — {bonificacoesResumo.mesLabel}
            </h3>
            <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <p className="text-2xl font-bold text-green-400">{bonificacoesResumo.comAssiduidade}</p>
                <p className="text-xs text-gray-500">com assiduidade confirmada</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{bonificacoesResumo.semAssiduidade}</p>
                <p className="text-xs text-gray-500">sem assiduidade</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">{bonificacoesResumo.plrsTrimestre}</p>
                <p className="text-xs text-gray-500">PLRs no trimestre</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Gerencie assiduidade e PLR pela IA Trabalhista →</p>
          </Link>
        )}

        {/* Navigation Grid */}
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Módulos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 hover:border-amber-500/40 hover:bg-[#222224] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center mb-4`}
                    >
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-amber-500 transition-colors mt-1" />
                  </div>
                  <h3 className="font-semibold text-white text-base">{item.label}</h3>
                  <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
