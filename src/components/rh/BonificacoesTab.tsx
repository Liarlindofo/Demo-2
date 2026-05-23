'use client';

import { useEffect, useState } from 'react';

interface AssiduidadeReg {
  id: string;
  mes: number;
  ano: number;
  valorDireito: number;
  recebeu: boolean;
  motivo: string | null;
}

interface PLRReg {
  id: string;
  trimestre: number;
  ano: number;
  valor: number;
  lojaNome: string;
  tipo?: string;
}

interface TrimestralReg {
  id: string;
  trimestre: number;
  ano: number;
  valor: number;
  dataPagamento: string;
  motivo: string | null;
}

interface Props {
  funcionarioId: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const MESES = [
  '', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export default function BonificacoesTab({ funcionarioId }: Props) {
  const [loading, setLoading] = useState(true);
  const [assiduidade, setAssiduidade] = useState<AssiduidadeReg[]>([]);
  const [plrs, setPlrs] = useState<PLRReg[]>([]);
  const [trimestrais, setTrimestrais] = useState<TrimestralReg[]>([]);
  const [totalAno, setTotalAno] = useState(0);

  useEffect(() => {
    fetch(`/api/rh/funcionarios/${funcionarioId}/bonificacoes-historico`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setAssiduidade(d.assiduidade ?? []);
          setPlrs(d.plrs ?? []);
          setTrimestrais(d.bonificacoesTrimestrais ?? []);
          setTotalAno(d.totalAno ?? 0);
        }
      })
      .finally(() => setLoading(false));
  }, [funcionarioId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-[#2a2a2e] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1c1c1e] border border-amber-500/20 rounded-2xl p-5">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total em bonificações</p>
        <p className="text-2xl font-bold text-amber-400">{fmt(totalAno)}</p>
        <p className="text-xs text-gray-500 mt-1">Ano corrente (assiduidade recebida + PLRs)</p>
      </div>

      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Assiduidade mensal (R$ 200)</h3>
        {assiduidade.length === 0 ? (
          <p className="text-sm text-gray-500">Sem registros de assiduidade.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-[#2a2a2e]">
                  <th className="pb-2 pr-4">Mês</th>
                  <th className="pb-2 pr-4">Valor direito</th>
                  <th className="pb-2 pr-4">Recebeu</th>
                  <th className="pb-2">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {assiduidade.map((a) => (
                  <tr key={a.id} className="border-b border-[#2a2a2e]/50">
                    <td className="py-2.5 text-gray-300">
                      {MESES[a.mes]}/{a.ano}
                    </td>
                    <td className="py-2.5 text-gray-300">{fmt(a.valorDireito)}</td>
                    <td className="py-2.5">
                      <span className={a.recebeu ? 'text-green-400' : 'text-red-400'}>
                        {a.recebeu ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-500">{a.motivo ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {trimestrais.length > 0 && (
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Bonificações trimestrais (individuais)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-[#2a2a2e]">
                  <th className="pb-2 pr-4">Trimestre</th>
                  <th className="pb-2 pr-4">Valor</th>
                  <th className="pb-2">Data pagamento</th>
                </tr>
              </thead>
              <tbody>
                {trimestrais.map((t) => (
                  <tr key={t.id} className="border-b border-[#2a2a2e]/50">
                    <td className="py-2.5 text-gray-300">Q{t.trimestre}/{t.ano}</td>
                    <td className="py-2.5 text-amber-400 font-mono">{fmt(t.valor)}</td>
                    <td className="py-2.5 text-gray-500">
                      {new Date(t.dataPagamento).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">PLR trimestral (por loja)</h3>
        {plrs.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum PLR registrado para este funcionário.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-[#2a2a2e]">
                  <th className="pb-2 pr-4">Trimestre</th>
                  <th className="pb-2 pr-4">Ano</th>
                  <th className="pb-2 pr-4">Loja</th>
                  <th className="pb-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {plrs.map((p) => (
                  <tr key={p.id} className="border-b border-[#2a2a2e]/50">
                    <td className="py-2.5 text-gray-300">Q{p.trimestre}</td>
                    <td className="py-2.5 text-gray-300">{p.ano}</td>
                    <td className="py-2.5 text-gray-300">{p.lojaNome}</td>
                    <td className="py-2.5 text-amber-400 font-mono">{fmt(p.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
