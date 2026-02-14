import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/components/admin/Dashboard";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";

async function getDashboardData() {
  // Buscar dados de stack_users (usuários do sistema)
  const totalUsers = await prisma.stackUser.count();
  const activeUsers = await prisma.stackUser.count({
    where: { isActive: true },
  });
  const blockedUsers = totalUsers - activeUsers;

  // Últimos logins baseados em lastActiveAt
  const recentLogins = await prisma.stackUser.findMany({
    where: {
      lastActiveAt: {
        not: null,
      },
    },
    orderBy: {
      lastActiveAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      displayName: true,
      primaryEmail: true,
      lastActiveAt: true,
      user: {
        select: {
          email: true,
          username: true,
        },
      },
    },
  });

  // Logs de auditoria (mantém admin_users para logs de ações administrativas)
  const recentLogs = await prisma.adminAuditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Formatar recentLogins para o formato esperado pelo componente
  const formattedLogins = recentLogins.map((user) => ({
    id: user.id,
    name: user.displayName || user.primaryEmail || user.user?.email || "Sem nome",
    email: user.primaryEmail || user.user?.email || "Sem email",
    lastLogin: user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : null,
  }));

  // Formatar recentLogs para garantir serialização correta
  const formattedLogs = recentLogs.map((log) => ({
    id: log.id,
    action: log.action || "Ação desconhecida",
    createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
    user: log.user ? {
      name: log.user.name || "Sistema",
      email: log.user.email || "",
    } : null,
  }));

  // Garantir que os dados estejam sempre no formato correto
  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    blockedUsers: blockedUsers || 0,
    recentLogins: formattedLogins || [],
    recentLogs: formattedLogs || [],
  };
}

export default async function AdminPage() {
  try {
    // Verificar autenticação
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "/calenza-adm";
    const cookieHeader = headersList.get("cookie") || "";
    
    const request = new NextRequest(
      new URL(`http://localhost${pathname}`),
      {
        headers: {
          cookie: cookieHeader,
        } as any,
      }
    );

    const session = await verifyAdminSession(request);

    if (!session) {
      redirect("/calenza-adm/login");
      return null;
    }

    const dashboardData = await getDashboardData();

    return (
      <ErrorBoundary>
        <AdminDashboard session={session} data={dashboardData} />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Erro na página admin:", error);
    redirect("/calenza-adm/login");
    return null;
  }
}
