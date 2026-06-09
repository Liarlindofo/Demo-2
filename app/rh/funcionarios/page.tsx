'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLoja, Loja } from '@/contexts/LojaContext';
import {
  Users,
  Search,
  Plus,
  ChevronRight,
  Trash2,
  X,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

interface Cargo {
  id: string;
  nome: string;
  ratPct: number;
}

interface Funcionario {
  id: string;
  nome: string;
  cpf?: string | null;
  email?: string | null;
  ativo: boolean;
  cargoId: string;
  cargo: { id: string; nome: string; ratPct: number };
  lojaId: string;
  loja: { id: string; nome: string };
  salarioBruto: number;
  composicaoSalarial?: {
    salarioBase: number;
    adicionalResponsabilidade: number;
    bonificacaoAssiduidade: number;
    valorAlimentacao: number;
    valorVT: number;
    baseCalculoEncargos: number;
    totalBruto: number;
  };
  escala: '6x1' | '5x2';
  turno: 'manhã' | 'tarde' | 'noite' | 'integral';
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
    <div className="flex gap-2 overflow-x-auto pb-1">
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

function DeleteModal({
  funcionario,
  onConfirm,
  onCancel,
  loading,
}: {
  funcionario: Funcionario;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Desativar funcionário</h3>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Tem certeza que deseja desativar{' '}
          <span className="text-white font-medium">{funcionario.nome}</span>? Esta ação pode ser
          revertida posteriormente.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-[#2a2a2e] text-gray-300 hover:bg-[#3a3a3e] transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Desativando...' : 'Desativar'}
          </button>
        </div>
      </div>
    </div>
  );
}

const TURNO_LABELS: Record<string, string> = {
  manhã: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
};

export default function FuncionariosPage() {
  const router = useRouter();
  const { lojas, lojaSelecionada, setLojaSelecionada } = useLoja();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCargo, setFilterCargo] = useState('');
  const [filterEscala, setFilterEscala] = useState('');
  const [filterTurno, setFilterTurno] = useState('');
  const [filterAtivo, setFilterAtivo] = useState('true');
  const [deleteTarget, setDeleteTarget] = useState<Funcionario | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const fetchFuncionarios = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (lojaSelecionada) params.set('lojaId', lojaSelecionada.id);
      if (filterCargo) params.set('cargoId', filterCargo);
      if (filterEscala) params.set('escala', filterEscala);
      if (filterTurno) params.set('turno', filterTurno);
      if (filterAtivo) params.set('ativo', filterAtivo);
      const res = await fetch(`/api/rh/funcionarios?${params}`);
      if (!res.ok) throw new Error('Falha ao carregar');
      setFuncionarios(await res.json());
    } catch {
      setFuncionarios([]);
    } finally {
      setLoading(false);
    }
  }, [lojaSelecionada, filterCargo, filterEscala, filterTurno, filterAtivo]);

  useEffect(() => {
    fetchFuncionarios();
  }, [fetchFuncionarios]);

  useEffect(() => {
    fetch('/api/rh/cargos')
      .then((r) => r.json())
      .then(setCargos)
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await fetch(`/api/rh/funcionarios/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      fetchFuncionarios();
    } catch {
      /* silently fail */
    } finally {
      setDeleteLoading(false);
    }
  };

  const searchTerm = search.trim().toLowerCase();
  const cpfSearch = searchTerm.replace(/\D/g, '');
  const funcionariosFiltrados = searchTerm
    ? funcionarios.filter(
        (f) =>
          f.nome.toLowerCase().includes(searchTerm) ||
          (cpfSearch.length > 0 && (f.cpf ?? '').replace(/\D/g, '').includes(cpfSearch))
      )
    : funcionarios;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {deleteTarget && (
        <DeleteModal
          funcionario={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
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
                <Users className="w-6 h-6 text-blue-400" />
                Funcionários
              </h1>
              <p className="text-sm text-gray-400">
                {loading
                  ? '...'
                  : searchTerm
                  ? `${funcionariosFiltrados.length} de ${funcionarios.length} resultado${funcionarios.length !== 1 ? 's' : ''}`
                  : `${funcionarios.length} resultado${funcionarios.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/rh/funcionarios/novo')}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black rounded-xl font-semibold text-sm hover:bg-amber-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Funcionário
          </button>
        </div>

        {/* Loja Selector */}
        <LojaSelector
          lojas={lojas}
          lojaSelecionada={lojaSelecionada}
          setLojaSelecionada={setLojaSelecionada}
        />

        {/* Filters */}
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={filterCargo}
              onChange={(e) => setFilterCargo(e.target.value)}
              className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="">Todos os cargos</option>
              {cargos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <select
              value={filterEscala}
              onChange={(e) => setFilterEscala(e.target.value)}
              className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="">Todas as escalas</option>
              <option value="6x1">6x1</option>
              <option value="5x2">5x2</option>
            </select>

            <select
              value={filterTurno}
              onChange={(e) => setFilterTurno(e.target.value)}
              className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="">Todos os turnos</option>
              <option value="manhã">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
              <option value="integral">Integral</option>
            </select>

            <select
              value={filterAtivo}
              onChange={(e) => setFilterAtivo(e.target.value)}
              className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
              <option value="">Todos</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="divide-y divide-[#2a2a2e]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                  <div className="w-10 h-10 bg-[#2a2a2e] rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-[#2a2a2e] rounded" />
                    <div className="h-3 w-24 bg-[#2a2a2e] rounded" />
                  </div>
                  <div className="h-6 w-14 bg-[#2a2a2e] rounded-full" />
                  <div className="h-4 w-20 bg-[#2a2a2e] rounded" />
                </div>
              ))}
            </div>
          ) : funcionariosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#2a2a2e] flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 font-medium">Nenhum funcionário encontrado</p>
                <p className="text-sm text-gray-600 mt-1">Tente ajustar os filtros ou cadastre um novo</p>
              </div>
              <button
                onClick={() => router.push('/rh/funcionarios/novo')}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Cadastrar funcionário
              </button>
            </div>
          ) : (
            <>
              {/* Header row */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px_40px] gap-4 px-5 py-3 border-b border-[#2a2a2e] text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span>Nome</span>
                <span>Cargo</span>
                <span>Loja</span>
                <span>Turno</span>
                <span>Salário Bruto</span>
                <span>Escala</span>
                <span />
              </div>
              <div className="divide-y divide-[#2a2a2e]">
                {funcionariosFiltrados.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => router.push(`/rh/funcionarios/${f.id}`)}
                    className="group flex md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_80px_40px] items-center gap-4 px-5 py-4 hover:bg-[#222224] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#2a2a2e] flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white">
                        {f.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{f.nome}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${f.ativo ? 'bg-green-400' : 'bg-gray-600'}`}
                          />
                          <span className="text-xs text-gray-500">
                            {f.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="hidden md:block text-sm text-gray-300 truncate">
                      {f.cargo?.nome ?? '—'}
                    </span>
                    <span className="hidden md:block text-sm text-gray-400 truncate">
                      {f.loja?.nome ?? '—'}
                    </span>
                    <span className="hidden md:block text-sm text-gray-400">
                      {TURNO_LABELS[f.turno] ?? f.turno}
                    </span>
                    <span
                      className="hidden md:block text-sm text-gray-300 font-mono cursor-help"
                      title={
                        f.composicaoSalarial
                          ? `Base: ${fmt(f.composicaoSalarial.salarioBase)} | Resp.: ${fmt(f.composicaoSalarial.adicionalResponsabilidade)} | Assid.: ${fmt(f.composicaoSalarial.bonificacaoAssiduidade)} | VR: ${fmt(f.composicaoSalarial.valorAlimentacao)} | VT: ${fmt(f.composicaoSalarial.valorVT)}`
                          : undefined
                      }
                    >
                      {fmt(f.salarioBruto)}
                    </span>

                    <span
                      className={`hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        f.escala === '6x1'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {f.escala}
                    </span>

                    <div className="flex items-center gap-2 ml-auto md:ml-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(f);
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-amber-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
