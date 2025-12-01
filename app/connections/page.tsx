"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@stackframe/stack";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Store,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

// Interfaces
interface WhatsAppConnection {
  id: string;
  name: string;
  clientId: string;
  sessions: SessionStatus[];
}

interface SessionStatus {
  slot: number;
  status: string;
  qrCode?: string;
  isActive: boolean;
}

interface UserAPI {
  id: string;
  name: string;
  type: string;
  storeId: string;
  apiKey: string;
  status?: string;
}

interface SaiposStore {
  id: string;
  name: string;
  type: string;
  storeId: string;
  apiKey: string;
  status: string;
}

// URL da API WhatsApp
const API_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_API_URL || "https://api.platefull.com.br";

export default function ConnectionsPage() {
  const user = useUser();
  const [whatsappConnections, setWhatsappConnections] = useState<
    WhatsAppConnection[]
  >([]);
  const [saiposStores, setSaiposStores] = useState<SaiposStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    qrCode?: string;
    slot?: number;
    connectionName?: string;
  }>({
    open: false,
  });
  const [actionLoading, setActionLoading] = useState<{
    [key: string]: boolean;
  }>({});

  // --------------------------------------------------------------
  // 1. CARREGAR CONEXÕES WHATSAPP E LOJAS SAIPOS
  // --------------------------------------------------------------
  const loadConnections = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Buscar todas as APIs do usuário
      const response = await fetch("/api/user-apis");
      if (response.ok) {
        const result = await response.json();
        const data: UserAPI[] = result.apis || [];

        // Separar APIs WhatsApp e Saipos
        const whatsappAPIs = data.filter((api) => api.type === "whatsapp");
        const saiposAPIs = data
          .filter((api) => api.type === "saipos")
          .slice(0, 4); // Máximo 4 lojas

        // Carregar status das conexões WhatsApp
        const connectionsWithStatus = await Promise.all(
          whatsappAPIs.map(async (api) => {
            try {
              const statusRes = await fetch(
                `${API_URL}/api/status/${api.storeId}`,
                {
                  headers: {
                    Authorization: `Bearer ${api.apiKey}`,
                  },
                },
              );

              if (statusRes.ok) {
                const statusData = await statusRes.json();
                return {
                  id: api.id,
                  name: api.name,
                  clientId: api.storeId,
                  sessions: statusData.sessions || [],
                };
              }
            } catch (error) {
              console.error("Erro ao buscar status WhatsApp:", error);
            }

            return {
              id: api.id,
              name: api.name,
              clientId: api.storeId,
              sessions: [],
            };
          }),
        );

        setWhatsappConnections(connectionsWithStatus);

        // Carregar lojas Saipos
        const stores: SaiposStore[] = saiposAPIs.map((api) => ({
          id: api.id,
          name: api.name,
          type: api.type,
          storeId: api.storeId,
          apiKey: api.apiKey,
          status: api.status || "disconnected",
        }));

        setSaiposStores(stores);
      }
    } catch (error) {
      console.error("Erro ao carregar conexões:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadConnections();
      const interval = setInterval(loadConnections, 5000);
      return () => clearInterval(interval);
    }
  }, [user, loadConnections]);

  // --------------------------------------------------------------
  // 2. INICIAR SESSÃO WHATSAPP (GERAR QR CODE)
  // --------------------------------------------------------------
  const startSession = async (
    connectionId: string,
    clientId: string,
    slot: number,
    apiKey: string,
    connectionName: string,
  ) => {
    const key = `${connectionId}-${slot}`;
    setActionLoading({ ...actionLoading, [key]: true });

    try {
      const response = await fetch(`${API_URL}/api/start/${clientId}/${slot}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        // QR CODE DISPONÍVEL
        if (data.qrCode) {
          setQrModal({
            open: true,
            qrCode: data.qrCode,
            slot,
            connectionName,
          });
        }

        await loadConnections();
      }
    } catch (error) {
      console.error("Erro ao iniciar sessão:", error);
    } finally {
      setActionLoading({ ...actionLoading, [key]: false });
    }
  };

  // --------------------------------------------------------------
  // 3. DESCONECTAR SESSÃO WHATSAPP
  // --------------------------------------------------------------
  const stopSession = async (
    connectionId: string,
    clientId: string,
    slot: number,
    apiKey: string,
  ) => {
    const key = `${connectionId}-${slot}`;
    setActionLoading({ ...actionLoading, [key]: true });

    try {
      const response = await fetch(`${API_URL}/api/stop/${clientId}/${slot}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        await loadConnections();
      }
    } catch (error) {
      console.error("Erro ao desconectar sessão:", error);
    } finally {
      setActionLoading({ ...actionLoading, [key]: false });
    }
  };

  // --------------------------------------------------------------
  // 4. FUNÇÕES AUXILIARES DE STATUS
  // --------------------------------------------------------------
  const getStatusColor = (status: string) => {
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
  };

  const getStatusText = (status: string) => {
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
  };

  const getStatusIcon = (status: string) => {
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
  };

  // --------------------------------------------------------------
  // 5. LOADING E AUTENTICAÇÃO
  // --------------------------------------------------------------
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

  // --------------------------------------------------------------
  // 6. RENDERIZAÇÃO
  // --------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Conexões</h1>
            <p className="text-gray-400">
              Gerencie suas conexões WhatsApp e lojas Saipos
            </p>
          </div>
          <Button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-[#001F05] hover:bg-[#003308] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Conexão
          </Button>
        </div>

        {/* LOJAS SAIPOS */}
        {saiposStores.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Store className="h-6 w-6" />
              Lojas Saipos ({saiposStores.length}/4)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {saiposStores.map((store) => (
                <Card
                  key={store.id}
                  className="bg-[#141415] border-[#374151] rounded-2xl hover:border-[#001F05] transition-all"
                >
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span>{store.name}</span>
                      {getStatusIcon(store.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">
                        <span className="font-semibold">Store ID:</span>{" "}
                        {store.storeId}
                      </p>
                      <p className="text-sm text-gray-400">
                        <span className="font-semibold">Status:</span>{" "}
                        <span className={getStatusColor(store.status)}>
                          {store.status}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CONEXÕES WHATSAPP */}
        {whatsappConnections.length === 0 ? (
          <Card className="bg-[#141415] border-[#374151] rounded-2xl p-12 text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Nenhuma conexão WhatsApp cadastrada
            </h3>
            <p className="text-gray-400 mb-6">
              Adicione uma conexão para começar
            </p>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-[#001F05] hover:bg-[#003308] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Conexão
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {whatsappConnections.map((connection) => (
              <div key={connection.id} className="space-y-4">
                <h2 className="text-2xl font-bold text-white">
                  {connection.name}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {connection.sessions.map((session) => {
                    const actionKey = `${connection.id}-${session.slot}`;

                    return (
                      <Card
                        key={session.slot}
                        className="bg-[#141415] border-[#374151] rounded-2xl p-6 hover:border-[#001F05] transition-all"
                      >
                        {/* STATUS */}
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(
                              session.status,
                            )} ${session.status === "connecting" ? "animate-pulse" : ""}`}
                          />
                          <h3 className="text-xl font-semibold text-white">
                            WhatsApp {session.slot}
                          </h3>
                        </div>

                        <p className="text-gray-400 mb-6">
                          {getStatusText(session.status)}
                        </p>

                        {/* AÇÕES */}
                        <div className="space-y-3">
                          {session.status === "CONNECTED" ||
                          session.status.toLowerCase() === "connected" ? (
                            <Button
                              onClick={() =>
                                stopSession(
                                  connection.id,
                                  connection.clientId,
                                  session.slot,
                                  "",
                                )
                              }
                              disabled={actionLoading[actionKey]}
                              className="w-full bg-red-600 hover:bg-red-700 text-white"
                            >
                              {actionLoading[actionKey] ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Power className="h-4 w-4 mr-2" />
                              )}
                              Desconectar
                            </Button>
                          ) : (
                            <>
                              <Button
                                onClick={() =>
                                  startSession(
                                    connection.id,
                                    connection.clientId,
                                    session.slot,
                                    "",
                                    connection.name,
                                  )
                                }
                                disabled={actionLoading[actionKey]}
                                className="w-full bg-[#001F05] hover:bg-[#003308] text-white"
                              >
                                {actionLoading[actionKey] ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <QrCode className="h-4 w-4 mr-2" />
                                )}
                                Gerar QR Code
                              </Button>

                              {session.status === "qrcode" &&
                                session.qrCode && (
                                  <Button
                                    onClick={() =>
                                      setQrModal({
                                        open: true,
                                        qrCode: session.qrCode,
                                        slot: session.slot,
                                        connectionName: connection.name,
                                      })
                                    }
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
                            onClick={() => loadConnections()}
                            variant="outline"
                            className="w-full border-[#374151] text-white hover:bg-[#374151]"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Atualizar Status
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CARD INFORMATIVO */}
        <Card className="mt-8 bg-[#141415] border-[#374151] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            Como Conectar
          </h3>
          <ol className="space-y-2 text-gray-400">
            <li>1. Clique em "Gerar QR Code"</li>
            <li>2. Abra o WhatsApp no seu celular</li>
            <li>3. Vá em Aparelhos conectados → Conectar aparelho</li>
            <li>4. Aponte a câmera para o QR Code</li>
          </ol>
        </Card>
      </div>

      {/* MODAL DO QR CODE */}
      <Dialog open={qrModal.open} onOpenChange={(open) => setQrModal({ open })}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle>
              Escaneie o QR Code - {qrModal.connectionName} (Slot {qrModal.slot}
              )
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
