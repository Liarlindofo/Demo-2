'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { UserProfileDropdown } from '@/components/user-profile-dropdown';
import { Logo } from '@/components/logo';
import { Card, CardContent } from '@/components/ui/card';
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
// Kanban columns config — visual neutro (sem rainbow)
// ---------------------------------------------------------------------------
const COLUMNS = [
  { id: 'NOVOS', label: 'Novos', statuses: ['PLACED'] },
  { id: 'EM_PREPARO', label: 'Em preparo', statuses: ['CONFIRMED', 'PREPARING'] },
  { id: 'SAIU_ENTREGA', label: 'Saiu para entrega', statuses: ['DISPATCHED'] },
  { id: 'RETIRADA', label: 'Pronto p/ retirada', statuses: ['READY_TO_PICKUP'] },
  { id: 'CONCLUIDOS', label: 'Concluídos', statuses: ['CONCLUDED'] },
  { id: 'CANCELAMENTOS', label: 'Cancelamentos', statuses: ['CANCELLED', 'DISPUTE'] },
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
    return (
      <span className="text-xs text-[#EA1D2C] font-medium tabular-nums">
        Expirado
      </span>
    );
  }
  const urgent = remaining < 60;
  return (
    <span
      className={`text-xs tabular-nums flex items-center gap-1 ${
        urgent ? 'text-[#EA1D2C] font-medium' : 'text-gray-500'
      }`}
    >
      <Clock className="h-3 w-3" />
      {formatElapsed(remaining)}
    </span>
  );
}

function ElapsedBadge({ createdAt }: { createdAt: string }) {
  const elapsed = useElapsedSeconds(createdAt);
  return (
    <span className="text-xs text-gray-500 flex items-center gap-1 tabular-nums">
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

  const statusLabel = isCancelled
    ? 'Cancelado'
    : isDispute
      ? 'Disputa'
      : isConcluded
        ? 'Concluído'
        : null;

  return (
    <Card
      className="rounded-lg cursor-pointer transition-colors mb-2.5 select-none border border-[#2a2a2c] bg-[#141415] hover:border-[#4b5563]"
      onClick={() => onCardClick(order)}
    >
      <CardContent className="p-3.5 space-y-2.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className={`font-semibold text-base tracking-tight ${
                isCancelled ? 'text-gray-500 line-through' : 'text-white'
              }`}
            >
              #{order.displayId}
            </span>
            {order.isTest && (
              <span className="text-[10px] uppercase tracking-wide text-gray-500 border border-[#374151] rounded px-1.5 py-0.5">
                Teste
              </span>
            )}
            {isScheduled && (
              <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-[#374151] rounded px-1.5 py-0.5">
                Agendado
              </span>
            )}
            {statusLabel && (
              <span className="text-[10px] uppercase tracking-wide text-gray-500">
                {statusLabel}
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-500 shrink-0 flex items-center gap-1 mt-0.5">
            {isDelivery ? (
              <><Bike className="h-3.5 w-3.5" />Delivery</>
            ) : (
              <><Package className="h-3.5 w-3.5" />Retirada</>
            )}
          </span>
        </div>

        {/* Agendamento */}
        {isScheduled && order.scheduledDateTime && (
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            <span>{formatScheduledDate(order.scheduledDateTime)}</span>
          </div>
        )}

        {/* Customer */}
        {order.customerName && (
          <p className="text-gray-300 text-sm truncate">{order.customerName}</p>
        )}

        {/* Items summary */}
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
          {summarizeItems(order.items)}
        </p>

        {/* Voucher discount */}
        {hasVoucher && voucherDiscount > 0 && (
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Tag className="h-3 w-3" />
            <span>Desconto {formatCurrency(voucherDiscount)}</span>
          </div>
        )}

        {/* Footer: valor + pagamento + timer */}
        <div className="flex items-end justify-between gap-2 pt-0.5 border-t border-[#2a2a2c]">
          <div className="min-w-0 pt-2">
            <p className="text-white font-medium text-sm">{formatCurrency(order.totalAmount)}</p>
            {primaryPayment && (
              <p className="text-gray-500 text-[11px] truncate mt-0.5">
                {primaryPayment.method === 'CASH'
                  ? primaryPayment.cash?.changeFor && primaryPayment.cash.changeFor > order.totalAmount
                    ? `Dinheiro · troco ${formatCurrency(primaryPayment.cash.changeFor - order.totalAmount)}`
                    : 'Dinheiro · sem troco'
                  : getPaymentLabel(primaryPayment.method)}
              </p>
            )}
          </div>
          <div className="pt-2 shrink-0">
            {isPlaced ? (
              <CountdownBadge createdAt={order.createdAt} />
            ) : (
              <ElapsedBadge createdAt={order.createdAt} />
            )}
          </div>
        </div>

        {/* Código de retirada */}
        {order.status === 'READY_TO_PICKUP' && order.pickupCode && (
          <div className="flex items-center gap-2.5 bg-[#1a1a1a] border border-[#374151] rounded-md px-3 py-2">
            <Package className="h-4 w-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-gray-500 text-[10px] uppercase tracking-wider leading-none mb-0.5">
                Código
              </p>
              <p className="text-white text-lg font-semibold tracking-widest leading-none">
                {order.pickupCode}
              </p>
            </div>
          </div>
        )}

        {/* Ações */}
        {canCancelOrder && (
          <div onClick={(e) => e.stopPropagation()} className="space-y-1.5 pt-0.5">
            {isPlaced && (
              <Button
                size="sm"
                disabled={loading}
                onClick={() => onConfirm(order)}
                className="w-full bg-[#EA1D2C] hover:bg-[#c9111f] text-white text-xs h-8 border-0"
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
                className="w-full bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#374151] text-xs h-8"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                  <><PlayCircle className="h-3.5 w-3.5 mr-1.5" />Iniciar preparo</>
                )}
              </Button>
            )}

            {isPreparing && isDelivery && (
              <Button
                size="sm"
                disabled={loading}
                onClick={() => onDispatch(order)}
                className="w-full bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#374151] text-xs h-8"
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
                className="w-full bg-[#1a1a1a] hover:bg-[#222] text-white border border-[#374151] text-xs h-8"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                  <><Package className="h-3.5 w-3.5 mr-1.5" />Pronto p/ retirada</>
                )}
              </Button>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={() => onCancel(order)}
              className="w-full text-[11px] text-gray-500 hover:text-gray-300 py-1 transition-colors disabled:opacity-50"
            >
              Cancelar pedido
            </button>
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
          <DialogTitle className="flex items-center gap-2 flex-wrap text-base font-semibold">
            <ShoppingBag className="h-4 w-4 text-[#EA1D2C]" />
            Pedido #{order.displayId}
            {order.isTest && (
              <span className="text-[10px] uppercase tracking-wide text-gray-500 border border-[#374151] rounded px-1.5 py-0.5 font-normal">
                Teste
              </span>
            )}
            {isScheduled && (
              <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-[#374151] rounded px-1.5 py-0.5 font-normal">
                Agendado
              </span>
            )}
            {hasVoucher && (
              <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-[#374151] rounded px-1.5 py-0.5 font-normal">
                Voucher
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Detalhes do pedido (somente leitura).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">

          {/* Tipo e timing do pedido */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              {isDelivery ? (
                <><Bike className="h-3.5 w-3.5" />Delivery</>
              ) : (
                <><Package className="h-3.5 w-3.5" />Retirada</>
              )}
            </span>
            <span className="text-[#2a2a2c]">·</span>
            <span className="flex items-center gap-1.5">
              {isScheduled ? (
                <><CalendarClock className="h-3.5 w-3.5" />Agendado</>
              ) : (
                <><Clock className="h-3.5 w-3.5" />Imediato</>
              )}
            </span>
          </div>

          {/* Agendamento */}
          {isScheduled && order.scheduledDateTime && (
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2c] rounded-lg p-3">
              <CalendarClock className="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Entrega agendada</p>
                <p className="text-white text-sm font-medium">
                  {formatScheduledDate(order.scheduledDateTime)}
                </p>
              </div>
            </div>
          )}

          {/* Voucher / Benefício */}
          {hasVoucher && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2c] rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider">
                <Tag className="h-3.5 w-3.5" />
                Cupom / voucher
              </div>
              {benefits.map((b, bi) => (
                <div key={bi}>
                  {b.value && b.value > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{b.target ?? 'Desconto'}</span>
                      <span className="text-gray-200">-{formatCurrency(b.value)}</span>
                    </div>
                  )}
                  {(b.sponsorshipValues ?? []).map((sv, si) => (
                    <div key={si} className="flex justify-between text-sm">
                      <span className="text-gray-300">{sv.name ?? sv.description ?? 'Desconto'}</span>
                      <span className="text-gray-200">-{formatCurrency(sv.value)}</span>
                    </div>
                  ))}
                </div>
              ))}
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-sm font-medium border-t border-[#2a2a2c] pt-1.5 mt-1">
                  <span className="text-gray-400">Total de descontos</span>
                  <span className="text-white">-{formatCurrency(voucherDiscount)}</span>
                </div>
              )}
            </div>
          )}

          {/* Customer */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2c] rounded-lg p-3 space-y-2">
            <p className="text-gray-500 text-xs uppercase tracking-wider">Cliente</p>
            {order.customerName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-200 text-sm">{order.customerName}</span>
              </div>
            )}
            {order.customerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500 shrink-0" />
                <a
                  href={`tel:${order.customerPhone}`}
                  className="text-gray-200 hover:text-white text-sm underline-offset-2 hover:underline"
                >
                  {order.customerPhone}
                </a>
              </div>
            )}
            {order.customerTaxId && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="text-gray-300 text-sm">{formatCpfCnpj(order.customerTaxId)}</span>
              </div>
            )}
          </div>

          {/* Código de retirada (TAKEOUT) */}
          {!isDelivery && order.pickupCode && (
            <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#374151] rounded-lg p-3">
              <Package className="h-5 w-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">
                  Código de retirada
                </p>
                <p className="text-white text-2xl font-semibold tracking-widest">
                  {order.pickupCode}
                </p>
              </div>
            </div>
          )}

          {/* Observations */}
          {order.observations && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2c] rounded-lg p-3">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                Observações
              </p>
              <p className="text-gray-200 text-sm">{order.observations}</p>
            </div>
          )}

          {/* Delivery address */}
          {isDelivery && addr && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2c] rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-1">
                <MapPin className="h-3.5 w-3.5" />
                Endereço de entrega
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
                <p className="text-gray-400 text-xs">Complemento: {addr.complement}</p>
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
                <p className="text-gray-300 text-xs mt-1">
                  Referência: {addr.reference}
                </p>
              )}
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Itens</p>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="bg-[#1a1a1a] border border-[#2a2a2c] rounded-lg p-3">
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
                    <div className="mt-1.5 space-y-0.5 pl-2 border-l border-[#2a2a2c]">
                      {item.options.map((opt, oi) => (
                        <div key={oi} className="flex justify-between text-xs text-gray-500">
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
                    <p className="text-xs text-gray-400 mt-1.5">
                      Obs: {item.observations}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2c] rounded-lg p-3 space-y-1.5 text-sm">
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
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-gray-400">
                <span>Desconto</span>
                <span>-{formatCurrency(voucherDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-medium border-t border-[#2a2a2c] pt-1.5 mt-1.5">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {/* Payment */}
          {allPayments.length > 0 && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2c] rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider">
                <CreditCard className="h-3.5 w-3.5" />
                Pagamento
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
                        <span>Pago online</span>
                      ) : (
                        <span>Pagamento na entrega</span>
                      )}
                    </div>
                    {isCash && (
                      changeAmount > 0 ? (
                        <div className="border border-[#2a2a2c] rounded px-2.5 py-1.5 space-y-0.5">
                          <p className="text-gray-400 text-xs">
                            Cliente paga com <span className="text-gray-200">{formatCurrency(changeFor)}</span>
                          </p>
                          <p className="text-white text-sm font-medium">
                            Troco: {formatCurrency(changeAmount)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs">
                          Dinheiro — sem troco
                        </p>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-gray-600 text-xs text-center">
            Ações deste pedido ficam no app do iFood.
          </p>
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
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              {pollingOk ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  <span className="hidden sm:block">Ao vivo</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#EA1D2C]" />
                  <span className="hidden sm:block text-gray-400">Offline</span>
                </>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={refreshing}
              onClick={() => fetchOrders(true)}
              className="h-7 w-7 p-0 text-gray-500 hover:text-white"
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
          <div className="flex gap-3">
            {COLUMNS.map((col) => (
              <div key={col.id} className="flex-shrink-0 w-72">
                <div className="flex items-center justify-between px-1 py-2 mb-3">
                  <div className="h-3.5 bg-[#1a1a1a] rounded animate-pulse w-24" />
                  <div className="h-3.5 bg-[#1a1a1a] rounded animate-pulse w-5" />
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="bg-[#141415] border border-[#2a2a2c] rounded-lg p-3.5 mb-2.5 animate-pulse space-y-2">
                    <div className="h-4 bg-[#1a1a1a] rounded w-16" />
                    <div className="h-3 bg-[#1a1a1a] rounded w-28" />
                    <div className="h-3 bg-[#1a1a1a] rounded w-20" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Last poll time */}
        {lastPoll && !loading && (
          <p className="text-gray-600 text-xs mb-3">
            Atualizado às {lastPoll.toLocaleTimeString('pt-BR')}
          </p>
        )}

        {/* Kanban */}
        {!loading && stores.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {COLUMNS.map((col) => {
              const colOrders = getColumnOrders(col.statuses);
              return (
                <div key={col.id} className="flex-shrink-0 w-72">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-1 py-2 mb-2.5 border-b border-[#2a2a2c]">
                    <span className="text-sm font-medium text-gray-300">{col.label}</span>
                    <span className="text-xs tabular-nums text-gray-500 min-w-[1.25rem] text-right">
                      {colOrders.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div>
                    {colOrders.length === 0 ? (
                      <div className="text-gray-600 text-xs text-center py-10">
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
                                <div className="flex items-center gap-2 my-3 px-1">
                                  <div className="flex-1 h-px bg-[#2a2a2c]" />
                                  <span className="text-gray-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                    <CalendarClock className="h-3 w-3" />
                                    Agendados
                                  </span>
                                  <div className="flex-1 h-px bg-[#2a2a2c]" />
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
