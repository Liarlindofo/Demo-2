'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLoja } from '@/contexts/LojaContext';
import {
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  MapPin,
  Calendar,
  RefreshCw,
  Link2,
} from 'lucide-react';

interface RegistroPonto {
  id: string;
  data: string;
  entrada1: string | null;
  saida1: string | null;
  entrada2: string | null;
  saida2: string | null;
  entrada3: string | null;
  saida3: string | null;
  compensado: boolean;
  neutro: boolean;
  folga: boolean;
  observacoes: string | null;
  funcionario: {
    id: string;
    nome: string;
    lojaId: string | null;
    loja: { id: string; nome: string } | null;
  };
}

interface PendenciaResumo {
  numeroFolhaOrigem: string;
  count: number;
  nomeSugerido: string | null;
}

interface Loja {
  id: string;
  nome: string;
  ativo: boolean;
}

const inputCls =
  'bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors';

function Badge({ label, color }: { label: string; color: 'amber' | 'blue' | 'green' }) {
  const cls = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
  }[color];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

function Horario({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-mono font-semibold text-white bg-[#2a2a2e] px-2 py-0.5 rounded-lg">
        {value}
      </span>
    </div>
  );
}

function RegistroRow({ registro }: { registro: RegistroPonto }) {
  const [expanded, setExpanded] = useState(false);

  const temBadge = registro.compensado || registro.neutro || registro.folga;
  const temHorario = registro.entrada1 || registro.saida1 || registro.entrada2 || registro.saida2;

  return (
    <div className="border-b border-[#2a2a2e] last:border-0">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2e]/40 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white truncate">{registro.funcionario.nome}</span>
            {temBadge && (
              <div className="flex items-center gap-1">
                {registro.folga && <Badge label="Folga" color="green" />}
                {registro.compensado && <Badge label="Compensado" color="blue" />}
                {registro.neutro && <Badge label="Neutro" color="amber" />}
              </div>
            )}
          </div>
          {registro.funcionario.loja && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {registro.funcionario.loja.nome}
            </p>
          )}
        </div>
        {temHorario && !expanded && (
          <div className="flex items-center gap-1.5 shrink-0">
            {registro.entrada1 && (
              <span className="text-xs font-mono text-gray-400">{registro.entrada1}</span>
            )}
            {registro.entrada1 && registro.saida1 && (
              <span className="text-xs text-gray-600">→</span>
            )}
            {registro.saida1 && (
              <span className="text-xs font-mono text-gray-400">{registro.saida1}</span>
            )}
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-11 pb-4 space-y-3">
          {/* Horários */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[[registro.entrada1, registro.saida1, '1ª entrada', '1ª saída'],
              [registro.entrada2, registro.saida2, '2ª entrada', '2ª saída'],
              [registro.entrada3, registro.saida3, '3ª entrada', '3ª saída']].map(
              ([e, s, le, ls], i) =>
                (e || s) ? (
                  <div key={i} className="bg-[#0a0a0a] rounded-xl p-3 flex flex-col gap-2">
                    <Horario label={le as string} value={e as string | null} />
                    <Horario label={ls as string} value={s as string | null} />
                  </div>
                ) : null
            )}
          </div>

          {/* Badges */}
          {temBadge && (
            <div className="flex items-center gap-2 flex-wrap">
              {registro.folga && <Badge label="Folga" color="green" />}
              {registro.compensado && <Badge label="Compensado" color="blue" />}
              {registro.neutro && <Badge label="Neutro" color="amber" />}
            </div>
          )}

          {/* Sem registros de horário */}
          {!temHorario && !registro.folga && (
            <p className="text-xs text-gray-500 italic">Sem horários registrados para este dia.</p>
          )}

          {/* Observações */}
          {registro.observacoes && (
            <p className="text-xs text-gray-400 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2">
              {registro.observacoes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type Aba = 'registros' | 'pendencias';

export default function PontosPage() {
  const { lojas, lojaSelecionada } = useLoja();

  const [aba, setAba] = useState<Aba>('registros');
  const [lojaId, setLojaId] = useState<string>('');
  const [data, setData] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [pendencias, setPendencias] = useState<PendenciaResumo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPontos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ data });
      if (lojaId) params.set('loja', lojaId);
      const res = await fetch(`/api/pontos?${params}`);
      if (res.ok) {
        const d = await res.json();
        setRegistros(d.registros ?? []);
        setPendencias(d.pendencias ?? []);
      }
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [data, lojaId]);

  useEffect(() => {
    fetchPontos();
  }, [fetchPontos]);

  useEffect(() => {
    if (lojaSelecionada && !lojaId) setLojaId(lojaSelecionada.id);
  }, [lojaSelecionada, lojaId]);

  const hoje = new Date().toISOString().split('T')[0];
  const dataFormatada = new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-500" />
              Pontos
            </h1>
            <p className="text-sm text-gray-400 capitalize mt-0.5">{dataFormatada}</p>
          </div>
          <button
            onClick={fetchPontos}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] text-sm text-gray-300 hover:bg-[#2a2a2e] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {/* Filtro de loja */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                <MapPin className="w-3 h-3 inline mr-1" />
                Loja
              </label>
              <select
                value={lojaId}
                onChange={(e) => setLojaId(e.target.value)}
                className={inputCls}
              >
                <option value="">Todas as lojas</option>
                {(lojas as Loja[]).map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de data */}
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                Data
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className={`${inputCls} flex-1`}
                />
                {data !== hoje && (
                  <button
                    onClick={() => setData(hoje)}
                    className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                  >
                    Hoje
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-4 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl p-1">
          <button
            onClick={() => setAba('registros')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              aba === 'registros'
                ? 'bg-amber-500 text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-1.5" />
            Registros
            {registros.length > 0 && (
              <span className="ml-1.5 text-xs opacity-80">({registros.length})</span>
            )}
          </button>
          <button
            onClick={() => setAba('pendencias')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              aba === 'pendencias'
                ? 'bg-amber-500 text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-1.5" />
            Pendências
            {pendencias.length > 0 && (
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  aba === 'pendencias'
                    ? 'bg-black/20 text-black'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {pendencias.length}
              </span>
            )}
          </button>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : aba === 'registros' ? (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
            {registros.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <Clock className="w-10 h-10 text-gray-700 mb-3" />
                <p className="text-gray-400 font-medium">Nenhum registro de ponto</p>
                <p className="text-sm text-gray-600 mt-1">
                  Nenhum dado recebido do Secullum para{' '}
                  {lojaId ? 'esta loja' : 'as lojas'} na data selecionada.
                </p>
              </div>
            ) : (
              <div>
                <div className="px-4 py-3 border-b border-[#2a2a2e] flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {registros.length} funcionário{registros.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {registros.map((r) => (
                  <RegistroRow key={r.id} registro={r} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Aba Pendências */
          <div className="space-y-3">
            {pendencias.length === 0 ? (
              <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl flex flex-col items-center justify-center py-16 text-center px-4">
                <AlertTriangle className="w-10 h-10 text-gray-700 mb-3" />
                <p className="text-gray-400 font-medium">Sem pendências</p>
                <p className="text-sm text-gray-600 mt-1">
                  Todas as matrículas recebidas estão vinculadas a funcionários.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400">
                    As matrículas abaixo foram recebidas do Secullum mas não correspondem a nenhum
                    funcionário cadastrado. Acesse o mapeamento para vinculá-las.
                  </p>
                </div>

                {pendencias.map((p) => (
                  <div
                    key={p.numeroFolhaOrigem}
                    className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-4 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-sm font-semibold text-white">
                          Folha #{p.numeroFolhaOrigem}
                        </span>
                        <span className="text-xs text-gray-500 bg-[#2a2a2e] px-2 py-0.5 rounded-full">
                          {p.count} registro{p.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {p.nomeSugerido && (
                        <p className="text-xs text-gray-400 mt-1 ml-6">
                          Nome: <span className="text-amber-400">{p.nomeSugerido}</span>
                        </p>
                      )}
                    </div>
                    <Link
                      href="/rh/mapeamento-ponto"
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                    >
                      Mapear →
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
