'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { UserProfileDropdown } from '@/components/user-profile-dropdown';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApp } from '@/contexts/app-context';
import {
  ShoppingBag,
  RefreshCw,
  Download,
  DollarSign,
  TrendingUp,
  XCircle,
  Receipt,
  AlertTriangle,
  ChevronLeft as ChevLeft,
  ChevronRight as ChevRight,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface IfoodConnection {
  id: string;
  merchantId: string;
  merchantName: string;
  status: string;
}

interface FinancialSummary {
  grossRevenue: number;
  netRevenue: number | null;
  ifoodCommission: number | null;
  ifoodCommissionPct: number | null;
  serviceFee: number | null;
  totalOrders: number;
  cancelledOrders: number;
  cancelledAmount: number;
  averageTicket: number;
  topPaymentMethods: Array<{ method: string; count: number; amount: number }>;
  salesByDay: Array<{ date: string; grossRevenue: number }>;
  dataSource: 'local' | 'synced';
}

interface FinancialEvent {
  id: string;
  eventType: string;
  amount: number;
  description: string;
  referenceDate: string;
  orderId: string | null;
}

interface Settlement {
  id: string;
  settlementDate: string;
  grossAmount: number;
  netAmount: number;
  commission: number;
  fees: number;
}

type PeriodPreset = '7D' | '15D' | '30D' | 'current_month' | 'prev_month' | 'custom';
type ActiveTab = 'events' | 'settlements';
type EventTypeFilter = 'ALL' | 'SALE' | 'REFUND' | 'COMMISSION' | 'FEE' | 'SETTLEMENT';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const IFOOD_TABS = [
  { label: 'Configurações', href: '/ifood/configuracoes' },
  { label: 'Operacional', href: '/ifood/operacional' },
  { label: 'Financeiro', href: '/ifood/financeiro', active: true },
  { label: 'Cardápio', href: '/ifood/cardapio' },
];

const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: '7D', label: 'Últimos 7 dias' },
  { value: '15D', label: 'Últimos 15 dias' },
  { value: '30D', label: 'Últimos 30 dias' },
  { value: 'current_month', label: 'Mês atual' },
  { value: 'prev_month', label: 'Mês anterior' },
  { value: 'custom', label: 'Personalizado' },
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  SALE: 'Venda',
  REFUND: 'Estorno',
  COMMISSION: 'Comissão',
  FEE: 'Taxa',
  SETTLEMENT: 'Repasse',
  UNKNOWN: 'Outro',
};

const PAYMENT_LABEL: Record<string, string> = {
  CREDIT_ONLINE: 'Crédito Online',
  DEBIT_ONLINE: 'Débito Online',
  CREDIT_OFFLINE: 'Crédito (entrega)',
  DEBIT_OFFLINE: 'Débito (entrega)',
  CASH: 'Dinheiro',
  PIX: 'Pix',
  MEAL_VOUCHER: 'Vale Refeição',
  UNKNOWN: 'Outros',
};

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f97316', '#06b6d4', '#f43f5e', '#a3a3a3'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getToday() {
  return new Date().toISOString().split('T')[0];
}

function subDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function getPeriodDates(preset: PeriodPreset, customStart?: string, customEnd?: string) {
  const today = getToday();
  switch (preset) {
    case '7D': return { startDate: subDays(6), endDate: today };
    case '15D': return { startDate: subDays(14), endDate: today };
    case '30D': return { startDate: subDays(29), endDate: today };
    case 'current_month': {
      const s = startOfMonth(new Date());
      return { startDate: s.toISOString().split('T')[0], endDate: today };
    }
    case 'prev_month': {
      const prev = subMonths(new Date(), 1);
      return {
        startDate: startOfMonth(prev).toISOString().split('T')[0],
        endDate: endOfMonth(prev).toISOString().split('T')[0],
      };
    }
    case 'custom':
      return { startDate: customStart ?? subDays(29), endDate: customEnd ?? today };
  }
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(iso: string) {
  return format(new Date(iso), 'dd/MM/yyyy', { locale: ptBR });
}

function fmtShortDate(iso: string) {
  return format(new Date(iso + 'T12:00:00'), 'dd/MM', { locale: ptBR });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded ${className ?? ''}`} />;
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------
function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  loading: boolean;
}) {
  return (
    <Card className="bg-[#141415] border-[#374151]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
          <Icon className={`h-4 w-4 ${color} opacity-70`} />
        </div>
        {loading ? (
          <>
            <Sk className="h-7 w-32 mb-1" />
            <Sk className="h-3 w-20" />
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-white">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Custom chart tooltip
// ---------------------------------------------------------------------------
interface TooltipPayload { value?: number; dataKey?: string }
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1b] border border-[#374151] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-white">
          {fmt(p.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function IfoodFinanceiroPage() {
  const { addToast } = useApp();

  // Stores
  const [stores, setStores] = useState<IfoodConnection[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState('');

  // Period
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('30D');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Data
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [events, setEvents] = useState<FinancialEvent[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotalPages, setEventsTotalPages] = useState(1);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('ALL');

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settlementsLoading, setSettlementsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('events');

  const [syncing, setSyncing] = useState(false);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [homologationNeeded, setHomologationNeeded] = useState(false);

  // -----------------------------------------------------------------------
  // Load stores
  // -----------------------------------------------------------------------
  useEffect(() => {
    fetch('/api/ifood/connections')
      .then((r) => r.json())
      .then((d: { connections?: IfoodConnection[] }) => {
        const list = d.connections ?? [];
        setStores(list);
        const saved = typeof window !== 'undefined'
          ? localStorage.getItem('ifood_selected_merchant')
          : null;
        const initial =
          (saved && list.find((s) => s.merchantId === saved)?.merchantId) ||
          list[0]?.merchantId || '';
        setSelectedMerchant(initial);
      })
      .catch(() => addToast('❌ Erro ao carregar lojas', 'error'));
  }, [addToast]);

  useEffect(() => {
    if (selectedMerchant) localStorage.setItem('ifood_selected_merchant', selectedMerchant);
  }, [selectedMerchant]);

  // -----------------------------------------------------------------------
  // Computed dates
  // -----------------------------------------------------------------------
  const { startDate, endDate } = getPeriodDates(periodPreset, customStart, customEnd);

  // -----------------------------------------------------------------------
  // Fetch summary
  // -----------------------------------------------------------------------
  const fetchSummary = useCallback(async () => {
    if (!selectedMerchant) return;
    setSummaryLoading(true);
    try {
      const params = new URLSearchParams({ merchantId: selectedMerchant, startDate, endDate });
      const res = await fetch(`/api/ifood/financial/summary?${params}`);
      if (!res.ok) throw new Error(await res.text());
      setSummary(await res.json());
    } catch {
      addToast('Erro ao carregar resumo financeiro', 'error');
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedMerchant, startDate, endDate, addToast]);

  // -----------------------------------------------------------------------
  // Fetch events
  // -----------------------------------------------------------------------
  const fetchEvents = useCallback(async (page = 1) => {
    if (!selectedMerchant) return;
    setEventsLoading(true);
    try {
      const params = new URLSearchParams({
        merchantId: selectedMerchant,
        startDate,
        endDate,
        page: String(page),
        size: '20',
        eventType: eventTypeFilter,
      });
      const res = await fetch(`/api/ifood/financial/events?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as {
        events: FinancialEvent[];
        total: number;
        page: number;
        totalPages: number;
      };
      setEvents(data.events ?? []);
      setEventsTotal(data.total ?? 0);
      setEventsPage(data.page ?? 1);
      setEventsTotalPages(data.totalPages ?? 1);
    } catch {
      addToast('Erro ao carregar lançamentos', 'error');
    } finally {
      setEventsLoading(false);
    }
  }, [selectedMerchant, startDate, endDate, eventTypeFilter, addToast]);

  // -----------------------------------------------------------------------
  // Fetch settlements
  // -----------------------------------------------------------------------
  const fetchSettlements = useCallback(async () => {
    if (!selectedMerchant) return;
    setSettlementsLoading(true);
    try {
      const params = new URLSearchParams({ merchantId: selectedMerchant, startDate, endDate });
      const res = await fetch(`/api/ifood/financial/settlements?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as { settlements: Settlement[] };
      setSettlements(data.settlements ?? []);
    } catch {
      addToast('Erro ao carregar repasses', 'error');
    } finally {
      setSettlementsLoading(false);
    }
  }, [selectedMerchant, startDate, endDate, addToast]);

  // -----------------------------------------------------------------------
  // Load on mount / changes
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!selectedMerchant) return;
    fetchSummary();
    fetchEvents(1);
    fetchSettlements();
  }, [selectedMerchant, startDate, endDate, fetchSummary, fetchEvents, fetchSettlements]);

  // Re-fetch events when filter changes
  useEffect(() => {
    if (selectedMerchant) fetchEvents(1);
  }, [eventTypeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  // Sync
  // -----------------------------------------------------------------------
  async function handleSync() {
    if (!selectedMerchant) return;
    setSyncing(true);
    setSyncWarning(null);
    setHomologationNeeded(false);
    try {
      const params = new URLSearchParams({ merchantId: selectedMerchant, startDate, endDate });
      const res = await fetch(`/api/ifood/financial/sync?${params}`, { method: 'POST' });
      const data = await res.json() as {
        success?: boolean;
        warning?: boolean;
        message?: string;
        requiresHomologation?: boolean;
        eventsSynced?: number;
        settlementsSynced?: number;
      };
      if (data.warning || data.requiresHomologation) {
        setSyncWarning(data.message ?? 'API Financeira requer permissões especiais.');
        setHomologationNeeded(!!data.requiresHomologation);
      } else if (data.success) {
        addToast(`✅ ${data.eventsSynced ?? 0} lançamentos e ${data.settlementsSynced ?? 0} repasses sincronizados`, 'success');
        fetchSummary();
        fetchEvents(1);
        fetchSettlements();
      }
    } catch {
      addToast('Erro ao sincronizar dados financeiros', 'error');
    } finally {
      setSyncing(false);
    }
  }

  // -----------------------------------------------------------------------
  // Export
  // -----------------------------------------------------------------------
  function handleExport() {
    if (!selectedMerchant) return;
    const type = activeTab === 'settlements' ? 'settlements' : 'events';
    const params = new URLSearchParams({ merchantId: selectedMerchant, startDate, endDate, type });
    window.open(`/api/ifood/financial/export?${params}`, '_blank');
  }

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------
  const selectedStore = stores.find((s) => s.merchantId === selectedMerchant);

  const pieData = (summary?.topPaymentMethods ?? []).map((p) => ({
    name: PAYMENT_LABEL[p.method] ?? p.method,
    value: p.amount,
  }));

  const barData = (summary?.salesByDay ?? []).map((d) => ({
    date: fmtShortDate(d.date),
    'Faturamento': d.grossRevenue,
  }));

  const commissionPct =
    summary?.ifoodCommissionPct ??
    (summary?.ifoodCommission && summary?.grossRevenue
      ? (summary.ifoodCommission / summary.grossRevenue) * 100
      : null);

  // -----------------------------------------------------------------------
  // JSX
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Header ── */}
      <header className="bg-[#141415]/95 backdrop-blur-sm border-b border-[#374151] sticky top-0 z-40">
        <div className="max-w-full px-4 sm:px-6 py-3 flex items-center gap-4 flex-wrap">
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity shrink-0">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ShoppingBag className="h-5 w-5 text-[#EA1D2C]" />
            <span className="font-semibold">iFood</span>
          </div>

          {/* Store selector */}
          {stores.length > 1 ? (
            <div className="w-52">
              <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#374151] text-white h-8 text-sm">
                  <SelectValue placeholder="Selecionar loja" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#374151] text-white">
                  {stores.map((s) => (
                    <SelectItem key={s.merchantId} value={s.merchantId} className="hover:bg-[#374151] focus:bg-[#374151]">
                      {s.merchantName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            selectedStore && (
              <span className="text-gray-400 text-sm">{selectedStore.merchantName}</span>
            )
          )}

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSync}
              disabled={syncing || !selectedMerchant}
              className="h-8 text-xs text-gray-400 hover:text-white gap-1.5"
            >
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              <span className="hidden sm:block">Sincronizar</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExport}
              disabled={!selectedMerchant}
              className="h-8 text-xs text-gray-400 hover:text-white gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:block">Exportar CSV</span>
            </Button>
            <UserProfileDropdown />
          </div>
        </div>

        {/* Subnav tabs */}
        <div className="px-4 sm:px-6">
          <nav className="flex gap-1">
            {IFOOD_TABS.map((tab) =>
              'active' in tab && tab.active ? (
                <span key={tab.href} className="px-4 py-2.5 text-sm font-medium text-white border-b-2 border-[#EA1D2C]">
                  {tab.label}
                </span>
              ) : (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-300 border-b-2 border-transparent transition-colors"
                >
                  {tab.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* No stores */}
        {stores.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma loja conectada</h3>
            <p className="text-gray-400 mb-4">Conecte uma loja iFood para usar o módulo financeiro.</p>
            <Link href="/ifood/configuracoes">
              <Button className="bg-[#EA1D2C] hover:bg-[#c9111f] text-white">Ir para Configurações</Button>
            </Link>
          </div>
        )}

        {stores.length > 0 && (
          <>
            {/* ── Period selector ── */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-[#141415] rounded-lg p-1 gap-0.5 flex-wrap">
                {PERIOD_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    size="sm"
                    variant={periodPreset === opt.value ? 'default' : 'ghost'}
                    onClick={() => setPeriodPreset(opt.value)}
                    className={`h-8 px-3 text-xs font-medium ${
                      periodPreset === opt.value
                        ? 'bg-[#EA1D2C] text-white hover:bg-[#c9111f]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>

              {periodPreset === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStart}
                    max={getToday()}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-8 px-2 text-xs bg-[#141415] border border-[#374151] rounded text-white"
                  />
                  <span className="text-gray-500 text-xs">até</span>
                  <input
                    type="date"
                    value={customEnd}
                    max={getToday()}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-8 px-2 text-xs bg-[#141415] border border-[#374151] rounded text-white"
                  />
                </div>
              )}

              <span className="text-xs text-gray-600">
                {fmtDate(startDate)} – {fmtDate(endDate)}
              </span>
            </div>

            {/* ── Sync warning ── */}
            {syncWarning && (
              <Alert className="bg-yellow-500/10 border-yellow-500/30">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-300 text-sm">
                  {syncWarning}
                  {homologationNeeded && (
                    <span className="block mt-1 text-yellow-400/80 text-xs">
                      Os KPIs abaixo são calculados a partir dos pedidos registrados localmente.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* ── Section 1: KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                icon={DollarSign}
                label="Faturamento Bruto"
                value={summary ? fmt(summary.grossRevenue) : 'R$ 0,00'}
                sub={`${summary?.totalOrders ?? 0} pedidos`}
                color="text-green-400"
                loading={summaryLoading}
              />
              <KPICard
                icon={TrendingUp}
                label="Faturamento Líquido"
                value={summary?.netRevenue != null ? fmt(summary.netRevenue) : '—'}
                sub={summary?.netRevenue == null ? 'Requer API Financeira' : undefined}
                color="text-blue-400"
                loading={summaryLoading}
              />
              <KPICard
                icon={Receipt}
                label="Comissão iFood"
                value={
                  summary?.ifoodCommission != null
                    ? fmt(summary.ifoodCommission)
                    : commissionPct != null
                    ? `${commissionPct.toFixed(1)}%`
                    : '—'
                }
                sub={
                  summary?.ifoodCommission != null && commissionPct != null
                    ? `${commissionPct.toFixed(1)}% do bruto`
                    : 'Requer API Financeira'
                }
                color="text-orange-400"
                loading={summaryLoading}
              />
              <KPICard
                icon={XCircle}
                label="Cancelamentos"
                value={summary ? fmt(summary.cancelledAmount) : 'R$ 0,00'}
                sub={`${summary?.cancelledOrders ?? 0} pedidos cancelados`}
                color="text-red-400"
                loading={summaryLoading}
              />
            </div>

            {/* ── Section 2 & 3: Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Bar chart — daily revenue */}
              <Card className="bg-[#141415] border-[#374151]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">Faturamento por Dia</CardTitle>
                </CardHeader>
                <CardContent>
                  {summaryLoading ? (
                    <Sk className="h-[240px]" />
                  ) : barData.length === 0 ? (
                    <div className="h-[240px] flex items-center justify-center text-gray-600 text-sm">
                      Nenhum dado no período
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={barData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2e" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
                          tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`}
                          width={55}
                        />
                        <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: '#374151', opacity: 0.3 }} />
                        <Bar dataKey="Faturamento" fill="#EA1D2C" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Pie chart — payment methods */}
              <Card className="bg-[#141415] border-[#374151]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-base">Formas de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  {summaryLoading ? (
                    <Sk className="h-[240px]" />
                  ) : pieData.length === 0 ? (
                    <div className="h-[240px] flex items-center justify-center text-gray-600 text-sm">
                      Nenhum dado no período
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(v: number) => [fmt(v), '']}
                          contentStyle={{ backgroundColor: '#1a1a1b', border: '1px solid #374151', borderRadius: '8px' }}
                          labelStyle={{ color: '#9ca3af' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(v) => <span style={{ color: '#9ca3af', fontSize: 11 }}>{v}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Sections 4 & 5: Tables ── */}
            {/* Tab switcher */}
            <div className="flex items-center gap-1 border-b border-[#374151]">
              {(['events', 'settlements'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    activeTab === t
                      ? 'text-white border-[#EA1D2C]'
                      : 'text-gray-500 border-transparent hover:text-gray-300'
                  }`}
                >
                  {t === 'events' ? 'Lançamentos' : 'Repasses'}
                </button>
              ))}
              <div className="ml-auto pb-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleExport}
                  className="h-7 text-xs text-gray-500 hover:text-white gap-1"
                >
                  <Download className="h-3 w-3" />
                  Exportar CSV
                </Button>
              </div>
            </div>

            {/* Events table */}
            {activeTab === 'events' && (
              <div className="space-y-3">
                {/* Filter by type */}
                <div className="flex gap-1.5 flex-wrap">
                  {(['ALL', 'SALE', 'REFUND', 'COMMISSION', 'FEE', 'SETTLEMENT'] as EventTypeFilter[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setEventTypeFilter(t)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        eventTypeFilter === t
                          ? 'bg-[#EA1D2C]/20 border-[#EA1D2C]/50 text-red-300'
                          : 'bg-[#141415] border-[#374151] text-gray-400 hover:text-white'
                      }`}
                    >
                      {t === 'ALL' ? 'Todos' : EVENT_TYPE_LABELS[t] ?? t}
                    </button>
                  ))}
                  <span className="ml-auto text-xs text-gray-600 self-center">{eventsTotal} lançamentos</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#374151]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#374151] bg-[#141415]">
                        <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Data</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Descrição</th>
                        <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1f20]">
                      {eventsLoading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <tr key={i}>
                              <td className="px-4 py-3"><Sk className="h-3 w-20" /></td>
                              <td className="px-4 py-3"><Sk className="h-3 w-16" /></td>
                              <td className="px-4 py-3"><Sk className="h-3 w-48" /></td>
                              <td className="px-4 py-3 text-right"><Sk className="h-3 w-20 ml-auto" /></td>
                            </tr>
                          ))
                        : events.length === 0
                        ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-12 text-center text-gray-600 text-sm">
                              Nenhum lançamento encontrado no período
                            </td>
                          </tr>
                        )
                        : events.map((ev) => (
                          <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                              {fmtDate(ev.referenceDate)}
                            </td>
                            <td className="px-4 py-3">
                              <EventTypeBadge type={ev.eventType} />
                            </td>
                            <td className="px-4 py-3 text-gray-300 text-xs max-w-xs truncate">
                              {ev.description}
                            </td>
                            <td className={`px-4 py-3 text-right font-mono text-sm font-medium ${ev.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {ev.amount >= 0 ? '+' : ''}{fmt(ev.amount)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {eventsTotalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">
                      Página {eventsPage} de {eventsTotalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEventsPage((p) => p - 1); fetchEvents(eventsPage - 1); }}
                        disabled={eventsPage <= 1 || eventsLoading}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                      >
                        <ChevLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEventsPage((p) => p + 1); fetchEvents(eventsPage + 1); }}
                        disabled={eventsPage >= eventsTotalPages || eventsLoading}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                      >
                        <ChevRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Settlements table */}
            {activeTab === 'settlements' && (
              <div className="space-y-3">
                {settlementsLoading ? (
                  <div className="rounded-xl border border-[#374151] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#141415] border-b border-[#374151]">
                          {['Data', 'Valor Bruto', 'Comissão', 'Taxas', 'Valor Líquido'].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f1f20]">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: 5 }).map((_, j) => (
                              <td key={j} className="px-4 py-3"><Sk className="h-3 w-24" /></td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : settlements.length === 0 ? (
                  <div className="rounded-xl border border-[#374151] bg-[#141415] p-12 text-center space-y-2">
                    <p className="text-gray-500 text-sm">Nenhum repasse encontrado no período.</p>
                    <p className="text-gray-600 text-xs">
                      Clique em <span className="text-gray-400 font-medium">Sincronizar</span> para buscar repasses da API iFood
                      (requer permissões especiais).
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#374151]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#374151] bg-[#141415]">
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Data do Repasse</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">Valor Bruto</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">Comissão</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">Taxas</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">Valor Líquido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f1f20]">
                        {settlements.map((s, i) => (
                          <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap flex items-center gap-2">
                              {fmtDate(s.settlementDate)}
                              {i === 0 && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] h-4">
                                  Mais recente
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs text-white">{fmt(s.grossAmount)}</td>
                            <td className="px-4 py-3 text-right font-mono text-xs text-red-400">-{fmt(s.commission)}</td>
                            <td className="px-4 py-3 text-right font-mono text-xs text-red-400">-{fmt(s.fees)}</td>
                            <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-green-400">{fmt(s.netAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event type badge
// ---------------------------------------------------------------------------
function EventTypeBadge({ type }: { type: string }) {
  const cfg: Record<string, string> = {
    SALE: 'bg-green-500/20 text-green-400 border-green-500/30',
    REFUND: 'bg-red-500/20 text-red-400 border-red-500/30',
    COMMISSION: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    FEE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    SETTLEMENT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${cfg[type] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
      {EVENT_TYPE_LABELS[type] ?? type}
    </span>
  );
}
