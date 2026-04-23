'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApp } from '@/contexts/app-context';
import {
  ChevronLeft,
  ShoppingBag,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  PackageSearch,
  ExternalLink,
  CheckSquare,
  Square,
  Pencil,
  Clock,
  ImageOff,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface IfoodConnection {
  id: string;
  merchantId: string;
  merchantName: string;
  status: string;
}

interface CatalogItem {
  id: string;
  itemId: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  status: string; // AVAILABLE | UNAVAILABLE
  category: string | null;
  imageUrl: string | null;
  syncedAt: string;
}

type StatusFilter = 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const IFOOD_TABS = [
  { label: 'Configurações', href: '/ifood/configuracoes' },
  { label: 'Operacional', href: '/ifood/operacional' },
  { label: 'Financeiro', href: '/ifood/financeiro' },
  { label: 'Cardápio', href: '/ifood/cardapio', active: true },
];

const UNCATEGORIZED = 'Sem categoria';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

// ---------------------------------------------------------------------------
// Inline Checkbox
// ---------------------------------------------------------------------------
function Checkbox({
  checked,
  onChange,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`flex-shrink-0 ${className ?? ''}`}
      aria-label={checked ? 'Desselecionar' : 'Selecionar'}
    >
      {checked ? (
        <CheckSquare className="h-4 w-4 text-[#EA1D2C]" />
      ) : (
        <Square className="h-4 w-4 text-gray-600 hover:text-gray-400" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/5 rounded ${className ?? ''}`} />;
}

// ---------------------------------------------------------------------------
// Item Card
// ---------------------------------------------------------------------------
function ItemCard({
  item,
  isSelected,
  isTogglingStatus,
  onToggleStatus,
  onEditPrice,
  onSelect,
}: {
  item: CatalogItem;
  isSelected: boolean;
  isTogglingStatus: boolean;
  onToggleStatus: (item: CatalogItem) => void;
  onEditPrice: (item: CatalogItem) => void;
  onSelect: (itemId: string) => void;
}) {
  const isAvailable = item.status === 'AVAILABLE';

  return (
    <Card
      className={`bg-[#1a1a1b] border-[#2d2d2e] transition-all duration-200 ${
        isSelected ? 'ring-1 ring-[#EA1D2C]/60' : ''
      } ${!isAvailable ? 'opacity-55' : ''}`}
    >
      <CardContent className="p-3 space-y-3">
        {/* Top row: checkbox + image */}
        <div className="flex gap-2.5">
          <Checkbox checked={isSelected} onChange={() => onSelect(item.itemId)} className="mt-0.5" />

          {/* Product image */}
          <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-[#2d2d2e] relative">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="64px"
                className="object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff className="h-5 w-5 text-gray-600" />
              </div>
            )}
          </div>

          {/* Name + description */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight line-clamp-2">
              {item.name}
            </p>
            {item.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-tight">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Bottom row: price + actions */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#2d2d2e]">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-white">{fmt(item.price)}</span>
            {item.originalPrice && item.originalPrice !== item.price && (
              <span className="text-xs text-gray-600 line-through">{fmt(item.originalPrice)}</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onEditPrice(item)}
              className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
              title="Editar preço"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            <Switch
              checked={isAvailable}
              onCheckedChange={() => onToggleStatus(item)}
              disabled={isTogglingStatus}
              className={`data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-700 ${
                isTogglingStatus ? 'opacity-50' : ''
              }`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Category section (accordion)
// ---------------------------------------------------------------------------
function CategorySection({
  category,
  items,
  selectedItems,
  togglingStatusIds,
  onToggleStatus,
  onEditPrice,
  onSelect,
}: {
  category: string;
  items: CatalogItem[];
  selectedItems: Set<string>;
  togglingStatusIds: Set<string>;
  onToggleStatus: (item: CatalogItem) => void;
  onEditPrice: (item: CatalogItem) => void;
  onSelect: (itemId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const available = items.filter((i) => i.status === 'AVAILABLE').length;

  return (
    <div className="space-y-3">
      {/* Category header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-1 py-1 text-left group"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronUp className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          )}
          <span className="font-semibold text-white text-sm">{category}</span>
          <Badge className="bg-[#2d2d2e] text-gray-400 border-0 text-xs h-4">
            {items.length}
          </Badge>
          <span className="text-xs text-gray-600">
            {available}/{items.length} disponíveis
          </span>
        </div>
      </button>

      {/* Items grid */}
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map((item) => (
            <ItemCard
              key={item.itemId}
              item={item}
              isSelected={selectedItems.has(item.itemId)}
              isTogglingStatus={togglingStatusIds.has(item.itemId)}
              onToggleStatus={onToggleStatus}
              onEditPrice={onEditPrice}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Price edit modal
// ---------------------------------------------------------------------------
function PriceModal({
  item,
  onSave,
  onClose,
  saving,
}: {
  item: CatalogItem;
  onSave: (item: CatalogItem, price: number) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [value, setValue] = useState(item.price.toFixed(2).replace('.', ','));

  function handleSave() {
    const parsed = parseFloat(value.replace(',', '.'));
    if (!isFinite(parsed) || parsed <= 0) return;
    onSave(item, parsed);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Editar preço</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-1 truncate">{item.name}</p>
            <p className="text-xs text-gray-600">Preço atual: {fmt(item.price)}</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400">Novo preço (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^0-9,]/g, ''))}
                className="pl-9 bg-[#1a1a1b] border-[#374151] text-white"
                placeholder="0,00"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>Alteração de preço pode levar até 5 minutos para refletir no app.</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#EA1D2C] hover:bg-[#c9111f] text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar preço'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function IfoodCardapioPage() {
  const { addToast } = useApp();

  // Stores
  const [stores, setStores] = useState<IfoodConnection[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState('');

  // Catalog data
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [requiresHomologation, setRequiresHomologation] = useState(false);

  // Sync
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Selection & bulk
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Per-item toggling
  const [togglingStatusIds, setTogglingStatusIds] = useState<Set<string>>(new Set());

  // Price modal
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [savingPrice, setSavingPrice] = useState(false);

  // Search debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(q), 300);
  }

  // -----------------------------------------------------------------------
  // Load stores
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
          list[0]?.merchantId || '';
        setSelectedMerchant(initial);
      })
      .catch(() => addToast('❌ Erro ao carregar lojas', 'error'));
  }, [addToast]);

  useEffect(() => {
    if (selectedMerchant) localStorage.setItem('ifood_selected_merchant', selectedMerchant);
  }, [selectedMerchant]);

  // -----------------------------------------------------------------------
  // Load catalog items
  // -----------------------------------------------------------------------
  const fetchItems = useCallback(async () => {
    if (!selectedMerchant) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ifood/catalog?merchantId=${selectedMerchant}`);
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { items: CatalogItem[]; lastSync: string | null };
      setItems(data.items ?? []);
      setLastSync(data.lastSync ?? null);
      setSelectedItems(new Set());
    } catch {
      addToast('Erro ao carregar cardápio', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMerchant, addToast]);

  useEffect(() => {
    if (selectedMerchant) {
      setItems([]);
      setRequiresHomologation(false);
      fetchItems();
    }
  }, [selectedMerchant, fetchItems]);

  // -----------------------------------------------------------------------
  // Sync
  // -----------------------------------------------------------------------
  async function handleSync() {
    if (!selectedMerchant || syncing) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/ifood/catalog/sync?merchantId=${selectedMerchant}`, {
        method: 'POST',
      });
      const data = (await res.json()) as {
        requiresHomologation?: boolean;
        message?: string;
        synced?: number;
        success?: boolean;
      };

      if (data.requiresHomologation) {
        setRequiresHomologation(true);
        return;
      }
      if (!res.ok) {
        addToast(data.message ?? 'Erro ao sincronizar', 'error');
        return;
      }
      addToast(`✅ ${data.synced ?? 0} itens sincronizados`, 'success');
      await fetchItems();
    } catch {
      addToast('Erro ao sincronizar cardápio', 'error');
    } finally {
      setSyncing(false);
    }
  }

  // -----------------------------------------------------------------------
  // Toggle status (optimistic)
  // -----------------------------------------------------------------------
  async function handleToggleStatus(item: CatalogItem) {
    const newStatus = item.status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';

    // Optimistic
    setItems((prev) =>
      prev.map((i) => (i.itemId === item.itemId ? { ...i, status: newStatus } : i)),
    );
    setTogglingStatusIds((prev) => new Set([...prev, item.itemId]));

    try {
      const res = await fetch(`/api/ifood/catalog/${item.itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: selectedMerchant, status: newStatus }),
      });

      if (!res.ok) throw new Error();
      addToast(
        `${item.name}: ${newStatus === 'AVAILABLE' ? '🟢 disponibilizado' : '⚫ indisponibilizado'}`,
        'success',
      );
    } catch {
      // Revert
      setItems((prev) =>
        prev.map((i) => (i.itemId === item.itemId ? { ...i, status: item.status } : i)),
      );
      addToast(`Erro ao alterar "${item.name}"`, 'error');
    } finally {
      setTogglingStatusIds((prev) => {
        const next = new Set(prev);
        next.delete(item.itemId);
        return next;
      });
    }
  }

  // -----------------------------------------------------------------------
  // Edit price (optimistic)
  // -----------------------------------------------------------------------
  async function handleSavePrice(item: CatalogItem, newPrice: number) {
    setSavingPrice(true);
    const oldPrice = item.price;

    // Optimistic
    setItems((prev) =>
      prev.map((i) => (i.itemId === item.itemId ? { ...i, price: newPrice } : i)),
    );

    try {
      const res = await fetch(`/api/ifood/catalog/${item.itemId}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: selectedMerchant, price: newPrice }),
      });

      if (!res.ok) throw new Error();
      addToast(`💰 Preço de "${item.name}" atualizado para ${fmt(newPrice)}`, 'success');
      setEditingItem(null);
    } catch {
      // Revert
      setItems((prev) =>
        prev.map((i) => (i.itemId === item.itemId ? { ...i, price: oldPrice } : i)),
      );
      addToast(`Erro ao alterar preço de "${item.name}"`, 'error');
    } finally {
      setSavingPrice(false);
    }
  }

  // -----------------------------------------------------------------------
  // Selection
  // -----------------------------------------------------------------------
  function handleSelect(itemId: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function handleSelectAll(visibleIds: string[]) {
    const allSelected = visibleIds.every((id) => selectedItems.has(id));
    setSelectedItems(allSelected ? new Set() : new Set(visibleIds));
  }

  // -----------------------------------------------------------------------
  // Bulk status
  // -----------------------------------------------------------------------
  async function handleBulkStatus(status: 'AVAILABLE' | 'UNAVAILABLE') {
    const ids = [...selectedItems];
    if (ids.length === 0) return;

    setBulkLoading(true);

    // Save originals for rollback
    const originals = new Map(
      items
        .filter((i) => ids.includes(i.itemId))
        .map((i) => [i.itemId, i.status]),
    );

    // Optimistic
    setItems((prev) =>
      prev.map((i) => (ids.includes(i.itemId) ? { ...i, status } : i)),
    );
    setSelectedItems(new Set());

    try {
      const res = await fetch('/api/ifood/catalog/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: selectedMerchant,
          items: ids.map((id) => ({ id, status })),
        }),
      });
      const data = (await res.json()) as {
        successCount?: number;
        errorCount?: number;
        errors?: Array<{ id: string; error: string }>;
      };

      if (!res.ok) throw new Error();

      if ((data.errorCount ?? 0) > 0) {
        // Revert failed items
        const failedIds = new Set((data.errors ?? []).map((e) => e.id));
        setItems((prev) =>
          prev.map((i) => {
            if (failedIds.has(i.itemId)) {
              return { ...i, status: originals.get(i.itemId) ?? i.status };
            }
            return i;
          }),
        );
        addToast(
          `⚠️ ${data.successCount} OK · ${data.errorCount} falhou(am)`,
          'error',
        );
      } else {
        addToast(
          `✅ ${data.successCount ?? ids.length} itens ${status === 'AVAILABLE' ? 'disponibilizados' : 'indisponibilizados'}`,
          'success',
        );
      }
    } catch {
      // Full revert
      setItems((prev) =>
        prev.map((i) => {
          const original = originals.get(i.itemId);
          return original ? { ...i, status: original } : i;
        }),
      );
      addToast('Erro na atualização em lote', 'error');
    } finally {
      setBulkLoading(false);
    }
  }

  // -----------------------------------------------------------------------
  // Filtered + grouped items
  // -----------------------------------------------------------------------
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL') {
        const cat = item.category ?? UNCATEGORIZED;
        if (cat !== categoryFilter) return false;
      }
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        return item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, statusFilter, categoryFilter, debouncedSearch]);

  const categories = useMemo(() => {
    const cats = new Map<string, CatalogItem[]>();
    for (const item of filteredItems) {
      const cat = item.category ?? UNCATEGORIZED;
      if (!cats.has(cat)) cats.set(cat, []);
      cats.get(cat)!.push(item);
    }
    return cats;
  }, [filteredItems]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) set.add(item.category ?? UNCATEGORIZED);
    return [...set].sort();
  }, [items]);

  const visibleItemIds = filteredItems.map((i) => i.itemId);
  const allVisibleSelected =
    visibleItemIds.length > 0 && visibleItemIds.every((id) => selectedItems.has(id));

  const selectedStore = stores.find((s) => s.merchantId === selectedMerchant);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black text-white">
      {/* ── Header ── */}
      <header className="bg-[#141415]/95 backdrop-blur-sm border-b border-[#374151] sticky top-0 z-40">
        <div className="max-w-full px-4 sm:px-6 py-3 flex items-center gap-4 flex-wrap">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ShoppingBag className="h-5 w-5 text-[#EA1D2C]" />
            <span className="font-semibold">iFood</span>
          </div>

          {/* Store selector */}
          {stores.length > 1 ? (
            <div className="w-52">
              <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#374151] text-white h-8 text-sm">
                  <SelectValue placeholder="Selecionar loja" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#374151] text-white">
                  {stores.map((s) => (
                    <SelectItem key={s.merchantId} value={s.merchantId}
                      className="hover:bg-[#374151] focus:bg-[#374151]">
                      {s.merchantName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : selectedStore && (
            <span className="text-gray-400 text-sm">{selectedStore.merchantName}</span>
          )}

          {/* Last sync + sync button */}
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {lastSync && (
              <span className="text-xs text-gray-600 hidden sm:block">
                Sincronizado {fmtDate(lastSync)}
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSync}
              disabled={syncing || !selectedMerchant}
              className="h-8 text-xs text-gray-400 hover:text-white gap-1.5"
            >
              {syncing
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <RefreshCw className="h-3.5 w-3.5" />}
              <span className="hidden sm:block">Sincronizar Cardápio</span>
            </Button>
          </div>
        </div>

        {/* Subnav */}
        <div className="px-4 sm:px-6">
          <nav className="flex gap-1">
            {IFOOD_TABS.map((tab) =>
              'active' in tab && tab.active ? (
                <span key={tab.href} className="px-4 py-2.5 text-sm font-medium text-white border-b-2 border-[#EA1D2C]">
                  {tab.label}
                </span>
              ) : (
                <Link key={tab.href} href={tab.href}
                  className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-300 border-b-2 border-transparent transition-colors">
                  {tab.label}
                </Link>
              ),
            )}
          </nav>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto pb-24">
        {/* No stores */}
        {stores.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma loja conectada</h3>
            <p className="text-gray-400 mb-4">
              Conecte uma loja iFood para gerenciar o cardápio.
            </p>
            <Link href="/ifood/configuracoes">
              <Button className="bg-[#EA1D2C] hover:bg-[#c9111f] text-white">
                Ir para Configurações
              </Button>
            </Link>
          </div>
        )}

        {stores.length > 0 && (
          <>
            {/* Homologation banner */}
            {requiresHomologation && (
              <Alert className="bg-orange-500/10 border-orange-500/30">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-orange-300 text-sm space-y-1">
                  <p className="font-semibold">Módulo Catalog não homologado</p>
                  <p className="text-orange-300/80 text-xs">
                    A API de Catálogo do iFood requer solicitação de acesso específica no iFood
                    Developer Portal. Solicite o escopo &quot;catalog&quot; para habilitar este módulo.
                  </p>
                  <a
                    href="https://developer.ifood.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 mt-1"
                  >
                    Acessar Developer Portal
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </AlertDescription>
              </Alert>
            )}

            {/* Search + filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <Input
                  placeholder="Buscar produto..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 h-8 text-sm bg-[#141415] border-[#374151] text-white placeholder:text-gray-600"
                />
              </div>

              {/* Status filter */}
              <div className="flex bg-[#141415] rounded-lg p-0.5 gap-0.5">
                {(['ALL', 'AVAILABLE', 'UNAVAILABLE'] as StatusFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 h-7 text-xs font-medium rounded-md transition-colors ${
                      statusFilter === f
                        ? 'bg-[#EA1D2C] text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f === 'ALL' ? 'Todos' : f === 'AVAILABLE' ? 'Disponíveis' : 'Indisponíveis'}
                  </button>
                ))}
              </div>

              {/* Category filter */}
              {allCategories.length > 1 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-44 h-8 text-xs bg-[#141415] border-[#374151] text-gray-300">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#141415] border-[#374151] text-white">
                    <SelectItem value="ALL" className="hover:bg-[#374151] focus:bg-[#374151] text-xs">
                      Todas as categorias
                    </SelectItem>
                    {allCategories.map((c) => (
                      <SelectItem key={c} value={c} className="hover:bg-[#374151] focus:bg-[#374151] text-xs">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Select all visible */}
              {filteredItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelectAll(visibleItemIds)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors ml-auto"
                >
                  {allVisibleSelected ? (
                    <CheckSquare className="h-3.5 w-3.5" />
                  ) : (
                    <Square className="h-3.5 w-3.5" />
                  )}
                  Selecionar todos
                </button>
              )}
            </div>

            {/* Stats bar */}
            {!loading && items.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span>{items.length} itens no cardápio</span>
                <span>·</span>
                <span className="text-green-500/70">
                  {items.filter((i) => i.status === 'AVAILABLE').length} disponíveis
                </span>
                <span>·</span>
                <span className="text-gray-500">
                  {items.filter((i) => i.status === 'UNAVAILABLE').length} indisponíveis
                </span>
                {filteredItems.length !== items.length && (
                  <>
                    <span>·</span>
                    <span className="text-[#EA1D2C]/80">{filteredItems.length} exibidos</span>
                  </>
                )}
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-6">
                {[1, 2].map((g) => (
                  <div key={g} className="space-y-3">
                    <Sk className="h-5 w-40" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-[#1a1a1b] border border-[#2d2d2e] rounded-xl p-3 space-y-3">
                          <div className="flex gap-2.5">
                            <Sk className="h-4 w-4" />
                            <Sk className="h-16 w-16 rounded-lg flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                              <Sk className="h-3.5 w-32" />
                              <Sk className="h-3 w-24" />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-[#2d2d2e]">
                            <Sk className="h-5 w-20" />
                            <Sk className="h-6 w-11 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state — never synced */}
            {!loading && items.length === 0 && !requiresHomologation && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-[#141415] border border-[#374151] rounded-2xl flex items-center justify-center mb-5">
                  <PackageSearch className="h-9 w-9 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Cardápio não sincronizado
                </h3>
                <p className="text-gray-500 text-sm max-w-xs mb-6">
                  Sincronize seu cardápio para gerenciar seus produtos aqui.
                </p>
                <Button
                  onClick={handleSync}
                  disabled={syncing}
                  className="bg-[#EA1D2C] hover:bg-[#c9111f] text-white gap-2"
                >
                  {syncing
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <RefreshCw className="h-4 w-4" />}
                  Sincronizar Agora
                </Button>
              </div>
            )}

            {/* No results after filter */}
            {!loading && items.length > 0 && filteredItems.length === 0 && (
              <div className="py-16 text-center text-gray-600 text-sm">
                Nenhum item encontrado com os filtros aplicados.
              </div>
            )}

            {/* Category sections */}
            {!loading && filteredItems.length > 0 && (
              <div className="space-y-8">
                {[...categories.entries()].map(([cat, catItems]) => (
                  <CategorySection
                    key={cat}
                    category={cat}
                    items={catItems}
                    selectedItems={selectedItems}
                    togglingStatusIds={togglingStatusIds}
                    onToggleStatus={handleToggleStatus}
                    onEditPrice={setEditingItem}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Bulk action bar ── */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#141415]/95 backdrop-blur-sm border-t border-[#374151] px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedItems(new Set())}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <CheckSquare className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-white">
                {selectedItems.size}{' '}
                {selectedItems.size === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatus('UNAVAILABLE')}
                disabled={bulkLoading}
                className="h-8 text-xs border-gray-600 text-gray-300 hover:bg-gray-700 gap-1.5"
              >
                {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Indisponibilizar selecionados
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulkStatus('AVAILABLE')}
                disabled={bulkLoading}
                className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5"
              >
                {bulkLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Disponibilizar selecionados
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Price modal ── */}
      {editingItem && (
        <PriceModal
          item={editingItem}
          onSave={handleSavePrice}
          onClose={() => setEditingItem(null)}
          saving={savingPrice}
        />
      )}
    </div>
  );
}
