"use client";

import { useEffect, useState } from "react";
import { useUser } from "@stackframe/stack";
import { SystemTool } from "@/types/admin";

interface ToolPermission {
  tool: SystemTool;
  hasPermission: boolean;
}

export function useToolPermissions() {
  const user = useUser({ or: 'return-null' });
  const [permissions, setPermissions] = useState<Record<SystemTool, boolean>>({
    [SystemTool.PRODUTOS]: false,
    [SystemTool.ETIQUETAGEM]: false,
    [SystemTool.CHECKLIST]: false,
    [SystemTool.WHATSAPP_CHAT]: false,
    [SystemTool.CONEXOES]: false,
    [SystemTool.AGENDAMENTO_RELATORIOS]: false,
    [SystemTool.CMV]: false,
    [SystemTool.ANALYTICS]: false,
    [SystemTool.ESTOQUE]: false,
    [SystemTool.IFOOD]: false,
    [SystemTool.RH]: false,
    [SystemTool.TAREFAS]: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkAllPermissions();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Re-executar quando o ID do usuário mudar

  async function checkAllPermissions() {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const tools = Object.values(SystemTool);
      const permissionChecks = await Promise.all(
        tools.map(async (tool) => {
          try {
            // Adicionar timestamp para evitar cache
            const response = await fetch(
              `/api/auth/check-tool-permission?tool=${tool}&_t=${Date.now()}`,
              { cache: 'no-store' }
            );
            if (response.ok) {
              const data = await response.json();
              return { tool, hasPermission: data.hasPermission === true };
            }
            return { tool, hasPermission: false };
          } catch (error) {
            console.error(`Erro ao verificar permissão para ${tool}:`, error);
            return { tool, hasPermission: false };
          }
        })
      );

      const permissionsMap: Record<SystemTool, boolean> = {
        [SystemTool.PRODUTOS]: false,
        [SystemTool.ETIQUETAGEM]: false,
        [SystemTool.CHECKLIST]: false,
        [SystemTool.WHATSAPP_CHAT]: false,
        [SystemTool.CONEXOES]: false,
        [SystemTool.AGENDAMENTO_RELATORIOS]: false,
        [SystemTool.CMV]: false,
        [SystemTool.ANALYTICS]: false,
        [SystemTool.ESTOQUE]: false,
        [SystemTool.IFOOD]: false,
        [SystemTool.RH]: false,
        [SystemTool.TAREFAS]: false,
      };

      permissionChecks.forEach(({ tool, hasPermission }) => {
        permissionsMap[tool] = hasPermission;
      });

      setPermissions(permissionsMap);
    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
    } finally {
      setLoading(false);
    }
  }

  return { permissions, loading, refetch: checkAllPermissions };
}
