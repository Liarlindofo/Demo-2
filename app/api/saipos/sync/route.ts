export const dynamic = 'force-dynamic';

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeSalesResponse, type SaiposRawSale } from "@/lib/saipos-api";
import { stackServerApp } from "@/stack";
import { syncStackAuthUser } from "@/lib/stack-auth-sync";
import { fetchSaiposSalesLargePeriod } from "@/lib/saipos-api-client";

interface SyncRequest {
  apiId?: string;
  days?: number;
}

const BRT_OFFSET = "-03:00";

function computeBRTWindow(days = 15): { start: Date; end: Date } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const now = new Date();

  const toYmd = (d: Date) => {
    const parts = fmt.formatToParts(d);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const da = parts.find((p) => p.type === "day")?.value;
    return `${y}-${m}-${da}`;
  };

  const endLocalYmd = toYmd(now);
  const startRef = new Date(now);
  startRef.setDate(startRef.getDate() - (days - 1));
  const startLocalYmd = toYmd(startRef);

  const startDate = new Date(`${startLocalYmd}T00:00:00${BRT_OFFSET}`);
  const endDate = new Date(`${endLocalYmd}T23:59:59${BRT_OFFSET}`);
  return { start: startDate, end: endDate };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    // 1) Autenticação via Stack Auth
    const stackUser = await stackServerApp.getUser({ or: "return-null" });
    if (!stackUser) {
      return NextResponse.json(
        { success: false, error: "Usuário não autenticado" },
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

    const body = (await request.json()) as SyncRequest;
    const apiId = body.apiId?.trim();
    const days = body.days && body.days > 0 ? body.days : 15;

    if (!apiId) {
      return NextResponse.json(
        { success: false, error: "apiId é obrigatório" },
        { status: 400 }
      );
    }

    // 2) Buscar API Saipos e validar dono
    const saiposAPI = await db.userAPI.findUnique({
      where: { id: apiId },
    });

    if (!saiposAPI || saiposAPI.type !== "saipos") {
      return NextResponse.json(
        { success: false, error: "API Saipos não encontrada" },
        { status: 404 }
      );
    }

    if (saiposAPI.userId !== userId) {
      console.error("API não pertence ao usuário atual", {
        apiUserId: saiposAPI.userId,
        userId,
      });
      return NextResponse.json(
        { success: false, error: "API não pertence ao usuário atual" },
        { status: 403 }
      );
    }

    const apiKey = saiposAPI.apiKey;
    const targetStoreId = saiposAPI.storeId;

    if (!targetStoreId) {
      return NextResponse.json(
        { success: false, error: "StoreId não configurado na API" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API key não encontrada" },
        { status: 401 }
      );
    }

    const cleanToken = apiKey.trim().replace(/^Bearer\s+/i, "");
    if (!cleanToken) {
      return NextResponse.json(
        { success: false, error: "Token inválido" },
        { status: 401 }
      );
    }

    // 3) Janela deslizante de N dias (default 15)
    const { start, end } = computeBRTWindow(days);

    console.log(
      `🔄 Sincronizando sales_daily para apiId=${apiId}, storeId=${targetStoreId}, período ${start.toISOString()} -> ${end.toISOString()}`
    );

    // 4) Apagar registros antigos desta API (antes do start)
    const deletedOld = await db.salesDaily.deleteMany({
      where: {
        apiId,
        date: { lt: start },
      },
    });
    console.log(
      `🧹 Removidos ${deletedOld.count} registros antigos de sales_daily para apiId=${apiId}`
    );

    // 5) Buscar vendas reais da Saipos para o período inteiro usando o novo cliente
    const startISO = start.toISOString();
    const endISO = end.toISOString();

    console.log(`🔄 Buscando vendas da Saipos para o período: ${startISO} até ${endISO}`);

    // Usar o novo cliente da API que respeita limites e trata rate limiting
    // O token já está associado às lojas, não precisamos passar storeId
    const result = await fetchSaiposSalesLargePeriod({
      token: cleanToken,
      startDate: startISO,
      endDate: endISO,
      withDate: 'created_at',
      dataColumnsFilter: 'all',
      limit: 100,
      offset: 0
    });

    if (!result.success) {
      console.error('❌ Erro ao buscar vendas:', result.error);
      return NextResponse.json({
        success: false,
        apiId,
        storeId: targetStoreId,
        startDate: start,
        endDate: end,
        daysSynced: 0,
        error: result.error || 'Erro ao buscar vendas da API Saipos',
      }, { status: 500 });
    }

    console.log(`📊 Total de vendas carregadas da API: ${result.data.length}`);

    // Converter para o formato esperado
    const rawSales = result.data as SaiposRawSale[];
    const normalized = normalizeSalesResponse(rawSales);

    console.log(
      `📊 ${normalized.length} registros normalizados para agregação diária em sales_daily`
    );

    if (normalized.length === 0) {
      return NextResponse.json({
        success: true,
        apiId,
        storeId: targetStoreId,
        startDate: start,
        endDate: end,
        daysSynced: 0,
        message: "Nenhuma venda encontrada no período para esta API.",
      });
    }

    // 6) Calcular clientes únicos por dia
    const uniqueCustomersByDate = new Map<string, Set<string>>();
    for (const sale of rawSales) {
      const saleDate = sale.shift_date ?? sale.sale_date ?? sale.created_at ?? new Date().toISOString();
      const dateKey = new Date(saleDate).toISOString().split("T")[0];
      
      if (!uniqueCustomersByDate.has(dateKey)) {
        uniqueCustomersByDate.set(dateKey, new Set());
      }
      
      // Extrair customer.id_customer conforme documentação
      if (sale.customer?.id_customer) {
        const customerId = String(sale.customer.id_customer);
        uniqueCustomersByDate.get(dateKey)!.add(customerId);
      }
    }

    // 7) UPSERT em sales_daily por (apiId, date)
    const upserts = normalized.map((data) => {
      const date = new Date(data.date + 'T00:00:00.000Z'); // Garantir UTC
      const uniqueCustomers = uniqueCustomersByDate.get(data.date)?.size || 0;
      
      console.log(`📊 Salvando dados para ${data.date}:`, {
        totalOrders: data.totalOrders,
        totalSales: data.totalSales,
        uniqueCustomers,
      });
      
      return db.salesDaily.upsert({
        where: {
          sales_daily_api_date_unique: {
            apiId,
            date,
          },
        },
        create: {
          apiId,
          storeId: targetStoreId,
          date,
          totalOrders: data.totalOrders,
          totalSales: data.totalSales,
          uniqueCustomers,
          channels: {
            ifood: data.qtdIFood,
            telefone: data.qtdTelefone,
            centralPedidos: data.qtdCentralPedidos,
            deliveryDireto: data.qtdDeliveryDireto,
            canceledOrders: data.canceledOrders,
            qtdDelivery: data.qtdDelivery,
            qtdBalcao: data.qtdBalcao,
            totalItems: data.totalItems,
            totalDeliveryFee: data.totalDeliveryFee || 0,
            totalAdditions: data.totalAdditions || 0,
            totalDiscounts: data.totalDiscounts || 0,
            averageTicketDelivery: data.averageTicketDelivery || 0,
            averageTicketBalcao: data.averageTicketBalcao || 0,
          },
        },
        update: {
          totalOrders: data.totalOrders,
          totalSales: data.totalSales,
          uniqueCustomers,
          channels: {
            ifood: data.qtdIFood,
            telefone: data.qtdTelefone,
            centralPedidos: data.qtdCentralPedidos,
            deliveryDireto: data.qtdDeliveryDireto,
            canceledOrders: data.canceledOrders,
            qtdDelivery: data.qtdDelivery,
            qtdBalcao: data.qtdBalcao,
            totalItems: data.totalItems,
            totalDeliveryFee: data.totalDeliveryFee || 0,
            totalAdditions: data.totalAdditions || 0,
            totalDiscounts: data.totalDiscounts || 0,
            averageTicketDelivery: data.averageTicketDelivery || 0,
            averageTicketBalcao: data.averageTicketBalcao || 0,
          },
        },
      });
    });

    await db.$transaction(upserts);
    console.log(`✅ ${upserts.length} dias sincronizados em sales_daily`);

    return NextResponse.json({
      success: true,
      apiId,
      storeId: targetStoreId,
      startDate: start,
      endDate: end,
      daysSynced: upserts.length,
    });
  } catch (error) {
    console.error("❌ Erro na sincronização Saipos (sales_daily):", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}