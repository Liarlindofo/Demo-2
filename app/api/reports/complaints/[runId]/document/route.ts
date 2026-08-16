export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionDbUser } from '@/lib/rh-api-auth';
import { createAtaSignedUrl } from '@/lib/complaints/ata-storage';
import { buildAndSaveAta } from '@/lib/complaints/build-ata';

const SIGNED_TTL_SECONDS = 3600;

/**
 * GET /api/reports/complaints/:runId/document
 *
 * Signed URL temporária da ata (.docx). Auth por sessão logada (não ServiceApiKey).
 * Se a ata ainda não existir no storage mas o run está CONCLUIDO, tenta gerar sob demanda.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const dbUser = await getSessionDbUser();
  if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { runId } = await params;

  let run = await prisma.complaintReviewRun.findFirst({
    where: { id: runId, userId: dbUser.id },
    select: {
      id: true,
      userId: true,
      status: true,
      ataStoragePath: true,
    },
  });

  if (!run) {
    return NextResponse.json({ error: 'Review run não encontrado.' }, { status: 404 });
  }

  if (!run.ataStoragePath && run.status === 'CONCLUIDO') {
    const generated = await buildAndSaveAta({
      userId: run.userId,
      reviewRunId: run.id,
    });
    if ('ataStoragePath' in generated) {
      run = { ...run, ataStoragePath: generated.ataStoragePath };
    } else {
      return NextResponse.json(
        { error: `Não foi possível gerar a ata: ${generated.error}` },
        { status: 502 },
      );
    }
  }

  if (!run.ataStoragePath) {
    return NextResponse.json(
      { error: 'Ata ainda não disponível para este run.' },
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
