"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSession } from "@/types/admin";
import { Users, UserCheck, UserX, Clock, LogOut, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminSidebar from "./Sidebar";

interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  recentLogins: Array<{
    id: string;
    name: string;
    email: string;
    lastLogin: Date | null;
  }>;
  recentLogs: Array<{
    id: string;
    action: string;
    createdAt: Date;
    user: {
      name: string;
      email: string;
    } | null;
  }>;
}

interface DashboardProps {
  session: AdminSession;
  data: DashboardData;
}

export default function AdminDashboard({ session, data }: DashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/calenza-adm/logout", { method: "POST" });
      router.push("/calenza-adm/login");
      router.refresh();
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Nunca";
    return new Date(date).toLocaleString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <AdminSidebar session={session} onLogout={handleLogout} loading={loading} />

      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
            <p className="text-gray-400">
              Bem-vindo, {session.name || session.email}
            </p>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm">Total de Usuários</h3>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-3xl font-bold">{data.totalUsers}</p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm">Usuários Ativos</h3>
                <UserCheck className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-400">{data.activeUsers}</p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm">Usuários Bloqueados</h3>
                <UserX className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-3xl font-bold text-red-400">{data.blockedUsers}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Últimos Logins */}
            <div className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Últimos Logins
              </h2>
              <div className="space-y-3">
                {data.recentLogins.length === 0 ? (
                  <p className="text-gray-400 text-sm">Nenhum login recente</p>
                ) : (
                  data.recentLogins.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-[#0f0f10] rounded"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(user.lastLogin)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Logs Recentes */}
            <div className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Ações Recentes
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.recentLogs.length === 0 ? (
                  <p className="text-gray-400 text-sm">Nenhuma ação recente</p>
                ) : (
                  data.recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-[#0f0f10] rounded text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          {log.user?.name || "Sistema"}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-400">{log.action}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
