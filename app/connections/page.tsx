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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const [addConnectionModal, setAddConnectionModal] = useState(false);
  const [connectionType, setConnectionType] = useState<"saipos" | "whatsapp">(
    "saipos",
  );
  const [actionLoading, setActionLoading] = useState<{
    [key: string]: boolean;
  }>({});

  // Formulário para adicionar conexão
  const [formData, setFormData] = useState({
    name: "",
    apiKey: "",
    storeId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          .slice(0, 3); // Máximo 3 lojas

        // Carregar status das conexões WhatsApp
        const connectionsWithStatus = await Promise.all(
          whatsappAPIs.map(async (api) => {
            try {
              const statusRes = await fetch(
                `${API_URL}/api/status/${api.storeId}`,
                {
                  method: "GET",
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
  // 2. ADICIONAR NOVA CONEXÃO
  // --------------------------------------------------------------
  const handleAddConnection = async () => {
    if (!formData.name || !formData.apiKey) {
      setErrorMsg("Preencha todos os campos obrigatórios");
      return;
    }

    // Validar limite de 3 lojas Saipos
    if (connectionType === "saipos" && saiposStores.length >= 3) {
      setErrorMsg("Você já possui 3 lojas Saipos cadastradas (limite máximo)");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/user-apis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          type: connectionType,
          apiKey: formData.apiKey,
          storeId:
            formData.storeId ||
            formData.name.toLowerCase().replace(/\s+/g, "-"),
        }),
      });

      if (response.ok) {
        // Limpar formulário e fechar modal
        setFormData({ name: "", apiKey: "", storeId: "" });
        setAddConnectionModal(false);
        setErrorMsg(null);
        // Recarregar conexões
        await loadConnections();
      } else {
        const error = await response.json();
        setErrorMsg(error.error || "Erro ao adicionar conexão");
      }
    } catch (error) {
      console.error("Erro ao adicionar conexão:", error);
      setErrorMsg("Erro ao adicionar conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------
  // 3. DELETAR CONEXÃO
  // --------------------------------------------------------------
  const handleDeleteConnection = async (id: string, type: string) => {
    if (!confirm(`Tem certeza que deseja remover esta conexão ${type}?`)) {
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
  // 4. GERAR QR CODE SEM CONEXÃO (PRIMEIRA VEZ)
  // --------------------------------------------------------------
  const generateQRCodeWithoutConnection = async () => {
    if (!user?.id) return;

    setActionLoading({ ...actionLoading, generate: true });

    try {
      // Verificar conectividade com o servidor primeiro
      try {
        const healthController = new AbortController();
        const healthTimeout = setTimeout(() => healthController.abort(), 5000); // 5 segundos para health check
        
        const healthCheck = await fetch(`${API_URL}/api/health`, {
          method: "GET",
          signal: healthController.signal,
        });
        
        clearTimeout(healthTimeout);
        
        if (!healthCheck.ok) {
          throw new Error(`Servidor retornou status ${healthCheck.status}. O backend pode não estar funcionando corretamente.`);
        }
      } catch (healthError: any) {
        if (healthError.name === 'AbortError' || healthError.message?.includes('Failed to fetch')) {
          throw new Error(`Não foi possível conectar ao servidor em ${API_URL}.\n\nA VPS pode estar offline ou o backend não está rodando.\n\nVerifique:\n1. Se a VPS está online\n2. Se o backend está rodando (porta 3001)\n3. Se o Nginx está configurado corretamente\n4. Se a URL da API está correta`);
        }
        throw healthError;
      }

      // Usar exatamente o ID do usuário (sem prefixos) como clientId padrão
      const defaultClientId = `${user.id}`;
      const defaultSlot = 1;

      // Criar AbortController para timeout de 120 segundos (2 minutos)
      // Iniciar conexão WhatsApp pode demorar para gerar o QR Code
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(
        `${API_URL}/api/start/${defaultClientId}/${defaultSlot}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('[Connections] Resposta do servidor:', data);

        // Se já está conectado
        if (data.isConnected && data.connectedNumber) {
          alert(`WhatsApp já está conectado com o número ${data.connectedNumber}`);
          await loadConnections();
          return;
        }

        // QR CODE DISPONÍVEL
        if (data.qrCode) {
          setQrModal({
            open: true,
            qrCode: data.qrCode,
            slot: defaultSlot,
            connectionName: "Nova Conexão",
          });
          await loadConnections();
        } else {
          // Se não tem QR ainda, fazer polling no endpoint /api/qr
          console.log('[Connections] QR Code não veio na resposta, iniciando polling...');
          
          let attempts = 0;
          const maxAttempts = 120; // até 120s de tentativa (2 minutos)
          const pollInterval = setInterval(async () => {
            attempts++;
            
            try {
              const qrResponse = await fetch(
                `${API_URL}/api/qr/${defaultClientId}/${defaultSlot}`
              );
              
              if (qrResponse.ok) {
                const qrData = await qrResponse.json();
                if (qrData.success && qrData.qrCode) {
                  clearInterval(pollInterval);
                  setQrModal({
                    open: true,
                    qrCode: qrData.qrCode,
                    slot: defaultSlot,
                    connectionName: "Nova Conexão",
                  });
                  await loadConnections();
                }
              }
            } catch (err) {
              console.error('Erro ao buscar QR Code:', err);
            }
            
            // Para polling após muitas tentativas
            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              alert('QR Code não foi gerado a tempo. Tente novamente ou verifique os logs do servidor.');
            }
          }, 1000); // Verifica a cada 1 segundo
        }
      } else {
        // Se a resposta não está OK, tentar obter mensagem de erro
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Erro HTTP ${response.status}` };
        }
        throw new Error(errorData.message || `Erro HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.error("Erro ao gerar QR Code:", error);
      let errorMessage = "Erro desconhecido";
      
      if (error.name === 'AbortError' || error.message?.includes('Timeout') || error.message?.includes('aborted')) {
        errorMessage = "Timeout: A requisição demorou mais de 2 minutos. O servidor pode estar processando a conexão. Aguarde alguns segundos e tente novamente, ou verifique se o servidor está online.";
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.name === 'TypeError') {
        // Verificar se é problema de CORS ou servidor offline
        const isCorsError = error.message?.includes('CORS') || error.message?.includes('Access-Control');
        const serverUrl = API_URL;
        
        if (isCorsError) {
          errorMessage = `Erro de CORS: O servidor em ${serverUrl} não está permitindo requisições do navegador. Verifique a configuração de CORS no backend.`;
        } else {
          errorMessage = `Erro de conexão: Não foi possível conectar ao servidor em ${serverUrl}.\n\nPossíveis causas:\n• A VPS está offline ou não está respondendo\n• O backend não está rodando na VPS\n• Problema de rede/firewall\n• URL da API incorreta\n\nVerifique se o servidor está acessível em: ${serverUrl}/api/health`;
        }
      } else if (error.message?.includes('browser is already running') || error.message?.includes('sessão já está rodando')) {
        errorMessage = "Uma sessão já está ativa. Tente parar a sessão atual primeiro ou aguarde alguns segundos e tente buscar o QR Code novamente.";
        // Tentar buscar QR Code existente
        try {
          const qrResponse = await fetch(`${API_URL}/api/qr/${user.id}/1`);
          if (qrResponse.ok) {
            const qrData = await qrResponse.json();
            if (qrData.success && qrData.qrCode) {
              setQrModal({
                open: true,
                qrCode: qrData.qrCode,
                slot: 1,
                connectionName: "Nova Conexão",
              });
              return; // Não mostra erro se conseguiu buscar o QR
            }
          }
        } catch (qrError) {
          console.error('Erro ao buscar QR Code existente:', qrError);
        }
      } else {
        errorMessage = error.message || "Erro ao gerar QR Code. Tente novamente.";
      }
      
      alert(errorMessage);
    } finally {
      setActionLoading({ ...actionLoading, generate: false });
    }
  };

  // --------------------------------------------------------------
  // 5. INICIAR SESSÃO WHATSAPP (GERAR QR CODE)
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
      // Verificar conectividade com o servidor primeiro
      try {
        const healthController = new AbortController();
        const healthTimeout = setTimeout(() => healthController.abort(), 5000); // 5 segundos para health check
        
        const healthCheck = await fetch(`${API_URL}/api/health`, {
          method: "GET",
          signal: healthController.signal,
        });
        
        clearTimeout(healthTimeout);
        
        if (!healthCheck.ok) {
          throw new Error(`Servidor retornou status ${healthCheck.status}. O backend pode não estar funcionando corretamente.`);
        }
      } catch (healthError: any) {
        if (healthError.name === 'AbortError' || healthError.message?.includes('Failed to fetch')) {
          alert(`Não foi possível conectar ao servidor em ${API_URL}.\n\nA VPS pode estar offline ou o backend não está rodando.\n\nVerifique:\n1. Se a VPS está online\n2. Se o backend está rodando (porta 3001)\n3. Se o Nginx está configurado corretamente\n4. Se a URL da API está correta`);
          return;
        }
        throw healthError;
      }

      const response = await fetch(`${API_URL}/api/start/${clientId}/${slot}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Connections] Resposta startSession:', data);

        // Se já está conectado
        if (data.isConnected && data.connectedNumber) {
          alert(`WhatsApp já está conectado com o número ${data.connectedNumber}`);
          await loadConnections();
          return;
        }

        // QR CODE DISPONÍVEL
        if (data.qrCode) {
          setQrModal({
            open: true,
            qrCode: data.qrCode,
            slot,
            connectionName,
          });
          await loadConnections();
        } else {
          // Fazer polling para buscar QR Code
          console.log('[Connections] QR Code não veio, iniciando polling...');
          
          let attempts = 0;
          const maxAttempts = 120; // até 120s de tentativa (2 minutos)
          const pollInterval = setInterval(async () => {
            attempts++;
            
            try {
              const qrResponse = await fetch(`${API_URL}/api/qr/${clientId}/${slot}`);
              if (qrResponse.ok) {
                const qrData = await qrResponse.json();
                if (qrData.success && qrData.qrCode) {
                  clearInterval(pollInterval);
                  setQrModal({
                    open: true,
                    qrCode: qrData.qrCode,
                    slot,
                    connectionName,
                  });
                  await loadConnections();
                }
              }
            } catch (err) {
              console.error('Erro ao buscar QR Code:', err);
            }
            
            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              alert('QR Code não foi gerado a tempo. Tente novamente.');
            }
          }, 1000);
        }
      } else {
        // Se a resposta não está OK, tentar obter mensagem de erro
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Erro HTTP ${response.status}` };
        }
        throw new Error(errorData.message || `Erro HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.error("Erro ao iniciar sessão:", error);
      let errorMessage = "Erro desconhecido";
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.name === 'TypeError') {
        const isCorsError = error.message?.includes('CORS') || error.message?.includes('Access-Control');
        const serverUrl = API_URL;
        
        if (isCorsError) {
          errorMessage = `Erro de CORS: O servidor em ${serverUrl} não está permitindo requisições do navegador. Verifique a configuração de CORS no backend.`;
        } else {
          errorMessage = `Erro de conexão: Não foi possível conectar ao servidor em ${serverUrl}.\n\nPossíveis causas:\n• A VPS está offline ou não está respondendo\n• O backend não está rodando na VPS\n• Problema de rede/firewall\n• URL da API incorreta\n\nVerifique se o servidor está acessível em: ${serverUrl}/api/health`;
        }
      } else {
        errorMessage = error.message || "Erro ao iniciar sessão. Tente novamente.";
      }
      
      alert(errorMessage);
    } finally {
      setActionLoading({ ...actionLoading, [key]: false });
    }
  };

  // --------------------------------------------------------------
  // 5. DESCONECTAR SESSÃO WHATSAPP
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
          "Content-Type": "application/json",
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Conexões</h1>
            <p className="text-gray-400">
              Gerencie suas conexões WhatsApp e lojas Saipos
            </p>
          </div>
          <Button
            onClick={() => {
              setAddConnectionModal(true);
              setConnectionType("whatsapp");
            }}
            className="bg-[#001F05] hover:bg-[#003308] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Conexão
          </Button>
        </div>

        {/* TABS */}
        <Tabs defaultValue="whatsapp" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#374151] mb-6">
            <TabsTrigger
              value="whatsapp"
              className="data-[state=active]:bg-[#001F05] text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger
              value="saipos"
              className="data-[state=active]:bg-[#001F05] text-white"
            >
              <Store className="h-4 w-4 mr-2" />
              Saipos ({saiposStores.length}/3)
            </TabsTrigger>
          </TabsList>

          {/* ABA WHATSAPP */}
          <TabsContent value="whatsapp" className="space-y-6">
            {whatsappConnections.length === 0 ? (
              <Card className="bg-[#141415] border-[#374151] rounded-2xl p-12 text-center">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Nenhuma conexão WhatsApp cadastrada
                </h3>
                <p className="text-gray-400 mb-6">
                  Gere um QR Code para conectar seu WhatsApp
                </p>
                <Button
                  onClick={generateQRCodeWithoutConnection}
                  disabled={actionLoading.generate}
                  className="bg-[#001F05] hover:bg-[#003308] text-white"
                >
                  {actionLoading.generate ? (
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
                        const actionKey = `${connection.id}-${session.slot}`;
                        const isConnected =
                          session.status === "CONNECTED" ||
                          session.status.toLowerCase() === "connected";

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
                                )} ${
                                  session.status === "connecting"
                                    ? "animate-pulse"
                                    : ""
                                }`}
                              />
                              <h3 className="text-xl font-semibold text-white">
                                WhatsApp {session.slot}
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
          </TabsContent>

          {/* ABA SAIPOS */}
          <TabsContent value="saipos" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-400">
                Conecte até 3 lojas Saipos usando Bearer Token
              </p>
              {saiposStores.length < 3 && (
                <Button
                  onClick={() => {
                    setAddConnectionModal(true);
                    setConnectionType("saipos");
                  }}
                  className="bg-[#001F05] hover:bg-[#003308] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Loja
                </Button>
              )}
            </div>

            {saiposStores.length === 0 ? (
              <Card className="bg-[#141415] border-[#374151] rounded-2xl p-12 text-center">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Nenhuma loja Saipos cadastrada
                </h3>
                <p className="text-gray-400 mb-6">
                  Adicione uma loja para começar
                </p>
                <Button
                  onClick={() => {
                    setAddConnectionModal(true);
                    setConnectionType("saipos");
                  }}
                  className="bg-[#001F05] hover:bg-[#003308] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Loja
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {saiposStores.map((store) => (
                  <Card
                    key={store.id}
                    className="bg-[#141415] border-[#374151] rounded-2xl hover:border-[#001F05] transition-all"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                          <Store className="h-5 w-5" />
                          {store.name}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteConnection(store.id, "Saipos")
                          }
                          className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">
                            Store ID:
                          </p>
                          <p className="text-sm text-white font-mono bg-[#0f0f10] p-2 rounded">
                            {store.storeId}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Status:</span>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(store.status)}
                            <span
                              className={`text-sm font-semibold ${
                                store.status === "connected"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {store.status === "connected"
                                ? "Conectado"
                                : "Desconectado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL ADICIONAR CONEXÃO */}
      <Dialog open={addConnectionModal} onOpenChange={setAddConnectionModal}>
        <DialogContent className="bg-[#141415] border-[#374151] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Adicionar Conexão{" "}
              {connectionType === "saipos" ? "Saipos" : "WhatsApp"}
            </DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">
                Nome da {connectionType === "saipos" ? "Loja" : "Conexão"}
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={
                  connectionType === "saipos"
                    ? "Ex: Loja Centro"
                    : "Ex: WhatsApp Principal"
                }
                className="bg-[#0f0f10] border-[#374151] text-white mt-1"
              />
            </div>

            <div>
              <Label htmlFor="apiKey" className="text-gray-300">
                {connectionType === "saipos" ? "Bearer Token" : "API Key"}
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
                placeholder="Cole sua chave de API aqui"
                className="bg-[#0f0f10] border-[#374151] text-white mt-1"
              />
            </div>

            {connectionType === "saipos" && (
              <div>
                <Label htmlFor="storeId" className="text-gray-300">
                  Store ID (opcional)
                </Label>
                <Input
                  id="storeId"
                  value={formData.storeId}
                  onChange={(e) =>
                    setFormData({ ...formData, storeId: e.target.value })
                  }
                  placeholder="Será gerado automaticamente se vazio"
                  className="bg-[#0f0f10] border-[#374151] text-white mt-1"
                />
              </div>
            )}

            {connectionType === "saipos" && (
              <p className="text-sm text-gray-400">
                Você pode adicionar até 3 lojas Saipos. Atualmente:{" "}
                {saiposStores.length}/3
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setAddConnectionModal(false);
                setFormData({ name: "", apiKey: "", storeId: "" });
                setErrorMsg(null);
              }}
              className="border-[#374151] text-white hover:bg-[#374151]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddConnection}
              disabled={isSubmitting}
              className="bg-[#001F05] hover:bg-[#003308] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
