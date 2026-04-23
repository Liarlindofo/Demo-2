"use client";

import { Clock, Wifi } from "lucide-react";
import { RealtimeData } from "@/types/ifood-dashboard";

interface Props {
  isRealtime: boolean;
  realtimeData: RealtimeData | null;
  lastFetchedAt: Date | null;
}

export function RealtimeIndicator({ isRealtime, realtimeData, lastFetchedAt }: Props) {
  if (!isRealtime) return null;

  const lastOrder = realtimeData
    ? {
        minutesAgo: realtimeData.lastOrderMinutesAgo,
        description: realtimeData.lastOrderDescription,
      }
    : null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
      {/* Live badge */}
      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <span className="text-green-400 text-xs font-semibold tracking-wide">AO VIVO</span>
      </div>

      {/* Update info */}
      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
        <Wifi className="h-3 w-3" />
        <span>Atualiza a cada 60s</span>
        {lastFetchedAt && (
          <span className="text-gray-600">
            · {lastFetchedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </div>

      {/* Last order */}
      {lastOrder?.minutesAgo !== null && lastOrder?.minutesAgo !== undefined && (
        <div className="flex items-center gap-1.5 bg-[#141415] border border-[#374151] rounded-full px-3 py-1 text-xs">
          <Clock className="h-3 w-3 text-gray-400" />
          <span className="text-gray-300">
            Último pedido{" "}
            <span className="text-white font-medium">
              {lastOrder.minutesAgo === 0
                ? "agora"
                : `há ${lastOrder.minutesAgo} min`}
            </span>
            {lastOrder.description && (
              <span className="text-gray-400"> · {lastOrder.description}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
