'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, DollarSign, Users, TrendingUp, BarChart3,
  Download, RefreshCw, ChevronDown, ChevronRight, Settings, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface FuncionarioDetalhe {
  id: string; nome: string; cargo: string; salarioBruto: number;
  encargos: number; percentualEncargos: number; custoTotal: number; custoAnual: number;
}

interface LojaConsolidado {
  lojaId: string; lojaNome: string; fap: number; totalFuncionarios: number;
  totalFolhaBruta?: number; totalBaseEncargos?: number;
  totalSalarioBruto: number; totalEncargos: number; totalCustoReal: number;
  custoAnualizado: number; funcionarios: FuncionarioDetalhe[];
}

interface Rede {
  totalFuncionarios: number;
  totalFolhaBruta?: number; totalBaseEncargos?: number;
  totalSalarioBruto: number;
  totalEncargos: number; totalCustoReal: number; custoAnualizado: number;
}

interface SnapshotHistorico {
  id: string; mes: number; ano: number; totalCustoReal: number;
  loja: { nome: string }; lojaId: string;
}

interface Cargo { id: string; nome: string; ratPct: number }

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const MESES_ABREV = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CORES = ['#F97316','#3B82F6','#10B981','#8B5CF6','#F59E0B','#EC4899'];

// ─── Página ──────────────────────────────────────────────────────────────────

export default function CustosPage() {
  const router = useRouter();

  const [consolidado, setConsolidado] = useState<LojaConsolidado[]>([]);
  const [rede, setRede] = useState<Rede | null>(null);
  const [historico, setHistorico] = useState<SnapshotHistorico[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerandoSnapshot, setGerandoSnapshot] = useState(false);
  const [lojasExpandidas, setLojasExpandidas] = useState<Set<string>>(new Set());
  const [showConfig, setShowConfig] = useState(false);
  const [editandoFap, setEditandoFap] = useState<Record<string, string>>({});
  const [editandoRat, setEditandoRat] = useState<Record<string, string>>({});
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchDados = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, hRes, cargoRes] = await Promise.all([
        fetch('/api/rh/custos/consolidado'),
        fetch('/api/rh/custos/historico'),
        fetch('/api/rh/cargos'),
      ]);
      if (cRes.ok) {
        const d = await cRes.json();
        setConsolidado(d.lojas ?? []);
        setRede(d.rede ?? null);
        const fapInit: Record<string, string> = {};
        d.lojas?.forEach((l: LojaConsolidado) => { fapInit[l.lojaId] = String(l.fap); });
        setEditandoFap(fapInit);
      }
      if (hRes.ok) setHistorico(await hRes.json());
      if (cargoRes.ok) {
        const cs: Cargo[] = await cargoRes.json();
        setCargos(cs);
        const ratInit: Record<string, string> = {};
        cs.forEach((c) => { ratInit[c.id] = String(c.ratPct); });
        setEditandoRat(ratInit);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDados(); }, [fetchDados]);

  const handleGerarSnapshot = async () => {
    setGerandoSnapshot(true);
    try {
      const res = await fetch('/api/rh/custos/snapshot', { method: 'POST' });
      if (res.ok) {
        showToast('Snapshot gerado com sucesso!');
        fetchDados();
      }
    } finally { setGerandoSnapshot(false); }
  };

  const handleSalvarConfig = async () => {
    setSalvandoConfig(true);
    try {
      const promises: Promise<Response>[] = [];
      // FAP por loja
      consolidado.forEach((l) => {
        const fap = parseFloat(editandoFap[l.lojaId] ?? '1.0');
        if (!isNaN(fap))
          promises.push(fetch('/api/rh/custos/consolidado', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lojaId: l.lojaId, fap }),
          }));
      });
      // RAT por cargo
      cargos.forEach((c) => {
        const rat = parseFloat(editandoRat[c.id] ?? '2.0');
        if (!isNaN(rat))
          promises.push(fetch('/api/rh/custos/consolidado', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cargoId: c.id, ratPct: rat }),
          }));
      });
      await Promise.all(promises);
      showToast('Configurações salvas!');
      fetchDados();
    } finally { setSalvandoConfig(false); }
  };

  // Dados para gráfico de barras
  const dadosBarras = consolidado.map((l) => ({
    name: l.lojaNome.length > 12 ? l.lojaNome.slice(0, 12) + '…' : l.lojaNome,
    'Sal. Bruto': Math.round(l.totalSalarioBruto),
    Encargos: Math.round(l.totalEncargos),
    'Custo Total': Math.round(l.totalCustoReal),
  }));

  // Dados para gráfico de linha (evolução mensal)
  const lojasIds = [...new Set(historico.map((h) => h.lojaId))];
  const mesesUnicos = [...new Set(historico.map((h) => `${h.ano}-${String(h.mes).padStart(2, '0')}`))]
    .sort()
    .slice(-12);

  const dadosLinha = mesesUnicos.map((mesAno) => {
    const [ano, mes] = mesAno.split('-');
    const ponto: Record<string, string | number> = {
      mes: `${MESES_ABREV[Number(mes) - 1]}/${ano.slice(2)}`,
    };
    lojasIds.forEach((lojaId) => {
      const snap = historico.find((h) => h.lojaId === lojaId && h.ano === Number(ano) && h.mes === Number(mes));
      const nome = snap?.loja.nome ?? lojaId.slice(0, 8);
      ponto[nome] = snap ? Math.round(snap.totalCustoReal) : 0;
    });
    return ponto;
  });

  const nomesLojaHistorico = [...new Set(historico.map((h) => h.loja.nome))];

  const toggleLoja = (id: string) => {
    setLojasExpandidas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-4 py-3 text-sm text-white shadow-xl z-50">
          {toast}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/rh')}
              className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e]"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-amber-400" /> Painel de Custos
              </h1>
              <p className="text-sm text-gray-400">Folha de pagamento e encargos por loja</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/rh/custos/exportar"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1c1c1e] border border-[#2a2a2e] text-gray-300 text-sm font-medium rounded-xl hover:bg-[#2a2a2e] transition-colors"
            >
              <Download className="w-4 h-4" /> Exportar CSV
            </a>
            <button
              onClick={handleGerarSnapshot}
              disabled={gerandoSnapshot}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black text-sm font-bold rounded-xl hover:bg-amber-400 disabled:opacity-60 transition-colors"
            >
              {gerandoSnapshot ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Gerar Snapshot do Mês
            </button>
          </div>
        </div>

        {/* Card da rede */}
        {rede && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Funcionários</p>
              </div>
              <p className="text-2xl font-bold text-white">{rede.totalFuncionarios}</p>
              <p className="text-xs text-gray-500 mt-0.5">ativos na rede</p>
            </div>
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Folha Bruta</p>
              </div>
              <p className="text-xl font-bold text-amber-400">{fmt(rede.totalFolhaBruta ?? rede.totalSalarioBruto)}</p>
              <p className="text-xs text-gray-500 mt-0.5">soma do total bruto</p>
            </div>
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-orange-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Base Encargos</p>
              </div>
              <p className="text-xl font-bold text-orange-400">{fmt(rede.totalBaseEncargos ?? 0)}</p>
              <p className="text-xs text-gray-500 mt-0.5">base de cálculo patronal</p>
            </div>
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Custo Total/Mês</p>
              </div>
              <p className="text-xl font-bold text-red-400">{fmt(rede.totalCustoReal)}</p>
              <p className="text-xs text-gray-500 mt-0.5">salários + encargos</p>
            </div>
            <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-green-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Custo Anualizado</p>
              </div>
              <p className="text-xl font-bold text-green-400">{fmt(rede.custoAnualizado)}</p>
              <p className="text-xs text-gray-500 mt-0.5">13°, férias e encargos</p>
            </div>
          </div>
        )}

        {/* Cards por loja */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Por Loja</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {consolidado.map((loja) => (
              <div key={loja.lojaId} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">{loja.lojaNome}</h3>
                  <span className="text-xs text-gray-500">{loja.totalFuncionarios} func.</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Folha bruta total</span>
                    <span className="font-medium text-white">{fmt(loja.totalFolhaBruta ?? loja.totalSalarioBruto)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Base de encargos</span>
                    <span className="font-medium text-orange-400">{fmt(loja.totalBaseEncargos ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Encargos</span>
                    <span className="font-medium text-red-400">{fmt(loja.totalEncargos)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 border-t border-[#2a2a2e] pt-1 mt-1">
                    <span>Custo total</span>
                    <span className="font-bold text-amber-400">{fmt(loja.totalCustoReal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Anualizado</span>
                    <span className="font-medium text-gray-300">{fmt(loja.custoAnualizado)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de barras comparativo */}
        {dadosBarras.length > 0 && (
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Comparativo entre Lojas</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dadosBarras}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1c1c1e', border: '1px solid #2a2a2e', borderRadius: 12 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v: number) => fmt(v)}
                />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                <Bar dataKey="Sal. Bruto" fill="#F97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Encargos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Custo Total" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico de evolução mensal */}
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Evolução Mensal</h2>
          {dadosLinha.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
              Gere snapshots mensais para visualizar a evolução
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dadosLinha}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2e" />
                <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1c1c1e', border: '1px solid #2a2a2e', borderRadius: 12 }}
                  formatter={(v: number) => fmt(v)}
                />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                {nomesLojaHistorico.map((nome, i) => (
                  <Line key={nome} type="monotone" dataKey={nome} stroke={CORES[i % CORES.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Breakdown por funcionário */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Detalhamento por Funcionário</h2>
          <div className="space-y-3">
            {consolidado.map((loja) => (
              <div key={loja.lojaId} className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleLoja(loja.lojaId)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#222224] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {lojasExpandidas.has(loja.lojaId) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="font-semibold text-white">{loja.lojaNome}</span>
                    <span className="text-xs text-gray-500">{loja.totalFuncionarios} funcionários</span>
                  </div>
                  <span className="text-sm font-bold text-amber-400">{fmt(loja.totalCustoReal)}/mês</span>
                </button>
                {lojasExpandidas.has(loja.lojaId) && (
                  <div>
                    <div className="grid grid-cols-12 gap-2 px-5 py-2 border-t border-b border-[#2a2a2e] text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="col-span-3">Nome</span>
                      <span className="col-span-2">Cargo</span>
                      <span className="col-span-2 text-right">Sal. Bruto</span>
                      <span className="col-span-2 text-right">Encargos</span>
                      <span className="col-span-2 text-right">Custo/Mês</span>
                      <span className="col-span-1 text-right">Custo/Ano</span>
                    </div>
                    {loja.funcionarios.map((f) => (
                      <div key={f.id} className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-[#2a2a2e] last:border-0 hover:bg-[#222224] text-sm">
                        <span className="col-span-3 text-white truncate">{f.nome}</span>
                        <span className="col-span-2 text-gray-400 truncate">{f.cargo}</span>
                        <span className="col-span-2 text-right text-gray-300">{fmt(f.salarioBruto)}</span>
                        <span className="col-span-2 text-right text-red-400">
                          {fmt(f.encargos)} <span className="text-xs text-gray-500">({f.percentualEncargos.toFixed(0)}%)</span>
                        </span>
                        <span className="col-span-2 text-right font-semibold text-amber-400">{fmt(f.custoTotal)}</span>
                        <span className="col-span-1 text-right text-xs text-gray-400">{fmt(f.custoAnual)}</span>
                      </div>
                    ))}
                    {/* Subtotal */}
                    <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-[#0a0a0a] text-sm font-semibold">
                      <span className="col-span-5 text-gray-400">Subtotal {loja.lojaNome}</span>
                      <span className="col-span-2 text-right text-gray-300">{fmt(loja.totalSalarioBruto)}</span>
                      <span className="col-span-2 text-right text-red-400">{fmt(loja.totalEncargos)}</span>
                      <span className="col-span-2 text-right text-amber-400">{fmt(loja.totalCustoReal)}</span>
                      <span className="col-span-1 text-right text-xs text-gray-400">{fmt(loja.custoAnualizado)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {/* Total geral */}
            {rede && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl px-5 py-4 flex items-center justify-between">
                <span className="font-bold text-white">Total da Rede</span>
                <div className="text-right">
                  <p className="text-xl font-bold text-amber-400">{fmt(rede.totalCustoReal)}/mês</p>
                  <p className="text-xs text-gray-400">{fmt(rede.custoAnualizado)}/ano</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Configurações de encargos */}
        <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#222224] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-white">Configurações de Encargos</span>
            </div>
            {showConfig ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>
          {showConfig && (
            <div className="border-t border-[#2a2a2e] p-5 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">FAP por Loja</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {consolidado.map((loja) => (
                    <div key={loja.lojaId}>
                      <label className="block text-xs text-gray-500 mb-1">{loja.lojaNome}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0.5"
                          max="2.0"
                          value={editandoFap[loja.lojaId] ?? '1.0'}
                          onChange={(e) => setEditandoFap((f) => ({ ...f, [loja.lojaId]: e.target.value }))}
                          className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">RAT (%) por Cargo</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {cargos.map((cargo) => (
                    <div key={cargo.id}>
                      <label className="block text-xs text-gray-500 mb-1">{cargo.nome}</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="6"
                        value={editandoRat[cargo.id] ?? '2.0'}
                        onChange={(e) => setEditandoRat((r) => ({ ...r, [cargo.id]: e.target.value }))}
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSalvarConfig}
                disabled={salvandoConfig}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-black text-sm font-bold rounded-xl hover:bg-amber-400 disabled:opacity-60"
              >
                {salvandoConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {salvandoConfig ? 'Salvando...' : 'Salvar e Recalcular'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
