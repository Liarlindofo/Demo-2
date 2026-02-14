"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@stackframe/stack";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Bot, Clock, Store, MessageSquare, Shield, Hash, Power } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ToolProtection from "@/components/auth/ToolProtection";
import { SystemTool } from "@/types/admin";

// Usar API routes do Next.js ao invés do backend separado
const API_URL = "";

interface UserAPI {
  id: string;
  name: string;
  type: string;
  storeId: string;
  apiKey: string;
}

interface ClientConfig {
  id: string;
  name: string;
  botName?: string;
  storeType?: string;
  basePrompt?: string;
  forbidden?: string;
  messageLimit?: number;
  contextTime?: number;
  botEnabled: boolean;
}

interface WhatsAppConnection {
  id: string;
  name: string;
  storeId: string;
  apiKey: string;
}

function WhatsAppToolsPageContent() {
  const user = useUser();
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [config, setConfig] = useState<ClientConfig>({
    id: "",
    name: "",
    botEnabled: true,
    messageLimit: 30,
    contextTime: 60,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConnections = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch("/api/user-apis");
      if (response.ok) {
        const result = await response.json();
        const data: UserAPI[] = result.apis || [];
        const whatsappAPIs = data.filter((api) => api.type === 'whatsapp');

        // Fallback: se não houver conexões cadastradas, usar sessão padrão do usuário
        if (whatsappAPIs.length === 0 && user?.id) {
          const fallback: WhatsAppConnection = {
            id: "default",
            name: "WhatsApp Principal",
            storeId: `${user.id}`,
            apiKey: "",
          };
          setConnections([fallback]);
          if (!selectedConnection) {
            setSelectedConnection(fallback.storeId);
          }
        } else {
          setConnections(whatsappAPIs);
          // Selecionar primeira conexão automaticamente
          if (whatsappAPIs.length > 0 && !selectedConnection) {
            setSelectedConnection(whatsappAPIs[0].storeId);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar conexões:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedConnection]);

  const loadConfig = useCallback(async (clientId: string) => {
    try {
      const connection = connections.find(c => c.storeId === clientId);
      if (!connection) return;

      // Usa API route do Next.js
      const response = await fetch(`/api/client/${clientId}/config`);

      if (response.ok) {
        const data = await response.json();
        setConfig(data.data);
      } else if (response.status === 404) {
        // Auto-provisionar cliente padrão
        const createRes = await fetch(`/api/client`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: clientId,
            name: "WhatsApp Principal",
            botEnabled: true,
            messageLimit: 30,
            contextTime: 60,
          }),
        });
        if (createRes.ok) {
          await loadConfig(clientId);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  }, [connections]);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user, loadConnections]);

  useEffect(() => {
    if (selectedConnection) {
      loadConfig(selectedConnection);
    }
  }, [selectedConnection, loadConfig]);

  const saveConfig = async () => {
    if (!selectedConnection) {
      alert("Selecione uma conexão WhatsApp");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/client/${selectedConnection}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const result = await response.json();
        // Atualizar o estado com a resposta do servidor para garantir sincronização
        if (result.data) {
          setConfig(result.data);
        }
        alert("Configurações salvas com sucesso!");
        // Recarregar a configuração para garantir que está sincronizada
        await loadConfig(selectedConnection);
      } else {
        alert("Erro ao salvar configurações");
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Erro ao salvar configurações");
    } finally {
      setSaving(false);
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
        <p className="text-white">Por favor, faça login para acessar suas ferramentas.</p>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-[#141415] border-[#374151] rounded-2xl p-12 text-center max-w-md">
          <h3 className="text-xl font-semibold text-white mb-4">
            Nenhuma conexão WhatsApp cadastrada
          </h3>
          <p className="text-gray-400 mb-6">
            Adicione uma conexão WhatsApp para configurar o bot
          </p>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-[#001F05] hover:bg-[#003308] text-white"
          >
            Ir para Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Ferramentas WhatsApp</h1>
          <p className="text-gray-400">Configure o comportamento do bot com IA</p>
        </div>

        {/* Connection Selector */}
        <Card className="bg-[#141415] border-[#374151] rounded-2xl p-6 mb-6">
          <Label htmlFor="connection" className="text-white mb-2 block">
            Selecione a Conexão WhatsApp
          </Label>
          <Select
            value={selectedConnection}
            onValueChange={setSelectedConnection}
          >
            <SelectTrigger className="bg-[#1a1a1a] border-[#374151] text-white">
              <SelectValue placeholder="Selecione uma conexão" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#374151]">
              {connections.map((conn) => (
                <SelectItem key={conn.id} value={conn.storeId} className="text-white">
                  {conn.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Card 1: Controle do Bot */}
          <Card className="bg-[#141415] border-[#374151] rounded-2xl p-6 hover:border-[#001F05] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#001F05] p-3 rounded-lg">
                <Power className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Controle do Bot</h3>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="bot-enabled" className="text-gray-300">
                Bot {config.botEnabled ? "Ativado" : "Desativado"}
              </Label>
              <Switch
                id="bot-enabled"
                checked={config.botEnabled}
                onCheckedChange={(checked) => setConfig({ ...config, botEnabled: checked })}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Quando desativado, o bot não responderá às mensagens
            </p>
          </Card>

          {/* Card 2: Tempo de Contexto */}
          <Card className="bg-[#141415] border-[#374151] rounded-2xl p-6 hover:border-[#001F05] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#001F05] p-3 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Tempo de Contexto</h3>
            </div>
            <Select
              value={config.contextTime?.toString()}
              onValueChange={(value) => setConfig({ ...config, contextTime: parseInt(value) })}
            >
              <SelectTrigger className="bg-[#1a1a1a] border-[#374151] text-white">
                <SelectValue placeholder="Selecione o tempo" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#374151]">
                <SelectItem value="5" className="text-white">5 minutos</SelectItem>
                <SelectItem value="15" className="text-white">15 minutos</SelectItem>
                <SelectItem value="30" className="text-white">30 minutos</SelectItem>
                <SelectItem value="60" className="text-white">1 hora</SelectItem>
                <SelectItem value="180" className="text-white">3 horas</SelectItem>
                <SelectItem value="1440" className="text-white">24 horas</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-2">
              Tempo que o bot mantém o contexto da conversa
            </p>
          </Card>

          {/* Card 3: Tipo de Loja */}
          <Card className="bg-[#141415] border-[#374151] rounded-2xl p-6 hover:border-[#001F05] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#001F05] p-3 rounded-lg">
                <Store className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Tipo de Loja</h3>
            </div>
            <Select
              value={config.storeType || ""}
              onValueChange={(value) => setConfig({ ...config, storeType: value })}
            >
              <SelectTrigger className="bg-[#1a1a1a] border-[#374151] text-white">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#374151]">
                <SelectItem value="pizzaria" className="text-white">Pizzaria</SelectItem>
                <SelectItem value="hamburgueria" className="text-white">Hamburgueria</SelectItem>
                <SelectItem value="restaurante" className="text-white">Restaurante</SelectItem>
                <SelectItem value="lanchonete" className="text-white">Lanchonete</SelectItem>
                <SelectItem value="cafeteria" className="text-white">Cafeteria</SelectItem>
                <SelectItem value="doceria" className="text-white">Doceria</SelectItem>
                <SelectItem value="outros" className="text-white">Outros</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-2">
              Tipo de estabelecimento para personalizar respostas
            </p>
          </Card>

          {/* Card 4: Nome do Bot */}
          <Card className="bg-[#141415] border-[#374151] rounded-2xl p-6 hover:border-[#001F05] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#001F05] p-3 rounded-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Nome do Bot</h3>
            </div>
            <Input
              placeholder="Ex: Maria, Carlos, Atendente..."
              value={config.botName || ""}
              onChange={(e) => setConfig({ ...config, botName: e.target.value })}
              className="bg-[#1a1a1a] border-[#374151] text-white placeholder:text-gray-600"
            />
            <p className="text-sm text-gray-500 mt-2">
              Nome que o bot usará ao se apresentar
            </p>
          </Card>

          {/* Card 5: Limite de Mensagens */}
          <Card className="bg-[#141415] border-[#374151] rounded-2xl p-6 hover:border-[#001F05] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#001F05] p-3 rounded-lg">
                <Hash className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Limite de Mensagens</h3>
            </div>
            <Input
              type="number"
              placeholder="30"
              value={config.messageLimit || 30}
              onChange={(e) => setConfig({ ...config, messageLimit: parseInt(e.target.value) || 30 })}
              className="bg-[#1a1a1a] border-[#374151] text-white"
            />
            <p className="text-sm text-gray-500 mt-2">
              Número máximo de mensagens no contexto
            </p>
          </Card>
        </div>

        {/* Cards Full Width */}
        <div className="space-y-6 mb-6">
          {/* Card 6: Prompt Base */}
          <Card className="bg-[#141415] border-[#374151] rounded-2xl p-6 hover:border-[#001F05] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#001F05] p-3 rounded-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Prompt Base</h3>
            </div>
            <Textarea
              placeholder="Ex: Você é um atendente prestativo que ajuda os clientes com pedidos, dúvidas sobre o cardápio e horários de funcionamento..."
              value={config.basePrompt || ""}
              onChange={(e) => setConfig({ ...config, basePrompt: e.target.value })}
              className="bg-[#1a1a1a] border-[#374151] text-white placeholder:text-gray-600 min-h-[120px]"
            />
            <p className="text-sm text-gray-500 mt-2">
              Instruções principais para o comportamento do bot
            </p>
          </Card>

          {/* Card 7: Regras Proibidas */}
          <Card className="bg-[#141415] border-[#374151] rounded-2xl p-6 hover:border-[#001F05] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#001F05] p-3 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Regras - O que o bot NÃO pode falar</h3>
            </div>
            <Textarea
              placeholder="Ex: Não fornecer informações de pagamento, não discutir política, não dar desconto sem autorização..."
              value={config.forbidden || ""}
              onChange={(e) => setConfig({ ...config, forbidden: e.target.value })}
              className="bg-[#1a1a1a] border-[#374151] text-white placeholder:text-gray-600 min-h-[120px]"
            />
            <p className="text-sm text-gray-500 mt-2">
              Assuntos e comportamentos que o bot deve evitar
            </p>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={saveConfig}
            disabled={saving || !selectedConnection}
            className="bg-[#001F05] hover:bg-[#003308] text-white px-8 py-6 text-lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mt-8 bg-[#141415] border-[#374151] rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">💡 Dicas de Configuração</h3>
          <ul className="space-y-2 text-gray-400 list-disc list-inside">
            <li>Seja específico no prompt base para obter respostas mais precisas</li>
            <li>Use o tempo de contexto adequado ao tipo de atendimento</li>
            <li>Defina claramente o que o bot não deve fazer nas regras</li>
            <li>Teste as configurações antes de usar em produção</li>
            <li>Ajuste o limite de mensagens conforme a complexidade das conversas</li>
            <li>Todas as configurações são salvas no banco de dados por conexão</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default function WhatsAppToolsPage() {
  return (
    <ToolProtection tool={SystemTool.WHATSAPP_CHAT} toolName="WhatsApp Chat">
      <WhatsAppToolsPageContent />
    </ToolProtection>
  );
}
