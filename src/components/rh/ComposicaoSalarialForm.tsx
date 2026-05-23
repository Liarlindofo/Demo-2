'use client';

import { useEffect, useMemo } from 'react';
import { HelpCircle } from 'lucide-react';
import { calcularComposicaoSalarial } from '@/lib/calculos-rh';

export interface ComposicaoSalarialValues {
  salarioBase: string;
  cargoResponsabilidade: boolean;
  valorAlimentacao: string;
  valorVT: string;
  bonificacaoAssiduidade: string;
}

interface Props {
  values: ComposicaoSalarialValues;
  onChange: (patch: Partial<ComposicaoSalarialValues>) => void;
  errors?: Record<string, string>;
  parseMoney: (v: string) => number;
  formatMoneyInput?: (v: string) => string;
}

const inputCls =
  'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex ml-1 align-middle">
      <HelpCircle className="w-3.5 h-3.5 text-gray-500 cursor-help" />
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-lg bg-[#2a2a2e] px-3 py-2 text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg">
        {text}
      </span>
    </span>
  );
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function ComposicaoSalarialForm({
  values,
  onChange,
  errors = {},
  parseMoney,
}: Props) {
  const composicao = useMemo(
    () =>
      calcularComposicaoSalarial({
        salarioBase: parseMoney(values.salarioBase),
        cargoResponsabilidade: values.cargoResponsabilidade,
        bonificacaoAssiduidade: parseMoney(values.bonificacaoAssiduidade),
        valorAlimentacao: parseMoney(values.valorAlimentacao),
        valorVT: parseMoney(values.valorVT),
      }),
    [values, parseMoney]
  );

  useEffect(() => {
    /* recalcula em tempo real via useMemo */
  }, [composicao]);

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Composição Salarial
      </p>

      <div>
        <label className={labelCls}>Salário Base *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
          <input
            type="text"
            inputMode="decimal"
            value={values.salarioBase}
            onChange={(e) => onChange({ salarioBase: e.target.value })}
            className={`${inputCls} pl-9 ${errors.salarioBase ? 'border-red-500/50' : ''}`}
            placeholder="0,00"
          />
        </div>
        {errors.salarioBase && (
          <p className="text-xs text-red-400 mt-1">{errors.salarioBase}</p>
        )}
      </div>

      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="cargoResponsabilidade"
          checked={values.cargoResponsabilidade}
          onChange={(e) => onChange({ cargoResponsabilidade: e.target.checked })}
          className="mt-1 rounded border-[#2a2a2e] bg-[#0a0a0a] text-amber-500 focus:ring-amber-500/50"
        />
        <label htmlFor="cargoResponsabilidade" className="text-sm text-gray-300 cursor-pointer">
          Cargo de Responsabilidade (+40% sobre o salário base)
          <Tooltip text="Acrescenta 40% sobre o salário base, com incidência total de encargos patronais." />
        </label>
      </div>
      {values.cargoResponsabilidade && composicao.adicionalResponsabilidade > 0 && (
        <p className="text-xs text-amber-400/90 -mt-2 ml-7">
          Adicional: {fmt(composicao.adicionalResponsabilidade)} (40% de{' '}
          {fmt(composicao.salarioBase)})
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Vale Refeição / Alimentação</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
            <input
              type="text"
              value={values.valorAlimentacao}
              onChange={(e) => onChange({ valorAlimentacao: e.target.value })}
              className={`${inputCls} pl-9`}
              placeholder="0,00"
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Vale Transporte</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
            <input
              type="text"
              value={values.valorVT}
              onChange={(e) => onChange({ valorVT: e.target.value })}
              className={`${inputCls} pl-9`}
              placeholder="0,00"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Bonificação de Assiduidade</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
            <input
              type="text"
              value={values.bonificacaoAssiduidade}
              onChange={(e) => onChange({ bonificacaoAssiduidade: e.target.value })}
              className={`${inputCls} pl-9`}
              placeholder="0,00"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#2a2a2e] bg-[#0a0a0a] p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-white">Total Bruto</span>
          <span className="text-lg font-bold text-amber-400">{fmt(composicao.totalBruto)}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            Base de cálculo de encargos
            <Tooltip text="VT e VR/VA são benefícios e não sofrem incidência de INSS, FGTS e encargos patronais." />
          </span>
          <span>{fmt(composicao.baseCalculoEncargos)}</span>
        </div>
      </div>
    </div>
  );
}
