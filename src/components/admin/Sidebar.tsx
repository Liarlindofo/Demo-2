"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSession } from "@/types/admin";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  session: AdminSession;
  onLogout: () => void;
  loading: boolean;
}

export default function AdminSidebar({ session, onLogout, loading }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Garantir que session sempre tenha valores válidos
  const safeSession = {
    userId: session?.userId || "",
    email: session?.email || "",
    name: session?.name || session?.email || "",
    role: session?.role || "user",
    permissions: Array.isArray(session?.permissions) ? session.permissions : [],
    clientId: session?.clientId || undefined,
  };

  const menuItems = [
    {
      href: "/calenza-adm",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["super_admin", "admin", "user"],
    },
    {
      href: "/calenza-adm/usuarios",
      label: "Usuários",
      icon: Users,
      roles: ["super_admin", "admin"],
      permission: "view_users",
    },
    {
      href: "/calenza-adm/clientes",
      label: "Clientes",
      icon: Building2,
      roles: ["super_admin"],
      permission: "manage_clients",
    },
    {
      href: "/calenza-adm/logs",
      label: "Logs de Auditoria",
      icon: FileText,
      roles: ["super_admin", "admin"],
      permission: "view_logs",
    },
    {
      href: "/calenza-adm/configuracoes",
      label: "Configurações",
      icon: Settings,
      roles: ["super_admin"],
      permission: "system_settings",
    },
  ];

  const filteredItems = menuItems.filter((item) => {
    if (!item.roles.includes(safeSession.role)) return false;
    if (item.permission && !safeSession.permissions.includes(item.permission as any)) {
      return false;
    }
    return true;
  });

  const SidebarContent = () => (
    <div className="h-full bg-[#1a1a1a] border-r border-[#374151] flex flex-col">
      <div className="p-6 border-b border-[#374151]">
        <h2 className="text-xl font-bold">Plateful Admin</h2>
        <p className="text-sm text-gray-400 mt-1">
          {safeSession.name || safeSession.email}
        </p>
        <p className="text-xs text-gray-500 mt-1 capitalize">
          {String(safeSession.role).replace("_", " ")}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-[#001F05] text-white"
                  : "text-gray-400 hover:bg-[#0f0f10] hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#374151]">
        <Button
          onClick={onLogout}
          disabled={loading}
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#1a1a1a] border border-[#374151] rounded-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-64">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 z-50">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
