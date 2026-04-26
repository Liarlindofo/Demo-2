export const dynamic = 'force-dynamic';

export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Verificar se a requisição vem do Vercel Cron (header Authorization)
function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

// GET /api/cron/cleanup-sales - Limpar dados com mais de 90 dias
export async function GET(request: Request) {
  try {
    // Verificar autorização (apenas Vercel Cron pode chamar)
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    console.log("🧹 Iniciando limpeza automática de dados antigos...");

    // Calcular data limite (90 dias atrás)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    cutoffDate.setHours(0, 0, 0, 0);

    // Deletar registros com mais de 90 dias
    const result = await db.salesDaily.deleteMany({
      where: {
        date: {
          lt: cutoffDate,
        },
      },
    });

    console.log(
      `✅ Limpeza concluída: ${result.count} registro(s) removido(s) (dados anteriores a ${cutoffDate.toISOString().split("T")[0]})`
    );

    return NextResponse.json({
      success: true,
      message: "Limpeza concluída",
      deleted: result.count,
      cutoffDate: cutoffDate.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("❌ Erro na limpeza automática:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}









