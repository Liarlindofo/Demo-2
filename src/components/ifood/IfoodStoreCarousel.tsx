"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Store } from "lucide-react";
import { IfoodConnection } from "@/types/ifood-dashboard";

interface Props {
  stores: IfoodConnection[];
  selectedId: string; // merchantId or 'all'
  onSelect: (id: string) => void;
  onSync: (merchantId: string) => void;
  syncingId: string | null;
}

function statusBadge(ifoodStatus?: string | null, dbStatus?: string) {
  if (ifoodStatus === "OPEN") {
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
        🟢 Online
      </Badge>
    );
  }
  if (ifoodStatus === "CLOSED") {
    return (
      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
        ⚫ Fechado
      </Badge>
    );
  }
  if (ifoodStatus === "PAUSED") {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
        🟡 Pausado
      </Badge>
    );
  }
  if (dbStatus === "inactive" || dbStatus === "error") {
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
        🔴 Offline
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-600/20 text-gray-500 border-gray-600/30 text-xs">
      — Aguardando
    </Badge>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AllStoresCard({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all duration-200 hover:scale-105 select-none ${
        selected
          ? "bg-[#001F05]/30 border-[#22c55e] ring-2 ring-[#22c55e]/40"
          : "bg-[#141415] border-[#374151] hover:border-[#22c55e]/50"
      }`}
    >
      <CardContent className="p-4 flex flex-col items-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#001F05] to-[#22c55e]/30 flex items-center justify-center">
          <Store className="h-8 w-8 text-green-400" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-white text-sm">Todas as Lojas</p>
          <p className="text-xs text-gray-400 mt-0.5">Visão consolidada</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StoreCard({
  store,
  selected,
  onClick,
  onSync,
  isSyncing,
}: {
  store: IfoodConnection;
  selected: boolean;
  onClick: () => void;
  onSync: () => void;
  isSyncing: boolean;
}) {
  const isOnline = store.ifoodStatus === "OPEN";

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all duration-200 hover:scale-105 select-none ${
        selected
          ? "bg-[#001F05]/30 border-[#22c55e] ring-2 ring-[#22c55e]/40"
          : isOnline
          ? "bg-[#141415] border-[#374151] hover:border-[#22c55e]/50"
          : "bg-[#141415] border-[#374151] hover:border-gray-500/50"
      }`}
    >
      <CardContent className="p-4 flex flex-col items-center space-y-3">
        <div className="relative">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-[#001F05] text-white text-lg font-bold">
              {getInitials(store.merchantName)}
            </AvatarFallback>
          </Avatar>
          {/* Status dot */}
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#141415] ${
              store.ifoodStatus === "OPEN"
                ? "bg-green-500"
                : store.ifoodStatus === "PAUSED"
                ? "bg-yellow-500"
                : store.ifoodStatus === "CLOSED"
                ? "bg-gray-500"
                : "bg-red-500"
            }`}
          />
        </div>

        <div className="text-center w-full space-y-1.5">
          <p className="font-medium text-white text-sm leading-tight line-clamp-2">
            {store.merchantName}
          </p>
          {statusBadge(store.ifoodStatus, store.status)}

          <Button
            size="sm"
            variant="outline"
            className="mt-1 w-full text-xs h-7 bg-transparent border-[#374151] text-gray-300 hover:bg-[#374151] hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onSync();
            }}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function IfoodStoreCarousel({ stores, selectedId, onSelect, onSync, syncingId }: Props) {
  const allItems = [{ type: "all" as const }, ...stores.map((s) => ({ type: "store" as const, store: s }))];
  const showCarousel = allItems.length > 2;

  if (showCarousel) {
    return (
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {allItems.map((item, idx) => (
            <CarouselItem key={idx} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
              {item.type === "all" ? (
                <AllStoresCard
                  selected={selectedId === "all"}
                  onClick={() => onSelect("all")}
                />
              ) : (
                <StoreCard
                  store={item.store}
                  selected={selectedId === item.store.merchantId}
                  onClick={() => onSelect(item.store.merchantId)}
                  onSync={() => onSync(item.store.merchantId)}
                  isSyncing={syncingId === item.store.merchantId}
                />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="bg-[#141415] border-[#374151] text-white hover:bg-[#374151]" />
        <CarouselNext className="bg-[#141415] border-[#374151] text-white hover:bg-[#374151]" />
      </Carousel>
    );
  }

  return (
    <div className="flex gap-4 flex-wrap">
      <div className="w-44">
        <AllStoresCard
          selected={selectedId === "all"}
          onClick={() => onSelect("all")}
        />
      </div>
      {stores.map((store) => (
        <div key={store.merchantId} className="w-44">
          <StoreCard
            store={store}
            selected={selectedId === store.merchantId}
            onClick={() => onSelect(store.merchantId)}
            onSync={() => onSync(store.merchantId)}
            isSyncing={syncingId === store.merchantId}
          />
        </div>
      ))}
    </div>
  );
}
