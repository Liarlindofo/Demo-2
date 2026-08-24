'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Check } from 'lucide-react';

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
const MESES_FULL = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const inputCls =
  'w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50';
const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

export default function BonificacoesTab({ funcionarioId }: Props) {
  const [loading, setLoading] = useState(true);
  const [assiduidade, setAssiduidade] = useState<AssiduidadeReg[]>([]);
  const [plrs, setPlrs] = useState<PLRReg[]>([]);
  const [trimestrais, setTrimestrais] = useState<TrimestralReg[]>([]);
  const [totalAno, setTotalAno] = useState(0);

  const [showFormAssiduidade, setShowFormAssiduidade] = useState(false);
  const hoje = new Date();
  const [formMes, setFormMes] = useState(hoje.getMonth() + 1);
  const [formAno, setFormAno] = useState(hoje.getFullYear());
  const [formRecebeu, setFormRecebeu] = useState<boolean | null>(null);
  const [formMotivo, setFormMotivo] = useState('');
  const [savingAssid, setSavingAssid] = useState(false);
  const [assidError, setAssidError] = useState('');

  const carregar = () => {
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
  };

  useEffect(() => { carregar(); }, [funcionarioId]);

  const handleSalvarAssiduidade = async () => {
    if (formRecebeu === null) { setAssidError('Selecione se recebeu ou não'); return; }
    if (!formRecebeu && !formMotivo.trim()) { setAssidError('Informe o motivo da não assiduidade'); return; }
    setAssidError('');
    setSavingAssid(true);
    try {
      const res = await fetch(`/api/rh/bonificacoes/assiduidade/${funcionarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mes: formMes,
          ano: formAno,
          recebeu: formRecebeu,
          motivo: formRecebeu ? null : formMotivo.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAssidError(err.error ?? 'Erro ao salvar');
        return;
      }
      setShowFormAssiduidade(false);
      setFormRecebeu(null);
      setFormMotivo('');
      carregar();
    } catch {
      setAssidError('Erro de conexão');
    } finally {
      setSavingAssid(false);
    }
  };

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Assiduidade mensal (R$ 200)</h3>
          <button
            type="button"
            onClick={() => { setShowFormAssiduidade((v) => !v); setAssidError(''); setFormRecebeu(null); setFormMotivo(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
          >
            {showFormAssiduidade ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showFormAssiduidade ? 'Cancelar' : 'Registrar'}
          </button>
        </div>

        {showFormAssiduidade && (
          <div className="mb-5 p-4 bg-[#0a0a0a] rounded-xl border border-[#2a2a2e] space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Mês</label>
                <select value={formMes} onChange={(e) => setFormMes(Number(e.target.value))} className={inputCls}>
                  {MESES_FULL.slice(1).map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Ano</label>
                <input type="number" min={2020} max={2100} value={formAno || ''} onChange={(e) => setFormAno(Number(e.target.value))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Recebeu a bonificação?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setFormRecebeu(true); setFormMotivo(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${formRecebeu === true ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-[#2a2a2e] text-gray-500 hover:border-[#3a3a3e]'}`}
                >
                  <Check className="w-4 h-4" /> Sim
                </button>
                <button
                  type="button"
                  onClick={() => setFormRecebeu(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${formRecebeu === false ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-[#2a2a2e] text-gray-500 hover:border-[#3a3a3e]'}`}
                >
                  <X className="w-4 h-4" /> Não
                </button>
              </div>
            </div>
            {formRecebeu === false && (
              <div>
                <label className={labelCls}>Motivo da não assiduidade *</label>
                <input
                  type="text"
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  placeholder="Ex: Falta sem justificativa"
                  className={inputCls}
                />
              </div>
            )}
            {assidError && <p className="text-xs text-red-400">{assidError}</p>}
            <button
              type="button"
              onClick={handleSalvarAssiduidade}
              disabled={savingAssid || formRecebeu === null}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {savingAssid ? 'Salvando...' : `Salvar — ${MESES_FULL[formMes]}/${formAno}`}
            </button>
          </div>
        )}

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
