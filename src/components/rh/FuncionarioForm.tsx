'use client';

import { useEffect, useState, useCallback } from 'react';
import ComposicaoSalarialForm, { type ComposicaoSalarialValues } from './ComposicaoSalarialForm';
import { formatarCPF, limparCPF, validarCPF, calcularIdade, validarDataNascimento } from '@/lib/validacoes';

export function formatCPFInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

export function parseMoney(v: string): number {
  return parseFloat(v.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
}

const inputCls =
  'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

export interface DadosPessoaisValues {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  dataAdmissao: string;
}

interface DadosPessoaisProps {
  values: DadosPessoaisValues;
  onChange: (patch: Partial<DadosPessoaisValues>) => void;
  errors: Record<string, string>;
  excludeFuncionarioId?: string;
}

export function DadosPessoaisFields({
  values,
  onChange,
  errors,
  excludeFuncionarioId,
}: DadosPessoaisProps) {
  const [cpfStatus, setCpfStatus] = useState<'idle' | 'checking' | 'ok' | 'invalid' | 'duplicate'>('idle');
  const [idade, setIdade] = useState<number | null>(null);

  const checkCpf = useCallback(
    async (cpf: string) => {
      const digits = limparCPF(cpf);
      if (digits.length < 11) {
        setCpfStatus('idle');
        return;
      }
      if (!validarCPF(digits)) {
        setCpfStatus('invalid');
        return;
      }
      setCpfStatus('checking');
      try {
        const params = new URLSearchParams({ cpf: digits });
        if (excludeFuncionarioId) params.set('excludeId', excludeFuncionarioId);
        const res = await fetch(`/api/rh/funcionarios/verificar-cpf?${params}`);
        const data = await res.json();
        if (!data.valido) setCpfStatus('invalid');
        else if (!data.disponivel) setCpfStatus('duplicate');
        else setCpfStatus('ok');
      } catch {
        setCpfStatus('idle');
      }
    },
    [excludeFuncionarioId]
  );

  useEffect(() => {
    const t = setTimeout(() => checkCpf(values.cpf), 500);
    return () => clearTimeout(t);
  }, [values.cpf, checkCpf]);

  useEffect(() => {
    if (!values.dataNascimento) {
      setIdade(null);
      return;
    }
    const d = new Date(values.dataNascimento);
    if (isNaN(d.getTime())) {
      setIdade(null);
      return;
    }
    setIdade(calcularIdade(d));
  }, [values.dataNascimento]);

  const cpfError =
    errors.cpf ||
    (cpfStatus === 'invalid' ? 'CPF inválido' : '') ||
    (cpfStatus === 'duplicate' ? 'CPF já cadastrado' : '');

  const nascError =
    errors.dataNascimento ||
    (values.dataNascimento
      ? validarDataNascimento(new Date(values.dataNascimento)) ?? ''
      : '');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className={labelCls}>Nome completo *</label>
        <input
          value={values.nome}
          onChange={(e) => onChange({ nome: e.target.value })}
          className={`${inputCls} ${errors.nome ? 'border-red-500/50' : ''}`}
        />
        {errors.nome && <p className="text-xs text-red-400 mt-1">{errors.nome}</p>}
      </div>
      <div>
        <label className={labelCls}>CPF *</label>
        <input
          value={values.cpf}
          onChange={(e) => onChange({ cpf: formatCPFInput(e.target.value) })}
          placeholder="000.000.000-00"
          className={`${inputCls} ${cpfError ? 'border-red-500/50' : cpfStatus === 'ok' ? 'border-green-500/30' : ''}`}
        />
        {cpfError && <p className="text-xs text-red-400 mt-1">{cpfError}</p>}
        {cpfStatus === 'checking' && (
          <p className="text-xs text-gray-500 mt-1">Verificando CPF...</p>
        )}
      </div>
      <div>
        <label className={labelCls}>Data de nascimento *</label>
        <input
          type="date"
          value={values.dataNascimento}
          onChange={(e) => onChange({ dataNascimento: e.target.value })}
          className={`${inputCls} ${nascError ? 'border-red-500/50' : ''}`}
        />
        {idade !== null && !nascError && (
          <p className="text-xs text-gray-500 mt-1">{idade} anos</p>
        )}
        {nascError && <p className="text-xs text-red-400 mt-1">{nascError}</p>}
      </div>
      <div>
        <label className={labelCls}>E-mail</label>
        <input
          type="email"
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Telefone</label>
        <input
          value={values.telefone}
          onChange={(e) => onChange({ telefone: e.target.value })}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Data de admissão *</label>
        <input
          type="date"
          value={values.dataAdmissao}
          onChange={(e) => onChange({ dataAdmissao: e.target.value })}
          className={`${inputCls} ${errors.dataAdmissao ? 'border-red-500/50' : ''}`}
        />
        {errors.dataAdmissao && (
          <p className="text-xs text-red-400 mt-1">{errors.dataAdmissao}</p>
        )}
      </div>
    </div>
  );
}

export { ComposicaoSalarialForm, type ComposicaoSalarialValues };

export function validateDadosPessoais(
  values: DadosPessoaisValues,
  cpfOk: boolean
): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!values.nome.trim()) errs.nome = 'Nome é obrigatório';
  const cpf = limparCPF(values.cpf);
  if (!cpf || !validarCPF(cpf)) errs.cpf = 'CPF inválido';
  else if (!cpfOk) errs.cpf = 'CPF já cadastrado ou em verificação';
  if (!values.dataNascimento) errs.dataNascimento = 'Data de nascimento é obrigatória';
  else {
    const err = validarDataNascimento(new Date(values.dataNascimento));
    if (err) errs.dataNascimento = err;
  }
  if (!values.dataAdmissao) errs.dataAdmissao = 'Data de admissão é obrigatória';
  return errs;
}

export function validateComposicao(values: ComposicaoSalarialValues): Record<string, string> {
  const errs: Record<string, string> = {};
  if (parseMoney(values.salarioBase) <= 0) errs.salarioBase = 'Salário base deve ser maior que zero';
  return errs;
}

export function buildComposicaoPayload(values: ComposicaoSalarialValues) {
  return {
    salarioBase: parseMoney(values.salarioBase),
    valorAlimentacao: parseMoney(values.valorAlimentacao),
    valorVT: parseMoney(values.valorVT),
    cargoResponsabilidade: values.cargoResponsabilidade,
    bonificacaoAssiduidade: parseMoney(values.bonificacaoAssiduidade),
  };
}

export function buildDadosPessoaisPayload(values: DadosPessoaisValues) {
  return {
    nome: values.nome.trim(),
    cpf: limparCPF(values.cpf),
    email: values.email || null,
    telefone: values.telefone || null,
    dataNascimento: values.dataNascimento,
    dataAdmissao: values.dataAdmissao,
  };
}
