'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/app-context';
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
  ChevronLeft,
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

type IfoodStatus = 'OPEN' | 'CLOSED' | 'BUSY' | 'PAUSED' | 'ERROR' | 'UNKNOWN' | null;

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
  raw?: {
    value?: string;
    message?: string;
    validations?: Array<{ id?: string; code?: string; state?: string; message?: string }>;
  };
}

const MAX_STORES = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function truncateMerchantId(id: string) {
  return id.length > 16 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;
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
    OPEN: { label: 'Aberto', icon: <Wifi className="h-3 w-3" />, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    CLOSED: { label: 'Fechado', icon: <WifiOff className="h-3 w-3" />, className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    BUSY: { label: 'Ocupado', icon: <Clock className="h-3 w-3" />, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    PAUSED: { label: 'Pausado', icon: <Clock className="h-3 w-3" />, className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    ERROR: { label: 'Erro', icon: <AlertTriangle className="h-3 w-3" />, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    UNKNOWN: { label: 'Desconhecido', icon: null, className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
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
      const data = await res.json() as { status?: string; error?: string };

      if (!res.ok) {
        addToast(`❌ ${data.error ?? 'Erro ao testar conexão'}`, 'error');
        setRealtimeStatus((prev) => ({ ...prev, [connection.id]: 'ERROR' }));
        return;
      }

      const s = (data.status ?? 'UNKNOWN') as IfoodStatus;
      setRealtimeStatus((prev) => ({ ...prev, [connection.id]: s }));

      const labels: Record<string, string> = {
        OPEN: '🟢 Loja aberta no iFood',
        CLOSED: '⚫ Loja fechada no iFood',
        BUSY: '🟡 Loja ocupada',
        PAUSED: '🟠 Loja pausada',
      };
      addToast(labels[s ?? ''] ?? `Status: ${s}`, s === 'OPEN' ? 'success' : 'error');

      // Atualiza status no estado local
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connection.id
            ? { ...c, status: s === 'OPEN' ? 'active' : s === 'CLOSED' ? 'inactive' : 'error' }
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
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#EA1D2C]" />
            <span className="font-semibold text-lg">iFood</span>
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
                <span
                  key={tab.href}
                  className="px-4 py-2.5 text-sm font-medium text-gray-500 cursor-not-allowed border-b-2 border-transparent"
                  title="Em breve"
                >
                  {tab.label}
                </span>
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
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleTestStatus(conn)}
                      disabled={testingStatus[conn.id]}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-[#374151] text-white hover:bg-[#374151]"
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
                      className="flex-1 border-[#374151] text-white hover:bg-[#374151]"
                    >
                      <Info className="h-3.5 w-3.5 mr-1.5" />
                      Ver Detalhes
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
                const validations = merchantStatusData.raw?.validations ?? [];
                const statusMap: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
                  OPEN:    { label: 'Aberto', icon: <Wifi className="h-4 w-4" />, cls: 'bg-green-500/15 border-green-500/30 text-green-400' },
                  CLOSED:  { label: 'Fechado', icon: <WifiOff className="h-4 w-4" />, cls: 'bg-gray-500/15 border-gray-500/30 text-gray-400' },
                  BUSY:    { label: 'Ocupado', icon: <Clock className="h-4 w-4" />, cls: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' },
                  PAUSED:  { label: 'Pausado', icon: <Clock className="h-4 w-4" />, cls: 'bg-orange-500/15 border-orange-500/30 text-orange-400' },
                  ERROR:   { label: 'Erro de conexão', icon: <AlertTriangle className="h-4 w-4" />, cls: 'bg-red-500/15 border-red-500/30 text-red-400' },
                  UNKNOWN: { label: 'Desconhecido', icon: null, cls: 'bg-gray-500/15 border-gray-500/30 text-gray-400' },
                };
                const cfg = statusMap[st] ?? statusMap.UNKNOWN;
                return (
                  <div className={`rounded-lg border p-3 space-y-2 ${cfg.cls}`}>
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      {cfg.icon}
                      Status iFood: {cfg.label}
                    </div>
                    {merchantStatusData.raw?.message && (
                      <p className="text-xs opacity-80">{merchantStatusData.raw.message}</p>
                    )}
                    {validations.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-current/20">
                        <p className="text-xs font-medium opacity-70 uppercase tracking-wider">Validações</p>
                        {validations.map((v, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            {v.state === 'VALID' || v.state === 'OK'
                              ? <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
                              : <XCircle className="h-3 w-3 text-red-400 shrink-0" />}
                            <span className="opacity-80">{v.message ?? v.code}</span>
                          </div>
                        ))}
                      </div>
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
