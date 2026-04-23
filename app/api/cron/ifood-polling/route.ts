import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  pollIfoodEvents,
  acknowledgeIfoodEvents,
  getOrderDetails,
  IfoodOrderPayload,
} from '@/lib/ifood-api';

// ---------------------------------------------------------------------------
// GET /api/cron/ifood-polling
// Executa a cada minuto via Vercel Cron.
// 1. Busca todas as lojas iFood ativas
// 2. Faz polling de eventos
// 3. Para eventos PLACED: busca detalhes e salva/atualiza no banco
// 4. Envia acknowledgment para todos os eventos recebidos
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  // Proteger com CRON_SECRET se disponível
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  let processed = 0;
  let errors = 0;

  try {
    // Buscar todas as conexões ativas
    const connections = await db.ifoodConnection.findMany({
      where: { status: 'active' },
      select: { merchantId: true, userId: true },
    });

    if (connections.length === 0) {
      return NextResponse.json({ message: 'Nenhuma loja ativa', processed: 0 });
    }

    // Indexar userId por merchantId
    const merchantUserMap = new Map<string, string>();
    for (const c of connections) {
      merchantUserMap.set(c.merchantId, c.userId);
    }

    const merchantIds = connections.map((c) => c.merchantId);
    const events = await pollIfoodEvents(merchantIds);

    if (events.length === 0) {
      return NextResponse.json({ message: 'Sem novos eventos', processed: 0, elapsed: Date.now() - startedAt });
    }

    // Processar cada evento
    for (const event of events) {
      try {
        const userId = merchantUserMap.get(event.merchantId);
        if (!userId) continue;

        if (event.fullCode === 'PLACED' || event.code === 'PLC') {
          // Buscar detalhes do pedido na API iFood
          let payload: IfoodOrderPayload;
          try {
            const { data } = await getOrderDetails(event.orderId);
            payload = data;
          } catch {
            errors++;
            continue;
          }

          const phone =
            payload.customer?.phone?.number ?? payload.customer?.phone?.localizer ?? null;

          // Upsert no banco
          await db.ifoodOrder.upsert({
            where: { orderId: event.orderId },
            create: {
              orderId: event.orderId,
              displayId: payload.displayId,
              merchantId: event.merchantId,
              userId,
              status: 'PLACED',
              orderType: payload.orderType,
              orderTiming: payload.orderTiming,
              customerName: payload.customer?.name ?? null,
              customerPhone: phone,
              deliveryAddress: (payload.delivery?.deliveryAddress as object) ?? null,
              items: payload.items as object[],
              payments: payload.payments as object,
              totalAmount: payload.total.orderAmount,
              deliveryFee: payload.total.deliveryFee ?? null,
              isTest: payload.isTest ?? false,
              rawPayload: payload as object,
            },
            update: {
              // Não sobrescreve se já foi confirmado/processado
            },
          });

          processed++;
        } else {
          // Sincronizar mudanças de status para outros eventos
          const statusMap: Record<string, string> = {
            CONFIRMED: 'CONFIRMED',
            CFM: 'CONFIRMED',
            PREPARATION_STARTED: 'PREPARING',
            PRS: 'PREPARING',
            DISPATCHED: 'DISPATCHED',
            DSP: 'DISPATCHED',
            CONCLUDED: 'CONCLUDED',
            CON: 'CONCLUDED',
            CANCELLED: 'CANCELLED',
            CAN: 'CANCELLED',
            READY_TO_PICKUP: 'READY_TO_PICKUP',
            RTP: 'READY_TO_PICKUP',
          };

          const newStatus = statusMap[event.fullCode] ?? statusMap[event.code];
          if (newStatus) {
            await db.ifoodOrder.updateMany({
              where: { orderId: event.orderId },
              data: { status: newStatus },
            });
          }
        }
      } catch {
        errors++;
      }
    }

    // Enviar acknowledgment para todos os eventos
    await acknowledgeIfoodEvents(
      events.map((e) => ({ id: e.id, code: e.code, fullCode: e.fullCode })),
    );

    const elapsed = Date.now() - startedAt;
    console.log(`[ifood-polling] ${processed} pedidos processados, ${errors} erros, ${elapsed}ms`);

    return NextResponse.json({ processed, errors, elapsed, total: events.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[ifood-polling] Fatal:', message);
    return NextResponse.json({ error: message, processed, errors }, { status: 500 });
  }
}
