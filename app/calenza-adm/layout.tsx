import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Não verificar autenticação na página de login
  if (pathname.includes("/login")) {
    return <>{children}</>;
  }

  // Verificar autenticação para todas as outras rotas
  // Como estamos em Server Component, vamos fazer a verificação no middleware ou em cada página
  // Por enquanto, vamos deixar a verificação nas páginas individuais

  return <>{children}</>;
}
