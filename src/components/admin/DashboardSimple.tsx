"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminSession, UserRole, Permission } from "@/types/admin";
import { Users, UserCheck, UserX, Clock, LogOut, Shield, ArrowRight } from "lucide-react";
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
    lastLogin: string | null;
  }>;
  recentLogs: Array<{
    id: string;
    action: string;
    createdAt: string;
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

export default function AdminDashboardSimple({ session, data }: DashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Validações básicas
  if (!session || typeof session !== 'object') {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center"><p>Erro: Sessão inválida</p></div>;
  }

  if (!data || typeof data !== 'object') {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center"><p>Erro: Dados não disponíveis</p></div>;
  }

  const safeSession: AdminSession = {
    userId: String(session.userId || ""),
    email: String(session.email || ""),
    name: String(session.name || session.email || ""),
    role: (session.role as UserRole) || UserRole.USER,
    permissions: Array.isArray(session.permissions) ? session.permissions : [],
    clientId: session.clientId || undefined,
  };

  const safeData = {
    totalUsers: Number(data.totalUsers) || 0,
    activeUsers: Number(data.activeUsers) || 0,
    blockedUsers: Number(data.blockedUsers) || 0,
    recentLogins: Array.isArray(data.recentLogins) ? data.recentLogins.filter((u: any) => u && u.id && u.name && u.email) : [],
    recentLogs: Array.isArray(data.recentLogs) ? data.recentLogs.filter((l: any) => l && l.id && l.action) : [],
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/calenza-adm/logout", { method: "POST" });
      router.push("/calenza-adm/login");
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Data inválida";
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      const hh = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch {
      return "Data inválida";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <AdminSidebar session={safeSession} onLogout={handleLogout} loading={loading} />

      <div className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
            <p className="text-gray-400">Bem-vindo, {safeSession.name || safeSession.email}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link 
              href="/calenza-adm/usuarios"
              className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-6 hover:border-green-500 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm">Total de Usuários</h3>
                <Users className="h-8 w-8 text-blue-400 group-hover:text-green-400 transition-colors" />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{safeData.totalUsers}</p>
                <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-green-400 transition-colors" />
              </div>
            </Link>

            <Link 
              href="/calenza-adm/usuarios"
              className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-6 hover:border-green-500 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm">Usuários Ativos</h3>
                <UserCheck className="h-8 w-8 text-green-400" />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-green-400">{safeData.activeUsers}</p>
                <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-green-400 transition-colors" />
              </div>
            </Link>

            <Link 
              href="/calenza-adm/usuarios"
              className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-6 hover:border-green-500 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-sm">Usuários Bloqueados</h3>
                <UserX className="h-8 w-8 text-red-400" />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-red-400">{safeData.blockedUsers}</p>
                <ArrowRight className="h-5 w-5 text-gray-500 group-hover:text-green-400 transition-colors" />
              </div>
            </Link>
          </div>

          {/* Botão de Acesso Rápido */}
          {safeSession.permissions.includes(Permission.VIEW_USERS) && (
            <div className="mb-8">
              <Link href="/calenza-adm/usuarios">
                <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gerenciar Usuários
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Últimos Logins
              </h2>
              <div className="space-y-3">
                {safeData.recentLogins.length === 0 ? (
                  <p className="text-gray-400 text-sm">Nenhum login recente</p>
                ) : (
                  safeData.recentLogins.map((user) => (
                    <div key={String(user.id)} className="flex items-center justify-between p-3 bg-[#0f0f10] rounded">
                      <div>
                        <p className="font-medium">{String(user.name)}</p>
                        <p className="text-sm text-gray-400">{String(user.email)}</p>
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(user.lastLogin)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Ações Recentes
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {safeData.recentLogs.length === 0 ? (
                  <p className="text-gray-400 text-sm">Nenhuma ação recente</p>
                ) : (
                  safeData.recentLogs.map((log) => (
                    <div key={String(log.id)} className="p-3 bg-[#0f0f10] rounded text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{String(log.user?.name || "Sistema")}</span>
                        <span className="text-gray-500 text-xs">{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="text-gray-400">{String(log.action)}</p>
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
