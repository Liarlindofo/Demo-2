export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { getReportsTenantUserIds } from '@/lib/reports-tenant-auth';
import {
  normalizeSupabaseUrl,
  whatsappEvidenceStoragePath,
  WHATSAPP_EVIDENCIAS_BUCKET,
  createWhatsAppEvidenceSignedUrl,
} from '@/lib/whatsapp-evidence-storage';

const SIGNED_TTL_SECONDS = 3600;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dataUrlFromText(text: string | null, messageType: string): string | null {
  const raw = text?.trim() || '';
  if (!raw) return null;
  if (raw.startsWith('data:image/')) return raw;
  if (/^\/9j\//.test(raw)) return `data:image/jpeg;base64,${raw}`;
  if (raw.startsWith('iVBOR')) return `data:image/png;base64,${raw}`;
  if (
    (messageType === 'image' || messageType === 'sticker') &&
    raw.length > 200 &&
    /^[A-Za-z0-9+/=\s]+$/.test(raw.slice(0, 80))
  ) {
    return `data:image/jpeg;base64,${raw.replace(/\s/g, '')}`;
  }
  return null;
}

/**
 * Tenta baixar o arquivo do Supabase Storage usando qualquer chave disponível.
 * Retorna o Buffer + mime se conseguir, ou null.
 */
async function downloadFromSupabase(
  storedPath: string,
): Promise<{ buffer: ArrayBuffer; mime: string } | null> {
  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!supabaseUrl) return null;

  const path = whatsappEvidenceStoragePath(storedPath);
  if (!path) return null;

  // Tenta com service role key primeiro (mais permissivo), depois anon key
  const keys = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ].filter(Boolean) as string[];

  for (const key of keys) {
    try {
      const client = createClient(supabaseUrl, key);
      const { data, error } = await client.storage
        .from(WHATSAPP_EVIDENCIAS_BUCKET)
        .download(path);

      if (error || !data) continue;

      const buffer = await data.arrayBuffer();
      const mime = data.type || 'image/jpeg';
      return { buffer, mime };
    } catch {
      continue;
    }
  }

  return null;
}

// ─── Route handler ────────────────────────────────────────────────────────────

/**
 * GET /api/whatsapp-messages/:id/media
 *
 * Estratégia em cascata:
 * 1. URL assinada do Supabase → retorna { url } para o cliente buscar diretamente (sem banda do servidor)
 * 2. Proxy direto → baixa o arquivo no servidor e entrega o binário ao browser (imagem original, full-res)
 * 3. Base64 embarcada em textContent → miniatura/thumbnail (último recurso)
 */
export async function GET(
  req: Request,
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

  // ── 1. URL assinada (rápida, sem banda no servidor) ──────────────────────
  if (row.mediaUrl) {
    const signedUrl = await createWhatsAppEvidenceSignedUrl(row.mediaUrl, SIGNED_TTL_SECONDS);
    if (signedUrl) {
      return NextResponse.json({ url: signedUrl, expiresIn: SIGNED_TTL_SECONDS });
    }
  }

  // ── 2. Proxy direto (baixa servidor-side e entrega o binário original) ───
  if (row.mediaUrl) {
    const downloaded = await downloadFromSupabase(row.mediaUrl);
    if (downloaded) {
      const { buffer, mime } = downloaded;
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': mime,
          'Content-Length': String(buffer.byteLength),
          'Cache-Control': 'private, max-age=3600',
        },
      });
    }
  }

  // ── 3. Fallback: base64 embutida em textContent (thumbnail do WhatsApp) ──
  const embedded = dataUrlFromText(row.textContent, row.messageType);
  if (embedded) {
    return NextResponse.json({ url: embedded, expiresIn: SIGNED_TTL_SECONDS });
  }

  if (row.mediaUrl) {
    return NextResponse.json(
      {
        error:
          'Não foi possível acessar a mídia. Confira SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente.',
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ error: 'Esta mensagem não tem mídia' }, { status: 404 });
}
