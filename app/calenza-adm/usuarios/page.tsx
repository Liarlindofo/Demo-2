"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/Sidebar";
import { StackUser, SystemTool, UserToolPermission } from "@/types/admin";
import {
  Search,
  Edit,
  Lock,
  Unlock,
  Key,
  Mail,
  User as UserIcon,
  Lock as LockIcon,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/ui/notification";

interface UserWithPermissions extends StackUser {
  toolPermissions: UserToolPermission[];
}

const TOOL_LABELS: Record<SystemTool, string> = {
  [SystemTool.PRODUTOS]: "Produtos",
  [SystemTool.ETIQUETAGEM]: "Etiquetagem",
  [SystemTool.CHECKLIST]: "Checklist",
  [SystemTool.WHATSAPP_CHAT]: "WhatsApp Chat",
  [SystemTool.CONEXOES]: "Conexões",
  [SystemTool.AGENDAMENTO_RELATORIOS]: "Agendamento de Relatórios",
  [SystemTool.CMV]: "CMV",
  [SystemTool.ANALYTICS]: "Analytics",
  [SystemTool.ESTOQUE]: "Estoque",
  [SystemTool.IFOOD]: "iFood",
  [SystemTool.RH]: "RH",
};

// Grupos visuais de ferramentas para organizar a UI
const TOOL_GROUPS: { label: string; tools: SystemTool[] }[] = [
  {
    label: "Operacional",
    tools: [
      SystemTool.PRODUTOS,
      SystemTool.CHECKLIST,
      SystemTool.ETIQUETAGEM,
      SystemTool.CMV,
      SystemTool.ESTOQUE,
    ],
  },
  {
    label: "Integrações",
    tools: [
      SystemTool.CONEXOES,
      SystemTool.WHATSAPP_CHAT,
      SystemTool.AGENDAMENTO_RELATORIOS,
      SystemTool.IFOOD,
    ],
  },
  {
    label: "Outros",
    tools: [SystemTool.ANALYTICS],
  },
];

export default function UsuariosPage() {
  const router = useRouter();
  const { showNotification, NotificationContainer } = useNotification();
  const [session, setSession] = useState<any>(null);
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<UserWithPermissions | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (session) {
      loadUsers();
    }
  }, [session, searchTerm]);

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

  async function loadUsers() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      
      const response = await fetch(`/api/calenza-adm/usuarios?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        showNotification("Erro ao carregar usuários", "error");
      }
    } catch (error) {
      showNotification("Erro ao carregar usuários", "error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserStatus(user: UserWithPermissions) {
    try {
      setSaving(true);
      const response = await fetch(`/api/calenza-adm/usuarios/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (response.ok) {
        showNotification(
          `Usuário ${user.isActive ? "desativado" : "ativado"} com sucesso`,
          "success"
        );
        loadUsers();
      } else {
        const error = await response.json();
        showNotification(error.error || "Erro ao alterar status", "error");
      }
    } catch (error) {
      showNotification("Erro ao alterar status do usuário", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveUserChanges() {
    if (!editingUser) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/calenza-adm/usuarios/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryEmail: editingUser.primaryEmail,
          displayName: editingUser.displayName,
          userEmail: editingUser.user?.email,
        }),
      });

      if (response.ok) {
        showNotification("Usuário atualizado com sucesso", "success");
        setShowEditModal(false);
        setEditingUser(null);
        loadUsers();
      } else {
        const error = await response.json();
        showNotification(error.error || "Erro ao atualizar usuário", "error");
      }
    } catch (error) {
      showNotification("Erro ao atualizar usuário", "error");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (!editingUser) return;
    if (newPassword.length < 6) {
      showNotification("Senha deve ter pelo menos 6 caracteres", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification("Senhas não coincidem", "error");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/calenza-adm/usuarios/${editingUser.id}/senha`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        showNotification("Senha alterada com sucesso", "success");
        setShowPasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const error = await response.json();
        showNotification(error.error || "Erro ao alterar senha", "error");
      }
    } catch (error) {
      showNotification("Erro ao alterar senha", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleToolPermission(user: UserWithPermissions, tool: SystemTool) {
    try {
      setSaving(true);
      const currentPermission = user.toolPermissions?.find((p) => p.tool === tool);
      const newEnabled = !currentPermission?.isEnabled;

      // Buscar todas as permissões atuais do usuário
      const currentPermissions = user.toolPermissions || [];
      
      // Criar array com todas as ferramentas e seus estados
      const permissions = Object.values(SystemTool).map((t) => {
        const existing = currentPermissions.find((p) => p.tool === t);
        return {
          tool: t,
          isEnabled: t === tool ? newEnabled : (existing?.isEnabled ?? false),
        };
      });

      const response = await fetch(`/api/calenza-adm/usuarios/${user.id}/permissoes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
        cache: 'no-store', // Evitar cache
      });

      if (response.ok) {
        const result = await response.json();
        showNotification(
          `Permissão de ${TOOL_LABELS[tool]} ${newEnabled ? "habilitada" : "desabilitada"}`,
          "success"
        );
        // Recarregar usuários após um pequeno delay para garantir que o banco foi atualizado
        setTimeout(() => {
          loadUsers();
        }, 300);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        showNotification(errorData.error || "Erro ao atualizar permissão", "error");
        console.error("Erro ao atualizar permissão:", errorData);
      }
    } catch (error: any) {
      console.error("Erro ao atualizar permissão:", error);
      showNotification(
        error?.message || "Erro ao atualizar permissão. Tente novamente.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(user: UserWithPermissions) {
    setEditingUser({ ...user });
    setShowEditModal(true);
  }

  function openPasswordModal(user: UserWithPermissions) {
    setEditingUser(user);
    setShowPasswordModal(true);
  }

  function getToolPermission(user: UserWithPermissions, tool: SystemTool): boolean {
    return user.toolPermissions?.find((p) => p.tool === tool)?.isEnabled ?? false;
  }

  async function handleLogout() {
    try {
      await fetch("/api/calenza-adm/logout", { method: "POST" });
      router.push("/calenza-adm/login");
    } catch (error) {
      router.push("/calenza-adm/login");
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <NotificationContainer />
      <AdminSidebar session={session} onLogout={handleLogout} loading={false} />
      
      <main className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Gerenciamento de Usuários</h1>

          {/* Barra de busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#374151] rounded-lg focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          {/* Lista de usuários */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Nenhum usuário encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">
                          {user.displayName || user.primaryEmail || "Sem nome"}
                        </h3>
                        {user.isActive ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-400">
                        <p>
                          <Mail className="inline h-4 w-4 mr-1" />
                          {user.primaryEmail || "Sem email"}
                        </p>
                        {user.user?.email && (
                          <p>
                            <UserIcon className="inline h-4 w-4 mr-1" />
                            {user.user.email}
                          </p>
                        )}
                        {user.user?.username && (
                          <p>
                            <span className="font-medium">Username:</span> {user.user.username}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Última atividade:</span>{" "}
                          {user.lastActiveAt
                            ? new Date(user.lastActiveAt).toLocaleString("pt-BR")
                            : "Nunca"}
                        </p>
                      </div>

                      {/* Permissões de ferramentas — agrupadas */}
                      <div className="mt-4 space-y-3">
                        <p className="text-sm font-medium">Permissões de Ferramentas:</p>
                        {TOOL_GROUPS.map((group) => (
                          <div key={group.label}>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                              {group.label}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {group.tools.map((tool) => {
                                const hasPermission = getToolPermission(user, tool);
                                return (
                                  <button
                                    key={tool}
                                    onClick={() => toggleToolPermission(user, tool)}
                                    disabled={saving}
                                    title={hasPermission ? "Clique para revogar" : "Clique para conceder"}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                      hasPermission
                                        ? "bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50"
                                        : "bg-gray-800 text-gray-500 border border-gray-700 hover:bg-gray-700"
                                    } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                  >
                                    {hasPermission ? (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    ) : (
                                      <LockIcon className="h-3.5 w-3.5" />
                                    )}
                                    {TOOL_LABELS[tool]}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        onClick={() => openEditModal(user)}
                        variant="outline"
                        size="sm"
                        className="bg-[#0f0f10] border-[#374151] hover:bg-[#1a1a1a]"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        onClick={() => toggleUserStatus(user)}
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        className={
                          user.isActive
                            ? "bg-red-900/20 border-red-700 text-red-400 hover:bg-red-900/30"
                            : "bg-green-900/20 border-green-700 text-green-400 hover:bg-green-900/30"
                        }
                      >
                        {user.isActive ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => openPasswordModal(user)}
                        variant="outline"
                        size="sm"
                        className="bg-[#0f0f10] border-[#374151] hover:bg-[#1a1a1a]"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Senha
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de edição */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Editar Usuário</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome de Exibição</label>
                <input
                  type="text"
                  value={editingUser.displayName || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, displayName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0f0f10] border border-[#374151] rounded-lg focus:outline-none focus:border-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email Principal</label>
                <input
                  type="email"
                  value={editingUser.primaryEmail || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, primaryEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#0f0f10] border border-[#374151] rounded-lg focus:outline-none focus:border-[#10b981]"
                />
              </div>
              {editingUser.user && (
                <div>
                  <label className="block text-sm font-medium mb-1">Email do Sistema</label>
                  <input
                    type="email"
                    value={editingUser.user.email || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        user: { ...editingUser.user!, email: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-[#0f0f10] border border-[#374151] rounded-lg focus:outline-none focus:border-[#10b981]"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={saveUserChanges}
                disabled={saving}
                className="flex-1 bg-[#10b981] hover:bg-[#059669]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
              <Button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                variant="outline"
                className="flex-1 border-[#374151]"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de alteração de senha */}
      {showPasswordModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#374151] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Alterar Senha</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f10] border border-[#374151] rounded-lg focus:outline-none focus:border-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirmar Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f10] border border-[#374151] rounded-lg focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={changePassword}
                disabled={saving}
                className="flex-1 bg-[#10b981] hover:bg-[#059669]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Alterar Senha"}
              </Button>
              <Button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                variant="outline"
                className="flex-1 border-[#374151]"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
