export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireServiceApiKey } from '@/lib/auth/service-api-key';

/**
 * GET /api/reports/due?horario=HH:mm
 *
 * Retorna todos os ReportDefinition ativos do userId resolvido pela API key
 * cujo horario de disparo coincide com o parâmetro recebido.
 * Para cada relatório, expande os campos com key + label do SaiposFieldCatalog,
 * na ordem configurada.
 *
 * Autenticação: header x-api-key (ServiceApiKey)
 */
export async function GET(req: NextRequest) {
  const auth = await requireServiceApiKey(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const horario = req.nextUrl.searchParams.get('horario');

  if (!horario || !/^\d{2}:\d{2}$/.test(horario)) {
    return NextResponse.json(
      { error: 'Parâmetro horario é obrigatório no formato HH:mm (ex: "23:30").' },
      { status: 400 },
    );
  }

  const definitions = await prisma.reportDefinition.findMany({
    where: { userId, ativo: true, horario },
    include: {
      campos: {
        orderBy: { ordem: 'asc' },
        select: { campoKey: true, ordem: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (definitions.length === 0) {
    return NextResponse.json([]);
  }

  // Resolver labels do catálogo em batch
  const allKeys = [...new Set(definitions.flatMap((d) => d.campos.map((c) => c.campoKey)))];
  const catalogEntries = await prisma.saiposFieldCatalog.findMany({
    where: { key: { in: allKeys } },
    select: { key: true, label: true },
  });
  const labelMap = new Map(catalogEntries.map((e) => [e.key, e.label]));

  const result = definitions.map((def) => ({
    id: def.id,
    nome: def.nome,
    fonte: def.fonte,
    escopoLoja: def.escopoLoja,
    destinoWhatsapp: def.destinoWhatsapp,
    sessionSlot: def.sessionSlot ?? 2,
    campos: def.campos.map((c) => ({
      key: c.campoKey,
      label: labelMap.get(c.campoKey) ?? c.campoKey,
    })),
  }));

  return NextResponse.json(result);
}
