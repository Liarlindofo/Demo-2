"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@stackframe/stack";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Plus,
  Link as LinkIcon,
} from "lucide-react";

interface UserAPI {
  id: string;
  userId: string;
  name: string;
  type: string; // "saipos"
  storeId: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

interface WhatsappSlotStatus {
  slot: number;
  isConnected: boolean;
  connectedNumber: string | null;
  qrCode: string | null;
  state: "connected" | "waiting_qr" | "offline" | string;
  isActive: boolean;
  updatedAt: string | null;
}

const WPP_API =
  process.env.NEXT_PUBLIC_WPP_API || "https://SEU_DOMINIO_DA_VPS/api";

export default function ConnectionsPage() {
  const user = useUser();
  const [loading, setLoading] = useState(true);

  // SAIPOS
  const [saiposApis, setSaiposApis] = useState<UserAPI[]>([]);
  const [loadingSaipos, setLoadingSaipos] = useState(false);

  // WHATSAPP BOT
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsappSlotStatus[]>([]);
  const [loadingWhatsapp, setLoadingWhatsapp] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>(
    {}
  );

  const [qrModal, setQrModal] = useState<{
    open: boolean;
    slot?: number;
  }>({
    open: false,
  });

  // -------- SAIPOS: carregar APIs do usuário --------
  const loadSaiposApis = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoadingSaipos(true);
      const res = await fetch("/api/user-apis");
      if (!res.ok) return;

      const data: UserAPI[] = await res.json();
      const onlySaipos = data.filter((api) => api.type === "saipos");
      setSaiposApis(onlySaipos);
    } catch (err) {
      console.error("Erro ao carregar APIs Saipos:", err);
    } finally {
      setLoadingSaipos(false);
    }
  }, [user?.id]);

  // -------- WHATSAPP: carregar status dos slots --------
  const loadWhatsappStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoadingWhatsapp(true);
      const res = await fetch(`${WPP_API}/status/${user.id}`);
      if (!res.ok) {
        console.error("Erro ao buscar status do WhatsApp");
        return;
      }

      const data = await res.json();
      setWhatsappStatus(data.connections || []);
    } catch (err) {
      console.error("Erro ao carregar status WhatsApp:", err);
    } finally {
      setLoadingWhatsapp(false);
    }
  }, [user?.id]);

  // -------- Efeitos iniciais / polling --------
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    loadSaiposApis();
    loadWhatsappStatus().finally(() => setLoading(false));

    const interval = setInterval(() => {
      loadSaiposApis();
      loadWhatsappStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, loadSaiposApis, loadWhatsappStatus]);

  // -------- WHATSAPP: ações --------
  const startWhatsappSession = async (slot: number) => {
    if (!user?.id) return;
    const key = `slot-${slot}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch(`${WPP_API}/start/${user.id}/${slot}`, {
        method: "POST",
      });

      if (!res.ok) {
        console.error("Erro ao iniciar sessão WhatsApp");
        return;
      }

      // Abre modal e deixa o componente interno buscar o QR
      setQrModal({ open: true, slot });
      await loadWhatsappStatus();
    } catch (err) {
      console.error("Erro ao iniciar sessão WhatsApp:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const stopWhatsappSession = async (slot: number) => {
    if (!user?.id) return;
    const key = `slot-${slot}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch(`${WPP_API}/stop/${user.id}/${slot}`, {
        method: "POST",
      });

      if (!res.ok) {
        console.error("Erro ao parar sessão WhatsApp");
        return;
      }

      await loadWhatsappStatus();
    } catch (err) {
      console.error("Erro ao parar sessão WhatsApp:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // -------- Helpers de status visual --------
  const getWhatsappStatusColor = (state: string) => {
    switch (state) {
      case "connected":
        return "bg-green-500";
      case "waiting_qr":
        return "bg-yellow-500";
      case "offline":
      default:
        return "bg-red-500";
    }
  };

  const getWhatsappStatusText = (state: string) => {
    switch (state) {
      case "connected":
        return "Conectado";
      case "waiting_qr":
        return "Aguardando QR Code";
      case "offline":
      default:
        return "Desconectado";
    }
  };

  // -------- Estados globais --------
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
      <div className="max-w-7xl mx-auto space-y-10">
        {/* HEADER GERAL */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Conexões do Sistema
            </h1>
            <p className="text-gray-400">
              Gerencie as integrações da sua conta: Saipos e WhatsApp Bot.
            </p>
          </div>
        </div>

        {/* SEÇÃO SAIPOS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Conexões Saipos
            </h2>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-[#001F05] hover:bg-[#003308] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar / Configurar
            </Button>
          </div>

          {loadingSaipos ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando conexões Saipos...
            </div>
          ) : saiposApis.length === 0 ? (
            <Card className="bg-[#141415] border-[#374151] rounded-2xl p-6 text-gray-300">
              Nenhuma API Saipos configurada ainda.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {saiposApis.map((api) => (
                <Card
                  key={api.id}
                  className="bg-[#141415] border-[#374151] rounded-2xl p-6"
                >
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {api.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">
                    Store ID: <span className="font-mono">{api.storeId}</span>
                  </p>
                  <p className="text-gray-500 text-xs">
                    Última atualização:{" "}
                    {new Date(api.updatedAt).toLocaleString("pt-BR")}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* SEÇÃO WHATSAPP BOT */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Conexões WhatsApp Bot
            </h2>

            <Button
              variant="outline"
              onClick={() => loadWhatsappStatus()}
              className="border-[#374151] text-white hover:bg-[#374151]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar status
            </Button>
          </div>

          {loadingWhatsapp ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando status do bot...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {whatsappStatus.map((slot) => {
                const key = `slot-${slot.slot}`;
                return (
                  <Card
                    key={slot.slot}
                    className="bg-[#141415] border-[#374151] rounded-2xl p-6 hover:border-[#001F05] transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-3 h-3 rounded-full ${getWhatsappStatusColor(
                          slot.state
                        )}`}
                      />
                      <h3 className="text-xl font-semibold text-white">
                        WhatsApp {slot.slot}
                      </h3>
                    </div>

                    <p className="text-gray-300 mb-2">
                      {getWhatsappStatusText(slot.state)}
                    </p>

                    {slot.connectedNumber && (
                      <p className="text-gray-400 text-sm mb-4">
                        Número conectado:{" "}
                        <span className="font-mono">
                          {slot.connectedNumber}
                        </span>
                      </p>
                    )}

                    <div className="space-y-3 mt-4">
                      {slot.state === "connected" ? (
                        <Button
                          onClick={() => stopWhatsappSession(slot.slot)}
                          disabled={actionLoading[key]}
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                          {actionLoading[key] ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Power className="h-4 w-4 mr-2" />
                          )}
                          Desconectar
                        </Button>
                      ) : (
                        <Button
                          onClick={() => startWhatsappSession(slot.slot)}
                          disabled={actionLoading[key]}
                          className="w-full bg-[#001F05] hover:bg-[#003308] text-white"
                        >
                          {actionLoading[key] ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <QrCode className="h-4 w-4 mr-2" />
                          )}
                          Gerar QR Code
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="mt-4 bg-[#141415] border-[#374151] rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Como conectar o WhatsApp
            </h3>
            <ol className="space-y-2 text-gray-400 text-sm">
              <li>1. Clique em &quot;Gerar QR Code&quot; no slot desejado.</li>
              <li>2. Abra o WhatsApp no seu celular.</li>
              <li>
                3. Vá em <b>Configurações</b> &gt; <b>Aparelhos conectados</b>{" "}
                &gt; <b>Conectar um aparelho</b>.
              </li>
              <li>4. Aponte a câmera para o QR Code exibido na tela.</li>
              <li>5. Aguarde a confirmação da conexão.</li>
            </ol>
          </Card>
        </section>
      </div>

      {/* MODAL DE QR CODE (CLIENTE LÊ DO BACKEND) */}
      <Dialog
        open={qrModal.open}
        onOpenChange={(open) => setQrModal({ open, slot: qrModal.slot })}
      >
        <DialogContent className="bg-[#141415] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle>
              Escaneie o QR Code {qrModal.slot ? `(Slot ${qrModal.slot})` : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            {qrModal.slot && (
              <LiveQR userId={user.id} slot={qrModal.slot} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Componente que fica buscando o QR Code no backend
 * a cada 2,5 segundos até aparecer.
 */
function LiveQR({ userId, slot }: { userId: string; slot: number }) {
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const API =
    process.env.NEXT_PUBLIC_WPP_API || "https://SEU_DOMINIO_DA_VPS/api";

  useEffect(() => {
    let active = true;

    async function fetchQR() {
      try {
        const res = await fetch(`${API}/qr/${userId}/${slot}`);
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.success && data.qrCode && active) {
          setQr(data.qrCode);
        }
      } catch (err) {
        console.error("Erro ao buscar QR:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQR();
    const interval = setInterval(fetchQR, 2500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [API, userId, slot]);

  if (loading && !qr) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Gerando QR Code...</p>
      </div>
    );
  }

  if (!qr) {
    return <p className="text-gray-400">QR Code ainda não disponível.</p>;
  }

  return (
    <>
      <Image
        src={qr}
        alt="QR Code"
        width={256}
        height={256}
        className="w-64 h-64 bg-white p-4 rounded-lg"
        unoptimized
      />
      <p className="text-gray-400 mt-4 text-center text-sm">
        Aponte a câmera do WhatsApp para este código para conectar.
      </p>
    </>
  );
}
