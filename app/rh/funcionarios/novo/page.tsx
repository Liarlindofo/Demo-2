'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoja } from '@/contexts/LojaContext';
import { ArrowLeft, Plus, X, User, Briefcase, DollarSign, Clock } from 'lucide-react';
import {
  DadosPessoaisFields,
  ComposicaoSalarialForm,
  validateDadosPessoais,
  validateComposicao,
  buildComposicaoPayload,
  buildDadosPessoaisPayload,
  type ComposicaoSalarialValues,
  type DadosPessoaisValues,
} from '@/components/rh/FuncionarioForm';
import { limparCPF, validarCPF } from '@/lib/validacoes';

interface Cargo {
  id: string;
  nome: string;
  descricao?: string | null;
  ratPct: number;
}

interface Loja {
  id: string;
  nome: string;
  ativo: boolean;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#2a2a2e]">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-white">{title}</h2>
    </div>
  );
}

export default function NovoFuncionarioPage() {
  const router = useRouter();
  const { lojas, lojaSelecionada } = useLoja();

  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCargoModal, setShowCargoModal] = useState(false);
  const [novoCargo, setNovoCargo] = useState('');
  const [novoCargoRat, setNovoCargoRat] = useState('2');
  const [savingCargo, setSavingCargo] = useState(false);

  const [dadosPessoais, setDadosPessoais] = useState<DadosPessoaisValues>({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    dataAdmissao: new Date().toISOString().split('T')[0],
  });
  const [composicao, setComposicao] = useState<ComposicaoSalarialValues>({
    salarioBase: '',
    cargoResponsabilidade: false,
    valorAlimentacao: '',
    valorVT: '',
    bonificacaoAssiduidade: '',
  });
  const [cargoId, setCargoId] = useState('');
  const [lojaId, setLojaId] = useState(lojaSelecionada?.id ?? '');
  const [escala, setEscala] = useState<'6x1' | '5x2'>('6x1');
  const [turno, setTurno] = useState<'manhã' | 'tarde' | 'noite' | 'integral'>('manhã');
  const [horarioEntrada, setHorarioEntrada] = useState('08:00');
  const [horarioSaida, setHorarioSaida] = useState('17:00');
  const [diasFolga, setDiasFolga] = useState<string[]>(['Dom']);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    fetch('/api/rh/cargos')
      .then((r) => r.json())
      .then(setCargos)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (lojaSelecionada && !lojaId) setLojaId(lojaSelecionada.id);
  }, [lojaSelecionada, lojaId]);

  const toggleDiaFolga = (dia: string) => {
    setDiasFolga((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const parseMoney = (v: string) => parseFloat(v.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;

  const validate = async () => {
    const cpfOk =
      limparCPF(dadosPessoais.cpf).length === 11 &&
      validarCPF(dadosPessoais.cpf) &&
      (await fetch(
        `/api/rh/funcionarios/verificar-cpf?cpf=${limparCPF(dadosPessoais.cpf)}`
      )
        .then((r) => r.json())
        .then((d) => d.disponivel === true)
        .catch(() => false));

    const errs = {
      ...validateDadosPessoais(dadosPessoais, cpfOk),
      ...validateComposicao(composicao),
    };
    if (!cargoId) errs.cargoId = 'Cargo é obrigatório';
    if (!lojaId) errs.lojaId = 'Loja é obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validate())) return;

    setSubmitting(true);
    try {
      const payload = {
        ...buildDadosPessoaisPayload(dadosPessoais),
        ...buildComposicaoPayload(composicao),
        cargoId,
        lojaId,
        escala,
        turno,
        horarioEntrada,
        horarioSaida,
        diasFolga,
        observacoes: observacoes || null,
      };

      const res = await fetch('/api/rh/funcionarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrors({ submit: err.error ?? 'Erro ao cadastrar funcionário' });
        return;
      }

      router.push('/rh/funcionarios');
    } catch {
      setErrors({ submit: 'Erro de conexão. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCargo = async () => {
    if (!novoCargo.trim()) return;
    setSavingCargo(true);
    try {
      const res = await fetch('/api/rh/cargos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoCargo.trim(), ratPct: parseFloat(novoCargoRat) || 2 }),
      });
      if (res.ok) {
        const created: Cargo = await res.json();
        setCargos((prev) => [...prev, created]);
        setCargoId(created.id);
        setShowCargoModal(false);
        setNovoCargo('');
        setNovoCargoRat('2');
      }
    } catch {
      /* silently fail */
    } finally {
      setSavingCargo(false);
    }
  };

  const inputCls =
    'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors';
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Create Cargo Modal */}
      {showCargoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">Novo Cargo</h3>
              <button
                onClick={() => setShowCargoModal(false)}
                className="text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nome do cargo *</label>
                <input
                  type="text"
                  value={novoCargo}
                  onChange={(e) => setNovoCargo(e.target.value)}
                  placeholder="Ex: Pizzaiolo"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>RAT % (Risco Acidente de Trabalho)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="3"
                  value={novoCargoRat}
                  onChange={(e) => setNovoCargoRat(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowCargoModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#2a2a2e] text-gray-300 text-sm font-medium hover:bg-[#3a3a3e] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCargo}
                disabled={savingCargo || !novoCargo.trim()}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {savingCargo ? 'Salvando...' : 'Criar cargo'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/rh/funcionarios')}
            className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Novo Funcionário</h1>
            <p className="text-sm text-gray-400">Preencha os dados para cadastrar</p>
          </div>
        </div>

        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-6">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
            <SectionTitle icon={<User className="w-4 h-4 text-amber-500" />} title="Dados Pessoais" />
            <DadosPessoaisFields
              values={dadosPessoais}
              onChange={(p) => setDadosPessoais((prev) => ({ ...prev, ...p }))}
              errors={errors}
            />
          </div>

          {/* Cargo e Lotação */}
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
            <SectionTitle
              icon={<Briefcase className="w-4 h-4 text-amber-500" />}
              title="Cargo e Lotação"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Cargo *</label>
                <div className="flex gap-2">
                  <select
                    value={cargoId}
                    onChange={(e) => setCargoId(e.target.value)}
                    className={`flex-1 bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 ${
                      errors.cargoId ? 'border-red-500/50' : ''
                    }`}
                  >
                    <option value="">Selecionar...</option>
                    {cargos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCargoModal(true)}
                    className="w-10 h-10 rounded-xl bg-[#2a2a2e] flex items-center justify-center hover:bg-[#3a3a3e] transition-colors text-gray-400"
                    title="Criar novo cargo"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {errors.cargoId && <p className="text-xs text-red-400 mt-1">{errors.cargoId}</p>}
              </div>
              <div>
                <label className={labelCls}>Loja *</label>
                <select
                  value={lojaId}
                  onChange={(e) => setLojaId(e.target.value)}
                  className={`w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 ${
                    errors.lojaId ? 'border-red-500/50' : ''
                  }`}
                >
                  <option value="">Selecionar...</option>
                  {lojas.map((l: Loja) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
                </select>
                {errors.lojaId && <p className="text-xs text-red-400 mt-1">{errors.lojaId}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Observações</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações sobre o funcionário..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Composição Salarial */}
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
            <SectionTitle
              icon={<DollarSign className="w-4 h-4 text-amber-500" />}
              title="Composição Salarial"
            />
            <ComposicaoSalarialForm
              values={composicao}
              onChange={(p) => setComposicao((prev) => ({ ...prev, ...p }))}
              errors={errors}
              parseMoney={parseMoney}
            />
          </div>

          {/* Escala de Trabalho */}
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
            <SectionTitle
              icon={<Clock className="w-4 h-4 text-amber-500" />}
              title="Escala de Trabalho"
            />
            <div className="space-y-5">
              {/* Escala */}
              <div>
                <label className={labelCls}>Regime de escala</label>
                <div className="flex gap-3">
                  {(['6x1', '5x2'] as const).map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEscala(e)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                        escala === e
                          ? e === '6x1'
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                            : 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-[#2a2a2e] text-gray-500 hover:border-[#3a3a3e]'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turno */}
              <div>
                <label className={labelCls}>Turno</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['manhã', 'tarde', 'noite', 'integral'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTurno(t)}
                      className={`py-2.5 rounded-xl text-sm font-medium border-2 capitalize transition-colors ${
                        turno === t
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-[#2a2a2e] text-gray-500 hover:border-[#3a3a3e]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horários */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Horário de entrada</label>
                  <input
                    type="time"
                    value={horarioEntrada}
                    onChange={(e) => setHorarioEntrada(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Horário de saída</label>
                  <input
                    type="time"
                    value={horarioSaida}
                    onChange={(e) => setHorarioSaida(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Dias de Folga */}
              <div>
                <label className={labelCls}>
                  Dias de folga ({diasFolga.length} dia{diasFolga.length !== 1 ? 's' : ''})
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((dia) => (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDiaFolga(dia)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                        diasFolga.includes(dia)
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-[#2a2a2e] text-gray-500 hover:border-[#3a3a3e]'
                      }`}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/rh/funcionarios')}
              className="flex-1 py-3 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-gray-300 font-medium hover:bg-[#2a2a2e] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Cadastrando...' : 'Cadastrar funcionário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
