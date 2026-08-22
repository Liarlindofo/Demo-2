"use client";

import { useEffect, useState } from "react";
import { useUser } from "@stackframe/stack";
import { SystemTool } from "@/types/admin";
import ToolLock from "@/components/ui/ToolLock";
import { Loader2 } from "lucide-react";

interface ToolProtectionProps {
  tool: SystemTool;
  toolName: string;
  children: React.ReactNode;
}

const TOOL_LABELS: Record<SystemTool, string> = {
  [SystemTool.PRODUTOS]: "Produtos",
  [SystemTool.ETIQUETAGEM]: "Etiquetagem",
  [SystemTool.CHECKLIST]: "Checklist",
  [SystemTool.WHATSAPP_CHAT]: "WhatsApp Chat",
  [SystemTool.CONEXOES]: "Conexões",
  [SystemTool.AGENDAMENTO_RELATORIOS]: "Central de Relatórios",
  [SystemTool.CMV]: "CMV",
  [SystemTool.ANALYTICS]: "Analytics",
  [SystemTool.ESTOQUE]: "Estoque",
  [SystemTool.IFOOD]: "iFood",
  [SystemTool.RH]: "RH",
  [SystemTool.TAREFAS]: "Tarefas",
  [SystemTool.BONIFICACAO]: "Bonificação",
};

export default function ToolProtection({ tool, toolName, children }: ToolProtectionProps) {
  const user = useUser({ or: 'return-null' });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, tool]); // Re-executar quando o ID do usuário ou a ferramenta mudar

  async function checkPermission() {
    if (!user) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    try {
      // Adicionar timestamp para evitar cache
      const response = await fetch(
        `/api/auth/check-tool-permission?tool=${tool}&_t=${Date.now()}`,
        { cache: 'no-store' }
      );
      if (response.ok) {
        const data = await response.json();
        setHasPermission(data.hasPermission === true);
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasPermission) {
    return <ToolLock toolName={toolName || TOOL_LABELS[tool]} />;
  }

  return <>{children}</>;
}
