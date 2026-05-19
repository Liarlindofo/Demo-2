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
} from 'lucide-react';

interface Funcionario {
  id: string;
  nome: string;
  salarioBruto: number;
  escala: '6x1' | '5x2';
  ativo: boolean;
}

interface Stats {
  total: number;
  custoMensal: number;
  escala6x1: number;
  escala5x2: number;
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
];

export default function RhDashboard() {
  const { lojas, lojaSelecionada, setLojaSelecionada, loading: lojaLoading } = useLoja();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const params = new URLSearchParams({ ativo: 'true' });
        if (lojaSelecionada) params.set('lojaId', lojaSelecionada.id);
        const res = await fetch(`/api/rh/funcionarios?${params}`);
        if (!res.ok) throw new Error('Falha ao carregar');
        const data: Funcionario[] = await res.json();
        const total = data.length;
        const custoMensal = data.reduce((acc, f) => acc + f.salarioBruto * 1.44, 0);
        const escala6x1 = data.filter((f) => f.escala === '6x1').length;
        const escala5x2 = data.filter((f) => f.escala === '5x2').length;
        setStats({ total, custoMensal, escala6x1, escala5x2 });
      } catch {
        setStats({ total: 0, custoMensal: 0, escala6x1: 0, escala5x2: 0 });
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
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
                <div className="text-sm text-gray-400 mt-0.5">Custo Mensal Est.</div>
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
