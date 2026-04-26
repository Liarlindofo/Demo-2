export const dynamic = 'force-dynamic';

export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stackServerApp } from "@/stack";
import { syncStackAuthUser } from "@/lib/stack-auth-sync";

/**
 * Rota TEMPORÁRIA de manutenção para corrigir userId em sales_daily
 * 
 * Backfill: atualiza registros em sales_daily que têm storeId mas userId está null ou incorreto
 * usando a tabela user_apis como fonte da verdade.
 * 
 * IMPORTANTE: Esta rota é apenas para uso interno. Após rodar uma vez em produção e verificar,
 * pode ser apagada ou deixar protegida por algum segredo.
 */
export async function POST() {
  try {
    // Autenticação básica (pode adicionar proteção adicional se necessário)
    const stackUser = await stackServerApp.getUser({ or: "return-null" });
    if (!stackUser) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Garantir usuário no banco
    await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail || undefined,
      displayName: stackUser.displayName || undefined,
      profileImageUrl: stackUser.profileImageUrl || undefined,
      primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
    });

    console.log("🔄 Iniciando backfill de userId em sales_daily...");

    // Ler todas as APIs Saipos na user_apis
    const apis = await db.userAPI.findMany({
      where: { type: "saipos" },
      select: { id: true, userId: true, storeId: true, name: true },
    });

    console.log(`📊 Encontradas ${apis.length} APIs Saipos`);

    let totalFixed = 0;
    const results = [];

    // Para cada API, fazer updateMany em salesDaily
    for (const api of apis) {
      if (!api.storeId) {
        console.warn(`⚠️ API ${api.name} (${api.id}) não tem storeId, pulando...`);
        continue;
      }

      // Primeiro, contar quantos registros precisam ser corrigidos
      const countResult = await db.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM sales_daily
        WHERE "storeId" = ${api.storeId}
          AND ("userId" IS NULL OR "userId" = '' OR "userId" != ${api.userId})
      `;
      
      const count = Number(countResult[0]?.count || 0);
      
      if (count > 0) {
        // Usar SQL raw para atualizar registros com userId null ou incorreto
        // Como userId agora é obrigatório no schema, não podemos usar { userId: null } diretamente
        await db.$executeRaw`
          UPDATE sales_daily
          SET "userId" = ${api.userId}
          WHERE "storeId" = ${api.storeId}
            AND ("userId" IS NULL OR "userId" = '' OR "userId" != ${api.userId})
        `;
      }

      if (count > 0) {
        totalFixed += count;
        results.push({
          apiId: api.id,
          apiName: api.name,
          storeId: api.storeId,
          fixed: count,
        });
        console.log(
          `✅ API "${api.name}" (${api.storeId}): ${count} registros corrigidos`
        );
      }
    }

    console.log(`✅ Backfill concluído! Total de registros corrigidos: ${totalFixed}`);

    return NextResponse.json({
      success: true,
      fixed: totalFixed,
      apisProcessed: apis.length,
      results,
      message: "Backfill de userId em sales_daily concluído",
    });
  } catch (e) {
    console.error("❌ Erro no backfill:", e);
    return NextResponse.json(
      { success: false, error: String(e) },
      { status: 500 }
    );
  }
}

