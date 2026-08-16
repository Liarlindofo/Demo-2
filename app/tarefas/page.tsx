import Link from 'next/link';
import { ListChecks, ClipboardList, CalendarClock, BarChart3, Eye, Layers } from 'lucide-react';
import { TarefasEnvioSessao } from './TarefasEnvioSessao';

const modules = [
  {
    href: '/tarefas/templates',
    icon: ClipboardList,
    label: 'Templates',
    description: 'Crie e gerencie modelos de tarefas reutilizáveis',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    href: '/tarefas/grupos',
    icon: Layers,
    label: 'Grupos',
    description: 'Monte pacotes (ex.: tarefas gerentes) para atribuir de uma vez',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    href: '/tarefas/atribuicoes',
    icon: CalendarClock,
    label: 'Atribuições',
    description: 'Agende e atribua tarefas aos funcionários',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    href: '/tarefas/relatorios',
    icon: BarChart3,
    label: 'Relatórios',
    description: 'Acompanhe a execução e desempenho por loja',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
  },
  {
    href: '/tarefas/revisao',
    icon: Eye,
    label: 'Revisão',
    description: 'Valide tarefas com divergências detectadas pela IA',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
];

export default function TarefasDashboard() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <ListChecks className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tarefas</h1>
            <p className="text-sm text-gray-400 mt-0.5">Checklists operacionais via WhatsApp</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className="group bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 hover:border-amber-500/30 hover:bg-[#222224] transition-all"
              >
                <div className={`w-11 h-11 rounded-xl ${m.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${m.color}`} />
                </div>
                <h2 className="font-semibold text-white text-base">{m.label}</h2>
                <p className="text-sm text-gray-400 mt-1">{m.description}</p>
              </Link>
            );
          })}
        </div>

        <TarefasEnvioSessao />

        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 text-center">
          <p className="text-sm text-gray-500">
            Módulo em construção — as funcionalidades serão habilitadas progressivamente.
          </p>
        </div>
      </div>
    </div>
  );
}
