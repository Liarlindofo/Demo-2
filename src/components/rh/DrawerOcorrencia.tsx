'use client';

import { useState } from 'react';
import { X, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';

const TIPOS_OCORRENCIA = [
  { value: 'falta_justificada', label: 'Falta Justificada' },
  { value: 'falta_injustificada', label: 'Falta Injustificada' },
  { value: 'atraso', label: 'Atraso' },
  { value: 'saida_antecipada', label: 'Saída Antecipada' },
  { value: 'advertencia_verbal', label: 'Advertência Verbal' },
  { value: 'advertencia_escrita', label: 'Advertência Escrita' },
  { value: 'suspensao', label: 'Suspensão' },
  { value: 'atestado_medico', label: 'Atestado Médico' },
  { value: 'acidente_trabalho', label: 'Acidente de Trabalho' },
  { value: 'licenca_maternidade', label: 'Licença Maternidade' },
  { value: 'licenca_paternidade', label: 'Licença Paternidade' },
  { value: 'afastamento_inss', label: 'Afastamento INSS' },
  { value: 'elogio', label: 'Elogio' },
  { value: 'outros', label: 'Outros' },
];

const TIPOS_ADVERTENCIA = ['advertencia_verbal', 'advertencia_escrita', 'suspensao'];
const TIPOS_AFASTAMENTO = ['atestado_medico', 'acidente_trabalho', 'licenca_maternidade', 'licenca_paternidade', 'afastamento_inss'];

interface Props {
  funcionarioId: string;
  registradoPor: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DrawerOcorrencia({ funcionarioId, registradoPor, onClose, onSuccess }: Props) {
  const [tipo, setTipo] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [descricao, setDescricao] = useState('');
  const [gravidade, setGravidade] = useState('');
  const [testemunhas, setTestemunhas] = useState('');
  const [providencia, setProvidencia] = useState('');
  const [cid, setCid] = useState('');
  const [dataInicioAfastamento, setDataInicioAfastamento] = useState('');
  const [dataFimAfastamento, setDataFimAfastamento] = useState('');
  const [registradoPorEdit, setRegistradoPorEdit] = useState(registradoPor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isAdvertencia = TIPOS_ADVERTENCIA.includes(tipo);
  const isAfastamento = TIPOS_AFASTAMENTO.includes(tipo);

  const handleSubmit = async () => {
    if (!tipo || !data || !descricao.trim()) {
      setError('Tipo, data e descrição são obrigatórios');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/rh/ocorrencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funcionarioId, tipo, data, descricao,
          gravidade: isAdvertencia ? gravidade : undefined,
          testemunhas: isAdvertencia ? testemunhas : undefined,
          providencia: isAdvertencia ? providencia : undefined,
          cidAfastamento: isAfastamento ? cid : undefined,
          dataInicioAfastamento: isAfastamento ? dataInicioAfastamento : undefined,
          dataFimAfastamento: isAfastamento ? dataFimAfastamento : undefined,
          registradoPor: registradoPorEdit,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Erro ao salvar');
      }
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#111113] border-l border-[#2a2a2e] flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2e]">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Registrar Ocorrência
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#2a2a2e] flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tipo *</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">Selecione...</option>
              {TIPOS_OCORRENCIA.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Data da Ocorrência *</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Descrição *</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Descreva a ocorrência com detalhes..."
            />
          </div>

          {isAdvertencia && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Gravidade</label>
                <select
                  value={gravidade}
                  onChange={(e) => setGravidade(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecione</option>
                  <option value="leve">Leve</option>
                  <option value="media">Média</option>
                  <option value="grave">Grave</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Testemunhas</label>
                <input
                  type="text"
                  value={testemunhas}
                  onChange={(e) => setTestemunhas(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="Nomes das testemunhas..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Providência Tomada</label>
                <textarea
                  value={providencia}
                  onChange={(e) => setProvidencia(e.target.value)}
                  rows={2}
                  className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
                  placeholder="O que foi feito..."
                />
              </div>
            </>
          )}

          {isAfastamento && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Início Afastamento</label>
                  <input
                    type="date"
                    value={dataInicioAfastamento}
                    onChange={(e) => setDataInicioAfastamento(e.target.value)}
                    className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Fim Afastamento</label>
                  <input
                    type="date"
                    value={dataFimAfastamento}
                    onChange={(e) => setDataFimAfastamento(e.target.value)}
                    className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">CID (opcional)</label>
                <input
                  type="text"
                  value={cid}
                  onChange={(e) => setCid(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ex: J11.1"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Registrado por</label>
            <input
              type="text"
              value={registradoPorEdit}
              onChange={(e) => setRegistradoPorEdit(e.target.value)}
              className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Ocorrência registrada!
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#2a2a2e] flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-[#2a2a2e] text-gray-300 text-sm font-medium hover:bg-[#3a3a3e]">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !tipo || !descricao.trim()}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
