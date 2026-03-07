export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stackServerApp } from "@/stack";
import { syncStackAuthUser } from "@/lib/stack-auth-sync";

interface SyncRequest {
  apiId: string;
  storeId?: string;
  days?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Deadline global - abortar antes do Vercel matar a função
const GLOBAL_DEADLINE_MS = 50000; // 50s (maxDuration=60s, com margem de 10s)
const PER_REQUEST_TIMEOUT_MS = 10000; // 10s por requisição individual

/**
 * Busca vendas da API Saipos para um período específico
 * Usa o endpoint /v1/search_sales diretamente - otimizado para ser rápido
 * Tem deadline global para nunca exceder o tempo máximo do Vercel
 */
async function fetchSalesFromSaipos(
  apiKey: string,
  startDate: Date,
  endDate: Date
): Promise<unknown[]> {
  const allSales: unknown[] = [];
  const limit = 200;
  let offset = 0;
  let pageNumber = 0;
  const MAX_PAGES = 50;
  const globalStart = Date.now();

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  while (pageNumber < MAX_PAGES) {
    // Verificar deadline global antes de cada requisição
    const elapsed = Date.now() - globalStart;
    if (elapsed > GLOBAL_DEADLINE_MS) {
      console.warn(`⏰ Deadline global atingido (${Math.round(elapsed / 1000)}s). Retornando ${allSales.length} vendas parciais.`);
      break;
    }

    const url = `https://data.saipos.io/v1/search_sales?p_date_column_filter=shift_date&p_filter_date_start=${encodeURIComponent(
      startISO
    )}&p_filter_date_end=${encodeURIComponent(
      endISO
    )}&p_limit=${limit}&p_offset=${offset}`;

    pageNumber++;
    console.log(`📥 [Saipos] Página ${pageNumber} (offset=${offset}), tempo: ${Math.round(elapsed / 1000)}s`);

    let res: Response | null = null;

    try {
      // AbortController com timeout para não ficar travado numa requisição lenta
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT_MS);

      res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Se é erro de servidor temporário, espera um pouco e tenta a próxima página
      if (res.status >= 500) {
        console.warn(`⚠️ Erro ${res.status} do Saipos. Aguardando 3s e retentando...`);
        await sleep(3000);
        
        // Uma retry com timeout
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), PER_REQUEST_TIMEOUT_MS);
        
        res = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          cache: "no-store",
          signal: controller2.signal,
        });
        
        clearTimeout(timeoutId2);
      }
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`⏰ Timeout de ${PER_REQUEST_TIMEOUT_MS / 1000}s na requisição para Saipos`);
      } else {
        console.error("❌ Erro de rede ao acessar API Saipos:", fetchError);
      }
      // Retorna o que já tem em vez de travar
      break;
    }

    if (!res || !res.ok) {
      const errText = res ? await res.text().catch(() => "") : "Sem resposta";
      console.error("❌ Erro na API Saipos:", res?.status, errText);
      break;
    }

    let pageData: unknown;
    try {
      const text = await res.text();
      pageData = text ? JSON.parse(text) : null;
    } catch (err) {
      console.error("❌ Erro ao parsear JSON:", err);
      break;
    }

    const pageArray = Array.isArray(pageData)
      ? pageData
      : (pageData && typeof pageData === 'object' && 'data' in (pageData as Record<string, unknown>) && Array.isArray((pageData as Record<string, unknown>).data))
        ? (pageData as Record<string, unknown>).data as unknown[]
        : (pageData && typeof pageData === 'object' && 'items' in (pageData as Record<string, unknown>) && Array.isArray((pageData as Record<string, unknown>).items))
          ? (pageData as Record<string, unknown>).items as unknown[]
          : [];

    if (pageArray.length === 0) break;

    // Log completo da primeira venda para debug
    if (allSales.length === 0 && pageArray.length > 0) {
      const sample = pageArray[0] as Record<string, unknown>;
      console.log(`📋 CAMPOS DISPONÍVEIS:`, Object.keys(sample));
      console.log(`📋 AMOSTRA COMPLETA (1ª venda):`, JSON.stringify(sample).substring(0, 1000));
    }

    allSales.push(...pageArray);
    offset += limit;

    // Se retornou menos que o limite, não há mais páginas
    if (pageArray.length < limit) break;

    await sleep(200); // Delay mínimo entre páginas
  }

  const totalTime = Math.round((Date.now() - globalStart) / 1000);
  console.log(`📊 Total de vendas carregadas: ${allSales.length} em ${pageNumber} páginas (${totalTime}s)`);
  return allSales;
}

/**
 * Agrega vendas por dia
 */
function aggregateSalesByDay(sales: unknown[]): Map<string, {
  totalOrders: number;
  totalSales: number;
  channels: Record<string, number>;
}> {
  const dailyData = new Map();
  let sampleLogged = 0;

  for (const sale of sales) {
    const saleObj = sale as Record<string, unknown>;
    const saleDate = saleObj.shift_date ?? saleObj.sale_date ?? saleObj.created_at;
    if (!saleDate) continue;
    
    const dateKey = new Date(saleDate as string).toISOString().split("T")[0];
    
    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, {
        totalOrders: 0,
        totalSales: 0,
        channels: {},
      });
    }

    const dayData = dailyData.get(dateKey)!;
    dayData.totalOrders++;
    
    // Buscar valor da venda - total_amount é o campo principal da documentação oficial Saipos
    const value = Number(
      saleObj.total_amount ??   // Campo principal da documentação oficial
      saleObj.total_sale_value ?? // Campo alternativo documentado
      saleObj.total_value ?? 
      saleObj.amount_total ?? 
      saleObj.total ?? 
      saleObj.valor_total ?? 
      saleObj.amount ?? 
      saleObj.value ?? 
      saleObj.gross_value ?? 
      saleObj.net_value ?? 
      0
    );

    dayData.totalSales += value;

    // Log de amostra para debug (primeiras 5 vendas)
    if (sampleLogged < 5) {
      console.log(`📊 Amostra venda ${sampleLogged + 1}:`, {
        date: dateKey,
        total_amount: saleObj.total_amount,
        total_sale_value: saleObj.total_sale_value,
        total_value: saleObj.total_value,
        total: saleObj.total,
        valorExtraido: value,
      });
      sampleLogged++;
    }

    const channel = String(saleObj.origin_name ?? saleObj.channel ?? "outros").toLowerCase();
    dayData.channels[channel] = (dayData.channels[channel] || 0) + 1;
  }

  return dailyData;
}

export async function POST(request: Request) {
  try {
    // 1) Autenticação
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

    if (!saiposAPI) {
      return NextResponse.json(
        { success: false, error: "API não encontrada" },
        { status: 404 }
      );
    }

    if (saiposAPI.type !== "saipos") {
      return NextResponse.json(
        { success: false, error: "API não é do tipo Saipos" },
        { status: 400 }
      );
    }

    if (saiposAPI.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "API não pertence ao usuário atual" },
        { status: 403 }
      );
    }

    const apiKey = saiposAPI.apiKey.trim().replace(/^Bearer\s+/i, "");
    const resolvedStoreId = body.storeId || saiposAPI.storeId || saiposAPI.name;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API key não encontrada" },
        { status: 401 }
      );
    }

    // 3) Calcular intervalo dos últimos N dias
    const now = new Date();
    const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
    startDate.setUTCHours(0, 0, 0, 0);
    
    // Validar que o período não excede 15 dias
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays > 15) {
      const adjustedStartDate = new Date(endDate);
      adjustedStartDate.setUTCDate(adjustedStartDate.getUTCDate() - 14);
      adjustedStartDate.setUTCHours(0, 0, 0, 0);
      startDate.setTime(adjustedStartDate.getTime());
    }

    console.log(
      `🔄 Sincronizando ${days} dias para apiId=${apiId}, storeId=${resolvedStoreId}`
    );
    console.log(`📅 Período: ${startDate.toISOString()} -> ${endDate.toISOString()}`);

    // 4) APAGAR registros antigos desta API (antes do startDate)
    const deletedOld = await db.salesDaily.deleteMany({
      where: {
        apiId,
        date: { lt: startDate },
      },
    });
    console.log(`🧹 Removidos ${deletedOld.count} registros antigos`);

    // 5) Buscar vendas da Saipos DIRETAMENTE (rápido, sem overhead do client)
    console.log(`🔄 Buscando vendas da Saipos...`);
    
    const rawSales = await fetchSalesFromSaipos(apiKey, startDate, endDate);
    console.log(`📊 Total de vendas brutas carregadas: ${rawSales.length}`);

    if (rawSales.length === 0) {
      return NextResponse.json({
        success: true,
        apiId,
        storeId: resolvedStoreId,
        startDate,
        endDate,
        daysSynced: 0,
        message: "Nenhuma venda encontrada no período para esta API.",
      });
    }

    // 6) Calcular clientes únicos por dia
    const uniqueCustomersByDate = new Map<string, Set<string>>();
    for (const sale of rawSales) {
      const saleObj = sale as Record<string, unknown>;
      const saleDate = saleObj.shift_date ?? saleObj.sale_date ?? saleObj.created_at;
      if (!saleDate) continue;
      
      const dateKey = new Date(saleDate as string).toISOString().split("T")[0];
      
      if (!uniqueCustomersByDate.has(dateKey)) {
        uniqueCustomersByDate.set(dateKey, new Set());
      }
      
      // Extrair customer.id_customer conforme documentação
      const customer = saleObj.customer as Record<string, unknown> | undefined;
      if (customer?.id_customer) {
        const customerId = String(customer.id_customer);
        uniqueCustomersByDate.get(dateKey)!.add(customerId);
      }
    }

    // 7) Agregar por dia
    const dailyAggregated = aggregateSalesByDay(rawSales);
    console.log(`📊 ${dailyAggregated.size} dias únicos para sincronizar`);

    // 8) Loop de datas e UPSERT
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const upserts = [];
    let totalSalesSum = 0;
    let totalOrdersSum = 0;

    for (const date of dates) {
      const dateKey = date.toISOString().split("T")[0];
      const dayData = dailyAggregated.get(dateKey) || {
        totalOrders: 0,
        totalSales: 0,
        channels: {},
      };
      
      const uniqueCustomers = uniqueCustomersByDate.get(dateKey)?.size || 0;

      totalSalesSum += dayData.totalSales;
      totalOrdersSum += dayData.totalOrders;

      // Log dos primeiros 3 dias para debug
      if (upserts.length < 3) {
        console.log(`📊 Dia ${dateKey}:`, {
          totalOrders: dayData.totalOrders,
          totalSales: dayData.totalSales,
          uniqueCustomers,
          channels: dayData.channels,
        });
      }

      upserts.push(
        db.salesDaily.upsert({
          where: {
            sales_daily_api_date_unique: {
              apiId,
              date,
            },
          },
          create: {
            apiId,
            storeId: resolvedStoreId,
            date,
            totalOrders: dayData.totalOrders,
            totalSales: dayData.totalSales,
            uniqueCustomers,
            channels: dayData.channels,
          },
          update: {
            totalOrders: dayData.totalOrders,
            totalSales: dayData.totalSales,
            uniqueCustomers,
            channels: dayData.channels,
          },
        })
      );
    }

    await db.$transaction(upserts);
    console.log(`✅ ${upserts.length} dias sincronizados em sales_daily`);
    console.log(`📊 Totais agregados: ${totalOrdersSum} pedidos, R$ ${totalSalesSum.toFixed(2)}`);

    return NextResponse.json({
      success: true,
      apiId,
      storeId: resolvedStoreId,
      startDate,
      endDate,
      daysSynced: upserts.length,
      totalOrders: totalOrdersSum,
      totalSales: totalSalesSum,
    });
  } catch (error) {
    console.error("❌ Erro na sincronização Saipos:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    const isTimeout = errorMessage.includes('abort') || errorMessage.includes('timeout') || errorMessage.includes('Timed out');
    
    return NextResponse.json(
      {
        success: false,
        error: isTimeout 
          ? "Sincronização demorou demais. Tente novamente em alguns minutos."
          : `Erro ao sincronizar dados: ${errorMessage}`,
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
