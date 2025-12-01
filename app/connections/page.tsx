"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useUser } from "@stackframe/stack";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import {
  Loader2,
  QrCode,
  Power,
  RefreshCw,
  Store,
  Plus
} from "lucide-react";

interface SessionStatus {
  slot: number;
  status: string;
  qrCode?: string;
}

interface UserAPI {
  id: string;
  name: string;
  type: "whatsapp" | "saipos";
  storeId: string;
  apiKey: string;
}

const API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL;

export default function ConnectionsPage() {
  const user = useUser();
  const [connections, setConnections] = useState<UserAPI[]>([]);
  const [sessions, setSessions] = useState<Record<string, SessionStatus[]>>({});
  const [loading, setLoading] = useState(true);

  const [qrModal, setQrModal] = useState<{
    open: boolean;
    qrCode?: string;
    slot?: number;
    name?: string;
  }>({ open: false });

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  /** -----------------------------------------------------------
   *  LOAD SAVED API KEYS FROM DATABASE
   * --------------------------------------------------------- */
  const loadAPIs = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const res = await fetch("/api/user-apis");
      const data: UserAPI[] = await res.json();

      const whatsappAPIs = data.filter((x) => x.type === "whatsapp");
      setConnections(whatsappAPIs);

      const sessionMap: Record<string, SessionStatus[]> = {};

      for (const api of whatsappAPIs) {
        try {
          const r = await fetch(`${API_URL}/api/status/${api.storeId}`, {
            headers: {
              Authorization: `Bearer ${api.apiKey}`
            }
          });

          if (!r.ok) {
            sessionMap[api.id] = [];
            continue;
          }

          const json = await r.json();
          sessionMap[api.id] = json.sessions || json || [];
        } catch {
          sessionMap[api.id] = [];
        }
      }

      setSessions(sessionMap);
    } catch (err) {
      console.log("Erro ao carregar APIs:", err);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadAPIs();
    const interval = setInterval(loadAPIs, 5000);
    return () => clearInterval(interval);
  }, [loadAPIs]);

  /** -----------------------------------------------------------
   *  START SESSION
   * --------------------------------------------------------- */
  const startSession = async (api: UserAPI, slot: number) => {
    const key = `${api.id}-${slot}`;
    setActionLoading((p) => ({ ...p, [key]: true }));

    try {
      const r = await fetch(`${API_URL}/api/start/${api.storeId}/${slot}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${api.apiKey}`,
          "Content-Type": "application/json"
        }
      });

      const json = await r.json();

      if (json.qrCode) {
        setQrModal({
          open: true,
          qrCode: json.qrCode,
          slot,
          name: api.name
        });
      }

      await loadAPIs();
    } finally {
      setActionLoading((p) => ({ ...p, [key]: false }));
    }
  };

  /** -----------------------------------------------------------
   *  STOP SESSION
   * --------------------------------------------------------- */
  const stopSession = async (api: UserAPI, slot: number) => {
    const key = `${api.id}-${slot}`;
    setActionLoading((p) => ({ ...p, [key]: true }));

    try {
      await fetch(`${API_URL}/api/stop/${api.storeId}/${slot}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${api.apiKey}`
        }
      });

      await loadAPIs();
    } finally {
      setActionLoading((p) => ({ ...p, [key]: false }));
    }
  };

  /** -----------------------------------------------------------
   *  STATUS COLORS/TEXT
   * --------------------------------------------------------- */
  const statusColor = (status: string) => {
    if (status === "CONNECTED") return "bg-green-500";
    if (status === "qrcode" || status === "connecting") return "bg-yellow-500";
    return "bg-red-500";
  };

  const statusText = (status: string) => {
    const map: any = {
      CONNECTED: "Conectado",
      qrcode: "Aguardando QR Code",
      connecting: "Conectando...",
      disconnected: "Desconectado",
      error: "Erro"
    };
    return map[status] || "Desconectado";
  };

  /** -----------------------------------------------------------
   *  LOADING STATES
   * --------------------------------------------------------- */
  if (!user)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Faça login para continuar.</p>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );

  /** -----------------------------------------------------------
   *  RENDER PAGE
   * --------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-8">Conexões WhatsApp</h1>

        {connections.length === 0 && (
          <Card className="bg-[#141415] p-8 border-[#374151] text-center">
            <h3 className="text-lg mb-4">Nenhuma conexão cadastrada</h3>
            <Button onClick={() => (window.location.href = "/dashboard")}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar Conexão
            </Button>
          </Card>
        )}

        {connections.map((api) => (
          <div key={api.id} className="mb-10">
            <h3 className="text-xl font-semibold mb-4">{api.name}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(sessions[api.id] || []).map((session) => {
                const key = `${api.id}-${session.slot}`;

                return (
                  <Card
                    key={session.slot}
                    className="bg-[#141415] p-6 border-[#374151] rounded-2xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-3 h-3 rounded-full ${statusColor(session.status)}`}
                      />
                      <h4 className="text-lg">WhatsApp {session.slot}</h4>
                    </div>

                    <p className="text-gray-400 mb-6">
                      {statusText(session.status)}
                    </p>

                    {session.status === "CONNECTED" ? (
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={() => stopSession(api, session.slot)}
                        disabled={actionLoading[key]}
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
                        className="w-full bg-[#001F05] hover:bg-[#003308]"
                        onClick={() => startSession(api, session.slot)}
                        disabled={actionLoading[key]}
                      >
                        {actionLoading[key] ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <QrCode className="h-4 w-4 mr-2" />
                        )}
                        Gerar QR Code
                      </Button>
                    )}

                    <Button
                      className="w-full mt-3 border-[#374151]"
                      variant="outline"
                      onClick={() => loadAPIs()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* QR MODAL */}
      <Dialog open={qrModal.open} onOpenChange={(o) => setQrModal({ open: o })}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle>
              Escaneie o QR Code – {qrModal.name} (Slot {qrModal.slot})
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center py-6">
            {qrModal.qrCode ? (
              <>
                <Image
                  src={qrModal.qrCode}
                  alt="QR Code"
                  width={256}
                  height={256}
                  className="bg-white p-4 rounded-lg"
                  unoptimized
                />
                <p className="text-gray-400 mt-4 text-center">
                  Aguardando leitura do QR Code…  
                  <br />
                  <span className="text-xs">Conexão será confirmada automaticamente</span>
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>Gerando QR Code…</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
