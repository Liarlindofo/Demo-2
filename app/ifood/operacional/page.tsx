'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/app-context';
import {
  ChevronLeft,
  ShoppingBag,
  Bike,
  Package,
  Clock,
  Phone,
  MapPin,
  Wifi,
  WifiOff,
  RefreshCw,
  User,
  CheckCircle2,
  Loader2,
  PlayCircle,
  Truck,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface IfoodConnection {
  id: string;
  merchantId: string;
  merchantName: string;
  status: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options?: Array<{ name: string; price: number }>;
  observations?: string;
}

interface PaymentMethod {
  value: number;
  method: string;
  type: string;
  cash?: { changeFor?: number };
}

interface IfoodOrder {
  id: string;
  orderId: string;
  displayId: string;
  merchantId: string;
  status: string;
  orderType: string;
  orderTiming: string;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: Record<string, string> | null;
  items: OrderItem[];
  payments: { prepaid?: number; pending?: number; methods?: PaymentMethod[] };
  totalAmount: number;
  deliveryFee: number | null;
  isTest: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Kanban columns config
// ---------------------------------------------------------------------------
const COLUMNS = [
  {
    id: 'NOVOS',
    label: 'Novos Pedidos',
    statuses: ['PLACED'],
    color: 'border-blue-500',
    headerColor: 'bg-blue-500/10 text-blue-400',
    dot: 'bg-blue-500',
  },
  {
    id: 'EM_PREPARO',
    label: 'Em Preparo',
    statuses: ['CONFIRMED', 'PREPARING'],
    color: 'border-yellow-500',
    headerColor: 'bg-yellow-500/10 text-yellow-400',
    dot: 'bg-yellow-500',
  },
  {
    id: 'SAIU_ENTREGA',
    label: 'Saiu para Entrega',
    statuses: ['DISPATCHED'],
    color: 'border-green-500',
    headerColor: 'bg-green-500/10 text-green-400',
    dot: 'bg-green-500',
  },
  {
    id: 'RETIRADA',
    label: 'Pronto para Retirada',
    statuses: ['READY_TO_PICKUP'],
    color: 'border-purple-500',
    headerColor: 'bg-purple-500/10 text-purple-400',
    dot: 'bg-purple-500',
  },
  {
    id: 'CONCLUIDOS',
    label: 'Concluídos',
    statuses: ['CONCLUDED', 'CANCELLED'],
    color: 'border-gray-600',
    headerColor: 'bg-gray-600/10 text-gray-400',
    dot: 'bg-gray-500',
  },
] as const;

// ---------------------------------------------------------------------------
// Audio alert (Web Audio API)
// ---------------------------------------------------------------------------
function playNewOrderAlert() {
  try {
    const ctx = new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    [0, 0.35, 0.7].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.35, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.28);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.28);
    });
  } catch { /* silently fail */ }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function useElapsedSeconds(isoDate: string): number {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000),
  );
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isoDate]);
  return elapsed;
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s > 0 ? ` ${s}s` : ''}`;
}

function getPaymentLabel(method: string): string {
  const map: Record<string, string> = {
    CASH: 'Dinheiro',
    CREDIT: 'Crédito',
    DEBIT: 'Débito',
    MEAL_VOUCHER: 'Vale Refeição',
    FOOD_VOUCHER: 'Vale Alimentação',
    PIX: 'PIX',
    ONLINE: 'Online',
  };
  return map[method] ?? method;
}

function summarizeItems(items: OrderItem[]): string {
  return items
    .slice(0, 2)
    .map((i) => `${i.quantity}x ${i.name}`)
    .join(', ')
    .concat(items.length > 2 ? ` +${items.length - 2} mais` : '');
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function CountdownBadge({ createdAt }: { createdAt: string }) {
  const elapsed = useElapsedSeconds(createdAt);
  const LIMIT = 3 * 60;
  const remaining = LIMIT - elapsed;
  if (remaining <= 0) {
    return <span className="text-xs text-red-400 font-bold animate-pulse">⚠ EXPIRADO</span>;
  }
  const urgent = remaining < 60;
  return (
    <span className={`text-xs font-bold ${urgent ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
      ⏱ {formatElapsed(remaining)}
    </span>
  );
}

function ElapsedBadge({ createdAt }: { createdAt: string }) {
  const elapsed = useElapsedSeconds(createdAt);
  return (
    <span className="text-xs text-gray-500 flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {formatElapsed(elapsed)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Order Card
// ---------------------------------------------------------------------------
function OrderCard({
  order,
  onCardClick,
  onConfirm,
  onStartPrep,
  onDispatch,
  onReadyToPickup,
  actionLoading,
}: {
  order: IfoodOrder;
  onCardClick: (o: IfoodOrder) => void;
  onConfirm: (o: IfoodOrder) => void;
  onStartPrep: (o: IfoodOrder) => void;
  onDispatch: (o: IfoodOrder) => void;
  onReadyToPickup: (o: IfoodOrder) => void;
  actionLoading: Record<string, boolean>;
}) {
  const isDelivery = order.orderType === 'DELIVERY';
  const isPlaced = order.status === 'PLACED';
  const isConfirmed = order.status === 'CONFIRMED';
  const isPreparing = order.status === 'PREPARING';
  const isConcluded = order.status === 'CONCLUDED';
  const isCancelled = order.status === 'CANCELLED';
  const loading = actionLoading[order.orderId];
  const primaryPayment = order.payments?.methods?.[0];

  return (
    <Card
      className="bg-[#1a1a1a] border-[#374151] rounded-xl cursor-pointer hover:border-[#EA1D2C]/40 transition-all mb-3 select-none"
      onClick={() => onCardClick(order)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold text-lg ${isCancelled ? 'text-gray-500 line-through' : 'text-white'}`}>
              #{order.displayId}
            </span>
            {order.isTest && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] px-1.5 py-0">
                TESTE
              </Badge>
            )}
            {order.orderTiming === 'SCHEDULED' && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0">
                AGENDADO
              </Badge>
            )}
            {isCancelled && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                CANCELADO
              </Badge>
            )}
            {isConcluded && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
                CONCLUÍDO
              </Badge>
            )}
          </div>
          {isDelivery ? (
            <Bike className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          ) : (
            <Package className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
          )}
        </div>

        {/* Customer */}
        {order.customerName && (
          <p className="text-gray-300 text-sm font-medium truncate">{order.customerName}</p>
        )}

        {/* Items summary */}
        <p className="text-gray-500 text-xs leading-relaxed">{summarizeItems(order.items)}</p>

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold">{formatCurrency(order.totalAmount)}</span>
          {primaryPayment && (
            <span className="text-gray-500 text-xs">{getPaymentLabel(primaryPayment.method)}</span>
          )}
        </div>

        {/* Timer */}
        <div className="flex items-center justify-between">
          {isPlaced ? (
            <CountdownBadge createdAt={order.createdAt} />
          ) : (
            <ElapsedBadge createdAt={order.createdAt} />
          )}
          <Badge
            className={`text-[10px] px-1.5 py-0 ${
              isDelivery
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            }`}
          >
            {isDelivery ? 'Delivery' : 'Retirada'}
          </Badge>
        </div>

        {/* Botões de ação — não propagam clique para o modal */}
        {(isPlaced || isConfirmed || isPreparing) && (
          <div onClick={(e) => e.stopPropagation()}>
            {isPlaced && (
              <Button
                size="sm"
                disabled={loading}
                onClick={() => onConfirm(order)}
                className="w-full bg-green-700/30 hover:bg-green-700/50 text-green-400 border border-green-700/40 text-xs h-8"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                  <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Confirmar</>
                )}
              </Button>
            )}

            {isConfirmed && (
              <Button
                size="sm"
                disabled={loading}
                onClick={() => onStartPrep(order)}
                className="w-full bg-blue-700/30 hover:bg-blue-700/50 text-blue-400 border border-blue-700/40 text-xs h-8"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                  <><PlayCircle className="h-3.5 w-3.5 mr-1.5" />Iniciar Preparo</>
                )}
              </Button>
            )}

            {isPreparing && isDelivery && (
              <Button
                size="sm"
                disabled={loading}
                onClick={() => onDispatch(order)}
                className="w-full bg-orange-700/30 hover:bg-orange-700/50 text-orange-400 border border-orange-700/40 text-xs h-8"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                  <><Truck className="h-3.5 w-3.5 mr-1.5" />Despachar</>
                )}
              </Button>
            )}

            {isPreparing && !isDelivery && (
              <Button
                size="sm"
                disabled={loading}
                onClick={() => onReadyToPickup(order)}
                className="w-full bg-purple-700/30 hover:bg-purple-700/50 text-purple-400 border border-purple-700/40 text-xs h-8"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                  <><Package className="h-3.5 w-3.5 mr-1.5" />Pronto p/ Retirada</>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Order Detail Modal — somente leitura
// ---------------------------------------------------------------------------
function OrderDetailModal({
  order,
  onClose,
}: {
  order: IfoodOrder | null;
  onClose: () => void;
}) {
  if (!order) return null;

  const isDelivery = order.orderType === 'DELIVERY';
  const primaryPayment = order.payments?.methods?.[0];
  const changeFor = primaryPayment?.cash?.changeFor;
  const addr = order.deliveryAddress;
  const itemsTotal = order.items.reduce((sum, i) => sum + i.totalPrice, 0);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#EA1D2C]" />
            Pedido #{order.displayId}
            {order.isTest && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 ml-1">TESTE</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Customer */}
          {order.customerName && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300">{order.customerName}</span>
              {order.customerPhone && (
                <a
                  href={`tel:${order.customerPhone}`}
                  className="ml-auto flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {order.customerPhone}
                </a>
              )}
            </div>
          )}

          {/* Delivery address */}
          {isDelivery && addr && (
            <div className="bg-black/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-sm font-medium mb-1">
                <MapPin className="h-3.5 w-3.5" />
                Endereço de Entrega
              </div>
              {addr.formattedAddress ? (
                <p className="text-white text-sm">{addr.formattedAddress}</p>
              ) : (
                <p className="text-white text-sm">
                  {addr.streetName} {addr.streetNumber}
                  {addr.neighborhood ? `, ${addr.neighborhood}` : ''}
                  {addr.city ? ` — ${addr.city}/${addr.state}` : ''}
                </p>
              )}
              {addr.reference && (
                <p className="text-gray-400 text-xs">Ref: {addr.reference}</p>
              )}
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Itens</p>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="bg-black/20 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <span className="text-white text-sm font-medium">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-gray-300 text-sm ml-2 shrink-0">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                  {item.options && item.options.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {item.options.map((opt, oi) => (
                        <div key={oi} className="flex justify-between text-xs text-gray-400">
                          <span>+ {opt.name}</span>
                          {opt.price > 0 && <span>{formatCurrency(opt.price)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {item.observations && (
                    <p className="text-xs text-yellow-400 mt-1">Obs: {item.observations}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-black/20 rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(itemsTotal)}</span>
            </div>
            {(order.deliveryFee ?? 0) > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>Taxa de entrega</span>
                <span>{formatCurrency(order.deliveryFee!)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-semibold border-t border-[#374151] pt-1.5 mt-1.5">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {/* Payment */}
          {primaryPayment && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Pagamento</span>
              <div className="text-right">
                <p className="text-white">{getPaymentLabel(primaryPayment.method)}</p>
                {primaryPayment.type === 'OFFLINE' && (
                  <p className="text-xs text-gray-500">Na entrega</p>
                )}
                {changeFor && changeFor > order.totalAmount && (
                  <p className="text-xs text-yellow-400">
                    Troco para {formatCurrency(changeFor)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status info */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
            <p className="text-blue-400 text-xs text-center">
              As ações deste pedido são realizadas diretamente pelo app do iFood.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#374151] text-white hover:bg-[#374151]"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// iFood subnav tabs
// ---------------------------------------------------------------------------
const IFOOD_TABS = [
  { label: 'Configurações', href: '/ifood/configuracoes' },
  { label: 'Operacional', href: '/ifood/operacional', active: true },
  { label: 'Financeiro', href: '/ifood/financeiro' },
  { label: 'Cardápio', href: '/ifood/cardapio' },
];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function IfoodOperacionalPage() {
  const { addToast } = useApp();

  const [stores, setStores] = useState<IfoodConnection[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<string>('');
  const [orders, setOrders] = useState<IfoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pollingOk, setPollingOk] = useState(true);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);

  const [detailOrder, setDetailOrder] = useState<IfoodOrder | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  // -----------------------------------------------------------------------
  // Load connected stores
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
          list[0]?.merchantId ||
          '';

        setSelectedMerchant(initial);
      })
      .catch(() => addToast('❌ Erro ao carregar lojas', 'error'));
  }, [addToast]);

  // -----------------------------------------------------------------------
  // Persist store selection
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (selectedMerchant) {
      localStorage.setItem('ifood_selected_merchant', selectedMerchant);
    }
  }, [selectedMerchant]);

  // -----------------------------------------------------------------------
  // Fetch orders
  // -----------------------------------------------------------------------
  const fetchOrders = useCallback(async (silent = false) => {
    if (!selectedMerchant) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`/api/ifood/orders?merchantId=${selectedMerchant}`);
      if (!res.ok) throw new Error('Erro ao buscar pedidos');
      const data = (await res.json()) as { orders: IfoodOrder[] };
      const incoming = data.orders ?? [];

      // Detectar novos pedidos PLACED para alertar
      const incomingIds = new Set(incoming.map((o) => o.orderId));
      const newPlaced = incoming.filter(
        (o) => o.status === 'PLACED' && !prevOrderIdsRef.current.has(o.orderId),
      );
      if (newPlaced.length > 0 && prevOrderIdsRef.current.size > 0) {
        playNewOrderAlert();
        addToast(`🛵 ${newPlaced.length} novo(s) pedido(s) chegou!`, 'success');
      }
      prevOrderIdsRef.current = incomingIds;

      setOrders(incoming);
      setPollingOk(true);
      setLastPoll(new Date());
    } catch {
      setPollingOk(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMerchant, addToast]);

  // Initial load + polling a cada 15s
  useEffect(() => {
    if (!selectedMerchant) return;
    fetchOrders(false);
    const id = setInterval(() => fetchOrders(true), 15_000);
    return () => clearInterval(id);
  }, [selectedMerchant, fetchOrders]);

  // -----------------------------------------------------------------------
  // Helpers de loading e update otimista
  // -----------------------------------------------------------------------
  function setLoaderOn(orderId: string) {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
  }
  function setLoaderOff(orderId: string) {
    setActionLoading((prev) => ({ ...prev, [orderId]: false }));
  }
  function optimistic(orderId: string, status: string) {
    setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status } : o)));
  }

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------
  async function handleConfirm(order: IfoodOrder) {
    setLoaderOn(order.orderId);
    optimistic(order.orderId, 'CONFIRMED');
    try {
      const res = await fetch(`/api/ifood/orders/${order.orderId}/confirm`, { method: 'POST' });
      if (!res.ok) throw new Error();
      addToast(`✅ Pedido #${order.displayId} confirmado!`, 'success');
    } catch {
      optimistic(order.orderId, 'PLACED');
      addToast(`❌ Erro ao confirmar pedido #${order.displayId}`, 'error');
    } finally {
      setLoaderOff(order.orderId);
    }
  }

  async function handleStartPrep(order: IfoodOrder) {
    setLoaderOn(order.orderId);
    optimistic(order.orderId, 'PREPARING');
    try {
      const res = await fetch(`/api/ifood/orders/${order.orderId}/startPreparation`, { method: 'POST' });
      if (!res.ok) throw new Error();
      addToast(`🍳 Preparo iniciado — Pedido #${order.displayId}`, 'success');
    } catch {
      optimistic(order.orderId, 'CONFIRMED');
      addToast(`❌ Erro ao iniciar preparo do pedido #${order.displayId}`, 'error');
    } finally {
      setLoaderOff(order.orderId);
    }
  }

  async function handleDispatch(order: IfoodOrder) {
    setLoaderOn(order.orderId);
    optimistic(order.orderId, 'DISPATCHED');
    try {
      const res = await fetch(`/api/ifood/orders/${order.orderId}/dispatch`, { method: 'POST' });
      if (!res.ok) throw new Error();
      addToast(`🛵 Pedido #${order.displayId} despachado!`, 'success');
    } catch {
      optimistic(order.orderId, 'PREPARING');
      addToast(`❌ Erro ao despachar pedido #${order.displayId}`, 'error');
    } finally {
      setLoaderOff(order.orderId);
    }
  }

  async function handleReadyToPickup(order: IfoodOrder) {
    setLoaderOn(order.orderId);
    optimistic(order.orderId, 'READY_TO_PICKUP');
    try {
      const res = await fetch(`/api/ifood/orders/${order.orderId}/readyToPickup`, { method: 'POST' });
      if (!res.ok) throw new Error();
      addToast(`📦 Pedido #${order.displayId} pronto para retirada!`, 'success');
    } catch {
      optimistic(order.orderId, 'PREPARING');
      addToast(`❌ Erro ao atualizar pedido #${order.displayId}`, 'error');
    } finally {
      setLoaderOff(order.orderId);
    }
  }

  // -----------------------------------------------------------------------
  // Columns
  // -----------------------------------------------------------------------
  function getColumnOrders(statuses: readonly string[]) {
    return orders.filter((o) => statuses.includes(o.status));
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const selectedStore = stores.find((s) => s.merchantId === selectedMerchant);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-[#141415]/95 backdrop-blur-sm border-b border-[#374151] sticky top-0 z-40">
        <div className="max-w-full px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#EA1D2C]" />
            <span className="font-semibold">iFood</span>
          </div>

          {/* Store selector */}
          {stores.length > 1 && (
            <div className="ml-2 w-52">
              <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#374151] text-white h-8 text-sm">
                  <SelectValue placeholder="Selecionar loja" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#374151] text-white">
                  {stores.map((s) => (
                    <SelectItem
                      key={s.merchantId}
                      value={s.merchantId}
                      className="hover:bg-[#374151] focus:bg-[#374151]"
                    >
                      {s.merchantName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {stores.length === 1 && selectedStore && (
            <span className="text-gray-400 text-sm">{selectedStore.merchantName}</span>
          )}

          {/* Polling status */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              {pollingOk ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-green-400 hidden sm:block">Polling ativo</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                  <span className="text-red-400 hidden sm:block">Desconectado</span>
                </>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={refreshing}
              onClick={() => fetchOrders(true)}
              className="h-7 w-7 p-0 text-gray-400 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Subnav */}
        <div className="px-4 sm:px-6">
          <nav className="flex gap-1">
            {IFOOD_TABS.map((tab) =>
              'active' in tab && tab.active ? (
                <span
                  key={tab.href}
                  className="px-4 py-2.5 text-sm font-medium text-white border-b-2 border-[#EA1D2C]"
                >
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

      {/* Body */}
      <main className="p-4 sm:p-6">
        {/* No stores */}
        {stores.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma loja conectada</h3>
            <p className="text-gray-400 mb-4">
              Conecte uma loja iFood antes de usar o painel operacional.
            </p>
            <Link href="/ifood/configuracoes">
              <Button className="bg-[#EA1D2C] hover:bg-[#c9111f] text-white">
                Ir para Configurações
              </Button>
            </Link>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && stores.length > 0 && (
          <div className="flex gap-4">
            {COLUMNS.map((col) => (
              <div key={col.id} className="flex-shrink-0 w-72">
                <div className={`rounded-lg p-3 mb-3 ${col.headerColor}`}>
                  <div className="h-4 bg-white/10 rounded animate-pulse w-32" />
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="bg-[#1a1a1a] rounded-xl p-4 mb-3 animate-pulse space-y-2">
                    <div className="h-4 bg-white/10 rounded w-20" />
                    <div className="h-3 bg-white/5 rounded w-32" />
                    <div className="h-3 bg-white/5 rounded w-24" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Last poll time */}
        {lastPoll && !loading && (
          <p className="text-gray-600 text-xs mb-4">
            Última atualização: {lastPoll.toLocaleTimeString('pt-BR')}
          </p>
        )}

        {/* Kanban */}
        {!loading && stores.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => {
              const colOrders = getColumnOrders(col.statuses);
              return (
                <div key={col.id} className="flex-shrink-0 w-72">
                  {/* Column header */}
                  <div className={`flex items-center justify-between rounded-lg px-3 py-2 mb-3 ${col.headerColor} border ${col.color}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <span className="font-semibold text-sm">{col.label}</span>
                    </div>
                    <Badge className="bg-white/10 text-current border-0 text-xs">
                      {colOrders.length}
                    </Badge>
                  </div>

                  {/* Cards */}
                  <div className="space-y-0">
                    {colOrders.length === 0 ? (
                      <div className="text-gray-600 text-sm text-center py-8 border border-dashed border-[#374151] rounded-xl">
                        Nenhum pedido
                      </div>
                    ) : (
                      colOrders.map((order) => (
                        <OrderCard
                          key={order.orderId}
                          order={order}
                          onCardClick={(o) => setDetailOrder(o)}
                          onConfirm={handleConfirm}
                          onStartPrep={handleStartPrep}
                          onDispatch={handleDispatch}
                          onReadyToPickup={handleReadyToPickup}
                          actionLoading={actionLoading}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de detalhes (somente leitura) */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
        />
      )}
    </div>
  );
}
