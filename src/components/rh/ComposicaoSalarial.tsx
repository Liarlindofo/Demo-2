'use client';

import {
  calcularComposicaoSalarial,
  calcularEncargosPatronais,
  custoAnualizado,
  custoMensalEmpresaComBonificacoes,
  totalBrutoComBonificacoes,
  type BonificacoesComposicaoMes,
  type ComposicaoSalarial as ComposicaoType,
} from '@/lib/calculos-rh';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  salarioBase: number;
  cargoResponsabilidade: boolean;
  bonificacaoAssiduidade: number;
  valorAlimentacao: number;
  valorVT: number;
  ratPct: number;
  fap?: number;
  composicao?: ComposicaoType;
  bonificacoesComposicao?: BonificacoesComposicaoMes;
}

export default function ComposicaoSalarialCard({
  salarioBase,
  cargoResponsabilidade,
  bonificacaoAssiduidade,
  valorAlimentacao,
  valorVT,
  ratPct,
  fap = 1,
  composicao: composicaoProp,
  bonificacoesComposicao,
}: Props) {
  const composicao =
    composicaoProp ??
    calcularComposicaoSalarial({
      salarioBase,
      cargoResponsabilidade,
      bonificacaoAssiduidade,
      valorAlimentacao,
      valorVT,
    });

  const bon = bonificacoesComposicao;
  const enc = calcularEncargosPatronais(composicao.baseCalculoEncargos, ratPct, fap);
  const totalBruto = bon
    ? totalBrutoComBonificacoes(composicao, bon)
    : composicao.totalBruto;
  const custoMensal = bon
    ? custoMensalEmpresaComBonificacoes(composicao, enc.totalEncargos, bon)
    : composicao.baseCalculoEncargos +
      enc.totalEncargos +
      composicao.valorAlimentacao +
      composicao.valorVT;
  const custoAnual = custoAnualizado(custoMensal);
  const pctEnc = enc.percentualSobreBase.toFixed(2);

  const temBonificacoesVariaveis = bon && bon.totalVariavel > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-[#2a2a2e] bg-[#1c1c1e] p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Composição Salarial Mensal
        </h3>
        <div className="space-y-2 text-sm">
          <Row label="Salário Base" value={composicao.salarioBase} />
          {composicao.adicionalResponsabilidade > 0 && (
            <Row
              label="Cargo de Responsabilidade (+40%)"
              value={composicao.adicionalResponsabilidade}
            />
          )}
          {composicao.bonificacaoAssiduidade > 0 && (
            <Row
              label="Bonificação de Assiduidade (cadastro)"
              value={composicao.bonificacaoAssiduidade}
            />
          )}
          <div className="border-t border-[#2a2a2e] my-2" />
          <Row label="Base de cálculo de encargos" value={composicao.baseCalculoEncargos} bold />
          <div className="border-t border-[#2a2a2e] my-2" />
          {composicao.valorAlimentacao > 0 && (
            <Row label="Vale Refeição/Alimentação" value={composicao.valorAlimentacao} />
          )}
          {composicao.valorVT > 0 && (
            <Row label="Vale Transporte" value={composicao.valorVT} />
          )}
          {temBonificacoesVariaveis && (
            <>
              <div className="border-t border-[#2a2a2e] my-2" />
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider pt-1">
                Bonificações do mês
              </p>
              {bon!.assiduidadePrograma > 0 && (
                <Row
                  label="Assiduidade mensal (programa)"
                  value={bon!.assiduidadePrograma}
                  className="text-emerald-400/90"
                />
              )}
              {bon!.bonificacaoTrimestralMedia > 0 && (
                <Row
                  label="Bonificação trimestral (média mensal)"
                  value={bon!.bonificacaoTrimestralMedia}
                  className="text-emerald-400/90"
                />
              )}
              {bon!.plrProjetadoMensal > 0 && (
                <Row
                  label={`PLR Q${bon!.trimestre}/${bon!.ano} (projeção mensal)`}
                  value={bon!.plrProjetadoMensal}
                  className="text-emerald-400/90"
                />
              )}
            </>
          )}
          <div className="border-t border-[#2a2a2e] my-2" />
          <Row label="Total Bruto" value={totalBruto} bold accent />
        </div>
      </div>

      <div className="rounded-2xl border border-[#2a2a2e] bg-[#1c1c1e] p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Custo Real para a Empresa
        </h3>
        <div className="space-y-2 text-sm">
          <Row label="Base encargos" value={composicao.baseCalculoEncargos} />
          <Row
            label={`Encargos patronais (~${pctEnc}%)`}
            value={enc.totalEncargos}
            className="text-red-400"
          />
          {temBonificacoesVariaveis && (
            <Row
              label="Bonificações variáveis (sem encargo)"
              value={bon!.totalVariavel}
              className="text-emerald-400/90"
            />
          )}
          <div className="border-t border-[#2a2a2e] my-2" />
          <Row label="Custo mensal total" value={custoMensal} bold />
          <Row label="Custo anual (c/ 13º e férias)" value={custoAnual} bold accent />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  accent,
  className = '',
}: {
  label: string;
  value: number;
  bold?: boolean;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex justify-between gap-4 ${className}`}>
      <span className="text-gray-400">{label}</span>
      <span
        className={
          bold
            ? accent
              ? 'font-bold text-amber-400'
              : 'font-semibold text-white'
            : 'text-white'
        }
      >
        {fmt(value)}
      </span>
    </div>
  );
}
