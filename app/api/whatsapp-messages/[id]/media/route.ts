export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getReportsTenantUserIds } from '@/lib/reports-tenant-auth';
import { createWhatsAppEvidenceSignedUrl } from '@/lib/whatsapp-evidence-storage';

const SIGNED_TTL_SECONDS = 3600;

function dataUrlFromText(text: string | null, messageType: string): string | null {
  const raw = text?.trim() || '';
  if (!raw) return null;
  if (raw.startsWith('data:image/')) return raw;
  if (/^\/9j\//.test(raw)) return `data:image/jpeg;base64,${raw}`;
  if (raw.startsWith('iVBOR')) return `data:image/png;base64,${raw}`;
  if ((messageType === 'image' || messageType === 'sticker') && raw.length > 200 && /^[A-Za-z0-9+/=\s]+$/.test(raw.slice(0, 80))) {
    return `data:image/jpeg;base64,${raw.replace(/\s/g, '')}`;
  }
  return null;
}

/**
 * GET /api/whatsapp-messages/:id/media
 * URL assinada temporária da mídia (bucket privado). Tenant da empresa.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userIds = await getReportsTenantUserIds();
  if (!userIds) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'id inválido' }, { status: 400 });

  const row = await prisma.whatsAppMessage.findFirst({
    where: { id, userId: { in: userIds } },
    select: { mediaUrl: true, textContent: true, messageType: true },
  });
  if (!row) return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 });

  if (row.mediaUrl) {
    const url = await createWhatsAppEvidenceSignedUrl(row.mediaUrl, SIGNED_TTL_SECONDS);
    if (url) {
      return NextResponse.json({ url, expiresIn: SIGNED_TTL_SECONDS });
    }
  }

  const embedded = dataUrlFromText(row.textContent, row.messageType);
  if (embedded) {
    return NextResponse.json({ url: embedded, expiresIn: SIGNED_TTL_SECONDS });
  }

  if (row.mediaUrl) {
    return NextResponse.json(
      {
        error:
          'Não foi possível assinar a mídia. Confira o bucket privado e as variáveis do Supabase.',
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ error: 'Esta mensagem não tem mídia' }, { status: 404 });
}
