"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardSummary } from "@/types/ifood-dashboard";

interface Props {
  summary: DashboardSummary | null;
  isLoading: boolean;
  periodLabel: string;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#374151]/40 rounded ${className ?? ""}`} />;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1b] border border-[#374151] rounded-lg p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-white">
          <span className="text-gray-400">{p.dataKey === "revenue" ? "Receita: " : "Pedidos: "}</span>
          {p.dataKey === "revenue"
            ? `R$ ${(p.value as number).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            : p.value}
        </p>
      ))}
    </div>
  );
}

export function IfoodSalesByDayChart({ summary, isLoading, periodLabel }: Props) {
  if (isLoading) {
    return (
      <Card className="bg-[#141415] border-[#374151]">
        <CardHeader>
          <Skeleton className="h-4 w-48 mb-1" />
          <Skeleton className="h-3 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[240px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const data =
    summary?.salesByDay.map((d) => ({
      name: format(new Date(d.date + "T12:00:00"), "dd/MM", { locale: ptBR }),
      revenue: d.revenue,
      orders: d.orders,
    })) ?? [];

  const hasData = data.some((d) => d.revenue > 0);

  return (
    <Card className="bg-[#141415] border-[#374151]">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base">Vendas por Dia</CardTitle>
        <CardDescription className="text-gray-500 text-xs">
          {periodLabel} · Receita dos pedidos aceitos
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[240px] flex items-center justify-center text-gray-600 text-sm">
            Nenhum pedido encontrado neste período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ifoodRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2e" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v}`
                }
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#ifoodRevenueGrad)"
                dot={{ fill: "#22c55e", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#22c55e" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
