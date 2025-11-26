"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@stackframe/stack";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, QrCode, Power, RefreshCw, Plus } from "lucide-react";

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
}

const API_URL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || "https://platefull.com.br";

export default function ConnectionsPage() {
  const user = useUser();
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{ 
    open: boolean; 
    qrCode?: string; 
    slot?: number;
    connectionName?: string;
  }>({
    open: false,
  });
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  const loadConnections = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Buscar APIs WhatsApp do usuário do banco
      const response = await fetch("/api/user-apis");
      if (response.ok) {
        const data: UserAPI[] = await response.json();
        const whatsappAPIs = data.filter((api) => api.type === 'whatsapp');
        
        // Para cada API WhatsApp, buscar status das sessões
        const connectionsWithSessions = await Promise.all(
          whatsappAPIs.map(async (api) => {
            try {
              const sessionsResponse = await fetch(
                `${API_URL}/api/whatsapp/${api.storeId}/sessions`,
                {
                  headers: {
                    Authorization: `Bearer ${api.apiKey}`,
                  },
                }
              );
              
              if (sessionsResponse.ok) {
                const sessionsData = await sessionsResponse.json();
                return {
                  id: api.id,
                  name: api.name,
                  clientId: api.storeId,
                  sessions: sessionsData.data || [],
                };
              }
            } catch (error) {
              console.error(`Erro ao carregar sessões para ${api.name}:`, error);
            }
            
            return {
              id: api.id,
              name: api.name,
              clientId: api.storeId,
              sessions: [],
            };
          })
        );

        setConnections(connectionsWithSessions);
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

  const startSession = async (connectionId: string, clientId: string, slot: number, apiKey: string, connectionName: string) => {
    const key = `${connectionId}-${slot}`;
    setActionLoading({ ...actionLoading, [key]: true });
    
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/${clientId}/${slot}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.qrCode) {
          setQrModal({ 
            open: true, 
            qrCode: data.qrCode, 
            slot,
            connectionName 
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

  const stopSession = async (connectionId: string, clientId: string, slot: number, apiKey: string) => {
    const key = `${connectionId}-${slot}`;
    setActionLoading({ ...actionLoading, [key]: true });
    
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/${clientId}/${slot}`, {
        method: "DELETE",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONNECTED":
      case "connected":
        return "bg-green-500";
      case "connecting":
      case "qrcode":
        return "bg-yellow-500";
      case "disconnected":
      case "error":
      default:
        return "bg-red-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "CONNECTED":
      case "connected":
        return "Conectado";
      case "connecting":
        return "Conectando...";
      case "qrcode":
        return "Aguardando QR Code";
      case "disconnected":
        return "Desconectado";
      case "error":
        return "Erro";
      default:
        return "Desconectado";
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
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Conexões WhatsApp</h1>
            <p className="text-gray-400">Gerencie suas conexões de WhatsApp (até 3 por conexão)</p>
          </div>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-[#001F05] hover:bg-[#003308] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Conexão
          </Button>
        </div>

        {connections.length === 0 ? (
          <Card className="bg-[#141415] border-[#374151] rounded-2xl p-12 text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Nenhuma conexão WhatsApp cadastrada
            </h3>
            <p className="text-gray-400 mb-6">
              Adicione uma conexão WhatsApp para começar a usar o sistema
            </p>
            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-[#001F05] hover:bg-[#003308] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Conexão
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {connections.map((connection) => (
              <div key={connection.id} className="space-y-4">
                {/* Connection Name */}
                <h2 className="text-2xl font-bold text-white">{connection.name}</h2>
                
                {/* Sessions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {connection.sessions.map((session) => {
                    const actionKey = `${connection.id}-${session.slot}`;
                    return (
                      <Card
                        key={session.slot}
                        className="bg-[#141415] border-[#374151] rounded-2xl p-6 hover:border-[#001F05] transition-all"
                      >
                        {/* Status Indicator */}
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(session.status)} ${
                              session.status === "connecting" ? "animate-pulse" : ""
                            }`}
                          />
                          <h3 className="text-xl font-semibold text-white">
                            WhatsApp {session.slot}
                          </h3>
                        </div>

                        {/* Status Text */}
                        <p className="text-gray-400 mb-6">{getStatusText(session.status)}</p>

                        {/* Actions */}
                        <div className="space-y-3">
                          {session.status === "CONNECTED" || session.status === "connected" ? (
                            <Button
                              onClick={() => stopSession(connection.id, connection.clientId, session.slot, '')}
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
                                onClick={() => startSession(connection.id, connection.clientId, session.slot, '', connection.name)}
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

                              {session.status === "qrcode" && session.qrCode && (
                                <Button
                                  onClick={() =>
                                    setQrModal({ 
                                      open: true, 
                                      qrCode: session.qrCode, 
                                      slot: session.slot,
                                      connectionName: connection.name
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

        {/* Info Card */}
        <Card className="mt-8 bg-[#141415] border-[#374151] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Como Conectar</h3>
          <ol className="space-y-2 text-gray-400">
            <li>1. Clique em &quot;Gerar QR Code&quot; no WhatsApp desejado</li>
            <li>2. Abra o WhatsApp no seu celular</li>
            <li>3. Vá em Mais opções {">"} Aparelhos conectados {">"} Conectar um aparelho</li>
            <li>4. Aponte a câmera para o QR Code exibido</li>
            <li>5. Aguarde a confirmação da conexão</li>
          </ol>
        </Card>
      </div>

      {/* QR Code Modal */}
      <Dialog open={qrModal.open} onOpenChange={(open) => setQrModal({ open })}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle>
              Escaneie o QR Code - {qrModal.connectionName} (Slot {qrModal.slot})
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
