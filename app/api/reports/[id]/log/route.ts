export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServiceApiKey } from '@/lib/auth/service-api-key';

/**
 * POST /api/reports/:id/log
 *
 * Registra a execução de um relatório. Verifica que o ReportDefinition
 * pertence ao userId resolvido pela API key — impede log em relatório alheio.
 *
 * Body: { status: "SUCESSO" | "FALHA", payload?: object, erro?: string }
 *
 * Autenticação: header x-api-key (ServiceApiKey)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireServiceApiKey(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const { id: reportDefinitionId } = await params;

  // Verificar que o relatório existe e pertence ao userId da key
  const definition = await prisma.reportDefinition.findFirst({
    where: { id: reportDefinitionId, userId },
    select: { id: true },
  });

  if (!definition) {
    return NextResponse.json(
      { error: 'Relatório não encontrado.' },
      { status: 404 },
    );
  }

  let body: { status?: string; payload?: unknown; erro?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 });
  }

  const { status, payload, erro } = body;

  if (status !== 'SUCESSO' && status !== 'FALHA') {
    return NextResponse.json(
      { error: 'status deve ser "SUCESSO" ou "FALHA".' },
      { status: 400 },
    );
  }

  const execution = await prisma.reportExecution.create({
    data: {
      reportDefinitionId,
      status,
      payload: payload !== undefined ? (payload as object) : undefined,
      erro: erro ?? null,
    },
  });

  return NextResponse.json(execution, { status: 201 });
}
