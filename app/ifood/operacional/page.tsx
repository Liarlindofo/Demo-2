'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { UserProfileDropdown } from '@/components/user-profile-dropdown';
import { Logo } from '@/components/logo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/app-context';
import {
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
  CalendarClock,
  Tag,
  FileText,
  CreditCard,
  Receipt,
  XCircle,
  AlertTriangle,
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
  options?: Array<{ name: string; price: number; quantity?: number }>;
  observations?: string;
}

interface PaymentMethod {
  value: number;
  method: string;
  type: string;
  cash?: { changeFor?: number };
}

interface OrderBenefit {
  target?: string;
  value?: number;
  sponsorshipValues?: Array<{ name: string; value: number; description?: string }>;
}

interface CancellationReason {
  cancelCodeId: string;
  description: string;
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
  customerTaxId: string | null;
  deliveryAddress: Record<string, string> | null;
  items: OrderItem[];
  payments: { prepaid?: number; pending?: number; methods?: PaymentMethod[] };
  totalAmount: number;
  deliveryFee: number | null;
  isTest: boolean;
  createdAt: string;
  scheduledDateTime: string | null;
  benefits: OrderBenefit[];
  observations: string | null;
  pickupCode: string | null;
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
    statuses: ['CONCLUDED'],
    color: 'border-gray-600',
    headerColor: 'bg-gray-600/10 text-gray-400',
    dot: 'bg-gray-500',
  },
  {
    id: 'CANCELAMENTOS',
    label: 'Cancelamentos',
    statuses: ['CANCELLED', 'DISPUTE'],
    color: 'border-red-700',
    headerColor: 'bg-red-700/10 text-red-400',
    dot: 'bg-red-500',
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
function formatCurrency(value: number | null | undefined) {
  return (Number.isFinite(value) ? (value as number) : 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function asOrderItems(items: unknown): OrderItem[] {
  return Array.isArray(items) ? (items as OrderItem[]) : [];
}

function asBenefits(benefits: unknown): OrderBenefit[] {
  return Array.isArray(benefits) ? (benefits as OrderBenefit[]) : [];
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

function summarizeItems(items: unknown): string {
  const list = asOrderItems(items);
  if (list.length === 0) return 'Sem itens';
  return list
    .slice(0, 2)
    .map((i) => `${i.quantity ?? 1}x ${i.name ?? 'Item'}`)
    .join(', ')
    .concat(list.length > 2 ? ` +${list.length - 2} mais` : '');
}

function formatScheduledDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  if (dateOnly.getTime() === today.getTime()) return `Hoje ${time}`;
  if (dateOnly.getTime() === tomorrow.getTime()) return `Amanhã ${time}`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ` ${time}`;
}

function getBenefitsTotalDiscount(benefits: OrderBenefit[]): number {
  return benefits.reduce((sum, b) => {
    const directValue = b.value ?? 0;
    const sponsorTotal = (b.sponsorshipValues ?? []).reduce((s, sv) => s + (sv.value ?? 0), 0);
    return sum + directValue + sponsorTotal;
  }, 0);
}

function formatCpfCnpj(doc: string): string {
  const digits = doc.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
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
  onCancel,
  actionLoading,
}: {
  order: IfoodOrder;
  onCardClick: (o: IfoodOrder) => void;
  onConfirm: (o: IfoodOrder) => void;
  onStartPrep: (o: IfoodOrder) => void;
  onDispatch: (o: IfoodOrder) => void;
  onReadyToPickup: (o: IfoodOrder) => void;
  onCancel: (o: IfoodOrder) => void;
  actionLoading: Record<string, boolean>;
}) {
  const isDelivery = order.orderType === 'DELIVERY';
  const isPlaced = order.status === 'PLACED';
  const isConfirmed = order.status === 'CONFIRMED';
  const isPreparing = order.status === 'PREPARING';
  const isConcluded = order.status === 'CONCLUDED';
  const isCancelled = order.status === 'CANCELLED';
  const isDispute = order.status === 'DISPUTE';
  const canCancelOrder = isPlaced || isConfirmed || isPreparing;
  const isScheduled = order.orderTiming === 'SCHEDULED';
  const loading = actionLoading[order.orderId];
  const primaryPayment = order.payments?.methods?.[0];
  const benefits = asBenefits(order.benefits);
  const hasVoucher = benefits.length > 0;
  const voucherDiscount = hasVoucher ? getBenefitsTotalDiscount(benefits) : 0;

  return (
    <Card
      className={`rounded-xl cursor-pointer transition-all mb-3 select-none border ${
        isScheduled
          ? 'bg-[#0d1a2e] border-blue-500/40 hover:border-blue-400/70'
          : !isDelivery
            ? 'bg-[#1a1a1a] border-purple-500/40 hover:border-purple-400/60'
            : 'bg-[#1a1a1a] border-[#374151] hover:border-[#EA1D2C]/40'
      }`}
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
            {isScheduled && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0">
                AGENDADO
              </Badge>
            )}
            {hasVoucher && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                VOUCHER
              </Badge>
            )}
            {isCancelled && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                CANCELADO
              </Badge>
            )}
            {isDispute && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0">
                DISPUTA
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

        {/* Agendamento */}
        {isScheduled && order.scheduledDateTime && (
          <div className="flex items-center gap-1.5 text-blue-300 text-xs bg-blue-500/10 rounded-md px-2 py-1">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium">📅 {formatScheduledDate(order.scheduledDateTime)}</span>
          </div>
        )}

        {/* Customer */}
        {order.customerName && (
          <p className="text-gray-300 text-sm font-medium truncate">{order.customerName}</p>
        )}

        {/* Items summary */}
        <p className="text-gray-500 text-xs leading-relaxed">{summarizeItems(order.items)}</p>

        {/* Voucher discount */}
        {hasVoucher && voucherDiscount > 0 && (
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
            <Tag className="h-3 w-3" />
            <span>Desconto: -{formatCurrency(voucherDiscount)}</span>
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-white font-semibold shrink-0">{formatCurrency(order.totalAmount)}</span>
          {primaryPayment && (
            primaryPayment.method === 'CASH' ? (
              <span className="text-yellow-400 text-xs font-medium text-right">
                💵 Dinheiro
                {primaryPayment.cash?.changeFor && primaryPayment.cash.changeFor > order.totalAmount
                  ? ` — Troco: ${formatCurrency(primaryPayment.cash.changeFor - order.totalAmount)}`
                  : ' — Sem troco'}
              </span>
            ) : (
              <span className="text-gray-500 text-xs">{getPaymentLabel(primaryPayment.method)}</span>
            )
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

        {/* Código de retirada — exibido com destaque na coluna "Pronto para Retirada" */}
        {order.status === 'READY_TO_PICKUP' && order.pickupCode && (
          <div className="flex items-center gap-2.5 bg-purple-500/15 border border-purple-500/30 rounded-lg px-3 py-2">
            <Package className="h-4 w-4 text-purple-400 shrink-0" />
            <div>
              <p className="text-purple-300 text-[10px] font-medium uppercase tracking-wider leading-none mb-0.5">
                Código de Retirada
              </p>
              <p className="text-purple-100 text-xl font-bold tracking-widest leading-none">
                {order.pickupCode}
              </p>
            </div>
          </div>
        )}

        {/* Botões de ação — não propagam clique para o modal */}
        {canCancelOrder && (
          <div onClick={(e) => e.stopPropagation()} className="space-y-1.5">
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

            {/* Botão cancelar — discreto, abaixo da ação principal */}
            <Button
              size="sm"
              disabled={loading}
              onClick={() => onCancel(order)}
              className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 text-xs h-7"
            >
              <XCircle className="h-3.5 w-3.5 mr-1.5" />
              Cancelar pedido
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Cancel Modal
// ---------------------------------------------------------------------------
function CancelModal({
  order,
  reasons,
  loadingReasons,
  cancelLoading,
  selectedCode,
  onSelectCode,
  onConfirm,
  onClose,
}: {
  order: IfoodOrder;
  reasons: CancellationReason[];
  loadingReasons: boolean;
  cancelLoading: boolean;
  selectedCode: string;
  onSelectCode: (code: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            Cancelar Pedido #{order.displayId}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Escolha o motivo para cancelar este pedido no iFood.
          </DialogDescription>
        </DialogHeader>

        {loadingReasons ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <p className="text-gray-400 text-sm">Selecione o motivo do cancelamento:</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {reasons.map((r) => (
                <button
                  key={r.cancelCodeId}
                  type="button"
                  onClick={() => onSelectCode(r.cancelCodeId)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    selectedCode === r.cancelCodeId
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : 'bg-black/20 border-[#374151] text-gray-300 hover:border-red-500/30 hover:bg-red-900/10'
                  }`}
                >
                  {r.description}
                </button>
              ))}
              {reasons.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-6">
                  Nenhum motivo disponível.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={cancelLoading}
            className="border-[#374151] text-white hover:bg-[#374151]"
          >
            Voltar
          </Button>
          <Button
            disabled={cancelLoading || !selectedCode || loadingReasons || reasons.length === 0}
            onClick={onConfirm}
            className="bg-red-700/30 hover:bg-red-700/50 text-red-400 border border-red-700/40"
          >
            {cancelLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><XCircle className="h-4 w-4 mr-1.5" />Confirmar Cancelamento</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
  const isScheduled = order.orderTiming === 'SCHEDULED';
  const allPayments = order.payments?.methods ?? [];
  const addr = order.deliveryAddress;
  const items = asOrderItems(order.items);
  const itemsTotal = items.reduce((sum, i) => sum + (i.totalPrice ?? 0), 0);
  const benefits = asBenefits(order.benefits);
  const hasVoucher = benefits.length > 0;
  const voucherDiscount = hasVoucher ? getBenefitsTotalDiscount(benefits) : 0;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <ShoppingBag className="h-5 w-5 text-[#EA1D2C]" />
            Pedido #{order.displayId}
            {order.isTest && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">TESTE</Badge>
            )}
            {isScheduled && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">AGENDADO</Badge>
            )}
            {hasVoucher && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">VOUCHER</Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Detalhes do pedido (somente leitura).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">

          {/* Tipo e timing do pedido */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className={`text-xs px-2 py-0.5 ${
                isDelivery
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
              }`}
            >
              {isDelivery ? (
                <><Bike className="h-3 w-3 mr-1 inline" />Delivery</>
              ) : (
                <><Package className="h-3 w-3 mr-1 inline" />Retirada</>
              )}
            </Badge>
            <Badge
              className={`text-xs px-2 py-0.5 ${
                isScheduled
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-gray-600/30 text-gray-400 border-gray-600/40'
              }`}
            >
              {isScheduled ? (
                <><CalendarClock className="h-3 w-3 mr-1 inline" />Agendado</>
              ) : (
                <><Clock className="h-3 w-3 mr-1 inline" />Imediato</>
              )}
            </Badge>
          </div>

          {/* Agendamento */}
          {isScheduled && order.scheduledDateTime && (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 rounded-lg p-3">
              <CalendarClock className="h-4 w-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-blue-300 text-xs font-medium uppercase tracking-wider">Entrega Agendada</p>
                <p className="text-white text-sm font-semibold">
                  📅 {formatScheduledDate(order.scheduledDateTime)}
                </p>
              </div>
            </div>
          )}

          {/* Voucher / Benefício */}
          {hasVoucher && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium uppercase tracking-wider">
                <Tag className="h-3.5 w-3.5" />
                Cupom / Voucher Aplicado
              </div>
              {benefits.map((b, bi) => (
                <div key={bi}>
                  {b.value && b.value > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{b.target ?? 'Desconto'}</span>
                      <span className="text-emerald-400 font-semibold">-{formatCurrency(b.value)}</span>
                    </div>
                  )}
                  {(b.sponsorshipValues ?? []).map((sv, si) => (
                    <div key={si} className="flex justify-between text-sm">
                      <span className="text-gray-300">{sv.name ?? sv.description ?? 'Desconto'}</span>
                      <span className="text-emerald-400 font-semibold">-{formatCurrency(sv.value)}</span>
                    </div>
                  ))}
                </div>
              ))}
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-sm font-bold border-t border-emerald-500/20 pt-1.5 mt-1">
                  <span className="text-emerald-300">Total de descontos</span>
                  <span className="text-emerald-400">-{formatCurrency(voucherDiscount)}</span>
                </div>
              )}
            </div>
          )}

          {/* Customer */}
          <div className="bg-black/30 rounded-lg p-3 space-y-2">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Cliente</p>
            {order.customerName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-gray-300 text-sm">{order.customerName}</span>
              </div>
            )}
            {order.customerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <a
                  href={`tel:${order.customerPhone}`}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {order.customerPhone}
                </a>
              </div>
            )}
            {order.customerTaxId && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-gray-300 text-sm">{formatCpfCnpj(order.customerTaxId)}</span>
              </div>
            )}
          </div>

          {/* Código de retirada (TAKEOUT) */}
          {!isDelivery && order.pickupCode && (
            <div className="flex items-center gap-3 bg-purple-500/15 border border-purple-500/30 rounded-lg p-3">
              <Package className="h-5 w-5 text-purple-400 shrink-0" />
              <div>
                <p className="text-purple-300 text-xs font-medium uppercase tracking-wider mb-0.5">
                  Código de Retirada
                </p>
                <p className="text-purple-100 text-2xl font-bold tracking-widest">
                  {order.pickupCode}
                </p>
              </div>
            </div>
          )}

          {/* Observations */}
          {order.observations && (
            <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-lg p-3">
              <p className="text-yellow-400 text-xs font-medium uppercase tracking-wider mb-1">
                Observações do Pedido
              </p>
              <p className="text-yellow-200 text-sm">{order.observations}</p>
            </div>
          )}

          {/* Delivery address */}
          {isDelivery && addr && (
            <div className="bg-black/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                <MapPin className="h-3.5 w-3.5" />
                Endereço de Entrega
              </div>
              {addr.formattedAddress ? (
                <p className="text-white text-sm">{addr.formattedAddress}</p>
              ) : (
                <p className="text-white text-sm">
                  {[
                    addr.streetName,
                    addr.streetNumber,
                  ].filter(Boolean).join(', ')}
                </p>
              )}
              {addr.complement && (
                <p className="text-gray-300 text-xs">Complemento: {addr.complement}</p>
              )}
              {addr.neighborhood && (
                <p className="text-gray-400 text-xs">Bairro: {addr.neighborhood}</p>
              )}
              {addr.city && (
                <p className="text-gray-400 text-xs">{addr.city}{addr.state ? `/${addr.state}` : ''}</p>
              )}
              {addr.postalCode && (
                <p className="text-gray-400 text-xs">CEP: {addr.postalCode}</p>
              )}
              {addr.reference && (
                <p className="text-yellow-400 text-xs bg-yellow-500/10 rounded px-2 py-1 mt-1">
                  📍 Referência: {addr.reference}
                </p>
              )}
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Itens do Pedido</p>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="bg-black/20 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <span className="text-white text-sm font-medium">
                      {item.quantity ?? 1}x {item.name ?? 'Item'}
                    </span>
                    <div className="text-right ml-2 shrink-0">
                      <span className="text-gray-300 text-sm">{formatCurrency(item.totalPrice)}</span>
                      {(item.quantity ?? 1) > 1 && (
                        <p className="text-gray-500 text-xs">{formatCurrency(item.unitPrice)} un.</p>
                      )}
                    </div>
                  </div>
                  {item.options && item.options.length > 0 && (
                    <div className="mt-1.5 space-y-0.5 pl-2 border-l border-[#374151]">
                      {item.options.map((opt, oi) => (
                        <div key={oi} className="flex justify-between text-xs text-gray-400">
                          <span>
                            {opt.quantity && opt.quantity > 1 ? `${opt.quantity}x ` : ''}
                            {opt.name}
                          </span>
                          {(opt.price ?? 0) > 0 && <span>+{formatCurrency(opt.price)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {item.observations && (
                    <p className="text-xs text-yellow-400 mt-1.5 bg-yellow-500/10 rounded px-2 py-1">
                      Obs: {item.observations}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-black/20 rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal dos itens</span>
              <span>{formatCurrency(itemsTotal)}</span>
            </div>
            {(order.deliveryFee ?? 0) > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>Taxa de entrega</span>
                <span>{formatCurrency(order.deliveryFee!)}</span>
              </div>
            )}
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Desconto (voucher)</span>
                <span>-{formatCurrency(voucherDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-semibold border-t border-[#374151] pt-1.5 mt-1.5">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {/* Payment */}
          {allPayments.length > 0 && (
            <div className="bg-black/30 rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
                <CreditCard className="h-3.5 w-3.5" />
                Forma de Pagamento
              </div>
              {allPayments.map((pm, pi) => {
                const isCash = pm.method === 'CASH';
                const isOnline = pm.type !== 'OFFLINE';
                const changeFor = pm.cash?.changeFor ?? 0;
                const changeAmount = changeFor > order.totalAmount ? changeFor - order.totalAmount : 0;
                return (
                  <div key={pi} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-white text-sm font-medium">{getPaymentLabel(pm.method)}</span>
                      <span className="text-gray-300 text-sm">{formatCurrency(pm.value)}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Receipt className="h-3 w-3 shrink-0" />
                      {isOnline ? (
                        <span className="text-green-400">✓ Já pago (online)</span>
                      ) : (
                        <span>Pagamento na entrega</span>
                      )}
                    </div>
                    {isCash && (
                      changeAmount > 0 ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/25 rounded px-2.5 py-1.5 space-y-0.5">
                          <p className="text-yellow-300 text-xs">
                            💵 Cliente pagará com: <span className="font-semibold">{formatCurrency(changeFor)}</span>
                          </p>
                          <p className="text-yellow-400 text-sm font-bold">
                            Troco a devolver: {formatCurrency(changeAmount)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-xs bg-black/20 rounded px-2 py-1">
                          💵 Pagamento em dinheiro — sem troco
                        </p>
                      )
                    )}
                  </div>
                );
              })}
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

  const [cancelOrder, setCancelOrder] = useState<IfoodOrder | null>(null);
  const [cancelReasons, setCancelReasons] = useState<CancellationReason[]>([]);
  const [cancelReasonsLoading, setCancelReasonsLoading] = useState(false);
  const [selectedCancelCode, setSelectedCancelCode] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

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
        // Sem merchant, fetchOrders nunca roda — libera o loading para não ficar tela preta vazia
        if (!initial) setLoading(false);
      })
      .catch(() => {
        addToast('❌ Erro ao carregar lojas', 'error');
        setLoading(false);
      });
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
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [res, resCancelled] = await Promise.all([
        fetch(`/api/ifood/orders?merchantId=${selectedMerchant}`),
        fetch(`/api/ifood/orders?merchantId=${selectedMerchant}&status=CANCELLED`),
      ]);

      if (!res.ok) throw new Error('Erro ao buscar pedidos');

      const data = (await res.json()) as { orders: IfoodOrder[] };
      const active = data.orders ?? [];

      // Cancelamentos de hoje (filtro client-side)
      const cancelledData = resCancelled.ok
        ? ((await resCancelled.json()) as { orders: IfoodOrder[] }).orders ?? []
        : [];
      const todayCancelled = cancelledData.filter(
        (o) => new Date(o.createdAt) >= todayStart,
      );

      // Mescla: pedidos ativos (inclui DISPUTE) + cancelados de hoje
      const incoming = [...active, ...todayCancelled];

      // Detectar novos pedidos PLACED para alertar
      const incomingIds = new Set(incoming.map((o) => o.orderId));
      const newPlaced = incoming.filter(
        (o) => o.status === 'PLACED' && !prevOrderIdsRef.current.has(o.orderId),
      );
      if (newPlaced.length > 0 && prevOrderIdsRef.current.size > 0) {
        playNewOrderAlert();
        addToast(`🛵 ${newPlaced.length} novo(s) pedido(s) chegou!`, 'success');
      }

      // Detectar novos pedidos em DISPUTE para alertar
      const newDispute = incoming.filter(
        (o) => o.status === 'DISPUTE' && !prevOrderIdsRef.current.has(o.orderId),
      );
      if (newDispute.length > 0 && prevOrderIdsRef.current.size > 0) {
        newDispute.forEach((o) =>
          addToast(`⚠️ iFood solicitou cancelamento do pedido #${o.displayId}`, 'error'),
        );
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

  // Initial load + polling a cada 30s
  useEffect(() => {
    if (!selectedMerchant) return;
    fetchOrders(false);
    const id = setInterval(() => fetchOrders(true), 30_000);
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

  async function handleCancel(order: IfoodOrder) {
    setCancelOrder(order);
    setCancelReasons([]);
    setSelectedCancelCode('');
    setCancelReasonsLoading(true);
    try {
      const res = await fetch(`/api/ifood/orders/${order.orderId}/cancellation-reasons`);
      const data = (await res.json()) as { reasons?: CancellationReason[] };
      const list = data.reasons ?? [];
      setCancelReasons(list);
      if (list.length > 0) setSelectedCancelCode(list[0].cancelCodeId);
    } catch {
      addToast('❌ Erro ao carregar motivos de cancelamento', 'error');
    } finally {
      setCancelReasonsLoading(false);
    }
  }

  async function handleConfirmCancel() {
    if (!cancelOrder || !selectedCancelCode || cancelLoading) return;
    const orderToCancel = cancelOrder;
    const previousStatus = orderToCancel.status;
    setCancelLoading(true);
    optimistic(orderToCancel.orderId, 'CANCELLED');
    try {
      const res = await fetch(`/api/ifood/orders/${orderToCancel.orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellationCode: selectedCancelCode }),
      });
      if (!res.ok) throw new Error();
      addToast(`✅ Pedido #${orderToCancel.displayId} cancelado.`, 'success');
      setCancelOrder(null);
    } catch {
      optimistic(orderToCancel.orderId, previousStatus);
      addToast(`❌ Erro ao cancelar pedido #${orderToCancel.displayId}`, 'error');
    } finally {
      setCancelLoading(false);
    }
  }

  // -----------------------------------------------------------------------
  // Columns
  // -----------------------------------------------------------------------
  function getColumnOrders(statuses: readonly string[]) {
    const filtered = orders.filter((o) => statuses.includes(o.status));
    // Pedidos agendados ficam no fim de cada coluna (imediatos primeiro)
    return [
      ...filtered.filter((o) => o.orderTiming !== 'SCHEDULED'),
      ...filtered.filter((o) => o.orderTiming === 'SCHEDULED').sort((a, b) => {
        const da = a.scheduledDateTime ? new Date(a.scheduledDateTime).getTime() : Infinity;
        const db2 = b.scheduledDateTime ? new Date(b.scheduledDateTime).getTime() : Infinity;
        return da - db2;
      }),
    ];
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
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity shrink-0">
            <Logo />
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

          {/* Polling status + user */}
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
            <UserProfileDropdown />
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
                    ) : (() => {
                      const immediate = colOrders.filter((o) => o.orderTiming !== 'SCHEDULED');
                      const scheduled = colOrders.filter((o) => o.orderTiming === 'SCHEDULED');
                      return (
                        <>
                          {immediate.map((order) => (
                            <OrderCard
                              key={order.orderId}
                              order={order}
                              onCardClick={(o) => setDetailOrder(o)}
                              onConfirm={handleConfirm}
                              onStartPrep={handleStartPrep}
                              onDispatch={handleDispatch}
                              onReadyToPickup={handleReadyToPickup}
                              onCancel={handleCancel}
                              actionLoading={actionLoading}
                            />
                          ))}
                          {scheduled.length > 0 && (
                            <>
                              {immediate.length > 0 && (
                                <div className="flex items-center gap-2 my-2 px-1">
                                  <div className="flex-1 h-px bg-blue-500/20" />
                                  <span className="text-blue-400 text-[10px] font-medium uppercase tracking-wider flex items-center gap-1">
                                    <CalendarClock className="h-3 w-3" />
                                    Agendados
                                  </span>
                                  <div className="flex-1 h-px bg-blue-500/20" />
                                </div>
                              )}
                              {scheduled.map((order) => (
                                <OrderCard
                                  key={order.orderId}
                                  order={order}
                                  onCardClick={(o) => setDetailOrder(o)}
                                  onConfirm={handleConfirm}
                                  onStartPrep={handleStartPrep}
                                  onDispatch={handleDispatch}
                                  onReadyToPickup={handleReadyToPickup}
                                  onCancel={handleCancel}
                                  actionLoading={actionLoading}
                                />
                              ))}
                            </>
                          )}
                        </>
                      );
                    })()}
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

      {/* Modal de cancelamento */}
      {cancelOrder && (
        <CancelModal
          order={cancelOrder}
          reasons={cancelReasons}
          loadingReasons={cancelReasonsLoading}
          cancelLoading={cancelLoading}
          selectedCode={selectedCancelCode}
          onSelectCode={setSelectedCancelCode}
          onConfirm={handleConfirmCancel}
          onClose={() => setCancelOrder(null)}
        />
      )}
    </div>
  );
}
