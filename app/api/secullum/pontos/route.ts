import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface SecullumPontoItem {
  batidaId: number;
  funcionarioId: number;
  nome: string;
  pis: string;
  matricula: string;
  data: string;
  entrada1: string | null;
  saida1: string | null;
  entrada2: string | null;
  saida2: string | null;
  entrada3: string | null;
  saida3: string | null;
  compensado: boolean;
  neutro: boolean;
  folga: boolean;
  observacoes: string | null;
}

function autenticar(req: NextRequest): boolean {
  const key = req.headers.get('x-secullum-webhook-key');
  const expected = process.env.SECULLUM_WEBHOOK_KEY;
  if (!expected) {
    console.warn('[secullum/pontos] SECULLUM_WEBHOOK_KEY não configurada — acesso negado');
    return false;
  }
  return key === expected;
}

export async function POST(req: NextRequest) {
  if (!autenticar(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  let items: SecullumPontoItem[];
  try {
    const body = await req.json();
    items = Array.isArray(body) ? body : [body];
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  if (items.length === 0) {
    return NextResponse.json({ processados: 0, pendentes: 0 });
  }

  let processados = 0;
  let pendentes = 0;

  for (const item of items) {
    const matricula = String(item.matricula ?? '').trim();
    const batidaId = Number(item.batidaId);
    const data = new Date(item.data);

    if (!matricula || isNaN(batidaId) || isNaN(data.getTime())) {
      console.warn('[secullum/pontos] Item inválido ignorado:', item);
      continue;
    }

    // Busca funcionário pelo campo numeroFolha (sem filtro de userId para aceitar qualquer empresa)
    const funcionario = await prisma.rhFuncionario.findFirst({
      where: { numeroFolha: matricula },
      select: { id: true },
    });

    if (funcionario) {
      await prisma.pontoRegistro.upsert({
        where: { batidaIdSecullum: batidaId },
        update: {
          funcionarioId: funcionario.id,
          data,
          entrada1: item.entrada1 ?? null,
          saida1: item.saida1 ?? null,
          entrada2: item.entrada2 ?? null,
          saida2: item.saida2 ?? null,
          entrada3: item.entrada3 ?? null,
          saida3: item.saida3 ?? null,
          compensado: Boolean(item.compensado),
          neutro: Boolean(item.neutro),
          folga: Boolean(item.folga),
          observacoes: item.observacoes ?? null,
        },
        create: {
          funcionarioId: funcionario.id,
          batidaIdSecullum: batidaId,
          data,
          entrada1: item.entrada1 ?? null,
          saida1: item.saida1 ?? null,
          entrada2: item.entrada2 ?? null,
          saida2: item.saida2 ?? null,
          entrada3: item.entrada3 ?? null,
          saida3: item.saida3 ?? null,
          compensado: Boolean(item.compensado),
          neutro: Boolean(item.neutro),
          folga: Boolean(item.folga),
          observacoes: item.observacoes ?? null,
        },
      });
      processados++;
    } else {
      // Funcionário não encontrado — registra pendência (upsert por matrícula+data)
      await prisma.pontoPendencia.upsert({
        where: { numeroFolhaOrigem_data: { numeroFolhaOrigem: matricula, data } },
        update: {
          nomeSugerido: item.nome ?? null,
          payloadBruto: item as unknown as Prisma.InputJsonValue,
          resolvida: false,
        },
        create: {
          numeroFolhaOrigem: matricula,
          nomeSugerido: item.nome ?? null,
          data,
          payloadBruto: item as unknown as Prisma.InputJsonValue,
          resolvida: false,
        },
      });
      pendentes++;
    }
  }

  return NextResponse.json({ processados, pendentes });
}
