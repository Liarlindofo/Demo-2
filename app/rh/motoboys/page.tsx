'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Bike, Plus, ArrowLeft, Search,
  Clock, ChevronRight, Mail,
  CheckCircle2, XCircle, Copy, MessageCircle, RefreshCw, Loader2,
  FileText, AlertCircle, FileCheck, Settings, Save,
} from 'lucide-react';

interface Loja { id: string; nome: string }
type DocStatus = 'none' | 'pending' | 'partial' | 'received';

interface Rider {
  id: string; name: string; cnpj: string; email: string;
  phone: string | null; status: string; passwordHash: string | null;
  lojaId: string; loja: { nome: string };
  docStatus: DocStatus; activePeriodId: string | null;
}
interface InviteData {
  link: string;
  expiresAt: string;
  whatsappLink: string | null;
}

const fmt = (cnpj: string) => cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  active: {
    label: 'Ativo',
    className: 'text-green-400 bg-green-500/10',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  pending_setup: {
    label: 'Aguardando ativação',
    className: 'text-amber-400 bg-amber-500/10',
    icon: <Clock className="w-3 h-3" />,
  },
  inactive: {
    label: 'Inativo',
    className: 'text-gray-400 bg-gray-500/10',
    icon: <XCircle className="w-3 h-3" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.className}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

const DOC_STATUS_CONFIG: Record<DocStatus, { label: string; className: string; icon: React.ReactNode } | null> = {
  none: null,
  pending: {
    label: 'Docs pendentes',
    className: 'text-red-400 bg-red-500/10',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  partial: {
    label: '1/2 docs enviados',
    className: 'text-amber-400 bg-amber-500/10',
    icon: <FileText className="w-3 h-3" />,
  },
  received: {
    label: 'Docs enviados',
    className: 'text-blue-400 bg-blue-500/10',
    icon: <FileCheck className="w-3 h-3" />,
  },
};

function DocBadge({ docStatus }: { docStatus: DocStatus }) {
  const cfg = DOC_STATUS_CONFIG[docStatus];
  if (!cfg) return null;
  return (
    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.className}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function PortalBadge({ hasPassword }: { hasPassword: boolean }) {
  if (hasPassword) {
    return (
      <span title="Acesso configurado" className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Portal ativo
      </span>
    );
  }
  return (
    <span title="Sem acesso ao portal" className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Sem acesso
    </span>
  );
}

// Toast simples inline
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl px-5 py-4 shadow-2xl flex items-start gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-4">
      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-white">{msg}</p>
    </div>
  );
}

interface InviteModalProps {
  rider: Rider;
  onClose: () => void;
  onToast: (msg: string) => void;
}

function InviteModal({ rider, onClose, onToast }: InviteModalProps) {
  const [data, setData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const fetchInvite = useCallback(async (regenerar = false) => {
    if (regenerar) setRegenerating(true); else setLoading(true);
    try {
      const res = await fetch(`/api/rh/motoboys/${rider.id}/invite`, regenerar ? { method: 'POST' } : undefined);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, [rider.id]);

  useEffect(() => { fetchInvite(); }, [fetchInvite]);

  const copy = () => {
    if (!data?.link) return;
    navigator.clipboard.writeText(data.link);
    onToast('Link copiado para a área de transferência!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">Link de convite</p>
            <p className="text-xs text-gray-500 mt-0.5">{rider.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">&times;</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        ) : data ? (
          <div className="space-y-3">
            <div className="bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-xs text-gray-300 break-all">
              {data.link}
            </div>
            <p className="text-xs text-gray-500">
              Válido até {new Date(data.expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={copy}
                className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/10 text-orange-400 text-xs rounded-lg hover:bg-orange-500/20 transition-colors">
                <Copy className="w-3.5 h-3.5" /> Copiar link
              </button>
              {data.whatsappLink && (
                <a href={data.whatsappLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 text-green-400 text-xs rounded-lg hover:bg-green-500/20 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" /> Abrir WhatsApp
                </a>
              )}
              <button onClick={() => fetchInvite(true)} disabled={regenerating}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#2a2a2e] text-gray-400 text-xs rounded-lg hover:text-white transition-colors disabled:opacity-50">
                {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Gerar novo link
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-400">Não foi possível carregar o link.</p>
        )}
      </div>
    </div>
  );
}

// ── Painel de configuração de e-mail ─────────────────────────────────────────

function ConfigEmailPanel({ onToast }: { onToast: (msg: string) => void }) {
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rh/motoboys/config');
      if (res.ok) {
        const data = await res.json();
        setEmail(data.email ?? '');
        setEmailInput(data.email ?? '');
      }
    } catch { /* silencia */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open) fetchConfig(); }, [open, fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/rh/motoboys/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });
      if (!res.ok) {
        const data = await res.json();
        onToast(`Erro: ${data.error ?? 'Falha ao salvar'}`);
        return;
      }
      setEmail(emailInput);
      onToast('E-mail de pagamentos atualizado com sucesso!');
      setOpen(false);
    } catch {
      onToast('Erro ao conectar com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Configurar e-mail de notificações de pagamento"
        className="flex items-center gap-2 px-4 py-2.5 bg-[#1c1c1e] border border-[#2a2a2e] text-gray-400 text-sm font-medium rounded-xl hover:text-white hover:border-[#3a3a3e] transition-colors"
      >
        <Settings className="w-4 h-4" />
        Configurações
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl p-6 w-full max-w-md space-y-5" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Notificações de Pagamento</p>
                  <p className="text-xs text-gray-500 mt-0.5">E-mail do responsável financeiro</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-lg leading-none">&times;</button>
            </div>

            {/* Descrição */}
            <div className="bg-orange-500/8 border border-orange-500/20 rounded-xl px-4 py-3">
              <p className="text-xs text-orange-300 leading-relaxed">
                Quando um motoboy enviar a <strong>NF</strong> e o <strong>boleto</strong>, um e-mail de
                notificação será enviado automaticamente para o endereço abaixo.
              </p>
            </div>

            {/* Campo de e-mail */}
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  E-mail do responsável
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="financeiro@empresa.com.br"
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                {email && (
                  <p className="text-xs text-gray-500 mt-2">
                    Atual: <span className="text-gray-300">{email}</span>
                  </p>
                )}
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#374151] text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-black text-sm font-bold hover:bg-orange-400 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MotoboyListPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="h-20 bg-[#1c1c1e] rounded-2xl animate-pulse" />)}
        </div>
      </div>
    }>
      <MotoboyListContent />
    </Suspense>
  );
}

function MotoboyListContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filtroLoja = searchParams.get('lojaId') ?? '';
  const filtroStatus = searchParams.get('status') ?? '';
  const filtroDocs = searchParams.get('docs') ?? '';
  const searchFromUrl = searchParams.get('q') ?? '';

  const [riders, setRiders] = useState<Rider[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchFromUrl);
  const [inviteRider, setInviteRider] = useState<Rider | null>(null);
  const [toast, setToast] = useState('');

  const setFiltro = useCallback((key: 'lojaId' | 'status' | 'docs' | 'q', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  useEffect(() => {
    fetch('/api/rh/lojas').then(r => r.ok ? r.json() : []).then(setLojas).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroLoja) params.set('lojaId', filtroLoja);
    if (filtroStatus) params.set('status', filtroStatus);
    fetch(`/api/rh/motoboys?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then(setRiders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filtroLoja, filtroStatus]);

  // Debounce da busca na URL
  useEffect(() => {
    setSearch(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== searchFromUrl) setFiltro('q', search);
    }, 300);
    return () => clearTimeout(t);
  }, [search, searchFromUrl, setFiltro]);

  const filtrados = riders.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || r.name.toLowerCase().includes(q)
      || r.email.toLowerCase().includes(q);
    const matchDocs = !filtroDocs || r.docStatus === filtroDocs;
    return matchSearch && matchDocs;
  });

  const pendentes = filtrados.filter(r => r.status === 'pending_setup').length;
  const docsPendentes = filtrados.filter(r => r.docStatus === 'pending' || r.docStatus === 'partial').length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/rh')} className="w-9 h-9 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] flex items-center justify-center hover:bg-[#2a2a2e]">
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Bike className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Motoboys</h1>
                <p className="text-xs text-gray-500">Gestão de entregadores e quinzenas</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConfigEmailPanel onToast={(msg) => setToast(msg)} />
            <Link href="/rh/motoboys/novo"
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-black text-sm font-bold rounded-xl hover:bg-orange-400 transition-colors">
              <Plus className="w-4 h-4" /> Cadastrar Motoboy
            </Link>
          </div>
        </div>

        {/* Alertas */}
        <div className="space-y-2">
          {pendentes > 0 && filtroStatus !== 'active' && filtroStatus !== 'inactive' && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-300">
                <strong>{pendentes}</strong> motoboy{pendentes > 1 ? 's' : ''} aguardando ativação — envie o link de convite.
              </p>
            </div>
          )}
          {docsPendentes > 0 && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">
                <strong>{docsPendentes}</strong> motoboy{docsPendentes > 1 ? 's' : ''} com documentos pendentes na quinzena atual.
              </p>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <select value={filtroLoja} onChange={(e) => setFiltro('lojaId', e.target.value)}
            className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
            <option value="">Todas as lojas</option>
            {lojas.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
          <select value={filtroStatus} onChange={(e) => setFiltro('status', e.target.value)}
            className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
            <option value="">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="pending_setup">Aguardando ativação</option>
            <option value="inactive">Inativos</option>
          </select>
          <select value={filtroDocs} onChange={(e) => setFiltro('docs', e.target.value)}
            className="bg-[#1c1c1e] border border-[#2a2a2e] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none">
            <option value="">Todos os docs</option>
            <option value="pending">Docs pendentes</option>
            <option value="partial">1/2 docs enviados</option>
            <option value="received">Docs enviados</option>
            <option value="none">Sem quinzena ativa</option>
          </select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <div key={i} className="h-20 bg-[#1c1c1e] rounded-2xl animate-pulse" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Bike className="w-12 h-12 text-gray-700" />
            <p className="text-gray-400">Nenhum motoboy encontrado</p>
            <Link href="/rh/motoboys/novo" className="text-orange-400 text-sm hover:underline">Cadastrar o primeiro</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrados.map((rider) => (
              <div key={rider.id} className="flex items-center justify-between bg-[#1c1c1e] border border-[#2a2a2e] rounded-2xl px-5 py-4 hover:bg-[#1e1e20] transition-colors group">

                {/* Info — clicável para detalhe */}
                <Link href={`/rh/motoboys/${rider.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Bike className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{rider.name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      <span className="text-xs text-gray-500">{fmt(rider.cnpj)}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />{rider.email}
                      </span>
                      <span className="text-xs text-gray-500">{rider.loja?.nome}</span>
                    </div>
                  </div>
                </Link>

                {/* Badges + ações */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <StatusBadge status={rider.status} />
                  <PortalBadge hasPassword={!!rider.passwordHash} />
                  <DocBadge docStatus={rider.docStatus} />

                  {/* Botão reenviar convite — só para pending_setup */}
                  {rider.status === 'pending_setup' && !rider.passwordHash && (
                    <button
                      onClick={(e) => { e.preventDefault(); setInviteRider(rider); }}
                      title="Ver / reenviar link de convite"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 text-xs rounded-lg hover:bg-amber-500/20 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Convite
                    </button>
                  )}

                  <Link href={`/rh/motoboys/${rider.id}`}>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition-colors" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de convite */}
      {inviteRider && (
        <InviteModal
          rider={inviteRider}
          onClose={() => setInviteRider(null)}
          onToast={(msg) => { setToast(msg); setInviteRider(null); }}
        />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </div>
  );
}
