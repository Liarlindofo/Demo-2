'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLoja } from '@/contexts/LojaContext';
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  User,
  Briefcase,
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';

interface Cargo {
  id: string;
  nome: string;
  ratPct: number;
}

interface Loja {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Funcionario {
  id: string;
  nome: string;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  dataAdmissao: string;
  dataDemissao?: string | null;
  ativo: boolean;
  cargoId: string;
  cargo: { id: string; nome: string; ratPct: number };
  lojaId: string;
  loja: { id: string; nome: string };
  salarioBruto: number;
  escala: '6x1' | '5x2';
  diasFolga: string[];
  turno: 'manhã' | 'tarde' | 'noite' | 'integral';
  horarioEntrada: string;
  horarioSaida: string;
  observacoes?: string | null;
  createdAt: string;
}

interface EncargosResult {
  salarioBruto: number;
  inssPatronal: number;
  rat: number;
  fgts: number;
  sistemaS: number;
  custoPatronalTotal: number;
  inssEmpregado: number;
  irrf: number;
  salarioLiquido: number;
  custoTotalMensal: number;
  custoAnual: number;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

const inputCls =
  'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

export default function FuncionarioDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { lojas } = useLoja();

  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [encargos, setEncargos] = useState<EncargosResult | null>(null);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEncargos, setLoadingEncargos] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Edit fields
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [cargoId, setCargoId] = useState('');
  const [lojaId, setLojaId] = useState('');
  const [salarioBruto, setSalarioBruto] = useState('');
  const [escala, setEscala] = useState<'6x1' | '5x2'>('6x1');
  const [turno, setTurno] = useState<'manhã' | 'tarde' | 'noite' | 'integral'>('manhã');
  const [horarioEntrada, setHorarioEntrada] = useState('');
  const [horarioSaida, setHorarioSaida] = useState('');
  const [diasFolga, setDiasFolga] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('');

  const populateForm = (f: Funcionario) => {
    setNome(f.nome);
    setCpf(f.cpf ?? '');
    setEmail(f.email ?? '');
    setTelefone(f.telefone ?? '');
    setDataAdmissao(f.dataAdmissao.split('T')[0]);
    setCargoId(f.cargoId);
    setLojaId(f.lojaId);
    setSalarioBruto(f.salarioBruto.toFixed(2).replace('.', ','));
    setEscala(f.escala);
    setTurno(f.turno);
    setHorarioEntrada(f.horarioEntrada);
    setHorarioSaida(f.horarioSaida);
    setDiasFolga(f.diasFolga);
    setObservacoes(f.observacoes ?? '');
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [fRes, cRes] = await Promise.all([
          fetch(`/api/rh/funcionarios/${params.id}`),
          fetch('/api/rh/cargos'),
        ]);
        if (fRes.ok) {
          const f: Funcionario = await fRes.json();
          setFuncionario(f);
          populateForm(f);

          // Load encargos
          setLoadingEncargos(true);
          fetch('/api/rh/calculos/impostos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ funcionarioId: f.id }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => data && setEncargos(data))
            .finally(() => setLoadingEncargos(false));
        }
        if (cRes.ok) setCargos(await cRes.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const toggleDiaFolga = (dia: string) => {
    setDiasFolga((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const parseSalario = (v: string) => {
    const clean = v.replace(/[^0-9,]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!nome.trim()) errs.nome = 'Nome é obrigatório';
    if (parseSalario(salarioBruto) <= 0) errs.salarioBruto = 'Salário inválido';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/rh/funcionarios/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          cpf: cpf || null,
          email: email || null,
          telefone: telefone || null,
          dataAdmissao,
          cargoId,
          lojaId,
          salarioBruto: parseSalario(salarioBruto),
          escala,
          turno,
          horarioEntrada,
          horarioSaida,
          diasFolga,
          observacoes: observacoes || null,
        }),
      });
      if (res.ok) {
        const updated: Funcionario = await res.json();
        setFuncionario(updated);
        setEditMode(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/rh/funcionarios/${params.id}`, { method: 'DELETE' });
      router.push('/rh/funcionarios');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-[#1c1c1e] rounded-xl" />
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 space-y-4">
            <div className="h-6 w-48 bg-[#2a2a2e] rounded" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-[#2a2a2e] rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!funcionario) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Funcionário não encontrado</p>
          <button
            onClick={() => router.push('/rh/funcionarios')}
            className="mt-4 text-amber-500 hover:text-amber-400 text-sm"
          >
            ← Voltar à lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Desativar funcionário</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Desativar <span className="text-white font-medium">{funcionario.nome}</span>? O
              registro é preservado e pode ser reativado.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#2a2a2e] text-gray-300 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium disabled:opacity-50"
              >
                {deleting ? 'Desativando...' : 'Desativar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/rh/funcionarios')}
              className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{funcionario.nome}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${funcionario.ativo ? 'bg-green-400' : 'bg-gray-600'}`}
                />
                <span className="text-sm text-gray-400">
                  {funcionario.ativo ? 'Ativo' : 'Inativo'} • {funcionario.cargo.nome} •{' '}
                  {funcionario.loja.nome}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {funcionario.ativo && !editMode && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
              >
                Desativar
              </button>
            )}
            {editMode ? (
              <>
                <button
                  onClick={() => {
                    populateForm(funcionario);
                    setEditMode(false);
                    setErrors({});
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-gray-300 text-sm font-medium hover:bg-[#2a2a2e] transition-colors"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-60 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-gray-300 text-sm font-medium hover:bg-[#2a2a2e] transition-colors"
              >
                <Edit3 className="w-4 h-4" /> Editar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Info / Edit */}
          <div className="lg:col-span-2 space-y-5">
            {/* Dados Pessoais */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#2a2a2e]">
                <User className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-white">Dados Pessoais</h2>
              </div>
              {editMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Nome completo *</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className={`${inputCls} ${errors.nome ? 'border-red-500/50' : ''}`}
                    />
                    {errors.nome && <p className="text-xs text-red-400 mt-1">{errors.nome}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>CPF</label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Telefone</label>
                    <input
                      type="text"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Data de admissão</label>
                    <input
                      type="date"
                      value={dataAdmissao}
                      onChange={(e) => setDataAdmissao(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: User, label: 'Nome', value: funcionario.nome },
                    { icon: Phone, label: 'Telefone', value: funcionario.telefone ?? '—' },
                    { icon: Mail, label: 'E-mail', value: funcionario.email ?? '—' },
                    {
                      icon: Calendar,
                      label: 'Admissão',
                      value: fmtDate(funcionario.dataAdmissao),
                    },
                    ...(funcionario.cpf
                      ? [{ icon: User, label: 'CPF', value: funcionario.cpf }]
                      : []),
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <span className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</span>
                      <span className="text-sm text-gray-200">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cargo e Loja */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#2a2a2e]">
                <Briefcase className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-white">Cargo e Lotação</h2>
              </div>
              {editMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Cargo</label>
                    <select
                      value={cargoId}
                      onChange={(e) => setCargoId(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    >
                      {cargos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Loja</label>
                    <select
                      value={lojaId}
                      onChange={(e) => setLojaId(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                    >
                      {lojas.map((l: Loja) => (
                        <option key={l.id} value={l.id}>
                          {l.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Observações</label>
                    <textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: Briefcase, label: 'Cargo', value: funcionario.cargo.nome },
                    { icon: Building2, label: 'Loja', value: funcionario.loja.nome },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <span className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</span>
                      <span className="text-sm text-gray-200">{value}</span>
                    </div>
                  ))}
                  {funcionario.observacoes && (
                    <div className="mt-3 p-3 bg-[#0a0a0a] rounded-xl text-sm text-gray-400">
                      {funcionario.observacoes}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Salário */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#2a2a2e]">
                <DollarSign className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-white">Salário</h2>
              </div>
              {editMode ? (
                <div>
                  <label className={labelCls}>Salário bruto *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
                    <input
                      type="text"
                      value={salarioBruto}
                      onChange={(e) => setSalarioBruto(e.target.value)}
                      className={`${inputCls} pl-9 ${errors.salarioBruto ? 'border-red-500/50' : ''}`}
                    />
                  </div>
                  {errors.salarioBruto && (
                    <p className="text-xs text-red-400 mt-1">{errors.salarioBruto}</p>
                  )}
                </div>
              ) : (
                <div className="text-2xl font-bold text-white">
                  {fmt(funcionario.salarioBruto)}
                  <span className="text-sm font-normal text-gray-500 ml-1">/mês</span>
                </div>
              )}
            </div>

            {/* Escala */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#2a2a2e]">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-white">Escala de Trabalho</h2>
              </div>
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Regime</label>
                    <div className="flex gap-3">
                      {(['6x1', '5x2'] as const).map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setEscala(e)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                            escala === e
                              ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                              : 'border-[#2a2a2e] text-gray-500'
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Turno</label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['manhã', 'tarde', 'noite', 'integral'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTurno(t)}
                          className={`py-2 rounded-xl text-sm font-medium border-2 capitalize transition-colors ${
                            turno === t
                              ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                              : 'border-[#2a2a2e] text-gray-500'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Entrada</label>
                      <input
                        type="time"
                        value={horarioEntrada}
                        onChange={(e) => setHorarioEntrada(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Saída</label>
                      <input
                        type="time"
                        value={horarioSaida}
                        onChange={(e) => setHorarioSaida(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Dias de folga</label>
                    <div className="flex flex-wrap gap-2">
                      {DIAS_SEMANA.map((dia) => (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => toggleDiaFolga(dia)}
                          className={`px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                            diasFolga.includes(dia)
                              ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                              : 'border-[#2a2a2e] text-gray-500'
                          }`}
                        >
                          {dia}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20">Regime</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        funcionario.escala === '6x1'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {funcionario.escala}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20">Turno</span>
                    <span className="text-sm text-gray-200 capitalize">{funcionario.turno}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20">Horário</span>
                    <span className="text-sm text-gray-200">
                      {funcionario.horarioEntrada} → {funcionario.horarioSaida}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20">Dias folga</span>
                    <div className="flex flex-wrap gap-1">
                      {funcionario.diasFolga.length > 0 ? (
                        funcionario.diasFolga.map((d) => (
                          <span
                            key={d}
                            className="px-2 py-0.5 bg-[#2a2a2e] rounded-md text-xs text-gray-400"
                          >
                            {d}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Cost Breakdown */}
          <div className="space-y-5">
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#2a2a2e]">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-white">Custo Patronal</h2>
              </div>

              {loadingEncargos ? (
                <div className="space-y-3 animate-pulse">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-3 w-28 bg-[#2a2a2e] rounded" />
                      <div className="h-3 w-16 bg-[#2a2a2e] rounded" />
                    </div>
                  ))}
                </div>
              ) : encargos ? (
                <div className="space-y-4">
                  {/* Patronal */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Encargos Patronais
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: 'INSS Patronal (20%)', value: encargos.inssPatronal },
                        { label: 'RAT', value: encargos.rat },
                        { label: 'FGTS (8%)', value: encargos.fgts },
                        { label: 'Sistema S', value: encargos.sistemaS },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-gray-400">{label}</span>
                          <span className="text-gray-200 font-mono">{fmt(value)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t border-[#2a2a2e]">
                        <span className="text-white">Custo patronal</span>
                        <span className="text-amber-400 font-mono">
                          {fmt(encargos.custoPatronalTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Descontos empregado */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Descontos do Empregado
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: 'INSS', value: encargos.inssEmpregado },
                        { label: 'IRRF', value: encargos.irrf },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-gray-400">{label}</span>
                          <span className="text-red-400 font-mono">-{fmt(value)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t border-[#2a2a2e]">
                        <span className="text-white">Salário líquido</span>
                        <span className="text-green-400 font-mono">
                          {fmt(encargos.salarioLiquido)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Totais */}
                  <div className="bg-[#0a0a0a] rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Custo mensal total</span>
                      <span className="text-white font-semibold font-mono">
                        {fmt(encargos.custoTotalMensal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Custo anual (c/ 13° e férias)</span>
                      <span className="text-amber-400 font-semibold font-mono">
                        {fmt(encargos.custoAnual)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Não foi possível calcular os encargos.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
