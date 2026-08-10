'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useLoja } from '@/contexts/LojaContext';
import {
  ArrowLeft, Edit3, Save, X, User, Briefcase, DollarSign, Clock,
  AlertTriangle, TrendingUp, Building2, Phone, Mail, Calendar,
  History, Umbrella, ChevronRight, FileText, ArrowRight, Gift,
} from 'lucide-react';
import BonificacoesTab from '@/components/rh/BonificacoesTab';
import DocumentosTab from '@/components/rh/DocumentosTab';
import OcorrenciasTab from '@/components/rh/OcorrenciasTab';
import TransferenciasTab from '@/components/rh/TransferenciasTab';
import DrawerTransferencia from '@/components/rh/DrawerTransferencia';
import ComposicaoSalarialCard from '@/components/rh/ComposicaoSalarial';
import ComposicaoSalarialForm, { type ComposicaoSalarialValues } from '@/components/rh/ComposicaoSalarialForm';
import DrawerBonificacaoTrimestral, { type BonificacaoTrimestral } from '@/components/rh/DrawerBonificacaoTrimestral';
import { formatarCPF, calcularIdade, limparCPF, validarCPF } from '@/lib/validacoes';
import { buildComposicaoPayload, parseMoney } from '@/components/rh/FuncionarioForm';
import { calcPeriodoAquisitivo } from '@/lib/ferias-rh';

interface Cargo { id: string; nome: string; ratPct: number }
interface Loja { id: string; nome: string; ativo: boolean }

interface Funcionario {
  id: string;
  nome: string;
  cpf: string | null;
  email?: string | null;
  telefone?: string | null;
  dataNascimento: string | null;
  dataAdmissao?: string | null;
  ativo: boolean;
  cargoId?: string | null;
  cargo?: { id: string; nome: string; ratPct: number } | null;
  lojaId?: string | null;
  loja?: { id: string; nome: string; fap?: number } | null;
  salarioBase: number;
  valorAlimentacao: number;
  valorVT: number;
  cargoResponsabilidade: boolean;
  bonificacaoAssiduidade: number;
  salarioBruto: number;
  composicaoSalarial?: {
    totalBruto: number;
    baseCalculoEncargos: number;
    adicionalResponsabilidade: number;
  };
  bonificacoesComposicao?: {
    mes: number;
    ano: number;
    trimestre: number;
    assiduidadePrograma: number;
    plrProjetadoMensal: number;
    bonificacaoTrimestralMedia: number;
    totalVariavel: number;
  };
  escala: '6x1' | '5x2';
  diasFolga: string[];
  domingoFolga?: string | null;
  turno: 'manhã' | 'tarde' | 'noite' | 'integral';
  horarioEntrada: string;
  horarioSaida: string;
  horarioDigest: string;
  observacoes?: string | null;
  dataInicioExperiencia?: string | null;
  dataFimExperiencia1?: string | null;
  dataFimExperiencia2?: string | null;
  dataInicioFerias?: string | null;
  dataGozoFerias?: string | null;
  statusFerias?: string | null;
  diasFeriasGozados?: number | null;
  createdAt: string;
}

interface EncargosResult {
  salarioBruto: number; rat: number; fgts: number;
  custoPatronalTotal: number; bonificacoesVariaveis?: number;
  inssEmpregado: number; irrf: number; descontoVT: number; salarioLiquido: number;
  custoTotalMensal: number; custoAnual: number;
}

interface Historico {
  id: string; campo: string; valorAnterior: string; valorNovo: string;
  alteradoPor: string; motivo: string | null; createdAt: string;
}

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const CAMPO_LABELS: Record<string, string> = {
  composicaoSalarial: 'Composição salarial', salarioBase: 'Salário base', cargoId: 'Cargo', lojaId: 'Loja',
  escala: 'Escala', turno: 'Turno', ativo: 'Status',
};

const STATUS_FERIAS_LABELS: Record<string, string> = {
  a_gozar: 'A gozar', gozando: 'Gozando', gozadas: 'Gozadas',
};

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (d: string | null | undefined) => !d ? '—' : new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

const inputCls = 'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

type Tab = 'dados' | 'ferias' | 'bonificacoes' | 'historico' | 'documentos' | 'ocorrencias' | 'transferencias';

export default function FuncionarioDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { lojas } = useLoja();

  const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
  const [encargos, setEncargos] = useState<EncargosResult | null>(null);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEncargos, setLoadingEncargos] = useState(false);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>('dados');
  const [toast, setToast] = useState('');
  const [showDrawerTransferencia, setShowDrawerTransferencia] = useState(false);

  // Férias
  const [dataGozoFerias, setDataGozoFerias] = useState('');
  const [diasFeriasGozados, setDiasFeriasGozados] = useState(0);
  const [statusFerias, setStatusFerias] = useState('a_gozar');
  const [salvandoFerias, setSalvandoFerias] = useState(false);

  // Edit fields
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [cargoId, setCargoId] = useState('');
  const [lojaId, setLojaId] = useState('');
  const [composicao, setComposicao] = useState<ComposicaoSalarialValues>({
    salarioBase: '', cargoResponsabilidade: false, valorAlimentacao: '', valorVT: '', bonificacaoAssiduidade: '',
  });
  const [bonificacoes, setBonificacoes] = useState<BonificacaoTrimestral[]>([]);
  const [showDrawerBonificacao, setShowDrawerBonificacao] = useState(false);
  const [editBonificacao, setEditBonificacao] = useState<BonificacaoTrimestral | null>(null);
  const [escala, setEscala] = useState<'6x1' | '5x2'>('6x1');
  const [turno, setTurno] = useState<'manhã' | 'tarde' | 'noite' | 'integral'>('manhã');
  const [horarioEntrada, setHorarioEntrada] = useState('');
  const [horarioSaida, setHorarioSaida] = useState('');
  const [horarioDigest, setHorarioDigest] = useState('');
  const [diasFolga, setDiasFolga] = useState<string[]>([]);
  const [domingoFolga, setDomingoFolga] = useState<string>('1');
  const [observacoes, setObservacoes] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const populateForm = (f: Funcionario) => {
    setNome(f.nome); setCpf(f.cpf ? formatCPF(f.cpf) : ''); setEmail(f.email ?? '');
    setTelefone(f.telefone ?? ''); setDataNascimento(f.dataNascimento ? f.dataNascimento.split('T')[0] : '');
    setDataAdmissao(f.dataAdmissao ? f.dataAdmissao.split('T')[0] : '');
    setCargoId(f.cargoId ?? '');
    setLojaId(f.lojaId ?? '');
    setComposicao({
      salarioBase: f.salarioBase.toFixed(2).replace('.', ','),
      cargoResponsabilidade: f.cargoResponsabilidade,
      valorAlimentacao: f.valorAlimentacao.toFixed(2).replace('.', ','),
      valorVT: f.valorVT.toFixed(2).replace('.', ','),
      bonificacaoAssiduidade: f.bonificacaoAssiduidade.toFixed(2).replace('.', ','),
    });
    setEscala(f.escala); setTurno(f.turno); setHorarioEntrada(f.horarioEntrada);
    setHorarioSaida(f.horarioSaida);
    setHorarioDigest(f.horarioDigest || f.horarioEntrada || '08:00');
    setDiasFolga(Array.isArray(f.diasFolga) ? f.diasFolga : []);
    setDomingoFolga(f.domingoFolga ?? '1');
    setObservacoes(f.observacoes ?? '');
    setDataGozoFerias(f.dataGozoFerias ? f.dataGozoFerias.split('T')[0] : '');
    setDiasFeriasGozados(f.diasFeriasGozados ?? 0);
    setStatusFerias(f.statusFerias ?? 'a_gozar');
  };

  const fetchHistorico = useCallback(async () => {
    setLoadingHistorico(true);
    try {
      const res = await fetch(`/api/rh/funcionarios/${params.id}/historico`);
      if (res.ok) setHistorico(await res.json());
    } finally {
      setLoadingHistorico(false);
    }
  }, [params.id]);

  useEffect(() => {
    const load = async () => {
      try {
        const [fRes, cRes] = await Promise.all([fetch(`/api/rh/funcionarios/${params.id}`), fetch('/api/rh/cargos')]);
        if (fRes.ok) {
          const f: Funcionario = await fRes.json();
          setFuncionario(f);
          populateForm(f);
          fetchEncargos(f.id);
        }
        if (cRes.ok) setCargos(await cRes.json());
      } finally { setLoading(false); }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    if (tab === 'historico') fetchHistorico();
  }, [tab, fetchHistorico]);

  const fetchBonificacoes = useCallback(async () => {
    const res = await fetch(`/api/rh/funcionarios/${params.id}/bonificacoes`);
    if (res.ok) setBonificacoes(await res.json());
  }, [params.id]);

  const fetchEncargos = useCallback(async (funcionarioId: string) => {
    setLoadingEncargos(true);
    try {
      const res = await fetch('/api/rh/calculos/impostos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funcionarioId }),
      });
      if (res.ok) setEncargos(await res.json());
    } finally {
      setLoadingEncargos(false);
    }
  }, []);

  const refetchFuncionario = useCallback(async () => {
    const res = await fetch(`/api/rh/funcionarios/${params.id}`);
    if (res.ok) {
      const f: Funcionario = await res.json();
      setFuncionario(f);
    }
  }, [params.id]);

  const handleBonificacaoSaved = useCallback(async () => {
    await Promise.all([
      fetchBonificacoes(),
      refetchFuncionario(),
      fetchEncargos(params.id),
    ]);
  }, [fetchBonificacoes, refetchFuncionario, fetchEncargos, params.id]);

  useEffect(() => {
    if (tab === 'dados' && funcionario) fetchBonificacoes();
  }, [tab, funcionario, fetchBonificacoes]);

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!nome.trim()) errs.nome = 'Nome é obrigatório';
    if (parseMoney(composicao.salarioBase) <= 0) errs.salarioBase = 'Salário base inválido';
    const cpfDigits = limparCPF(cpf);
    if (cpfDigits && !validarCPF(cpfDigits)) errs.cpf = 'CPF inválido';
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast(Object.values(errs)[0]);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/rh/funcionarios/${params.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          cpf: cpfDigits || null,
          email: email || null,
          telefone: telefone || null,
          dataNascimento: dataNascimento || null,
          dataAdmissao: dataAdmissao || null,
          cargoId: cargoId || null,
          lojaId: lojaId || null,
          ...buildComposicaoPayload(composicao),
          escala, turno, horarioEntrada, horarioSaida, horarioDigest,
          diasFolga,
          domingoFolga,
          observacoes: observacoes || null,
        }),
      });
      if (res.ok) {
        const updated: Funcionario = await res.json();
        setFuncionario(updated);
        populateForm(updated);
        setEditMode(false);
        showToast('Dados salvos');
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Não foi possível salvar');
      }
    } finally { setSaving(false); }
  };

  const handleSalvarFerias = async () => {
    setSalvandoFerias(true);
    try {
      const res = await fetch(`/api/rh/funcionarios/${params.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataGozoFerias: dataGozoFerias || null,
          diasFeriasGozados,
          statusFerias: dataGozoFerias ? 'gozadas' : statusFerias,
        }),
      });
      if (res.ok) {
        const updated: Funcionario = await res.json();
        setFuncionario(updated);
        populateForm(updated);
        showToast('Férias registradas — próximo vencimento atualizado');
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Não foi possível salvar férias');
      }
    } finally { setSalvandoFerias(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await fetch(`/api/rh/funcionarios/${params.id}`, { method: 'DELETE' }); router.push('/rh/funcionarios'); }
    finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-[#1c1c1e] rounded-xl" />
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 space-y-4">
            <div className="h-6 w-48 bg-[#2a2a2e] rounded" />
            <div className="grid grid-cols-2 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-[#2a2a2e] rounded-xl" />)}</div>
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
          <button onClick={() => router.push('/rh/funcionarios')} className="mt-4 text-amber-500 hover:text-amber-400 text-sm">← Voltar à lista</button>
        </div>
      </div>
    );
  }

  const periodo = calcPeriodoAquisitivo(
    funcionario.dataInicioFerias ? new Date(funcionario.dataInicioFerias) : null,
    {
      dataAdmissao: funcionario.dataAdmissao ? new Date(funcionario.dataAdmissao) : null,
      dataGozoFerias: funcionario.dataGozoFerias ? new Date(funcionario.dataGozoFerias) : null,
    },
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white shadow-xl z-50">{toast}</div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
              <h3 className="text-lg font-semibold text-white">Desativar funcionário</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">Desativar <span className="text-white font-medium">{funcionario.nome}</span>? O registro é preservado e pode ser reativado.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#2a2a2e] text-gray-300 text-sm font-medium">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium disabled:opacity-50">
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
            <button onClick={() => router.push('/rh/funcionarios')} className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{funcionario.nome}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${funcionario.ativo ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span className="text-sm text-gray-400">{funcionario.ativo ? 'Ativo' : 'Inativo'}{funcionario.cargo ? ` • ${funcionario.cargo.nome}` : ''}{funcionario.loja ? ` • ${funcionario.loja.nome}` : ''}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {funcionario.ativo && !editMode && tab === 'dados' && (
              <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">Desativar</button>
            )}
            {tab === 'dados' && (editMode ? (
              <>
                <button onClick={() => { populateForm(funcionario); setEditMode(false); setErrors({}); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-gray-300 text-sm font-medium hover:bg-[#2a2a2e] transition-colors"><X className="w-4 h-4" /> Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-60 transition-colors"><Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar'}</button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-gray-300 text-sm font-medium hover:bg-[#2a2a2e] transition-colors"><Edit3 className="w-4 h-4" /> Editar</button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl p-1 w-fit">
          {([
            ['dados', User, 'Dados'],
            ['ferias', Umbrella, 'Férias'],
            ['bonificacoes', Gift, 'Bonificações'],
            ['documentos', FileText, 'Documentos'],
            ['ocorrencias', AlertTriangle, 'Ocorrências'],
            ['transferencias', ArrowRight, 'Transferências'],
            ['historico', History, 'Histórico'],
          ] as const).map(([t, Icon, label]) => (
            <button key={t} onClick={() => setTab(t as Tab)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* ── TAB DADOS ── */}
        {tab === 'dados' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              {/* Dados Pessoais */}
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#2a2a2e]">
                  <User className="w-4 h-4 text-amber-500" /><h2 className="text-sm font-semibold text-white">Dados Pessoais</h2>
                </div>
                {editMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Nome completo *</label>
                      <input type="text" value={nome} onChange={e => setNome(e.target.value)} className={`${inputCls} ${errors.nome ? 'border-red-500/50' : ''}`} />
                      {errors.nome && <p className="text-xs text-red-400 mt-1">{errors.nome}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>CPF</label>
                      <input type="text" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} className={`${inputCls} ${errors.cpf ? 'border-red-500/50' : ''}`} />
                      {errors.cpf && <p className="text-xs text-red-400 mt-1">{errors.cpf}</p>}
                    </div>
                    <div><label className={labelCls}>Telefone</label><input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} className={inputCls} /></div>
                    <div className="sm:col-span-2"><label className={labelCls}>E-mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} /></div>
                    <div><label className={labelCls}>Data de admissão</label><input type="date" value={dataAdmissao} onChange={e => setDataAdmissao(e.target.value)} className={inputCls} /></div>
                    <div><label className={labelCls}>Data de nascimento</label><input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} className={inputCls} /></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { icon: User, label: 'Nome', value: funcionario.nome },
                      { icon: Phone, label: 'Telefone', value: funcionario.telefone ?? '—' },
                      { icon: Mail, label: 'E-mail', value: funcionario.email ?? '—' },
                      { icon: Calendar, label: 'Admissão', value: fmtDate(funcionario.dataAdmissao) },
                      {
                        icon: Calendar,
                        label: 'Nascimento',
                        value: funcionario.dataNascimento
                          ? `${fmtDate(funcionario.dataNascimento)} (${calcularIdade(new Date(funcionario.dataNascimento))} anos)`
                          : '—',
                      },
                      { icon: User, label: 'CPF', value: formatarCPF(funcionario.cpf) },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                        <span className="text-sm text-gray-200">{value}</span>
                      </div>
                    ))}
                    {/* Datas experiência */}
                    {funcionario.dataFimExperiencia1 && (
                      <div className="mt-3 p-3 bg-[#0a0a0a] rounded-xl space-y-1.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Período de Experiência</p>
                        <div className="flex gap-4 text-xs text-gray-400">
                          <span>45 dias: <span className="text-amber-400">{fmtDate(funcionario.dataFimExperiencia1)}</span></span>
                          {funcionario.dataFimExperiencia2 && <span>90 dias: <span className="text-amber-400">{fmtDate(funcionario.dataFimExperiencia2)}</span></span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cargo e Loja */}
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#2a2a2e]">
                  <Briefcase className="w-4 h-4 text-amber-500" /><h2 className="text-sm font-semibold text-white">Cargo e Lotação</h2>
                </div>
                {editMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Cargo</label>
                      <select value={cargoId} onChange={e => setCargoId(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50">
                        <option value="">Selecione o cargo</option>
                        {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Loja</label>
                      <select value={lojaId} onChange={e => setLojaId(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50">
                        <option value="">Selecione a loja</option>
                        {lojas.map((l: Loja) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Observações</label>
                      <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[{ icon: Briefcase, label: 'Cargo', value: funcionario.cargo?.nome ?? '—' }, { icon: Building2, label: 'Loja', value: funcionario.loja?.nome ?? '—' }].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</span>
                        <span className="text-sm text-gray-200">{value}</span>
                      </div>
                    ))}
                    {funcionario.observacoes && <div className="mt-3 p-3 bg-[#0a0a0a] rounded-xl text-sm text-gray-400">{funcionario.observacoes}</div>}
                  </div>
                )}
              </div>

              {/* Composição Salarial */}
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#2a2a2e]">
                  <DollarSign className="w-4 h-4 text-amber-500" /><h2 className="text-sm font-semibold text-white">Composição Salarial</h2>
                </div>
                {editMode ? (
                  <ComposicaoSalarialForm values={composicao} onChange={p => setComposicao(prev => ({ ...prev, ...p }))} errors={errors} parseMoney={parseMoney} />
                ) : (
                  <ComposicaoSalarialCard
                    salarioBase={funcionario.salarioBase}
                    cargoResponsabilidade={funcionario.cargoResponsabilidade}
                    bonificacaoAssiduidade={funcionario.bonificacaoAssiduidade}
                    valorAlimentacao={funcionario.valorAlimentacao}
                    valorVT={funcionario.valorVT}
                    ratPct={funcionario.cargo?.ratPct ?? 1.0}
                    fap={funcionario.loja?.fap ?? 1}
                    bonificacoesComposicao={funcionario.bonificacoesComposicao}
                  />
                )}
              </div>

              {/* Bonificações trimestrais */}
              {!editMode && (
                <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-white">Bonificações Trimestrais</h2>
                    <button type="button" onClick={() => { setEditBonificacao(null); setShowDrawerBonificacao(true); }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30">+ Registrar</button>
                  </div>
                  {bonificacoes.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma bonificação registrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {bonificacoes.map(b => (
                        <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#2a2a2e] last:border-0 text-sm">
                          <span className="text-white">Q{b.trimestre} {b.ano}</span>
                          <span className="text-amber-400 font-mono">{fmt(b.valor)}</span>
                          <span className="text-gray-500 text-xs">{fmtDate(b.dataPagamento)}</span>
                          <span className="text-gray-500 text-xs truncate max-w-[120px]">{b.motivo ?? '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Escala */}
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#2a2a2e]">
                  <Clock className="w-4 h-4 text-amber-500" /><h2 className="text-sm font-semibold text-white">Escala de Trabalho</h2>
                </div>
                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Regime</label>
                      <div className="flex gap-3">
                        {(['6x1', '5x2'] as const).map(e => (
                          <button key={e} type="button" onClick={() => setEscala(e)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${escala === e ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-[#2a2a2e] text-gray-500'}`}>{e}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Turno</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['manhã', 'tarde', 'noite', 'integral'] as const).map(t => (
                          <button key={t} type="button" onClick={() => setTurno(t)} className={`py-2 rounded-xl text-sm font-medium border-2 capitalize transition-colors ${turno === t ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-[#2a2a2e] text-gray-500'}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={labelCls}>Entrada</label><input type="time" value={horarioEntrada} onChange={e => setHorarioEntrada(e.target.value)} className={inputCls} /></div>
                      <div><label className={labelCls}>Saída</label><input type="time" value={horarioSaida} onChange={e => setHorarioSaida(e.target.value)} className={inputCls} /></div>
                    </div>
                    <div>
                      <label className={labelCls}>Horário do resumo de tarefas (WhatsApp)</label>
                      <input
                        type="time"
                        value={horarioDigest}
                        onChange={(e) => setHorarioDigest(e.target.value)}
                        className={inputCls}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Horário em que o bot envia a lista de tarefas do dia. Padrão: horário de entrada.
                      </p>
                    </div>
                    <div>
                      <label className={labelCls}>Dias de folga fixos</label>
                      <div className="flex flex-wrap gap-2">
                        {DIAS_SEMANA.map(dia => (
                          <button key={dia} type="button" onClick={() => setDiasFolga(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia])} className={`px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-colors ${diasFolga.includes(dia) ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-[#2a2a2e] text-gray-500'}`}>{dia}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Domingo de folga no mês (DSR)</label>
                      <div className="flex flex-wrap gap-2">
                        {([
                          { value: '1', label: '1º domingo' },
                          { value: '2', label: '2º domingo' },
                          { value: '3', label: '3º domingo' },
                          { value: '4', label: '4º domingo' },
                          { value: 'ultimo', label: 'Último domingo' },
                        ]).map(opt => (
                          <button key={opt.value} type="button" onClick={() => setDomingoFolga(opt.value)} className={`px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-colors ${domingoFolga === opt.value ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-[#2a2a2e] text-gray-500'}`}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3"><span className="text-xs text-gray-500 w-20">Regime</span><span className={`px-3 py-1 rounded-full text-xs font-semibold ${funcionario.escala === '6x1' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>{funcionario.escala}</span></div>
                    <div className="flex items-center gap-3"><span className="text-xs text-gray-500 w-20">Turno</span><span className="text-sm text-gray-200 capitalize">{funcionario.turno}</span></div>
                    <div className="flex items-center gap-3"><span className="text-xs text-gray-500 w-20">Horário</span><span className="text-sm text-gray-200">{funcionario.horarioEntrada} → {funcionario.horarioSaida}</span></div>
                    <div className="flex items-center gap-3"><span className="text-xs text-gray-500 w-20">Resumo</span><span className="text-sm text-gray-200">{funcionario.horarioDigest || funcionario.horarioEntrada} (tarefas do dia)</span></div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20">Dias folga</span>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(funcionario.diasFolga) ? funcionario.diasFolga : []).length > 0
                          ? (Array.isArray(funcionario.diasFolga) ? funcionario.diasFolga : []).map(d => <span key={d} className="px-2 py-0.5 bg-[#2a2a2e] rounded-md text-xs text-gray-400">{d}</span>)
                          : <span className="text-sm text-gray-500">—</span>
                        }
                      </div>
                    </div>
                    {funcionario.domingoFolga && !(Array.isArray(funcionario.diasFolga) ? funcionario.diasFolga : []).includes('Dom') && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-20">Folga DSR</span>
                        <span className="text-sm text-gray-200">
                          {funcionario.domingoFolga === 'ultimo'
                            ? 'Último domingo do mês'
                            : `${funcionario.domingoFolga}º domingo do mês`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Cost */}
            <div className="space-y-5">
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#2a2a2e]">
                  <TrendingUp className="w-4 h-4 text-amber-500" /><h2 className="text-sm font-semibold text-white">Custo Patronal</h2>
                </div>
                {loadingEncargos ? (
                  <div className="space-y-3 animate-pulse">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex justify-between"><div className="h-3 w-28 bg-[#2a2a2e] rounded" /><div className="h-3 w-16 bg-[#2a2a2e] rounded" /></div>)}</div>
                ) : encargos ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Encargos Patronais</p>
                      <div className="space-y-2">
                        {[{ label: 'RAT', value: encargos.rat }, { label: 'FGTS (8%)', value: encargos.fgts }].map(({ label, value }) => (
                          <div key={label} className="flex justify-between text-sm"><span className="text-gray-400">{label}</span><span className="text-gray-200 font-mono">{fmt(value)}</span></div>
                        ))}
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-[#2a2a2e]"><span className="text-white">Total encargos (FGTS + RAT)</span><span className="text-amber-400 font-mono">{fmt(encargos.custoPatronalTotal)}</span></div>
                        <p className="text-[10px] text-gray-600 mt-1">Simples Nacional — calculado sobre salário + adicional de responsabilidade.</p>
                      </div>
                    </div>
                    {(encargos.bonificacoesVariaveis ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bonificações do mês</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Custo direto (sem encargo)</span>
                          <span className="text-emerald-400/90 font-mono">{fmt(encargos.bonificacoesVariaveis!)}</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Descontos do Empregado</p>
                      <div className="space-y-2">
                        {[{ label: 'INSS', value: encargos.inssEmpregado }, { label: 'IRRF', value: encargos.irrf }, { label: 'VT (5%)', value: encargos.descontoVT }].map(({ label, value }) => (
                          <div key={label} className="flex justify-between text-sm"><span className="text-gray-400">{label}</span><span className="text-red-400 font-mono">-{fmt(value)}</span></div>
                        ))}
                        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-[#2a2a2e]"><span className="text-white">Salário líquido</span><span className="text-green-400 font-mono">{fmt(encargos.salarioLiquido)}</span></div>
                      </div>
                    </div>
                    <div className="bg-[#0a0a0a] rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-400">Custo mensal total</span><span className="text-white font-semibold font-mono">{fmt(encargos.custoTotalMensal)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-400">Custo anual (c/ 13° e férias)</span><span className="text-amber-400 font-semibold font-mono">{fmt(encargos.custoAnual)}</span></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Não foi possível calcular os encargos.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB FÉRIAS ── */}
        {tab === 'ferias' && (
          <div className="space-y-4">

            {/* ── Resumo de férias ─────────────────────────────────────────── */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Umbrella className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-white">Férias</h2>
              </div>

              {periodo ? (() => {
                const venc = periodo.vencimento;
                const dias = periodo.diasRestantes;
                const vencido = dias < 0;
                const urgente = !vencido && dias <= 60;

                return (
                  <div className="space-y-3">
                    {/* Próximo vencimento */}
                    <div className={`flex items-center justify-between p-4 rounded-xl border ${
                      vencido  ? 'bg-red-500/10 border-red-500/25'
                      : urgente ? 'bg-amber-500/10 border-amber-500/25'
                               : 'bg-[#141416] border-[#2a2a2e]'
                    }`}>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Próximo vencimento</p>
                        <p className={`text-base font-bold ${vencido ? 'text-red-400' : urgente ? 'text-amber-400' : 'text-white'}`}>
                          {fmtDate(venc.toISOString())}
                        </p>
                      </div>
                      <div className={`text-right text-sm font-semibold ${vencido ? 'text-red-400' : urgente ? 'text-amber-400' : 'text-gray-400'}`}>
                        {vencido
                          ? <>Vencido há <span className="text-lg font-bold">{Math.abs(dias)}</span> dias</>
                          : <>daqui <span className="text-lg font-bold">{dias}</span> dias</>
                        }
                      </div>
                    </div>

                    {/* Última férias */}
                    <div className="flex items-center justify-between px-1">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Última férias registrada</p>
                        {funcionario.dataGozoFerias ? (
                          <p className="text-sm font-medium text-white">
                            {fmtDate(funcionario.dataGozoFerias)}
                            {(funcionario.diasFeriasGozados ?? 0) > 0 && (
                              <span className="text-gray-500 ml-2">· {funcionario.diasFeriasGozados} dias gozados</span>
                            )}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600 italic">Nenhuma registrada</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <p className="text-sm text-gray-500">Data de admissão não informada — não é possível calcular o vencimento.</p>
              )}
            </div>

            {/* ── Registrar férias ─────────────────────────────────────────── */}
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-white">Registrar Férias</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Data de início das férias</label>
                  <input type="date" value={dataGozoFerias} onChange={e => setDataGozoFerias(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Quantos dias de férias?</label>
                  <input type="number" min={0} max={30} value={diasFeriasGozados}
                    onChange={e => setDiasFeriasGozados(Number(e.target.value))} className={inputCls} />
                </div>
              </div>
              <button onClick={handleSalvarFerias} disabled={salvandoFerias}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-60 transition-colors">
                <Save className="w-4 h-4" />{salvandoFerias ? 'Salvando...' : 'Salvar férias'}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB BONIFICAÇÕES ── */}
        {tab === 'bonificacoes' && (
          <BonificacoesTab funcionarioId={params.id} />
        )}

        {/* ── TAB HISTÓRICO ── */}
        {tab === 'historico' && (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[#2a2a2e]">
              <History className="w-4 h-4 text-amber-500" /><h2 className="text-sm font-semibold text-white">Histórico de Alterações</h2>
            </div>
            {loadingHistorico ? (
              <div className="divide-y divide-[#2a2a2e]">
                {[0, 1, 2, 3].map(i => <div key={i} className="px-5 py-4 flex gap-4 animate-pulse"><div className="h-4 flex-1 bg-[#2a2a2e] rounded" /><div className="h-4 w-24 bg-[#2a2a2e] rounded" /></div>)}
              </div>
            ) : historico.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <History className="w-10 h-10 text-gray-700" />
                <p className="text-gray-500 text-sm">Nenhuma alteração registrada ainda</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline */}
                <div className="absolute left-[28px] top-0 bottom-0 w-px bg-[#2a2a2e]" />
                <div className="divide-y divide-[#2a2a2e]">
                  {historico.map((h) => (
                    <div key={h.id} className="px-5 py-4 flex gap-4 items-start hover:bg-[#222224] transition-colors">
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 z-10">
                        <ChevronRight className="w-3 h-3 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white">{CAMPO_LABELS[h.campo] ?? h.campo}</span>
                          <span className="text-xs text-gray-500">{h.valorAnterior || '—'}</span>
                          <span className="text-xs text-gray-600">→</span>
                          <span className="text-xs font-medium text-amber-400">{h.valorNovo}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          por <span className="text-gray-400">{h.alteradoPor}</span>
                          {h.motivo && <> · <span className="italic">{h.motivo}</span></>}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 flex-shrink-0">
                        {new Date(h.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB DOCUMENTOS ── */}
        {tab === 'documentos' && (
          <DocumentosTab
            funcionarioId={params.id}
            uploadadoPor={funcionario.nome}
          />
        )}

        {/* ── TAB OCORRÊNCIAS ── */}
        {tab === 'ocorrencias' && (
          <OcorrenciasTab
            funcionarioId={params.id}
            registradoPor={funcionario.nome}
          />
        )}

        {/* ── TAB TRANSFERÊNCIAS ── */}
        {tab === 'transferencias' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowDrawerTransferencia(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black text-sm font-bold rounded-xl hover:bg-amber-400 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Transferir para outra loja
              </button>
            </div>
            <TransferenciasTab funcionarioId={params.id} />
          </div>
        )}

        <DrawerBonificacaoTrimestral
          open={showDrawerBonificacao}
          onClose={() => setShowDrawerBonificacao(false)}
          funcionarioId={params.id}
          edit={editBonificacao}
          onSaved={handleBonificacaoSaved}
        />
        {showDrawerTransferencia && (
          <DrawerTransferencia
            funcionarioId={params.id}
            funcionarioNome={funcionario.nome}
            lojaAtualId={funcionario.lojaId}
            lojaAtualNome={funcionario.loja?.nome ?? '—'}
            lojas={lojas}
            aprovadoPor=""
            onClose={() => setShowDrawerTransferencia(false)}
            onSuccess={() => {
              setShowDrawerTransferencia(false);
              showToast(`${funcionario.nome} transferido com sucesso`);
              setTab('transferencias');
            }}
          />
        )}
      </div>
    </div>
  );
}
