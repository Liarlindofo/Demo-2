export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReportsTenantUserId } from '@/lib/reports-tenant-auth';
import { createAtaSignedUrl } from '@/lib/complaints/ata-storage';
import { buildAndSaveAta } from '@/lib/complaints/build-ata';

const SIGNED_TTL_SECONDS = 3600;

/**
 * GET /api/reports/complaints/:runId/document
 *
 * Signed URL temporária da ata (.docx). Tenant da empresa.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const tenantUserId = await getReportsTenantUserId();
  if (!tenantUserId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { runId } = await params;

  const run = await prisma.complaintReviewRun.findFirst({
    where: { id: runId, userId: tenantUserId },
    select: {
      id: true,
      ataStoragePath: true,
    },
  });

  if (!run) {
    return NextResponse.json({ error: 'Review run não encontrado.' }, { status: 404 });
  }

  if (!run.ataStoragePath) {
    return NextResponse.json(
      {
        error:
          'Ata ainda não gerada. Revise as reclamações, marque as que entram na ata e clique em "Gerar ata".',
      },
      { status: 404 },
    );
  }

  const url = await createAtaSignedUrl(run.ataStoragePath, SIGNED_TTL_SECONDS);
  if (!url) {
    return NextResponse.json(
      {
        error:
          'Não foi possível assinar a ata. Confira o bucket privado atas-reclamacoes e as variáveis do Supabase.',
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ url, expiresIn: SIGNED_TTL_SECONDS });
}

/**
 * POST /api/reports/complaints/:runId/document
 *
 * Gera (ou regenera) a ata .docx com reclamações confirmadoPorHumano=true.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const tenantUserId = await getReportsTenantUserId();
  if (!tenantUserId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { runId } = await params;

  const run = await prisma.complaintReviewRun.findFirst({
    where: { id: runId, userId: tenantUserId },
    select: { id: true, status: true },
  });

  if (!run) {
    return NextResponse.json({ error: 'Review run não encontrado.' }, { status: 404 });
  }

  if (run.status !== 'CONCLUIDO') {
    return NextResponse.json(
      { error: 'Só é possível gerar ata de runs concluídos.' },
      { status: 400 },
    );
  }

  const confirmadas = await prisma.complaint.count({
    where: { reviewRunId: runId, userId: tenantUserId, confirmadoPorHumano: true },
  });

  if (confirmadas === 0) {
    return NextResponse.json(
      {
        error:
          'Marque ao menos uma reclamação como "Incluir na ata" antes de gerar o documento.',
      },
      { status: 400 },
    );
  }

  const generated = await buildAndSaveAta({
    userId: tenantUserId,
    reviewRunId: runId,
  });

  if ('error' in generated) {
    return NextResponse.json(
      { error: `Não foi possível gerar a ata: ${generated.error}` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    ataStoragePath: generated.ataStoragePath,
    confirmadas,
  });
}
