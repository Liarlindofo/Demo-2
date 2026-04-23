"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { DashboardSummary } from "@/types/ifood-dashboard";

interface Props {
  summary: DashboardSummary | null;
  isLoading: boolean;
  isRealtime: boolean;
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
  const orders = payload.find((p) => p.dataKey === "orders")?.value as number | undefined;
  const revenue = payload.find((p) => p.dataKey === "revenue")?.value as number | undefined;
  return (
    <div className="bg-[#1a1a1b] border border-[#374151] rounded-lg p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-2 font-medium">{label}h</p>
      <p className="text-white">
        <span className="text-gray-400">Pedidos: </span>
        {orders ?? 0}
      </p>
      {revenue !== undefined && revenue > 0 && (
        <p className="text-white">
          <span className="text-gray-400">Receita: </span>
          {`R$ ${revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
        </p>
      )}
    </div>
  );
}

export function IfoodSalesByHourChart({ summary, isLoading, isRealtime }: Props) {
  const currentHour = new Date().getHours();

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

  // Only show hours with data or the surrounding range
  const rawData = summary?.salesByHour ?? [];
  const maxHourWithData = rawData.reduce(
    (max, d) => (d.orders > 0 ? Math.max(max, d.hour) : max),
    0,
  );
  const displayEnd = isRealtime ? Math.max(currentHour, maxHourWithData, 10) : maxHourWithData || 23;
  const data = rawData.slice(0, displayEnd + 1).map((d) => ({
    hour: d.hour,
    name: `${String(d.hour).padStart(2, "0")}`,
    orders: d.orders,
    revenue: d.revenue,
  }));

  const hasData = data.some((d) => d.orders > 0);

  return (
    <Card className="bg-[#141415] border-[#374151]">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base">Pedidos por Hora</CardTitle>
        <CardDescription className="text-gray-500 text-xs">
          {isRealtime
            ? "Distribuição de pedidos de hoje · hora atual destacada"
            : "Distribuição de pedidos ao longo do dia"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[240px] flex items-center justify-center text-gray-600 text-sm">
            Nenhum pedido encontrado neste período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2e" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                tick={{ fill: "#6b7280", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#374151", opacity: 0.3 }} />
              <Bar dataKey="orders" radius={[3, 3, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={`cell-${entry.hour}`}
                    fill={
                      isRealtime && entry.hour === currentHour
                        ? "#22c55e"
                        : entry.orders > 0
                        ? "#166534"
                        : "#1f2937"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {isRealtime && (
          <p className="text-xs text-gray-600 mt-2 text-center">
            Barra verde = hora atual ({String(currentHour).padStart(2, "0")}h)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
