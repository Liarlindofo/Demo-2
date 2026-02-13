import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/components/admin/Dashboard";

async function getDashboardData() {
  const totalUsers = await prisma.adminUser.count();
  const activeUsers = await prisma.adminUser.count({
    where: { isActive: true },
  });
  const blockedUsers = totalUsers - activeUsers;

  const recentLogins = await prisma.adminUser.findMany({
    where: {
      lastLogin: {
        not: null,
      },
    },
    orderBy: {
      lastLogin: "desc",
    },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      lastLogin: true,
    },
  });

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

  return {
    totalUsers,
    activeUsers,
    blockedUsers,
    recentLogins,
    recentLogs,
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

    return <AdminDashboard session={session} data={dashboardData} />;
  } catch (error) {
    console.error("Erro na página admin:", error);
    redirect("/calenza-adm/login");
    return null;
  }
}
