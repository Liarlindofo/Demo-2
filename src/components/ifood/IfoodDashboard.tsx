"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IfoodStoreCarousel } from "./IfoodStoreCarousel";
import { PeriodSelector } from "./PeriodSelector";
import { RealtimeIndicator } from "./RealtimeIndicator";
import { IfoodKPICards } from "./IfoodKPICards";
import { IfoodSalesByDayChart } from "./IfoodSalesByDayChart";
import { IfoodSalesByHourChart } from "./IfoodSalesByHourChart";
import {
  IfoodConnection,
  Period,
  DashboardSummary,
  RealtimeData,
} from "@/types/ifood-dashboard";
import { AlertTriangle, Store } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STORAGE_KEY_MERCHANT = "ifood_selected_merchant";
const STORAGE_KEY_PERIOD = "ifood_selected_period_type";
const POLLING_INTERVAL_MS = 60_000;

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function buildPeriod(type: Period["type"]): Period {
  const today = getToday();
  const sub = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split("T")[0];
  };
  switch (type) {
    case "1D": return { type, startDate: today, endDate: today };
    case "7D": return { type, startDate: sub(6), endDate: today };
    case "15D": return { type, startDate: sub(14), endDate: today };
    case "30D": return { type, startDate: sub(29), endDate: today };
    default: return { type: "1D", startDate: today, endDate: today };
  }
}

function periodLabel(period: Period): string {
  if (period.type === "custom") {
    const s = format(new Date(period.startDate + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR });
    const e = format(new Date(period.endDate + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR });
    return s === e ? s : `${s} – ${e}`;
  }
  return period.type;
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-[#141415] border border-[#374151] rounded-2xl flex items-center justify-center mb-5">
        <Store className="h-9 w-9 text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Nenhuma loja iFood conectada
      </h3>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        Conecte sua loja iFood para visualizar os dados em tempo real aqui.
      </p>
      <Button asChild className="bg-[#22c55e] text-black hover:bg-[#16a34a]">
        <Link href="/ifood/configuracoes">Conectar Loja</Link>
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function IfoodDashboard() {
  const [connections, setConnections] = useState<IfoodConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(true);

  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("all");
  const [period, setPeriod] = useState<Period>(buildPeriod("1D"));

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRealtime = period.type === "1D";

  // ---------------------------------------------------------------------------
  // Fetch connections + statuses on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadConnections() {
      setConnectionsLoading(true);
      try {
        const res = await fetch("/api/ifood/merchants/status-all");
        if (!res.ok) throw new Error("Erro ao carregar lojas");
        const data = (await res.json()) as { connections: IfoodConnection[] };
        setConnections(data.connections ?? []);
      } catch {
        setConnections([]);
      } finally {
        setConnectionsLoading(false);
      }
    }
    loadConnections();
  }, []);

  // Restore persisted selection
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedMerchant = localStorage.getItem(STORAGE_KEY_MERCHANT);
    if (savedMerchant) setSelectedMerchantId(savedMerchant);
    const savedPeriodType = localStorage.getItem(STORAGE_KEY_PERIOD) as Period["type"] | null;
    if (savedPeriodType && ["1D","7D","15D","30D"].includes(savedPeriodType)) {
      setPeriod(buildPeriod(savedPeriodType));
    }
  }, []);

  // Persist selection changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MERCHANT, selectedMerchantId);
    }
  }, [selectedMerchantId]);

  useEffect(() => {
    if (typeof window !== "undefined" && period.type !== "custom") {
      localStorage.setItem(STORAGE_KEY_PERIOD, period.type);
    }
  }, [period]);

  // ---------------------------------------------------------------------------
  // Fetch summary
  // ---------------------------------------------------------------------------
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const params = new URLSearchParams({
        merchantId: selectedMerchantId,
        startDate: period.startDate,
        endDate: period.endDate,
      });
      const res = await fetch(`/api/ifood/dashboard/summary?${params}`);
      if (!res.ok) return;
      const data = (await res.json()) as DashboardSummary;
      setSummary(data);
      setLastFetchedAt(new Date());
    } catch {
      // keep previous data
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedMerchantId, period]);

  // ---------------------------------------------------------------------------
  // Fetch realtime
  // ---------------------------------------------------------------------------
  const fetchRealtime = useCallback(async () => {
    try {
      const params = new URLSearchParams({ merchantId: selectedMerchantId });
      const res = await fetch(`/api/ifood/dashboard/realtime?${params}`);
      if (!res.ok) return;
      const data = (await res.json()) as RealtimeData;
      setRealtimeData(data);
      setLastFetchedAt(new Date());
    } catch {
      // keep previous data
    }
  }, [selectedMerchantId]);

  // Reload summary when merchant or period changes
  useEffect(() => {
    if (connectionsLoading) return;
    fetchSummary();
  }, [fetchSummary, connectionsLoading]);

  // Polling for realtime mode
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (!isRealtime || connectionsLoading) return;

    // Initial realtime fetch
    fetchRealtime();

    pollingRef.current = setInterval(() => {
      fetchSummary();
      fetchRealtime();
    }, POLLING_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isRealtime, fetchSummary, fetchRealtime, connectionsLoading]);

  // ---------------------------------------------------------------------------
  // Handle sync (manual)
  // ---------------------------------------------------------------------------
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSync = useCallback(async (merchantId: string) => {
    setSyncingId(merchantId);
    try {
      // Re-fetch status for all stores after sync
      await fetch("/api/ifood/merchants/status-all");
      await fetchSummary();
    } finally {
      setSyncingId(null);
    }
  }, [fetchSummary]);

  // ---------------------------------------------------------------------------
  // Handle store selection
  // ---------------------------------------------------------------------------
  const handleSelectMerchant = useCallback((id: string) => {
    setSelectedMerchantId(id);
    setSummary(null);
  }, []);

  const handlePeriodChange = useCallback((newPeriod: Period) => {
    setPeriod(newPeriod);
    setSummary(null);
    setRealtimeData(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Determine selected store status
  // ---------------------------------------------------------------------------
  const selectedStore = connections.find((c) => c.merchantId === selectedMerchantId);
  const isSelectedOffline =
    selectedStore &&
    selectedMerchantId !== "all" &&
    (selectedStore.ifoodStatus === "CLOSED" || selectedStore.status === "inactive" || selectedStore.status === "error");

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (connectionsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-44 h-36 bg-[#141415] border border-[#374151] rounded-xl" />
          ))}
        </div>
        <div className="h-9 w-72 bg-[#141415] border border-[#374151] rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#141415] border border-[#374151] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🛵</span> iFood
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {selectedMerchantId === "all"
              ? `${connections.length} loja(s) conectada(s) · visão consolidada`
              : selectedStore?.merchantName ?? ""}
          </p>
        </div>
      </div>

      {/* Store carousel */}
      <IfoodStoreCarousel
        stores={connections}
        selectedId={selectedMerchantId}
        onSelect={handleSelectMerchant}
        onSync={handleSync}
        syncingId={syncingId}
      />

      {/* Period + realtime indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <PeriodSelector value={period} onChange={handlePeriodChange} />
        <RealtimeIndicator
          isRealtime={isRealtime}
          realtimeData={realtimeData}
          lastFetchedAt={lastFetchedAt}
        />
      </div>

      {/* Offline banner */}
      {isSelectedOffline && (
        <Alert className="bg-yellow-500/10 border-yellow-500/30">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-300 text-sm flex items-center justify-between flex-wrap gap-2">
            <span>Sua loja está offline no iFood</span>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-7 text-xs border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
            >
              <Link href="/ifood/configuracoes">Ver detalhes</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <IfoodKPICards
        summary={summary}
        isLoading={summaryLoading}
        isRealtime={isRealtime}
      />

      {/* Charts */}
      {period.type !== "1D" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <IfoodSalesByDayChart
            summary={summary}
            isLoading={summaryLoading}
            periodLabel={periodLabel(period)}
          />
          <IfoodSalesByHourChart
            summary={summary}
            isLoading={summaryLoading}
            isRealtime={isRealtime}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <IfoodSalesByHourChart
            summary={summary}
            isLoading={summaryLoading}
            isRealtime={isRealtime}
          />
          <IfoodSalesByDayChart
            summary={summary}
            isLoading={summaryLoading}
            periodLabel={periodLabel(period)}
          />
        </div>
      )}
    </div>
  );
}
