export const dynamic = 'force-dynamic';

export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stackServerApp } from "@/stack";
import { syncStackAuthUser } from "@/lib/stack-auth-sync";

// GET /api/dashboard/sales - Ler dados de vendas do cache local
export async function GET(request: Request) {
  try {
    console.log("📊 [GET /api/dashboard/sales] Iniciando busca de dados...");
    const url = new URL(request.url);
    const storeId = url.searchParams.get("storeId");
    const range = url.searchParams.get("range") || "7d"; // 1d, 7d, 15d (máximo)
    const specificDate = url.searchParams.get("date"); // Data específica quando range=1d
    const startDateParam = url.searchParams.get("startDate"); // Data inicial quando fornecida
    const endDateParam = url.searchParams.get("endDate"); // Data final quando fornecida

    console.log("📊 Parâmetros recebidos:", { storeId, range, specificDate, startDateParam, endDateParam });

    // Autenticação
    const stackUser = await stackServerApp.getUser({ or: "return-null" });
    if (!stackUser) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }
    const dbUser = await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail || undefined,
      displayName: stackUser.displayName || undefined,
      profileImageUrl: stackUser.profileImageUrl || undefined,
      primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
    });
    const userId = dbUser.id;

    if (!storeId) {
      console.error("❌ storeId não fornecido");
      return NextResponse.json(
        { error: "storeId é obrigatório" },
        { status: 400 }
      );
    }

    // Calcular datas baseado no range ou datas específicas fornecidas
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia de hoje
    
    let startDate: Date;
    let endDate: Date = today;
    
    // Se datas específicas foram fornecidas, usar elas
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
      console.log(`📊 Usando datas específicas fornecidas: ${startDate.toISOString().split('T')[0]} até ${endDate.toISOString().split('T')[0]}`);
    } else if (specificDate) {
      // Se uma data específica foi fornecida (range=1d com data específica)
      startDate = new Date(specificDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(specificDate);
      endDate.setHours(23, 59, 59, 999);
      console.log(`📊 Usando data específica fornecida: ${specificDate}`);
    } else {
      // Calcular datas baseado no range (comportamento padrão)
      switch (range) {
        case "1d":
          // Apenas hoje
          startDate = new Date(today);
          startDate.setHours(0, 0, 0, 0);
          endDate = today;
          break;
        case "7d":
          // Últimos 7 dias incluindo hoje (6 dias atrás + hoje = 7 dias)
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          endDate = today;
          break;
        case "15d":
          // Últimos 15 dias incluindo hoje (14 dias atrás + hoje = 15 dias)
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 14);
          startDate.setHours(0, 0, 0, 0);
          endDate = today;
          break;
        default:
          // Default: últimos 7 dias
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          endDate = today;
      }
    }

    // Buscar dados do cache com otimização
    // Usar select apenas dos campos necessários para melhor performance
    console.log("📊 Buscando dados do banco...", { storeId, startDate, today, range });
    
    // Verificar se o modelo existe
    if (!db.salesDaily) {
      console.error("❌ Modelo salesDaily não encontrado no Prisma Client");
      throw new Error("Modelo salesDaily não está disponível. Execute 'npx prisma generate' para regenerar o Prisma Client.");
    }
    
    // Buscar a API pelo storeId e userId para obter o apiId
    const api = await db.userAPI.findFirst({
      where: {
        storeId: storeId,
        userId: userId,
        type: "saipos",
      },
    });

    if (!api) {
      return NextResponse.json(
        { error: "API não encontrada para este storeId" },
        { status: 404 }
      );
    }

    // Verificar se há dados no banco para este apiId + storeId
    let totalRecords = 0;
    let allRecords: Array<{ date: Date; totalSales: unknown; totalOrders: number }> = [];
    
    try {
      totalRecords = await db.salesDaily.count({
        where: { apiId: api.id, storeId: storeId },
      });
      console.log(`📊 Total de registros no banco para storeId "${storeId}": ${totalRecords}`);
      
      // Buscar todos os registros para debug
      allRecords = await db.salesDaily.findMany({
        where: { apiId: api.id, storeId: storeId },
        select: { date: true, totalSales: true, totalOrders: true },
        take: 5,
        orderBy: { date: "desc" },
      });
      console.log(`📊 Últimos 5 registros encontrados:`, allRecords);
    } catch (countError) {
      console.error("❌ Erro ao contar registros:", countError);
      // Continuar mesmo com erro - pode ser que a tabela não exista ainda
      totalRecords = 0;
    }
    
    let salesData;
    try {
      // Adicionar timeout para evitar travamento do pool
      const queryPromise = db.salesDaily.findMany({
        where: {
          apiId: api.id,
          storeId: storeId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          date: true,
          totalSales: true,
          totalOrders: true,
          uniqueCustomers: true,
        },
        orderBy: {
          date: "asc",
        },
        // Não limitar resultados - buscar todos os registros do período
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout após 20 segundos")), 20000)
      );

      salesData = await Promise.race([queryPromise, timeoutPromise]);
      console.log(`📊 Dados encontrados no período: ${salesData.length} registros`);
      console.log(`📊 Período de busca: ${startDate.toISOString().split('T')[0]} até ${today.toISOString().split('T')[0]}`);
      console.log(`📊 StoreId usado na busca: "${storeId}"`);
      
      if (salesData.length > 0) {
        console.log(`📊 Primeiro registro:`, {
          date: salesData[0].date,
          totalSales: salesData[0].totalSales,
          totalOrders: salesData[0].totalOrders,
        });
        console.log(`📊 Último registro:`, {
          date: salesData[salesData.length - 1].date,
          totalSales: salesData[salesData.length - 1].totalSales,
          totalOrders: salesData[salesData.length - 1].totalOrders,
        });
      } else {
        console.warn(`⚠️ NENHUM DADO ENCONTRADO para storeId "${storeId}" no período ${startDate.toISOString().split('T')[0]} até ${endDate.toISOString().split('T')[0]}`);
        console.warn(`⚠️ Total de registros no banco para este storeId: ${totalRecords}`);
        if (totalRecords > 0 && allRecords.length > 0) {
          console.warn(`⚠️ Mas há ${totalRecords} registros no banco! Buscando dados mais recentes disponíveis...`);
          console.warn(`⚠️ Últimos registros encontrados:`, allRecords.map(r => ({
            date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
            totalOrders: r.totalOrders
          })));
          
          // Se não encontrou dados no período solicitado, buscar os dados mais recentes disponíveis
          const mostRecentDate = allRecords[0]?.date;
          if (mostRecentDate) {
            const recentDate = mostRecentDate instanceof Date ? mostRecentDate : new Date(mostRecentDate);
            recentDate.setHours(23, 59, 59, 999);
            
            // Para range "1d", buscar apenas o último dia com dados
            // Para outros ranges, buscar os últimos N dias a partir do último dia com dados
            let fallbackStartDate: Date;
            if (range === "1d") {
              fallbackStartDate = new Date(recentDate);
              fallbackStartDate.setHours(0, 0, 0, 0);
            } else if (range === "7d") {
              fallbackStartDate = new Date(recentDate);
              fallbackStartDate.setDate(fallbackStartDate.getDate() - 6);
              fallbackStartDate.setHours(0, 0, 0, 0);
            } else if (range === "15d") {
              fallbackStartDate = new Date(recentDate);
              fallbackStartDate.setDate(fallbackStartDate.getDate() - 14);
              fallbackStartDate.setHours(0, 0, 0, 0);
            } else {
              fallbackStartDate = new Date(recentDate);
              fallbackStartDate.setDate(fallbackStartDate.getDate() - 6);
              fallbackStartDate.setHours(0, 0, 0, 0);
            }
            
            console.log(`📊 Buscando dados mais recentes disponíveis: ${fallbackStartDate.toISOString().split('T')[0]} até ${recentDate.toISOString().split('T')[0]}`);
            
            try {
            const fallbackQueryPromise = db.salesDaily.findMany({
                where: {
                  apiId: api.id,
                  storeId: storeId,
                  date: {
                    gte: fallbackStartDate,
                    lte: recentDate,
                  },
                },
        select: {
          date: true,
          totalSales: true,
          totalOrders: true,
          uniqueCustomers: true,
        },
                orderBy: {
                  date: "asc",
                },
              });
              
              const fallbackTimeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Query timeout após 20 segundos")), 20000)
              );
              
              salesData = await Promise.race([fallbackQueryPromise, fallbackTimeoutPromise]);
              console.log(`📊 Dados encontrados no período alternativo: ${salesData.length} registros`);
              
              // Atualizar startDate e endDate para refletir os dados encontrados
              if (salesData.length > 0) {
                startDate = fallbackStartDate;
                endDate = recentDate;
              }
            } catch (fallbackError) {
              console.error("❌ Erro ao buscar dados alternativos:", fallbackError);
              // Continuar com salesData vazio
            }
          }
        }
      }
    } catch (dbError) {
      console.error("❌ Erro ao buscar dados do banco:", dbError);
      throw dbError;
    }

    // Converter para formato esperado pela dashboard
    console.log("📊 Convertendo dados...");
    const formattedData = salesData.map((item, index) => {
      try {
        // Converter data para string ISO (YYYY-MM-DD)
        let dateStr: string;
        if (item.date instanceof Date) {
          dateStr = item.date.toISOString().split("T")[0];
        } else {
          // Se já for string, usar diretamente
          dateStr = typeof item.date === 'string' ? item.date : new Date(item.date).toISOString().split("T")[0];
        }
        
        // Converter totalSales para Number
        let totalSalesNum: number = 0;
        try {
          if (item.totalSales !== null && item.totalSales !== undefined) {
            if (typeof item.totalSales === 'number') {
              totalSalesNum = item.totalSales;
            } else {
              totalSalesNum = Number(item.totalSales) || 0;
            }
          }
        } catch (e) {
          console.error(`Erro ao converter totalSales no item ${index}:`, e, item.totalSales);
          totalSalesNum = 0;
        }
        
        // Converter averageTicket (calculado on-the-fly)
        const averageTicketNum: number = (item.totalOrders || 0) > 0 ? (totalSalesNum / (item.totalOrders || 0)) : 0;
        
        return {
          date: dateStr,
          totalSales: totalSalesNum,
          totalOrders: item.totalOrders || 0,
          averageTicket: averageTicketNum,
          uniqueCustomers: item.uniqueCustomers || 0,
          channels: null,
        };
      } catch (error) {
        console.error(`❌ Erro ao converter item ${index}:`, error, item);
        // Retornar item com valores padrão em caso de erro
        const dateStr = item.date instanceof Date 
          ? item.date.toISOString().split("T")[0]
          : (typeof item.date === 'string' ? item.date : new Date().toISOString().split("T")[0]);
        
        return {
          date: dateStr,
          totalSales: 0,
          totalOrders: 0,
          averageTicket: 0,
          uniqueCustomers: 0,
          channels: null,
        };
      }
    });

    // Calcular totais agregados
    const totals = formattedData.reduce(
      (acc, item) => ({
        totalSales: acc.totalSales + item.totalSales,
        totalOrders: acc.totalOrders + item.totalOrders,
        uniqueCustomers: acc.uniqueCustomers + item.uniqueCustomers,
      }),
      { totalSales: 0, totalOrders: 0, uniqueCustomers: 0 }
    );

    const averageTicket =
      totals.totalOrders > 0 ? totals.totalSales / totals.totalOrders : 0;

    console.log("📊 Dados formatados com sucesso:", {
      totalItems: formattedData.length,
      totals,
      averageTicket,
    });

    return NextResponse.json({
      data: formattedData,
      summary: {
        totalSales: totals.totalSales,
        totalOrders: totals.totalOrders,
        averageTicket: averageTicket,
        uniqueCustomers: totals.uniqueCustomers,
      },
      period: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
        range: range,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar dados de vendas:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
    console.error("Tipo do erro:", error?.constructor?.name);
    console.error("Mensagem do erro:", error instanceof Error ? error.message : String(error));
    
    // Retornar erro mais detalhado
    const errorMessage = error instanceof Error 
      ? error.message
      : String(error);
    
    // Em produção, não expor stack trace completo
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorDetails = isDevelopment && error instanceof Error && error.stack
      ? `\n${error.stack}`
      : '';
    
    return NextResponse.json(
      {
        error: `${errorMessage}${errorDetails}`,
        data: [],
        summary: {
          totalSales: 0,
          totalOrders: 0,
          averageTicket: 0,
          uniqueCustomers: 0,
        },
      },
      { status: 500 }
    );
  }
}




