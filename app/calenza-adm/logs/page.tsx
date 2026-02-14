"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/Sidebar";
import { AdminSession } from "@/types/admin";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LogsPage() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (session) {
      loadLogs();
    }
  }, [session]);

  async function checkAuth() {
    try {
      const response = await fetch("/api/calenza-adm/me");
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      } else {
        router.push("/calenza-adm/login");
      }
    } catch (error) {
      router.push("/calenza-adm/login");
    }
  }

  async function loadLogs() {
    try {
      setLoading(true);
      const response = await fetch("/api/calenza-adm/logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/calenza-adm/logout", { method: "POST" });
      router.push("/calenza-adm/login");
    } catch (error) {
      router.push("/calenza-adm/login");
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("pt-BR");
    } catch {
      return "Data inválida";
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <AdminSidebar session={session} onLogout={handleLogout} loading={false} />

      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Logs de Auditoria</h1>
            <p className="text-gray-400">Histórico de ações administrativas</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#374151] rounded-lg overflow-hidden">
              <div className="p-6">
                {logs.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Nenhum log encontrado</p>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 bg-[#0f0f10] rounded border border-[#374151]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <span className="font-medium">
                              {log.user?.name || "Sistema"}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-300">{log.action}</p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                              Ver detalhes
                            </summary>
                            <pre className="mt-2 p-2 bg-[#000] rounded text-xs overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
