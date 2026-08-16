export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { createWhatsAppEvidenceSignedUrl } from '@/lib/whatsapp-evidence-storage';

const SIGNED_TTL_SECONDS = 3600;

/**
 * GET /api/whatsapp-messages/:id/media
 * URL assinada temporária da mídia (bucket privado). Só o tenant dono da linha.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'id inválido' }, { status: 400 });

  const row = await prisma.whatsAppMessage.findFirst({
    where: { id, userId: rh.userId },
    select: { mediaUrl: true },
  });
  if (!row) return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 });
  if (!row.mediaUrl) {
    return NextResponse.json({ error: 'Esta mensagem não tem mídia' }, { status: 404 });
  }

  const url = await createWhatsAppEvidenceSignedUrl(row.mediaUrl, SIGNED_TTL_SECONDS);
  if (!url) {
    return NextResponse.json(
      { error: 'Não foi possível assinar a mídia. Confira o bucket privado e as variáveis do Supabase.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ url, expiresIn: SIGNED_TTL_SECONDS });
}
