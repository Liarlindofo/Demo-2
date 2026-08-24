'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/app-context';
import { UserProfileDropdown } from '@/components/user-profile-dropdown';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  Store,
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock,
  ShoppingBag,
  Info,
  MapPin,
  Phone,
  Building2,
  Tag,
  Truck,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  Timer,
  CalendarDays,
  Pencil,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface IfoodConnection {
  id: string;
  merchantId: string;
  merchantName: string;
  status: string;
  createdAt: string;
}

type IfoodStatus = 'ONLINE' | 'FECHADO' | 'AVISO' | 'INDISPONÍVEL' | 'OPEN' | 'CLOSED' | 'BUSY' | 'PAUSED' | 'ERROR' | 'UNKNOWN' | null;

interface MerchantAddress {
  streetName?: string;
  streetNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  reference?: string;
}

interface MerchantContact {
  phone?: string;
  email?: string;
}

interface MerchantCategory {
  id?: string;
  description?: string;
}

interface MerchantDeliveryMethod {
  id?: string;
  mode?: string;
  title?: string;
  subtitle?: string;
  minTime?: number;
  maxTime?: number;
  minOrderValue?: number;
}

interface MerchantDetails {
  id?: string;
  name?: string;
  corporateName?: string;
  taxId?: string;         // CNPJ
  address?: MerchantAddress;
  contacts?: MerchantContact[];
  mainCategory?: MerchantCategory;
  categories?: MerchantCategory[];
  deliveryMethods?: MerchantDeliveryMethod[];
  enabled?: boolean;
}

interface MerchantStatusRaw {
  status: string;
  available: boolean;
  message?: string;
}

interface Interruption {
  id: string;
  description?: string;
  start: string;
  end: string;
}

const PAUSE_PRESETS = [
  { label: '30 min', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '1h30', value: 90 },
  { label: '2 horas', value: 120 },
];

// ---------------------------------------------------------------------------
// Opening hours types & constants
// ---------------------------------------------------------------------------
interface Shift {
  start: string;    // "HH:MM"
  duration: number; // minutos
}

interface OpeningHoursDay {
  dayOfWeek: string;
  shifts: Shift[];
}

interface EditShift {
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
}

interface EditDaySchedule {
  dayOfWeek: string;
  active: boolean;
  shifts: EditShift[];
}

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

const DAY_LABEL_SHORT: Record<string, string> = {
  MONDAY: 'Seg', TUESDAY: 'Ter', WEDNESDAY: 'Qua',
  THURSDAY: 'Qui', FRIDAY: 'Sex', SATURDAY: 'Sáb', SUNDAY: 'Dom',
};

const DAY_LABEL_FULL: Record<string, string> = {
  MONDAY: 'Segunda-feira', TUESDAY: 'Terça-feira', WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira', FRIDAY: 'Sexta-feira', SATURDAY: 'Sábado', SUNDAY: 'Domingo',
};

const MAX_STORES = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function truncateMerchantId(id: string) {
  return id.length > 16 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;
}

function formatPauseRemaining(endIso: string): string {
  const diff = new Date(endIso).getTime() - Date.now();
  if (diff <= 0) return 'Encerrada';
  const totalMin = Math.ceil(diff / 60_000);
  if (totalMin < 60) return `${totalMin} min restantes`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h${m}min restantes` : `${h}h restantes`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** "10:00" + 540 min → "19:00" */
function shiftEnd(start: string, duration: number): string {
  const [h, m] = start.split(':').map(Number);
  const total = h * 60 + m + duration;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** "19:00" - "10:00" → 540 */
function calcDuration(start: string, end: string): number {
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  return toMin(end) - toMin(start);
}

/** Converte OpeningHoursDay[] em EditDaySchedule[] (todos os 7 dias) */
function toEditSchedule(days: OpeningHoursDay[]): EditDaySchedule[] {
  const map = Object.fromEntries(days.map((d) => [d.dayOfWeek, d]));
  return DAY_ORDER.map((dow) => {
    const day = map[dow];
    const shifts = day?.shifts ?? [];
    if (!day || shifts.length === 0) {
      return { dayOfWeek: dow, active: false, shifts: [{ start: '08:00', end: '22:00' }] };
    }
    return {
      dayOfWeek: dow,
      active: true,
      shifts: shifts.map((s) => ({ start: s.start, end: shiftEnd(s.start, s.duration) })),
    };
  });
}

/** Converte EditDaySchedule[] de volta para o formato iFood.
 *  Inclui TODOS os 7 dias — inativos com shifts:[] — pois a API iFood exige o conjunto completo. */
function fromEditSchedule(schedule: EditDaySchedule[]): OpeningHoursDay[] {
  return schedule.map((d) => {
    if (!d.active) return { dayOfWeek: d.dayOfWeek, shifts: [] };
    const validShifts = d.shifts
      .filter((s) => s.start && s.end && calcDuration(s.start, s.end) > 0)
      .map((s) => ({ start: s.start, duration: calcDuration(s.start, s.end) }));
    return { dayOfWeek: d.dayOfWeek, shifts: validShifts };
  });
}

function StatusBadge({ status }: { status: string; }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: '● Online', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    inactive: { label: '● Fechado', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    error: { label: '● Erro', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };

  const cfg = map[status] ?? { label: '● Desconhecido', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function RealtimeStatusBadge({ status }: { status: IfoodStatus }) {
  if (!status) return null;

  const map: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    ONLINE:        { label: 'Online',       icon: <Wifi className="h-3 w-3" />,          className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    FECHADO:       { label: 'Fechado',      icon: <WifiOff className="h-3 w-3" />,       className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    AVISO:         { label: 'Aviso',        icon: <AlertTriangle className="h-3 w-3" />, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    'INDISPONÍVEL':{ label: 'Indisponível', icon: <AlertTriangle className="h-3 w-3" />, className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    OPEN:          { label: 'Aberto',       icon: <Wifi className="h-3 w-3" />,          className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    CLOSED:        { label: 'Fechado',      icon: <WifiOff className="h-3 w-3" />,       className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    BUSY:          { label: 'Ocupado',      icon: <Clock className="h-3 w-3" />,         className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    PAUSED:        { label: 'Pausado',      icon: <Clock className="h-3 w-3" />,         className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    ERROR:         { label: 'Erro',         icon: <AlertTriangle className="h-3 w-3" />, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    UNKNOWN:       { label: 'Desconhecido', icon: null,                                  className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  };

  const cfg = map[status] ?? map.UNKNOWN;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Subnav iFood
// ---------------------------------------------------------------------------
const IFOOD_TABS = [
  { label: 'Configurações', href: '/ifood/configuracoes', active: true },
  { label: 'Operacional', href: '/ifood/operacional', active: false },
  { label: 'Financeiro', href: '/ifood/financeiro', active: false },
  { label: 'Cardápio', href: '/ifood/cardapio', active: false },
];

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function IfoodConfiguracoesPage() {
  const { addToast } = useApp();

  const [connections, setConnections] = useState<IfoodConnection[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal adicionar loja
  const [addOpen, setAddOpen] = useState(false);
  const [merchantIdInput, setMerchantIdInput] = useState('');
  const [addStep, setAddStep] = useState<'input' | 'confirm'>('input');
  const [verifying, setVerifying] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [verifiedName, setVerifiedName] = useState('');
  const [addError, setAddError] = useState('');

  // Modal excluir
  const [deleteTarget, setDeleteTarget] = useState<IfoodConnection | null>(null);

  // Status em tempo real por card
  const [testingStatus, setTestingStatus] = useState<Record<string, boolean>>({});
  const [realtimeStatus, setRealtimeStatus] = useState<Record<string, IfoodStatus>>({});

  // Modal de detalhes da loja
  const [detailsTarget, setDetailsTarget] = useState<IfoodConnection | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [merchantDetails, setMerchantDetails] = useState<MerchantDetails | null>(null);
  const [merchantStatusData, setMerchantStatusData] = useState<MerchantStatusRaw | null>(null);

  // Horários de funcionamento por loja — keyed by merchantId
  const [openingHours, setOpeningHours] = useState<Record<string, OpeningHoursDay[]>>({});
  const [openingHoursLoading, setOpeningHoursLoading] = useState<Record<string, boolean>>({});

  // Modal editar horários
  const [editHoursTarget, setEditHoursTarget] = useState<IfoodConnection | null>(null);
  const [editSchedule, setEditSchedule] = useState<EditDaySchedule[]>([]);
  const [editHoursLoading, setEditHoursLoading] = useState(false);
  const [editHoursError, setEditHoursError] = useState('');

  // Interrupções (pausas) por loja — keyed by merchantId
  const [interruptions, setInterruptions] = useState<Record<string, Interruption[]>>({});
  const [interruptionsLoading, setInterruptionsLoading] = useState<Record<string, boolean>>({});
  const [removingPause, setRemovingPause] = useState<Record<string, boolean>>({});

  // Modal criar pausa
  const [pauseTarget, setPauseTarget] = useState<IfoodConnection | null>(null);
  const [pauseDescription, setPauseDescription] = useState('');
  const [pauseMinutes, setPauseMinutes] = useState(60);
  const [pauseCustom, setPauseCustom] = useState('');
  const [pauseIsCustom, setPauseIsCustom] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [pauseError, setPauseError] = useState('');

  // ---------------------------------------------------------------------------
  // Carregar conexões
  // ---------------------------------------------------------------------------
  const loadConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/ifood/connections');
      if (res.ok) {
        const data = await res.json() as { connections: IfoodConnection[] };
        setConnections(data.connections);
      }
    } catch {
      // silencia erros de rede para não travar a UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Carrega interrupções e horários para cada loja ao montar ou ao reconectar
  useEffect(() => {
    connections.forEach((conn) => {
      if (interruptions[conn.merchantId] === undefined) loadInterruptions(conn);
      if (openingHours[conn.merchantId] === undefined) loadOpeningHours(conn);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections]);

  // ---------------------------------------------------------------------------
  // Verificar merchantId na API iFood (step 1 do modal)
  // ---------------------------------------------------------------------------
  async function handleVerify() {
    const id = merchantIdInput.trim();
    if (!id) {
      setAddError('Cole o Merchant ID antes de verificar');
      return;
    }

    setVerifying(true);
    setAddError('');

    try {
      // Tenta criar a conexão (o backend valida o merchant na API iFood)
      const res = await fetch('/api/ifood/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: id }),
      });

      const data = await res.json() as { connection?: IfoodConnection; error?: string };

      if (!res.ok) {
        setAddError(data.error ?? 'Erro ao verificar Merchant ID');
        return;
      }

      // Já conectou com sucesso
      setConnections((prev) => [...prev, data.connection!]);
      addToast('✅ Loja conectada com sucesso!', 'success');
      closeAddModal();
    } catch {
      setAddError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setVerifying(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Confirmar conexão (step 2, caso queiramos separar verificação de confirmação)
  // Para simplificar, o fluxo atual vai direto: Verificar = conectar
  // ---------------------------------------------------------------------------
  async function handleConfirmConnect() {
    setConnecting(true);
    setAddError('');
    try {
      const res = await fetch('/api/ifood/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchantIdInput.trim() }),
      });

      const data = await res.json() as { connection?: IfoodConnection; error?: string };

      if (!res.ok) {
        setAddError(data.error ?? 'Erro ao conectar loja');
        return;
      }

      setConnections((prev) => [...prev, data.connection!]);
      addToast('✅ Loja conectada com sucesso!', 'success');
      closeAddModal();
    } catch {
      setAddError('Erro de conexão. Tente novamente.');
    } finally {
      setConnecting(false);
    }
  }

  function closeAddModal() {
    setAddOpen(false);
    setMerchantIdInput('');
    setAddStep('input');
    setVerifiedName('');
    setAddError('');
    setVerifying(false);
    setConnecting(false);
  }

  // ---------------------------------------------------------------------------
  // Testar conexão em tempo real
  // ---------------------------------------------------------------------------
  async function handleTestStatus(connection: IfoodConnection) {
    setTestingStatus((prev) => ({ ...prev, [connection.id]: true }));

    try {
      const res = await fetch(`/api/ifood/connections/${connection.id}/status`);
      const data = await res.json() as { status?: string; available?: boolean; message?: string; error?: string };

      if (!res.ok) {
        addToast(`❌ ${data.error ?? 'Erro ao testar conexão'}`, 'error');
        setRealtimeStatus((prev) => ({ ...prev, [connection.id]: 'ERROR' }));
        return;
      }

      const s = (data.status ?? 'INDISPONÍVEL') as IfoodStatus;
      setRealtimeStatus((prev) => ({ ...prev, [connection.id]: s }));

      const toastLabels: Record<string, string> = {
        ONLINE:        '🟢 Loja online no iFood',
        FECHADO:       '⚫ Loja fechada no iFood',
        AVISO:         '🟡 Loja com aviso no iFood',
        'INDISPONÍVEL':'🟠 Loja indisponível no iFood',
      };
      const toastMsg = data.message
        ? `${toastLabels[s ?? ''] ?? `Status: ${s}`} — ${data.message}`
        : (toastLabels[s ?? ''] ?? `Status: ${s}`);
      addToast(toastMsg, s === 'ONLINE' ? 'success' : 'error');

      // Sincroniza badge permanente com o resultado do teste
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connection.id
            ? { ...c, status: s === 'ONLINE' ? 'active' : s === 'FECHADO' ? 'inactive' : 'error' }
            : c,
        ),
      );
    } catch {
      addToast('❌ Erro ao testar conexão', 'error');
      setRealtimeStatus((prev) => ({ ...prev, [connection.id]: 'ERROR' }));
    } finally {
      setTestingStatus((prev) => ({ ...prev, [connection.id]: false }));
    }
  }

  // ---------------------------------------------------------------------------
  // Interrupções (pausas)
  // ---------------------------------------------------------------------------
  async function loadInterruptions(conn: IfoodConnection) {
    setInterruptionsLoading((prev) => ({ ...prev, [conn.merchantId]: true }));
    try {
      const res = await fetch(`/api/ifood/merchants/${conn.merchantId}/interruptions`);
      if (res.ok) {
        const data = await res.json() as { interruptions: Interruption[] };
        setInterruptions((prev) => ({ ...prev, [conn.merchantId]: data.interruptions ?? [] }));
      }
    } catch {
      // falha silenciosa — não bloqueia a UI
    } finally {
      setInterruptionsLoading((prev) => ({ ...prev, [conn.merchantId]: false }));
    }
  }

  async function handleCreatePause() {
    if (!pauseTarget) return;
    const minutes = pauseIsCustom ? parseInt(pauseCustom, 10) : pauseMinutes;
    if (!minutes || minutes <= 0 || minutes > 1440) {
      setPauseError('Duração inválida (entre 1 e 1440 minutos)');
      return;
    }
    setPauseLoading(true);
    setPauseError('');
    try {
      const res = await fetch(`/api/ifood/merchants/${pauseTarget.merchantId}/interruptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: pauseDescription || 'Pausa manual', durationMinutes: minutes }),
      });
      const data = await res.json() as { interruption?: Interruption; error?: string };
      if (!res.ok) {
        setPauseError(data.error ?? 'Erro ao criar pausa');
        return;
      }
      // Atualiza lista local
      await loadInterruptions(pauseTarget);
      addToast(`⏸ Loja "${pauseTarget.merchantName}" pausada por ${minutes} min`, 'success');
      closePauseModal();
    } catch {
      setPauseError('Erro de conexão. Tente novamente.');
    } finally {
      setPauseLoading(false);
    }
  }

  async function handleRemovePause(conn: IfoodConnection, interruptionId: string) {
    setRemovingPause((prev) => ({ ...prev, [interruptionId]: true }));
    try {
      const res = await fetch(
        `/api/ifood/merchants/${conn.merchantId}/interruptions/${interruptionId}`,
        { method: 'DELETE' },
      );
      if (res.ok || res.status === 204) {
        setInterruptions((prev) => ({
          ...prev,
          [conn.merchantId]: (prev[conn.merchantId] ?? []).filter((i) => i.id !== interruptionId),
        }));
        addToast(`▶️ Pausa removida — "${conn.merchantName}" voltou ao ar`, 'success');
      } else {
        const data = await res.json() as { error?: string };
        addToast(`❌ ${data.error ?? 'Erro ao remover pausa'}`, 'error');
      }
    } catch {
      addToast('❌ Erro ao remover pausa', 'error');
    } finally {
      setRemovingPause((prev) => ({ ...prev, [interruptionId]: false }));
    }
  }

  function openPauseModal(conn: IfoodConnection) {
    setPauseTarget(conn);
    setPauseDescription('');
    setPauseMinutes(60);
    setPauseCustom('');
    setPauseIsCustom(false);
    setPauseError('');
  }

  function closePauseModal() {
    setPauseTarget(null);
    setPauseDescription('');
    setPauseMinutes(60);
    setPauseCustom('');
    setPauseIsCustom(false);
    setPauseError('');
    setPauseLoading(false);
  }

  // ---------------------------------------------------------------------------
  // Horários de funcionamento
  // ---------------------------------------------------------------------------
  async function loadOpeningHours(conn: IfoodConnection) {
    setOpeningHoursLoading((prev) => ({ ...prev, [conn.merchantId]: true }));
    try {
      const res = await fetch(`/api/ifood/merchants/${conn.merchantId}/opening-hours`);
      if (res.ok) {
        const data = await res.json() as { openingHours: OpeningHoursDay[] };
        setOpeningHours((prev) => ({ ...prev, [conn.merchantId]: data.openingHours ?? [] }));
      }
    } catch {
      // falha silenciosa
    } finally {
      setOpeningHoursLoading((prev) => ({ ...prev, [conn.merchantId]: false }));
    }
  }

  function openEditHours(conn: IfoodConnection) {
    const days = openingHours[conn.merchantId] ?? [];
    setEditSchedule(toEditSchedule(days));
    setEditHoursTarget(conn);
    setEditHoursError('');
  }

  function closeEditHours() {
    setEditHoursTarget(null);
    setEditSchedule([]);
    setEditHoursError('');
    setEditHoursLoading(false);
  }

  async function handleSaveHours() {
    if (!editHoursTarget) return;
    setEditHoursLoading(true);
    setEditHoursError('');
    try {
      const payload = fromEditSchedule(editSchedule);
      const res = await fetch(`/api/ifood/merchants/${editHoursTarget.merchantId}/opening-hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingHours: payload }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setEditHoursError(d.error ?? 'Erro ao salvar horários');
        return;
      }
      setOpeningHours((prev) => ({ ...prev, [editHoursTarget.merchantId]: payload }));
      addToast('✅ Horários salvos com sucesso!', 'success');
      closeEditHours();
    } catch {
      setEditHoursError('Erro de conexão. Tente novamente.');
    } finally {
      setEditHoursLoading(false);
    }
  }

  // Helpers para editar o estado do schedule no modal
  function toggleDay(dayOfWeek: string) {
    setEditSchedule((prev) =>
      prev.map((d) => d.dayOfWeek === dayOfWeek ? { ...d, active: !d.active } : d),
    );
  }

  function updateShift(dayOfWeek: string, index: number, field: 'start' | 'end', value: string) {
    setEditSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek !== dayOfWeek ? d : {
          ...d,
          shifts: d.shifts.map((s, i) => i === index ? { ...s, [field]: value } : s),
        },
      ),
    );
  }

  function addShift(dayOfWeek: string) {
    setEditSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek !== dayOfWeek ? d : {
          ...d,
          shifts: [...d.shifts, { start: '08:00', end: '22:00' }],
        },
      ),
    );
  }

  function removeShift(dayOfWeek: string, index: number) {
    setEditSchedule((prev) =>
      prev.map((d) =>
        d.dayOfWeek !== dayOfWeek ? d : {
          ...d,
          shifts: d.shifts.filter((_, i) => i !== index),
        },
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Ver detalhes completos da loja
  // ---------------------------------------------------------------------------
  async function handleViewDetails(connection: IfoodConnection) {
    setDetailsTarget(connection);
    setMerchantDetails(null);
    setMerchantStatusData(null);
    setDetailsLoading(true);

    try {
      const [detailsRes, statusRes] = await Promise.all([
        fetch(`/api/ifood/merchants/${connection.merchantId}/details`),
        fetch(`/api/ifood/merchants/${connection.merchantId}/status`),
      ]);

      if (detailsRes.ok) {
        const d = await detailsRes.json() as { merchant: MerchantDetails };
        setMerchantDetails(d.merchant);
      }

      if (statusRes.ok) {
        const s = await statusRes.json() as MerchantStatusRaw;
        setMerchantStatusData(s);
      }
    } catch {
      addToast('❌ Erro ao carregar detalhes da loja', 'error');
    } finally {
      setDetailsLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Excluir conexão
  // ---------------------------------------------------------------------------
  async function handleDelete(connection: IfoodConnection) {
    try {
      const res = await fetch(`/api/ifood/connections/${connection.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        addToast(`❌ ${data.error ?? 'Erro ao remover loja'}`, 'error');
        return;
      }

      setConnections((prev) => prev.filter((c) => c.id !== connection.id));
      addToast('🗑️ Loja removida com sucesso', 'success');
    } catch {
      addToast('❌ Erro ao remover loja', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-[#141415]/95 backdrop-blur-sm border-b border-[#374151] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity shrink-0">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#EA1D2C]" />
            <span className="font-semibold text-lg">iFood</span>
          </div>
          <div className="ml-auto">
            <UserProfileDropdown />
          </div>
        </div>

        {/* Subnav */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 pb-0">
            {IFOOD_TABS.map((tab) => (
              tab.active ? (
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
              )
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Suas Lojas iFood</h1>
            <p className="text-gray-400 mt-1 text-sm">
              Conecte até {MAX_STORES} lojas iFood à sua conta ({connections.length}/{MAX_STORES})
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            disabled={connections.length >= MAX_STORES}
            className="bg-[#EA1D2C] hover:bg-[#c9111f] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Loja
          </Button>
        </div>

        {/* Empty state */}
        {connections.length === 0 && (
          <Card className="bg-[#141415] border-[#374151] rounded-2xl">
            <CardContent className="py-16 flex flex-col items-center text-center">
              <Store className="h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma loja conectada</h3>
              <p className="text-gray-400 mb-6 max-w-sm">
                Conecte sua loja iFood para começar a gerenciar pedidos, cardápio e relatórios.
              </p>
              <Button
                onClick={() => setAddOpen(true)}
                className="bg-[#EA1D2C] hover:bg-[#c9111f] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Loja
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Cards de lojas */}
        {connections.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((conn) => (
              <Card
                key={conn.id}
                className="bg-[#141415] border-[#374151] rounded-2xl hover:border-[#EA1D2C]/40 transition-all"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-white text-base font-semibold leading-tight flex items-center gap-2">
                      <Store className="h-4 w-4 shrink-0 text-[#EA1D2C]" />
                      {conn.merchantName}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(conn)}
                      className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Merchant ID */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Merchant ID</p>
                    <p className="text-xs text-gray-300 font-mono bg-black/40 px-2 py-1.5 rounded">
                      {truncateMerchantId(conn.merchantId)}
                    </p>
                  </div>

                  {/* Badges de status */}
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={conn.status} />
                    {realtimeStatus[conn.id] && (
                      <RealtimeStatusBadge status={realtimeStatus[conn.id]} />
                    )}
                    {(interruptions[conn.merchantId] ?? []).length > 0 && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                        <PauseCircle className="h-3 w-3 mr-1" />
                        PAUSADA
                      </Badge>
                    )}
                  </div>

                  {/* Pausas ativas */}
                  {interruptionsLoading[conn.merchantId] ? (
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Carregando pausas...
                    </div>
                  ) : (interruptions[conn.merchantId] ?? []).length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-orange-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
                        <PauseCircle className="h-3.5 w-3.5" />
                        Pausas Ativas ({(interruptions[conn.merchantId] ?? []).length})
                      </p>
                      {(interruptions[conn.merchantId] ?? []).map((int) => (
                        <div
                          key={int.id}
                          className="bg-orange-500/10 border border-orange-500/25 rounded-lg px-3 py-2 flex items-start justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-orange-200 text-xs font-medium truncate">
                              {int.description ?? 'Pausa manual'}
                            </p>
                            <p className="text-orange-400/70 text-[10px] flex items-center gap-1 mt-0.5">
                              <Timer className="h-3 w-3 shrink-0" />
                              {formatDateTime(int.start)} → {formatDateTime(int.end)}
                              {' · '}{formatPauseRemaining(int.end)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={removingPause[int.id]}
                            onClick={() => handleRemovePause(conn, int.id)}
                            className="h-6 w-6 p-0 text-orange-400 hover:text-white hover:bg-orange-500/20 shrink-0"
                          >
                            {removingPause[int.id]
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <XCircle className="h-3 w-3" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Horários de funcionamento — resumo compacto */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Horários
                      </p>
                      <button
                        onClick={() => openEditHours(conn)}
                        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Pencil className="h-2.5 w-2.5" />
                        Editar
                      </button>
                    </div>

                    {openingHoursLoading[conn.merchantId] ? (
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs py-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Carregando...
                      </div>
                    ) : (() => {
                      const days = openingHours[conn.merchantId];
                      if (!days) return (
                        <p className="text-gray-600 text-xs italic py-1">Não carregado</p>
                      );
                      const activeDays = DAY_ORDER
                        .map((dow) => ({ dow, day: days.find((d) => d.dayOfWeek === dow) }))
                        .filter(({ day }) => (day?.shifts?.length ?? 0) > 0);
                      if (activeDays.length === 0) return (
                        <p className="text-gray-600 text-xs italic py-1">Nenhum horário configurado</p>
                      );
                      return (
                        <div className="space-y-0.5">
                          {activeDays.map(({ dow, day }) => (
                            <div key={dow} className="flex items-start gap-2 text-xs">
                              <span className="text-gray-500 w-7 shrink-0 font-medium">{DAY_LABEL_SHORT[dow]}</span>
                              <span className="text-gray-300">
                                {(day?.shifts ?? []).map((s) => `${s.start}–${shiftEnd(s.start, s.duration)}`).join(', ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Botões */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleTestStatus(conn)}
                      disabled={testingStatus[conn.id]}
                      variant="outline"
                      size="sm"
                      className="border-[#374151] text-white hover:bg-[#374151]"
                    >
                      {testingStatus[conn.id] ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Verificando</>
                      ) : (
                        <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Testar</>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleViewDetails(conn)}
                      variant="outline"
                      size="sm"
                      className="border-[#374151] text-white hover:bg-[#374151]"
                    >
                      <Info className="h-3.5 w-3.5 mr-1.5" />
                      Detalhes
                    </Button>
                    <Button
                      onClick={() => openPauseModal(conn)}
                      variant="outline"
                      size="sm"
                      className="col-span-2 border-orange-700/40 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50"
                    >
                      <PauseCircle className="h-3.5 w-3.5 mr-1.5" />
                      Pausar Loja
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info box */}
        <Alert className="mt-8 bg-[#141415] border-[#374151]">
          <ShoppingBag className="h-4 w-4 text-[#EA1D2C]" />
          <AlertDescription className="text-gray-400 text-sm">
            O Plateful usa um aplicativo centralizado iFood. Você precisa apenas do{' '}
            <strong className="text-white">Merchant ID</strong> da sua loja, disponível no{' '}
            <strong className="text-white">Portal do Parceiro iFood</strong> em{' '}
            Minha Conta → Dados da loja → Identificador da loja.
          </AlertDescription>
        </Alert>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Modal: Pausar Loja                                                  */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={!!pauseTarget} onOpenChange={(o) => { if (!o) closePauseModal(); }}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PauseCircle className="h-5 w-5 text-orange-400" />
              Pausar Loja — {pauseTarget?.merchantName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <Alert className="bg-orange-500/10 border-orange-500/25">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-300 text-sm">
                A loja ficará indisponível no iFood durante o período definido. Clientes não conseguirão fazer novos pedidos.
              </AlertDescription>
            </Alert>

            {/* Motivo */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Motivo da pausa (opcional)</Label>
              <input
                type="text"
                value={pauseDescription}
                onChange={(e) => setPauseDescription(e.target.value)}
                placeholder="ex: Falta de ingredientes, alta demanda..."
                className="w-full bg-[#0f0f10] border border-[#374151] text-white placeholder:text-gray-600 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              />
            </div>

            {/* Duração — presets */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Duração</Label>
              <div className="grid grid-cols-4 gap-2">
                {PAUSE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => { setPauseMinutes(p.value); setPauseIsCustom(false); }}
                    className={`rounded-lg border text-sm py-2 transition-colors ${
                      !pauseIsCustom && pauseMinutes === p.value
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 font-semibold'
                        : 'bg-black/20 border-[#374151] text-gray-400 hover:border-orange-500/30 hover:text-orange-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Personalizado */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setPauseIsCustom(!pauseIsCustom)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    pauseIsCustom
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                      : 'border-[#374151] text-gray-500 hover:border-orange-500/30 hover:text-orange-400'
                  }`}
                >
                  <Timer className="h-3 w-3" />
                  Personalizado
                </button>
                {pauseIsCustom && (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={pauseCustom || ''}
                      onChange={(e) => setPauseCustom(e.target.value)}
                      placeholder="minutos"
                      className="w-24 bg-[#0f0f10] border border-[#374151] text-white text-sm rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    />
                    <span className="text-gray-500 text-xs">min</span>
                  </div>
                )}
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-black/30 rounded-lg px-3 py-2 text-sm">
              <span className="text-gray-400">Duração selecionada: </span>
              <span className="text-orange-300 font-semibold">
                {pauseIsCustom
                  ? (pauseCustom ? `${pauseCustom} min` : '—')
                  : PAUSE_PRESETS.find((p) => p.value === pauseMinutes)?.label ?? `${pauseMinutes} min`}
              </span>
            </div>

            {pauseError && (
              <Alert className="bg-red-500/10 border-red-500/30">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400 text-sm">{pauseError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={closePauseModal}
              disabled={pauseLoading}
              className="border-[#374151] text-white hover:bg-[#374151]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreatePause}
              disabled={pauseLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {pauseLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Pausando...</>
              ) : (
                <><PauseCircle className="h-4 w-4 mr-2" />Confirmar Pausa</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Modal: Editar Horários                                              */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={!!editHoursTarget} onOpenChange={(o) => { if (!o) closeEditHours(); }}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-400" />
              Horários — {editHoursTarget?.merchantName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {editSchedule.map((day) => (
              <div
                key={day.dayOfWeek}
                className={`rounded-lg border transition-colors ${
                  day.active
                    ? 'bg-black/20 border-[#374151]'
                    : 'bg-black/10 border-[#2a2a2a] opacity-60'
                }`}
              >
                {/* Header do dia */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleDay(day.dayOfWeek)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        day.active ? 'bg-blue-500' : 'bg-gray-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          day.active ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${day.active ? 'text-white' : 'text-gray-500'}`}>
                      {DAY_LABEL_FULL[day.dayOfWeek]}
                    </span>
                  </div>
                  {!day.active && (
                    <span className="text-gray-600 text-xs">Fechado</span>
                  )}
                </div>

                {/* Períodos */}
                {day.active && (
                  <div className="px-3 pb-3 space-y-2">
                    {day.shifts.map((shift, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="time"
                            value={shift.start}
                            onChange={(e) => updateShift(day.dayOfWeek, idx, 'start', e.target.value)}
                            className="bg-[#0f0f10] border border-[#374151] text-white text-sm rounded px-2 py-1.5 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                          />
                          <span className="text-gray-500 text-xs shrink-0">às</span>
                          <input
                            type="time"
                            value={shift.end}
                            onChange={(e) => updateShift(day.dayOfWeek, idx, 'end', e.target.value)}
                            className="bg-[#0f0f10] border border-[#374151] text-white text-sm rounded px-2 py-1.5 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                          />
                          {shift.start && shift.end && calcDuration(shift.start, shift.end) > 0 && (
                            <span className="text-gray-500 text-[10px] shrink-0">
                              ({Math.floor(calcDuration(shift.start, shift.end) / 60)}h
                              {calcDuration(shift.start, shift.end) % 60 > 0
                                ? `${calcDuration(shift.start, shift.end) % 60}min`
                                : ''})
                            </span>
                          )}
                        </div>
                        {day.shifts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeShift(day.dayOfWeek, idx)}
                            className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addShift(day.dayOfWeek)}
                      className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-xs transition-colors mt-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar período
                    </button>
                  </div>
                )}
              </div>
            ))}

            {editHoursError && (
              <Alert className="bg-red-500/10 border-red-500/30">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-400 text-sm">{editHoursError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={closeEditHours}
              disabled={editHoursLoading}
              className="border-[#374151] text-white hover:bg-[#374151]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveHours}
              disabled={editHoursLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editHoursLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" />Salvar Horários</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Modal: Detalhes da Loja                                             */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={!!detailsTarget} onOpenChange={(o) => { if (!o) { setDetailsTarget(null); setMerchantDetails(null); setMerchantStatusData(null); } }}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-[#EA1D2C]" />
              {detailsTarget?.merchantName}
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-gray-500 text-sm">Carregando informações...</p>
            </div>
          ) : (
            <div className="space-y-5 py-1">

              {/* Status operacional */}
              {merchantStatusData && (() => {
                const st = merchantStatusData.status;
                const statusMap: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
                  ONLINE:        { label: 'Online',          icon: <Wifi className="h-4 w-4" />,          cls: 'bg-green-500/15 border-green-500/30 text-green-400' },
                  FECHADO:       { label: 'Fechado',         icon: <WifiOff className="h-4 w-4" />,       cls: 'bg-gray-500/15 border-gray-500/30 text-gray-400' },
                  AVISO:         { label: 'Aviso',           icon: <AlertTriangle className="h-4 w-4" />, cls: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' },
                  'INDISPONÍVEL':{ label: 'Indisponível',    icon: <AlertTriangle className="h-4 w-4" />, cls: 'bg-orange-500/15 border-orange-500/30 text-orange-400' },
                  ERROR:         { label: 'Erro de conexão', icon: <AlertTriangle className="h-4 w-4" />, cls: 'bg-red-500/15 border-red-500/30 text-red-400' },
                };
                const cfg = statusMap[st] ?? { label: st, icon: null, cls: 'bg-gray-500/15 border-gray-500/30 text-gray-400' };
                return (
                  <div className={`rounded-lg border p-3 space-y-2 ${cfg.cls}`}>
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      {cfg.icon}
                      Status iFood: {cfg.label}
                    </div>
                    {merchantStatusData.message && (
                      <p className="text-xs opacity-80">{merchantStatusData.message}</p>
                    )}
                  </div>
                );
              })()}

              {/* Informações básicas */}
              {merchantDetails && (
                <>
                  {/* Identificação */}
                  <div className="bg-black/30 rounded-lg p-3 space-y-2">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Identificação</p>
                    {merchantDetails.corporateName && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-gray-300 text-sm">{merchantDetails.corporateName}</span>
                      </div>
                    )}
                    {merchantDetails.taxId && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400 text-xs mt-0.5 shrink-0">CNPJ</span>
                        <span className="text-gray-300 text-sm font-mono">{merchantDetails.taxId}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 text-xs mt-0.5 shrink-0">Merchant ID</span>
                      <span className="text-gray-500 text-xs font-mono break-all">{detailsTarget?.merchantId}</span>
                    </div>
                  </div>

                  {/* Endereço */}
                  {merchantDetails.address && (() => {
                    const a = merchantDetails.address!;
                    return (
                      <div className="bg-black/30 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                          <MapPin className="h-3.5 w-3.5" />
                          Endereço
                        </div>
                        {(a.streetName || a.streetNumber) && (
                          <p className="text-white text-sm">
                            {[a.streetName, a.streetNumber].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {a.complement && (
                          <p className="text-gray-300 text-xs">Complemento: {a.complement}</p>
                        )}
                        {a.neighborhood && (
                          <p className="text-gray-400 text-xs">Bairro: {a.neighborhood}</p>
                        )}
                        {a.city && (
                          <p className="text-gray-400 text-xs">{a.city}{a.state ? `/${a.state}` : ''}</p>
                        )}
                        {a.postalCode && (
                          <p className="text-gray-400 text-xs">CEP: {a.postalCode}</p>
                        )}
                        {a.reference && (
                          <p className="text-yellow-400 text-xs">📍 {a.reference}</p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Contato */}
                  {(merchantDetails.contacts ?? []).length > 0 && (
                    <div className="bg-black/30 rounded-lg p-3 space-y-1.5">
                      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Contato</p>
                      {merchantDetails.contacts!.map((c, i) => (
                        <div key={i} className="space-y-1">
                          {c.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                              <a href={`tel:${c.phone}`} className="text-blue-400 hover:text-blue-300 text-sm">
                                {c.phone}
                              </a>
                            </div>
                          )}
                          {c.email && (
                            <p className="text-gray-300 text-sm pl-6">{c.email}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Categoria */}
                  {(merchantDetails.mainCategory ?? merchantDetails.categories?.[0]) && (
                    <div className="bg-black/30 rounded-lg p-3 space-y-1">
                      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Categoria</p>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-gray-300 text-sm">
                          {(merchantDetails.mainCategory ?? merchantDetails.categories![0]).description}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Modalidades de entrega */}
                  {(merchantDetails.deliveryMethods ?? []).length > 0 && (
                    <div className="bg-black/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
                        <Truck className="h-3.5 w-3.5" />
                        Modalidades de Entrega
                      </div>
                      {merchantDetails.deliveryMethods!.map((dm, i) => (
                        <div key={i} className="bg-black/20 rounded p-2 space-y-0.5">
                          <p className="text-white text-sm font-medium">{dm.title ?? dm.mode}</p>
                          {dm.subtitle && (
                            <p className="text-gray-400 text-xs">{dm.subtitle}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                            {(dm.minTime !== undefined && dm.maxTime !== undefined) && (
                              <span>⏱ {dm.minTime}–{dm.maxTime} min</span>
                            )}
                            {dm.minOrderValue !== undefined && dm.minOrderValue > 0 && (
                              <span>🛒 Pedido mín.: R$ {(dm.minOrderValue / 100).toFixed(2).replace('.', ',')}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Fallback: sem dados */}
              {!detailsLoading && !merchantDetails && !merchantStatusData && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Não foi possível carregar as informações desta loja.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDetailsTarget(null); setMerchantDetails(null); setMerchantStatusData(null); }}
              className="border-[#374151] text-white hover:bg-[#374151]"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Modal: Adicionar Loja                                               */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) closeAddModal(); else setAddOpen(true); }}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#EA1D2C]" />
              Adicionar Loja iFood
            </DialogTitle>
          </DialogHeader>

          {addStep === 'input' && (
            <div className="space-y-4 py-2">
              <Alert className="bg-[#0f0f10] border-[#374151]">
                <AlertDescription className="text-gray-400 text-sm">
                  Cole o <strong className="text-white">Merchant ID</strong> da sua loja. Você encontra
                  no Portal do Parceiro iFood em{' '}
                  <span className="text-white">Minha Conta → Dados da loja → Identificador</span>.
                </AlertDescription>
              </Alert>

              <div className="space-y-1.5">
                <Label htmlFor="merchantId" className="text-gray-300 text-sm">
                  Merchant ID (UUID)
                </Label>
                <Input
                  id="merchantId"
                  value={merchantIdInput}
                  onChange={(e) => {
                    setMerchantIdInput(e.target.value);
                    setAddError('');
                  }}
                  placeholder="ex: 3326e9c1-dc8a-4b2f-9f11-0e2a7c8b1234"
                  className="bg-[#0f0f10] border-[#374151] text-white placeholder:text-gray-600 font-mono text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleVerify(); }}
                />
              </div>

              {addError && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-400 text-sm">{addError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {addStep === 'confirm' && (
            <div className="space-y-4 py-2">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 text-sm font-semibold mb-1">✅ Loja encontrada</p>
                <p className="text-white font-medium">{verifiedName}</p>
                <p className="text-gray-400 text-xs font-mono mt-1">{truncateMerchantId(merchantIdInput)}</p>
              </div>
              <p className="text-gray-400 text-sm">
                Confirme para vincular essa loja à sua conta Plateful.
              </p>
              {addError && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-400 text-sm">{addError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={closeAddModal}
              className="border-[#374151] text-white hover:bg-[#374151]"
              disabled={verifying || connecting}
            >
              Cancelar
            </Button>

            {addStep === 'input' && (
              <Button
                onClick={handleVerify}
                disabled={verifying || !merchantIdInput.trim()}
                className="bg-[#EA1D2C] hover:bg-[#c9111f] text-white"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  'Verificar e Conectar'
                )}
              </Button>
            )}

            {addStep === 'confirm' && (
              <Button
                onClick={handleConfirmConnect}
                disabled={connecting}
                className="bg-[#EA1D2C] hover:bg-[#c9111f] text-white"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Conectando...
                  </>
                ) : (
                  'Confirmar Conexão'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Dialog: Confirmar exclusão                                          */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="h-5 w-5" />
              Remover loja iFood?
            </DialogTitle>
          </DialogHeader>

          <p className="text-gray-400 text-sm leading-relaxed">
            A loja <strong className="text-white">{deleteTarget?.merchantName}</strong> será
            desvinculada da sua conta. Os dados relacionados (pedidos, relatórios) serão
            desvinculados e não poderão ser recuperados. Tem certeza?
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-[#374151] text-white hover:bg-[#374151]"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
