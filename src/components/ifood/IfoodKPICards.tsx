"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, Users, XCircle } from "lucide-react";
import { DashboardSummary } from "@/types/ifood-dashboard";

interface Props {
  summary: DashboardSummary | null;
  isLoading: boolean;
  isRealtime: boolean;
}

function pctChange(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((current - prev) / prev) * 100;
}

function VariationBadge({ current, prev }: { current: number; prev: number }) {
  const pct = pctChange(current, prev);
  if (pct === null) return null;
  const positive = pct >= 0;
  return (
    <span
      className={`text-xs font-semibold ${
        positive ? "text-green-400" : "text-red-400"
      }`}
    >
      {positive ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#374151]/40 rounded ${className ?? ""}`} />;
}

export function IfoodKPICards({ summary, isLoading, isRealtime }: Props) {
  const cards = [
    {
      title: "Vendas",
      tooltip: "Total de receita dos pedidos não cancelados no período",
      icon: DollarSign,
      color: "text-green-400",
      value: summary
        ? `R$ ${summary.totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : "R$ 0,00",
      current: summary?.totalSales ?? 0,
      prev: summary?.prevTotalSales ?? 0,
    },
    {
      title: "Pedidos",
      tooltip: "Total de pedidos aceitos (excluindo cancelados e de teste)",
      icon: ShoppingCart,
      color: "text-blue-400",
      value: summary ? summary.totalOrders.toString() : "0",
      current: summary?.totalOrders ?? 0,
      prev: summary?.prevTotalOrders ?? 0,
    },
    {
      title: "Ticket Médio",
      tooltip: "Receita total dividida pelo número de pedidos no período",
      icon: TrendingUp,
      color: "text-purple-400",
      value: summary
        ? `R$ ${summary.averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : "R$ 0,00",
      current: summary?.averageTicket ?? 0,
      prev: summary?.prevAverageTicket ?? 0,
    },
    {
      title: "Clientes Únicos",
      tooltip: "Número de telefones distintos que fizeram pedidos no período",
      icon: Users,
      color: "text-orange-400",
      value: summary ? summary.uniqueCustomers.toString() : "0",
      current: summary?.uniqueCustomers ?? 0,
      prev: summary?.prevUniqueCustomers ?? 0,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-[#141415] border-[#374151]">
            <CardContent className="p-5">
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-7 w-32 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const hasOrders = (summary?.totalOrders ?? 0) > 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className={`bg-[#141415] border-[#374151] transition-all duration-300 ${
              isRealtime && hasOrders ? "ring-1 ring-green-500/20" : ""
            }`}
            title={card.tooltip}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {card.title}
                </p>
                <card.icon className={`h-4 w-4 ${card.color} opacity-70`} />
              </div>
              <p
                className={`text-2xl font-bold ${
                  hasOrders ? "text-white" : "text-gray-600"
                }`}
              >
                {card.value}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <VariationBadge current={card.current} prev={card.prev} />
                {card.prev > 0 && (
                  <span className="text-xs text-gray-600">vs período anterior</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cancelled orders notice */}
      {(summary?.cancelledOrders ?? 0) > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <XCircle className="h-3.5 w-3.5 text-red-500/60" />
          <span>
            {summary!.cancelledOrders} pedido(s) cancelado(s) no período — não incluídos nos KPIs
          </span>
        </div>
      )}
    </div>
  );
}
