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
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApp } from '@/contexts/app-context';
import {
  ChevronLeft,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  XCircle,
  Bike,
  Package,
  Clock,
  Phone,
  MapPin,
  AlertTriangle,
  Wifi,
  WifiOff,
  RefreshCw,
  User,
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

interface CancellationReason {
  cancelCodeId: string;
  description: string;
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
  const LIMIT = 3 * 60; // 3 minutes
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
  onConfirm,
  onDispatch,
  onReject,
  onCardClick,
  actionLoading,
}: {
  order: IfoodOrder;
  onConfirm: (o: IfoodOrder) => void;
  onDispatch: (o: IfoodOrder) => void;
  onReject: (o: IfoodOrder) => void;
  onCardClick: (o: IfoodOrder) => void;
  actionLoading: Record<string, boolean>;
}) {
  const isDelivery = order.orderType === 'DELIVERY';
  const isPlaced = order.status === 'PLACED';
  const isPreparing = order.status === 'CONFIRMED' || order.status === 'PREPARING';
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
            <span className="text-white font-bold text-lg">#{order.displayId}</span>
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

        {/* Action buttons */}
        {(isPlaced || isPreparing) && (
          <div
            className="flex gap-2 pt-1"
            onClick={(e) => e.stopPropagation()}
          >
            {isPlaced && (
              <>
                <Button
                  size="sm"
                  disabled={loading}
                  onClick={() => onConfirm(order)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                    <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Confirmar</>
                  )}
                </Button>
                <Button
                  size="sm"
                  disabled={loading}
                  onClick={() => onReject(order)}
                  className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 text-xs h-8"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />Recusar
                </Button>
              </>
            )}

            {isPreparing && (
              <Button
                size="sm"
                disabled={loading}
                onClick={() => onDispatch(order)}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-8"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                  isDelivery
                    ? <><Bike className="h-3.5 w-3.5 mr-1" />Pronto / Despachar</>
                    : <><Package className="h-3.5 w-3.5 mr-1" />Pronto p/ Retirada</>
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
// Order Detail Modal
// ---------------------------------------------------------------------------
function OrderDetailModal({
  order,
  onClose,
  onConfirm,
  onDispatch,
  onReject,
  actionLoading,
}: {
  order: IfoodOrder | null;
  onClose: () => void;
  onConfirm: (o: IfoodOrder) => void;
  onDispatch: (o: IfoodOrder) => void;
  onReject: (o: IfoodOrder) => void;
  actionLoading: Record<string, boolean>;
}) {
  if (!order) return null;

  const isDelivery = order.orderType === 'DELIVERY';
  const isPlaced = order.status === 'PLACED';
  const isPreparing = order.status === 'CONFIRMED' || order.status === 'PREPARING';
  const loading = actionLoading[order.orderId];
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
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#374151] text-white hover:bg-[#374151]"
          >
            Fechar
          </Button>

          {isPlaced && (
            <>
              <Button
                disabled={loading}
                onClick={() => { onReject(order); onClose(); }}
                className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Recusar
              </Button>
              <Button
                disabled={loading}
                onClick={() => { onConfirm(order); onClose(); }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : (
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                )}
                Confirmar Pedido
              </Button>
            </>
          )}

          {isPreparing && (
            <Button
              disabled={loading}
              onClick={() => { onDispatch(order); onClose(); }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : (
                isDelivery
                  ? <Bike className="h-4 w-4 mr-1.5" />
                  : <Package className="h-4 w-4 mr-1.5" />
              )}
              {isDelivery ? 'Pronto / Despachar' : 'Pronto p/ Retirada'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Cancel Modal
// ---------------------------------------------------------------------------
function CancelModal({
  order,
  onClose,
  onCancel,
}: {
  order: IfoodOrder | null;
  onClose: () => void;
  onCancel: (orderId: string, code: string) => Promise<void>;
}) {
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!order) return;
    setFetching(true);
    fetch(`/api/ifood/cancellation-reasons/${order.orderId}`)
      .then((r) => r.json())
      .then((d: { reasons?: CancellationReason[] }) => {
        setReasons(d.reasons ?? []);
        if (d.reasons?.[0]) setSelected(d.reasons[0].cancelCodeId);
      })
      .catch(() => {
        // Fallback: razões padrão
        setReasons([
          { cancelCodeId: '501', description: 'Restaurante sem capacidade' },
          { cancelCodeId: '502', description: 'Item indisponível' },
          { cancelCodeId: '503', description: 'Área de entrega não atendida' },
        ]);
        setSelected('501');
      })
      .finally(() => setFetching(false));
  }, [order]);

  if (!order) return null;

  async function handleConfirm() {
    if (!selected) return;
    setLoading(true);
    try {
      await onCancel(order!.orderId, selected);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <XCircle className="h-5 w-5" />
            Recusar Pedido #{order.displayId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300 text-sm">
              Ao recusar este pedido, o cliente será notificado pelo iFood. Esta ação não pode ser desfeita.
            </AlertDescription>
          </Alert>

          <div className="space-y-1.5">
            <label className="text-sm text-gray-300">Motivo do cancelamento</label>
            {fetching ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando motivos...
              </div>
            ) : (
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="bg-[#0f0f10] border-[#374151] text-white">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#374151] text-white">
                  {reasons.map((r) => (
                    <SelectItem
                      key={r.cancelCodeId}
                      value={r.cancelCodeId}
                      className="hover:bg-[#374151] focus:bg-[#374151]"
                    >
                      {r.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-[#374151] text-white hover:bg-[#374151]"
          >
            Voltar
          </Button>
          <Button
            disabled={loading || !selected || fetching}
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar Recusa
          </Button>
        </DialogFooter>
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

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [detailOrder, setDetailOrder] = useState<IfoodOrder | null>(null);
  const [cancelOrder, setCancelOrder] = useState<IfoodOrder | null>(null);

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

  // Initial load + polling every 15 s
  useEffect(() => {
    if (!selectedMerchant) return;
    fetchOrders(false);
    const id = setInterval(() => fetchOrders(true), 15_000);
    return () => clearInterval(id);
  }, [selectedMerchant, fetchOrders]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------
  function setOrderLoading(orderId: string, val: boolean) {
    setActionLoading((prev) => ({ ...prev, [orderId]: val }));
  }

  function optimisticUpdate(orderId: string, newStatus: string) {
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o)),
    );
  }

  async function handleConfirm(order: IfoodOrder) {
    setOrderLoading(order.orderId, true);
    optimisticUpdate(order.orderId, 'PREPARING');
    try {
      const res = await fetch(`/api/ifood/orders/${order.orderId}/confirm`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao confirmar');
      addToast(`✅ Pedido #${order.displayId} confirmado!`, 'success');
    } catch {
      optimisticUpdate(order.orderId, 'PLACED'); // rollback
      addToast(`❌ Erro ao confirmar pedido #${order.displayId}`, 'error');
    } finally {
      setOrderLoading(order.orderId, false);
    }
  }

  async function handleDispatch(order: IfoodOrder) {
    const isDelivery = order.orderType === 'DELIVERY';
    const endpoint = isDelivery
      ? `/api/ifood/orders/${order.orderId}/dispatch`
      : `/api/ifood/orders/${order.orderId}/readyToPickup`;
    const newStatus = isDelivery ? 'DISPATCHED' : 'READY_TO_PICKUP';

    setOrderLoading(order.orderId, true);
    optimisticUpdate(order.orderId, newStatus);
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao despachar');
      addToast(
        isDelivery
          ? `🛵 Pedido #${order.displayId} despachado!`
          : `📦 Pedido #${order.displayId} pronto para retirada!`,
        'success',
      );
    } catch {
      optimisticUpdate(order.orderId, order.status); // rollback
      addToast(`❌ Erro ao atualizar pedido #${order.displayId}`, 'error');
    } finally {
      setOrderLoading(order.orderId, false);
    }
  }

  async function handleCancel(orderId: string, code: string) {
    const order = orders.find((o) => o.orderId === orderId);
    setOrderLoading(orderId, true);
    try {
      const res = await fetch(`/api/ifood/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationCode: code }),
      });
      if (!res.ok) throw new Error('Falha ao cancelar');
      optimisticUpdate(orderId, 'CANCELLED');
      addToast(`🗑️ Pedido #${order?.displayId ?? ''} cancelado`, 'success');
    } catch {
      addToast(`❌ Erro ao cancelar pedido`, 'error');
    } finally {
      setOrderLoading(orderId, false);
    }
  }

  // -----------------------------------------------------------------------
  // Columns
  // -----------------------------------------------------------------------
  const activeOrders = orders.filter(
    (o) => !['CONCLUDED', 'CANCELLED'].includes(o.status),
  );

  function getColumnOrders(statuses: readonly string[]) {
    return activeOrders.filter((o) => statuses.includes(o.status));
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
                          onConfirm={handleConfirm}
                          onDispatch={handleDispatch}
                          onReject={(o) => setCancelOrder(o)}
                          onCardClick={(o) => setDetailOrder(o)}
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

      {/* Modals */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onConfirm={(o) => { handleConfirm(o); }}
          onDispatch={(o) => { handleDispatch(o); }}
          onReject={(o) => { setCancelOrder(o); }}
          actionLoading={actionLoading}
        />
      )}

      {cancelOrder && (
        <CancelModal
          order={cancelOrder}
          onClose={() => setCancelOrder(null)}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
