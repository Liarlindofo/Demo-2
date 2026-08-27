"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@stackframe/stack";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ToolProtection from "@/components/auth/ToolProtection";
import { SystemTool } from "@/types/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  QrCode,
  Power,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Bot,
  Pencil,
  Trash2,
} from "lucide-react";

interface SessionRow {
  slot: number;
  label: string;
  status: string;
  isConnected: boolean;
  isActive: boolean;
  connectedNumber: string | null;
  qrCode: string | null;
  iaAtiva: boolean;
  iaPrompt: string | null;
  monitorarReclamacoes: boolean;
}

interface QrModalState {
  open: boolean;
  qrCode?: string;
  slot?: number;
  label?: string;
}

function isSessionConnected(s: SessionRow) {
  return s.isConnected || s.status === "CONNECTED";
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "connected":
      return "bg-green-500";
    case "connecting":
    case "qrcode":
      return "bg-yellow-500";
    default:
      return "bg-red-500";
  }
}

function getStatusText(status: string) {
  switch (status.toLowerCase()) {
    case "connected":
      return "Conectado";
    case "connecting":
      return "Conectando...";
    case "qrcode":
      return "Aguardando QR Code";
    default:
      return "Desconectado";
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "connected":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "connecting":
    case "qrcode":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <XCircle className="h-4 w-4 text-red-500" />;
  }
}

function SessionCard({
  session,
  isStarting,
  actionLoading,
  savingConfig,
  deleting,
  onStart,
  onStop,
  onDelete,
  onRefresh,
  onShowQr,
  onSaveConfig,
}: {
  session: SessionRow;
  isStarting: boolean;
  actionLoading: boolean;
  savingConfig: boolean;
  deleting: boolean;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onShowQr: (qrCode: string) => void;
  onSaveConfig: (patch: {
    label?: string;
    iaAtiva?: boolean;
    iaPrompt?: string | null;
    monitorarReclamacoes?: boolean;
  }) => Promise<void>;
}) {
  const connected = isSessionConnected(session);
  const waitingQr = session.status === "QRCODE";
  const connecting = session.status === "CONNECTING" || waitingQr;

  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(session.label);
  const [promptDraft, setPromptDraft] = useState(session.iaPrompt ?? "");

  useEffect(() => {
    if (!editingLabel) setLabelDraft(session.label);
  }, [session.label, editingLabel]);

  useEffect(() => {
    setPromptDraft(session.iaPrompt ?? "");
  }, [session.iaPrompt]);

  const commitLabel = async () => {
    const next = labelDraft.trim();
    setEditingLabel(false);
    if (!next || next === session.label) {
      setLabelDraft(session.label);
      return;
    }
    await onSaveConfig({ label: next });
  };

  return (
    <Card className="bg-[#141415] border-[#374151] rounded-2xl p-6 hover:border-[#001F05] transition-all">
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-3 h-3 rounded-full ${getStatusColor(session.status)} ${
            connecting ? "animate-pulse" : ""
          }`}
        />
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Bot className="h-5 w-5 text-emerald-400 shrink-0" />
          {editingLabel ? (
            <input
              autoFocus
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitLabel();
                if (e.key === "Escape") {
                  setLabelDraft(session.label);
                  setEditingLabel(false);
                }
              }}
              className="bg-[#0a0a0a] border border-[#374151] rounded-lg px-2 py-1 text-sm text-white w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingLabel(true)}
              className="flex items-center gap-1.5 min-w-0 group"
              title="Editar nome"
            >
              <h3 className="text-xl font-semibold text-white truncate">{session.label}</h3>
              <Pencil className="h-3.5 w-3.5 text-gray-600 group-hover:text-gray-300 shrink-0" />
            </button>
          )}
        </div>
        {getStatusIcon(session.status)}
      </div>

      <p className="text-gray-400 mb-2">{getStatusText(session.status)}</p>

      {connected && (
        <p className="text-xs text-gray-500 mb-3 truncate">
          {session.connectedNumber
            ? `Número: ${session.connectedNumber}`
            : "Número: ainda não identificado (reconecte se persistir)"}
        </p>
      )}

      <div className="mb-4">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            connected
              ? "bg-green-500/20 text-green-400"
              : waitingQr
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-red-500/20 text-red-400"
          }`}
        >
          {connected ? "✓ Conectado" : waitingQr ? "⏳ Aguardando QR" : "✗ Desconectado"}
        </span>
      </div>

      <div className="mb-4 space-y-3">
        <button
          type="button"
          onClick={() => onSaveConfig({ iaAtiva: !session.iaAtiva })}
          disabled={savingConfig}
          className="flex items-center gap-2.5 select-none"
        >
          <span
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
              session.iaAtiva ? "bg-emerald-500" : "bg-[#3a3a3e]"
            }`}
            role="switch"
            aria-checked={session.iaAtiva}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: session.iaAtiva ? "18px" : "2px" }}
            />
          </span>
          <span className="text-sm text-gray-300">IA ativa</span>
        </button>

        <button
          type="button"
          onClick={() => onSaveConfig({ monitorarReclamacoes: !session.monitorarReclamacoes })}
          disabled={savingConfig}
          className="flex items-center gap-2.5 select-none"
        >
          <span
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
              session.monitorarReclamacoes ? "bg-amber-500" : "bg-[#3a3a3e]"
            }`}
            role="switch"
            aria-checked={session.monitorarReclamacoes}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: session.monitorarReclamacoes ? "18px" : "2px" }}
            />
          </span>
          <span className="text-sm text-gray-300">Registrar mensagens para revisão de reclamações</span>
        </button>

        {session.iaAtiva && (
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Prompt exclusivo desta sessão</label>
            <textarea
              value={promptDraft}
              onChange={(e) => setPromptDraft(e.target.value)}
              rows={4}
              placeholder="Vazio = usa o prompt padrão de /whatsapp-tools"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2e] rounded-xl px-3 py-2 text-xs text-gray-300 placeholder-gray-600 resize-none focus:outline-none focus:border-emerald-500/40"
            />
            <button
              type="button"
              disabled={savingConfig}
              onClick={() => onSaveConfig({ iaPrompt: promptDraft.trim() || null })}
              className="mt-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
            >
              Salvar prompt
            </button>
            <p className="text-[10px] text-gray-600 mt-1.5 leading-relaxed">
              Se preenchido, esta sessão <span className="text-gray-400">ignora</span> o prompt de /whatsapp-tools e usa só este texto.
              Se vazio, usa o padrão da Platefull. Não precisa reconectar para o prompt valer.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {connected ? (
          <Button
            onClick={onStop}
            disabled={actionLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            Desconectar
          </Button>
        ) : (
          <>
            <Button
              onClick={onStart}
              disabled={isStarting}
              className="w-full bg-[#001F05] hover:bg-[#003308] text-white"
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <QrCode className="h-4 w-4 mr-2" />
              )}
              {waitingQr || connecting ? "Reconectar / Novo QR" : "Gerar QR Code"}
            </Button>

            {waitingQr && session.qrCode && (
              <Button
                onClick={() => onShowQr(session.qrCode!)}
                variant="outline"
                className="w-full border-[#374151] text-white hover:bg-[#374151]"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Ver QR Code
              </Button>
            )}
          </>
        )}

        <Button
          onClick={onRefresh}
          variant="outline"
          className="w-full border-[#374151] text-white hover:bg-[#374151]"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar Status
        </Button>

        <Button
          onClick={onDelete}
          disabled={actionLoading || deleting}
          variant="outline"
          className="w-full border-red-900/60 text-red-400 hover:bg-red-950/40 hover:text-red-300"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Apagar sessão
        </Button>
      </div>
    </Card>
  );
}

function ConnectionsPageContent() {
  const user = useUser();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<QrModalState>({ open: false });
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});
  const [isStarting, setIsStarting] = useState<Record<number, boolean>>({});
  const [savingConfig, setSavingConfig] = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState<Record<number, boolean>>({});
  const [awaitingQr, setAwaitingQr] = useState<Record<number, boolean>>({});
  const [creating, setCreating] = useState(false);

  const loadConnections = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/whatsapp-sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      }
    } catch (error) {
      console.error("Erro ao carregar conexões:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    loadConnections();
    const interval = setInterval(loadConnections, 15000);
    return () => clearInterval(interval);
  }, [user, loadConnections]);

  useEffect(() => {
    if (!qrModal.open || qrModal.slot == null) return;
    const session = sessions.find((s) => s.slot === qrModal.slot);
    if (session && isSessionConnected(session)) {
      const t = setTimeout(() => setQrModal({ open: false }), 1500);
      return () => clearTimeout(t);
    }
  }, [sessions, qrModal.open, qrModal.slot]);

  useEffect(() => {
    if (!user?.id) return;
    const activeSlots = Object.keys(awaitingQr)
      .map(Number)
      .filter((slot) => awaitingQr[slot]);
    if (activeSlots.length === 0) return;

    const interval = setInterval(async () => {
      for (const slot of activeSlots) {
        try {
          const qrResponse = await fetch(`/api/whatsapp-sessions/slot/${slot}/qr`);
          if (!qrResponse.ok) continue;
          const qrData = await qrResponse.json();

          if (qrData.isConnected) {
            setAwaitingQr((prev) => ({ ...prev, [slot]: false }));
            await loadConnections();
            continue;
          }

          if (qrData.success && qrData.qrCode) {
            const sess = sessions.find((s) => s.slot === slot);
            setQrModal({
              open: true,
              qrCode: qrData.qrCode,
              slot,
              label: sess?.label || `Sessão ${slot}`,
            });
          }
        } catch (err) {
          console.error(`Erro ao buscar QR (slot ${slot}):`, err);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [awaitingQr, user?.id, loadConnections, sessions]);

  const handleStart = async (slot: number, label: string) => {
    if (!user?.id || isStarting[slot]) return;

    setIsStarting((prev) => ({ ...prev, [slot]: true }));
    setActionLoading((prev) => ({ ...prev, [slot]: true }));

    const session = sessions.find((s) => s.slot === slot);
    const alreadyWaiting =
      session?.status === "QRCODE" || session?.status === "CONNECTING";
    const force = alreadyWaiting || Boolean(awaitingQr[slot]);
    const forceQs = force ? "?force=1" : "";

    try {
      const response = await fetch(`/api/whatsapp-sessions/slot/${slot}/start${forceQs}`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Erro HTTP ${response.status}`);

      setAwaitingQr((prev) => ({ ...prev, [slot]: true }));
      setQrModal({
        open: true,
        qrCode: data.qrCode || undefined,
        slot,
        label,
      });
      await loadConnections();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao iniciar sessão";
      alert(message);
    } finally {
      setIsStarting((prev) => ({ ...prev, [slot]: false }));
      setActionLoading((prev) => ({ ...prev, [slot]: false }));
    }
  };

  const handleStop = async (slot: number) => {
    setActionLoading((prev) => ({ ...prev, [slot]: true }));
    try {
      await fetch(`/api/whatsapp-sessions/slot/${slot}/stop`, { method: "POST" });
      setAwaitingQr((prev) => ({ ...prev, [slot]: false }));
      await loadConnections();
    } catch (error) {
      console.error(`Erro ao desconectar slot ${slot}:`, error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [slot]: false }));
    }
  };

  const handleDelete = async (slot: number, label: string) => {
    const ok = window.confirm(
      `Apagar permanentemente "${label}"?\n\nIsso remove a sessão da lista e os dados de autenticação. Para usar de novo, será preciso criar e escanear o QR.`,
    );
    if (!ok) return;

    setDeleting((prev) => ({ ...prev, [slot]: true }));
    try {
      const res = await fetch(`/api/whatsapp-sessions/slot/${slot}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Falha ao apagar sessão");

      setAwaitingQr((prev) => ({ ...prev, [slot]: false }));
      if (qrModal.slot === slot) setQrModal({ open: false });
      await loadConnections();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao apagar sessão");
    } finally {
      setDeleting((prev) => ({ ...prev, [slot]: false }));
    }
  };

  const handleSaveConfig = async (
    slot: number,
    patch: {
      label?: string;
      iaAtiva?: boolean;
      iaPrompt?: string | null;
      monitorarReclamacoes?: boolean;
    },
  ) => {
    setSavingConfig((prev) => ({ ...prev, [slot]: true }));
    try {
      const res = await fetch(`/api/whatsapp-sessions/slot/${slot}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao salvar");
      }
      await loadConnections();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSavingConfig((prev) => ({ ...prev, [slot]: false }));
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/whatsapp-sessions", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Falha ao criar sessão");

      const slot = Number(data.slot);
      setAwaitingQr((prev) => ({ ...prev, [slot]: true }));
      setQrModal({
        open: true,
        qrCode: data.qrCode || undefined,
        slot,
        label: `Sessão ${slot}`,
      });
      await loadConnections();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao conectar novo número");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Por favor, faça login para acessar suas conexões.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Conexões</h1>
            <p className="text-gray-400">
              Conecte quantos números quiser. Cada um pode ter IA e prompt próprios.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="bg-[#001F05] hover:bg-[#003308] text-white"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Conectar novo número
          </Button>
        </div>

        {sessions.length === 0 ? (
          <Card className="bg-[#141415] border-[#374151] rounded-2xl p-10 text-center">
            <p className="text-gray-400 mb-4">Nenhuma sessão ainda.</p>
            <Button onClick={handleCreate} disabled={creating} className="bg-[#001F05] hover:bg-[#003308] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Conectar primeiro número
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((session) => (
              <SessionCard
                key={session.slot}
                session={session}
                isStarting={Boolean(isStarting[session.slot])}
                actionLoading={Boolean(actionLoading[session.slot])}
                savingConfig={Boolean(savingConfig[session.slot])}
                deleting={Boolean(deleting[session.slot])}
                onStart={() => handleStart(session.slot, session.label)}
                onStop={() => handleStop(session.slot)}
                onDelete={() => handleDelete(session.slot, session.label)}
                onRefresh={loadConnections}
                onShowQr={(qrCode) =>
                  setQrModal({ open: true, qrCode, slot: session.slot, label: session.label })
                }
                onSaveConfig={(patch) => handleSaveConfig(session.slot, patch)}
              />
            ))}
          </div>
        )}

        <Card className="mt-8 bg-[#141415] border-[#374151] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Como conectar</h3>
          <ol className="space-y-2 text-gray-400">
            <li>1. Clique em &quot;Conectar novo número&quot; ou &quot;Gerar QR Code&quot;</li>
            <li>2. Abra o WhatsApp no celular do número correspondente</li>
            <li>3. Vá em Aparelhos conectados → Conectar aparelho</li>
            <li>4. Aponte a câmera para o QR Code</li>
            <li>5. Dê um nome, ligue a IA se quiser, e escolha essa sessão em Relatórios ou Tarefas</li>
          </ol>
        </Card>
      </div>

      <Dialog
        open={qrModal.open}
        onOpenChange={(open) => {
          if (!open) setQrModal({ open: false });
        }}
      >
        <DialogContent className="bg-[#141415] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code — {qrModal.label}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            {qrModal.qrCode ? (
              <>
                <Image
                  src={qrModal.qrCode}
                  alt="QR Code"
                  width={256}
                  height={256}
                  className="w-64 h-64 bg-white p-4 rounded-lg"
                  unoptimized
                />
                <p className="text-gray-400 mt-4 text-center">
                  Aguardando leitura do QR Code...
                  <br />
                  <span className="text-xs">A conexão será confirmada automaticamente</span>
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>Gerando QR Code...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <ToolProtection tool={SystemTool.CONEXOES} toolName="Conexões">
      <ConnectionsPageContent />
    </ToolProtection>
  );
}
