"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@stackframe/stack";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ToolProtection from "@/components/auth/ToolProtection";
import { SystemTool } from "@/types/admin";
import { useApp } from "@/contexts/app-context";
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
  MessageSquare,
  Trash2,
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
  isConnected?: boolean;
}

interface UserAPI {
  id: string;
  name: string;
  type: string;
  storeId: string;
  apiKey: string;
  status?: string;
}

// URL da API WhatsApp
const API_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_API_URL || "https://api.platefull.com.br";

function ConnectionsPageContent() {
  const user = useUser();
  const { addToast } = useApp();
  const [whatsappConnections, setWhatsappConnections] = useState<
    WhatsAppConnection[]
  >([]);
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

  // Estados de proteção contra chamadas duplicadas
  const [isStarting, setIsStarting] = useState<{ [key: string]: boolean }>({});
  const [hasStarted, setHasStarted] = useState<{ [key: string]: boolean }>({});


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

        // Apenas APIs WhatsApp
        const whatsappAPIs = data.filter((api) => api.type === "whatsapp");

        // Carregar status das conexões WhatsApp (APENAS STATUS, NUNCA START)
        let connectionsWithStatus: WhatsAppConnection[] = [];
        
        try {
          const statusRes = await fetch(
            `${API_URL}/api/status/${user.id}`,
            {
              method: "GET",
            },
          );

          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const session = statusData.session || {
              status: 'DISCONNECTED',
              isActive: false,
              isConnected: false,
            };
            
            connectionsWithStatus = [
              {
                id: "main",
                name: "WhatsApp",
                clientId: user.id,
                sessions: [session],
              },
            ];
          }
        } catch (error) {
          console.error("Erro ao buscar status WhatsApp:", error);
          connectionsWithStatus = [
            {
              id: "main",
              name: "WhatsApp Principal",
              clientId: user.id,
              sessions: [],
            },
          ];
        }

        setWhatsappConnections(connectionsWithStatus);
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
      const interval = setInterval(loadConnections, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loadConnections]);

  // Fechar modal do QR quando conectar
  useEffect(() => {
    if (qrModal.open && whatsappConnections.length > 0) {
      const connection = whatsappConnections.find(c => 
        c.sessions.some(s => 
          (s.isConnected || s.status.toLowerCase() === 'connected')
        )
      );
      if (connection) {
        setTimeout(() => {
          setQrModal({ open: false });
        }, 2000);
      }
    }
  }, [whatsappConnections, qrModal.open]);

  // Polling de QR Code (APENAS quando já iniciou)
  useEffect(() => {
    if (!user?.id) return;
    
    const activeKeys = Object.keys(hasStarted).filter(key => hasStarted[key]);
    if (activeKeys.length === 0) return;

    const interval = setInterval(async () => {
      for (const key of activeKeys) {
        try {
          const qrResponse = await fetch(`${API_URL}/api/qr/${user.id}`);
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            if (qrData.success && qrData.qrCode && !qrModal.open) {
              setQrModal({
                open: true,
                qrCode: qrData.qrCode,
                connectionName: "WhatsApp",
              });
            }
          }
        } catch (err) {
          console.error('Erro ao buscar QR Code:', err);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [hasStarted, user?.id, qrModal.open]);

  // --------------------------------------------------------------
  // 3. DELETAR CONEXÃO
  // --------------------------------------------------------------
  const handleDeleteConnection = async (id: string, type: string) => {
    if (!confirm(`Tem certeza que deseja remover esta conexão ${type}?`)) {
      return;
    }

    if (id === "default") {
      alert("Esta conexão padrão não pode ser removida. Para remover, delete uma conexão cadastrada no Dashboard.");
      return;
    }

    try {
      const response = await fetch(`/api/user-apis?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadConnections();
      } else {
        alert("Erro ao remover conexão");
      }
    } catch (error) {
      console.error("Erro ao deletar conexão:", error);
      alert("Erro ao remover conexão");
    }
  };

  // --------------------------------------------------------------
  // 4. INICIAR SESSÃO - ÚNICA FUNÇÃO QUE CHAMA /api/start
  // --------------------------------------------------------------
  const handleStartWhatsApp = async (clientId: string, connectionName: string) => {
    const key = `whatsapp-${clientId}`;
    
    // Proteção contra chamadas duplicadas
    if (isStarting[key] || hasStarted[key]) {
      console.log('[handleStartWhatsApp] Bloqueado: sessão já iniciando ou iniciada');
      return;
    }

    setIsStarting({ ...isStarting, [key]: true });
    setActionLoading({ ...actionLoading, [key]: true });

    try {
      console.log('[handleStartWhatsApp] Iniciando sessão para:', clientId);
      
      const response = await fetch(`${API_URL}/api/start/${clientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[handleStartWhatsApp] Resposta:', data);

        if (data.success) {
          setHasStarted({ ...hasStarted, [key]: true });
          
          if (data.qrCode) {
            setQrModal({
              open: true,
              qrCode: data.qrCode,
              connectionName,
            });
          }
          
          await loadConnections();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.error("Erro ao iniciar sessão:", error);
      
      if (error.message?.includes('browser is already running') || 
          error.message?.includes('Sessão já está')) {
        alert("Sessão já está ativa. Aguardando QR Code...");
        setHasStarted({ ...hasStarted, [key]: true });
        
        try {
          const qrResponse = await fetch(`${API_URL}/api/qr/${clientId}`);
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            if (qrData.success && qrData.qrCode) {
              setQrModal({
                open: true,
                qrCode: qrData.qrCode,
                connectionName,
              });
            }
          }
        } catch (qrError) {
          console.error('Erro ao buscar QR Code existente:', qrError);
        }
      } else {
        alert(error.message || "Erro ao iniciar sessão. Tente novamente.");
      }
    } finally {
      setIsStarting({ ...isStarting, [key]: false });
      setActionLoading({ ...actionLoading, [key]: false });
    }
  };

  // --------------------------------------------------------------
  // 5. DESCONECTAR SESSÃO
  // --------------------------------------------------------------
  const stopSession = async (clientId: string) => {
    const key = `whatsapp-${clientId}`;
    setActionLoading({ ...actionLoading, [key]: true });

    try {
      const response = await fetch(`${API_URL}/api/stop/${clientId}?forget=1`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setHasStarted({ ...hasStarted, [key]: false });
        await loadConnections();
      }
    } catch (error) {
      console.error("Erro ao desconectar sessão:", error);
    } finally {
      setActionLoading({ ...actionLoading, [key]: false });
    }
  };

  // --------------------------------------------------------------
  // 6. FUNÇÕES AUXILIARES DE STATUS
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
  // 7. LOADING E AUTENTICAÇÃO
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
  // 8. RENDERIZAÇÃO
  // --------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Conexões</h1>
          <p className="text-gray-400">
            Gerencie suas conexões WhatsApp
          </p>
        </div>

        {/* WHATSAPP */}
        <div className="space-y-6">
            {whatsappConnections.length === 0 ? (
              <Card className="bg-[#141415] border-[#374151] rounded-2xl p-12 text-center">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Nenhuma conexão WhatsApp cadastrada
                </h3>
                <p className="text-gray-400 mb-6">
                  Gere um QR Code para conectar seu WhatsApp
                </p>
                <Button
                  onClick={() => user?.id && handleStartWhatsApp(user.id, "Nova Conexão")}
                  disabled={isStarting[`whatsapp-${user?.id}`] || hasStarted[`whatsapp-${user?.id}`]}
                  className="bg-[#001F05] hover:bg-[#003308] text-white"
                >
                  {isStarting[`whatsapp-${user?.id}`] ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Gerando QR Code...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Gerar QR Code
                    </>
                  )}
                </Button>
              </Card>
            ) : (
              <div className="space-y-8">
                {whatsappConnections.map((connection) => (
                  <div key={connection.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white">
                        {connection.name}
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteConnection(connection.id, "WhatsApp")
                        }
                        className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {connection.sessions.map((session) => {
                        const actionKey = `whatsapp-${connection.clientId}`;
                        const isConnected =
                          session.status === "CONNECTED" ||
                          session.status.toLowerCase() === "connected";

                        return (
                          <Card
                            key="whatsapp-main"
                            className="bg-[#141415] border-[#374151] rounded-2xl p-6 hover:border-[#001F05] transition-all"
                          >
                            {/* STATUS */}
                            <div className="flex items-center gap-3 mb-4">
                              <div
                                className={`w-3 h-3 rounded-full ${getStatusColor(
                                  session.status,
                                )} ${
                                  session.status === "connecting"
                                    ? "animate-pulse"
                                    : ""
                                }`}
                              />
                              <h3 className="text-xl font-semibold text-white">
                                WhatsApp
                              </h3>
                              {getStatusIcon(session.status)}
                            </div>

                            <p className="text-gray-400 mb-2">
                              {getStatusText(session.status)}
                            </p>

                            {/* STATUS BADGE */}
                            <div className="mb-4">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  isConnected
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {isConnected ? "✓ Conectado" : "✗ Desconectado"}
                              </span>
                            </div>

                            {/* AÇÕES */}
                            <div className="space-y-3">
                              {isConnected ? (
                                <Button
                                  onClick={() =>
                                    stopSession(connection.clientId)
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
                                      handleStartWhatsApp(
                                        connection.clientId,
                                        connection.name,
                                      )
                                    }
                                    disabled={isStarting[actionKey] || hasStarted[actionKey]}
                                    className="w-full bg-[#001F05] hover:bg-[#003308] text-white"
                                  >
                                    {isStarting[actionKey] ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      <QrCode className="h-4 w-4 mr-2" />
                                    )}
                                    {hasStarted[actionKey] ? "QR Solicitado" : "Gerar QR Code"}
                                  </Button>

                                  {session.status === "qrcode" &&
                                    session.qrCode && (
                                      <Button
                                        onClick={() =>
                                          setQrModal({
                                            open: true,
                                            qrCode: session.qrCode,
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
      </div>

      {/* MODAL DO QR CODE */}
      <Dialog open={qrModal.open} onOpenChange={(open) => setQrModal({ open })}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white">
          <DialogHeader>
            <DialogTitle>
              Escaneie o QR Code - {qrModal.connectionName}
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
