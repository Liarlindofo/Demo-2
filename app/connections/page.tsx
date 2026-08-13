"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
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
  Bot,
  FileText,
} from "lucide-react";

type SessionKind = "atendimento" | "relatorios";

interface SessionStatus {
  status: string;
  qrCode?: string | null;
  isActive: boolean;
  isConnected?: boolean;
  connectedNumber?: string | null;
}

interface QrModalState {
  open: boolean;
  qrCode?: string;
  kind?: SessionKind;
  connectionName?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_API_URL || "https://api.platefull.com.br";

const EMPTY_SESSION: SessionStatus = {
  status: "DISCONNECTED",
  qrCode: null,
  isActive: false,
  isConnected: false,
  connectedNumber: null,
};

function isSessionConnected(session: SessionStatus) {
  return (
    session.isConnected === true ||
    session.status === "CONNECTED" ||
    session.status.toLowerCase() === "connected"
  );
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "connected":
    case "conectado":
      return "bg-green-500";
    case "connecting":
    case "conectando":
    case "qrcode":
      return "bg-yellow-500";
    default:
      return "bg-red-500";
  }
}

function getStatusText(status: string) {
  switch (status.toLowerCase()) {
    case "connected":
    case "conectado":
      return "Conectado";
    case "connecting":
    case "conectando":
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
    case "conectado":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "connecting":
    case "conectando":
    case "qrcode":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <XCircle className="h-4 w-4 text-red-500" />;
  }
}

function SessionCard({
  kind,
  title,
  description,
  icon,
  session,
  isStarting,
  actionLoading,
  onStart,
  onStop,
  onRefresh,
  onShowQr,
}: {
  kind: SessionKind;
  title: string;
  description: string;
  icon: ReactNode;
  session: SessionStatus;
  isStarting: boolean;
  actionLoading: boolean;
  onStart: () => void;
  onStop: () => void;
  onRefresh: () => void;
  onShowQr: (qrCode: string) => void;
}) {
  const connected = isSessionConnected(session);
  const waitingQr =
    session.status === "QRCODE" || session.status.toLowerCase() === "qrcode";
  const connecting =
    session.status === "CONNECTING" ||
    session.status.toLowerCase() === "connecting";

  return (
    <Card className="bg-[#141415] border-[#374151] rounded-2xl p-6 hover:border-[#001F05] transition-all">
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-3 h-3 rounded-full ${getStatusColor(session.status)} ${
            connecting || waitingQr ? "animate-pulse" : ""
          }`}
        />
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h3 className="text-xl font-semibold text-white truncate">{title}</h3>
        </div>
        {getStatusIcon(session.status)}
      </div>

      <p className="text-gray-500 text-sm mb-3">{description}</p>

      <p className="text-gray-400 mb-2">{getStatusText(session.status)}</p>

      {session.connectedNumber && connected && (
        <p className="text-xs text-gray-500 mb-3 truncate">
          Número: {session.connectedNumber}
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
          {connected
            ? "✓ Conectado"
            : waitingQr
              ? "⏳ Aguardando QR"
              : "✗ Desconectado"}
        </span>
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
      </div>

      <p className="text-[11px] text-gray-600 mt-4">
        {kind === "atendimento" ? "Sessão slot 1 · bot de atendimento" : "Sessão slot 2 · somente envio"}
      </p>
    </Card>
  );
}

function ConnectionsPageContent() {
  const user = useUser();
  const [atendimento, setAtendimento] = useState<SessionStatus>(EMPTY_SESSION);
  const [relatorios, setRelatorios] = useState<SessionStatus>(EMPTY_SESSION);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<QrModalState>({ open: false });
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [isStarting, setIsStarting] = useState<Record<string, boolean>>({});
  const [awaitingQr, setAwaitingQr] = useState<Record<string, boolean>>({});

  const loadConnections = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [statusRes, sendOnlyRes] = await Promise.all([
        fetch(`${API_URL}/api/status/${user.id}`),
        fetch(`${API_URL}/api/send-only/${user.id}/status`),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setAtendimento(statusData.session || EMPTY_SESSION);
      } else {
        setAtendimento(EMPTY_SESSION);
      }

      if (sendOnlyRes.ok) {
        const sendOnlyData = await sendOnlyRes.json();
        setRelatorios(sendOnlyData.session || EMPTY_SESSION);
      } else {
        setRelatorios(EMPTY_SESSION);
      }
    } catch (error) {
      console.error("Erro ao carregar conexões:", error);
      setAtendimento(EMPTY_SESSION);
      setRelatorios(EMPTY_SESSION);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadConnections();
      const interval = setInterval(loadConnections, 15000);
      return () => clearInterval(interval);
    }
  }, [user, loadConnections]);

  // Fecha o modal só quando a sessão correspondente conectar
  useEffect(() => {
    if (!qrModal.open || !qrModal.kind) return;

    const session = qrModal.kind === "atendimento" ? atendimento : relatorios;
    if (isSessionConnected(session)) {
      const t = setTimeout(() => setQrModal({ open: false }), 1500);
      return () => clearTimeout(t);
    }
  }, [atendimento, relatorios, qrModal.open, qrModal.kind]);

  // Polling de QR enquanto aguarda leitura
  useEffect(() => {
    if (!user?.id) return;

    const activeKinds = (Object.keys(awaitingQr) as SessionKind[]).filter(
      (k) => awaitingQr[k],
    );
    if (activeKinds.length === 0) return;

    const interval = setInterval(async () => {
      for (const kind of activeKinds) {
        try {
          const url =
            kind === "atendimento"
              ? `${API_URL}/api/qr/${user.id}`
              : `${API_URL}/api/send-only/${user.id}/qr`;

          const qrResponse = await fetch(url);
          if (!qrResponse.ok) continue;

          const qrData = await qrResponse.json();

          if (qrData.isConnected) {
            setAwaitingQr((prev) => ({ ...prev, [kind]: false }));
            await loadConnections();
            continue;
          }

          if (qrData.success && qrData.qrCode) {
            setQrModal((prev) => ({
              open: true,
              qrCode: qrData.qrCode,
              kind,
              connectionName:
                kind === "atendimento"
                  ? "WhatsApp de Atendimento"
                  : "WhatsApp de Relatórios",
            }));
          }
        } catch (err) {
          console.error(`Erro ao buscar QR (${kind}):`, err);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [awaitingQr, user?.id, loadConnections]);

  const handleStart = async (kind: SessionKind) => {
    if (!user?.id) return;
    const key = kind;

    if (isStarting[key]) return;

    setIsStarting((prev) => ({ ...prev, [key]: true }));
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    const session = kind === "atendimento" ? atendimento : relatorios;
    const alreadyWaiting =
      session.status === "QRCODE" ||
      session.status === "CONNECTING" ||
      session.status.toLowerCase() === "qrcode";

    // Reconexão / QR fresco: força reset da sessão no backend
    const force = alreadyWaiting || Boolean(awaitingQr[key]);
    const forceQs = force ? "?force=1" : "";

    try {
      const url =
        kind === "atendimento"
          ? `${API_URL}/api/start/${user.id}${forceQs}`
          : `${API_URL}/api/send-only/${user.id}/start${forceQs}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Erro HTTP ${response.status}`);
      }

      setAwaitingQr((prev) => ({ ...prev, [key]: true }));

      if (data.qrCode) {
        setQrModal({
          open: true,
          qrCode: data.qrCode,
          kind,
          connectionName:
            kind === "atendimento"
              ? "WhatsApp de Atendimento"
              : "WhatsApp de Relatórios",
        });
      } else {
        // Abre modal em loading até o polling trazer o QR
        setQrModal({
          open: true,
          kind,
          connectionName:
            kind === "atendimento"
              ? "WhatsApp de Atendimento"
              : "WhatsApp de Relatórios",
        });
      }

      await loadConnections();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erro ao iniciar sessão";
      console.error(`Erro ao iniciar sessão (${kind}):`, error);

      if (
        message.includes("browser is already running") ||
        message.includes("Sessão já está")
      ) {
        setAwaitingQr((prev) => ({ ...prev, [key]: true }));
        try {
          const qrUrl =
            kind === "atendimento"
              ? `${API_URL}/api/qr/${user.id}`
              : `${API_URL}/api/send-only/${user.id}/qr`;
          const qrResponse = await fetch(qrUrl);
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            if (qrData.success && qrData.qrCode) {
              setQrModal({
                open: true,
                qrCode: qrData.qrCode,
                kind,
                connectionName:
                  kind === "atendimento"
                    ? "WhatsApp de Atendimento"
                    : "WhatsApp de Relatórios",
              });
            }
          }
        } catch (qrError) {
          console.error("Erro ao buscar QR existente:", qrError);
        }
      } else {
        alert(message || "Erro ao iniciar sessão. Tente novamente.");
      }
    } finally {
      setIsStarting((prev) => ({ ...prev, [key]: false }));
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleStop = async (kind: SessionKind) => {
    if (!user?.id) return;
    const key = kind;

    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const url =
        kind === "atendimento"
          ? `${API_URL}/api/stop/${user.id}?forget=1`
          : `${API_URL}/api/send-only/${user.id}/stop`;

      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      setAwaitingQr((prev) => ({ ...prev, [key]: false }));
      await loadConnections();
    } catch (error) {
      console.error(`Erro ao desconectar (${kind}):`, error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
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
        <p className="text-white">
          Por favor, faça login para acessar suas conexões.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Conexões</h1>
          <p className="text-gray-400">
            Gerencie as sessões WhatsApp de atendimento e de relatórios
            separadamente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SessionCard
            kind="atendimento"
            title="WhatsApp de Atendimento"
            description="Bot que responde mensagens (IA, RH, tarefas)."
            icon={<Bot className="h-5 w-5 text-emerald-400 shrink-0" />}
            session={atendimento}
            isStarting={Boolean(isStarting.atendimento)}
            actionLoading={Boolean(actionLoading.atendimento)}
            onStart={() => handleStart("atendimento")}
            onStop={() => handleStop("atendimento")}
            onRefresh={loadConnections}
            onShowQr={(qrCode) =>
              setQrModal({
                open: true,
                qrCode,
                kind: "atendimento",
                connectionName: "WhatsApp de Atendimento",
              })
            }
          />

          <SessionCard
            kind="relatorios"
            title="WhatsApp de Relatórios"
            description="Somente envio — não responde mensagens. Usado pelos relatórios automáticos."
            icon={<FileText className="h-5 w-5 text-sky-400 shrink-0" />}
            session={relatorios}
            isStarting={Boolean(isStarting.relatorios)}
            actionLoading={Boolean(actionLoading.relatorios)}
            onStart={() => handleStart("relatorios")}
            onStop={() => handleStop("relatorios")}
            onRefresh={loadConnections}
            onShowQr={(qrCode) =>
              setQrModal({
                open: true,
                qrCode,
                kind: "relatorios",
                connectionName: "WhatsApp de Relatórios",
              })
            }
          />
        </div>

        <Card className="mt-8 bg-[#141415] border-[#374151] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Como conectar</h3>
          <ol className="space-y-2 text-gray-400">
            <li>1. Clique em &quot;Gerar QR Code&quot; no card desejado</li>
            <li>2. Abra o WhatsApp no celular do número correspondente</li>
            <li>3. Vá em Aparelhos conectados → Conectar aparelho</li>
            <li>4. Aponte a câmera para o QR Code</li>
            <li>
              5. Use números diferentes se quiser: atendimento e relatórios são
              sessões independentes
            </li>
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
            <DialogTitle>
              Escaneie o QR Code — {qrModal.connectionName}
            </DialogTitle>
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
                  <span className="text-xs">
                    A conexão será confirmada automaticamente
                  </span>
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
