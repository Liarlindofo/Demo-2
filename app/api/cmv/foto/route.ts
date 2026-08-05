import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stackServerApp } from '@/stack';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BUCKET = 'cmv-produtos';

/** Segmento de path seguro para Supabase Storage (sem %, acentos ou chars inválidos). */
function sanitizeStorageSegment(raw: string): string {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // mantém raw se não for URI-encoded válido
  }
  return decoded
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'item';
}

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return { supabaseUrl, client: createClient(supabaseUrl, supabaseKey) };
}

/**
 * POST /api/cmv/foto
 *
 * Gera URL assinada para upload direto ao Supabase (evita limite 413 do Vercel).
 * Body JSON: { saborId, storeSlug, contentType, fileName? }
 * Retorna: { signedUrl, path, token, publicUrl }
 */
export async function POST(req: NextRequest) {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json(
      { error: 'Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)' },
      { status: 500 },
    );
  }

  let body: {
    saborId?: string;
    storeSlug?: string;
    contentType?: string;
    fileName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido — envie JSON' }, { status: 400 });
  }

  const { saborId, storeSlug, contentType, fileName } = body;
  if (!saborId || !storeSlug) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: saborId, storeSlug' },
      { status: 400 },
    );
  }

  const rawExt = contentType?.split('/')[1]?.replace('jpeg', 'jpg')
    ?.replace('quicktime', 'mov')
    || fileName?.split('.').pop()?.toLowerCase()
    || 'jpg';
  const ext = rawExt.replace(/[^a-z0-9]/g, '') || 'jpg';

  const userId = sanitizeStorageSegment(stackUser.id);
  const store  = sanitizeStorageSegment(storeSlug);
  const sabor  = sanitizeStorageSegment(saborId);
  const path   = `${userId}/${store}/${sabor}/${Date.now()}.${ext}`;

  const { data, error } = await sb.client.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error('[cmv/foto] Erro ao criar signed URL:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Falha ao gerar URL de upload' },
      { status: 500 },
    );
  }

  const { data: urlData } = sb.client.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
    publicUrl,
    contentType: contentType || 'application/octet-stream',
  });
}

/**
 * DELETE /api/cmv/foto?saborId=&storeSlug=
 * Remove a foto de um produto do Storage.
 */
export async function DELETE(req: NextRequest) {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  const { searchParams } = req.nextUrl;
  const saborId   = searchParams.get('saborId');
  const storeSlug = searchParams.get('storeSlug');

  if (!saborId || !storeSlug) {
    return NextResponse.json({ error: 'saborId e storeSlug são obrigatórios' }, { status: 400 });
  }

  const userId = sanitizeStorageSegment(stackUser.id);
  const store  = sanitizeStorageSegment(storeSlug);
  const sabor  = sanitizeStorageSegment(saborId);

  const { data: files } = await sb.client.storage
    .from(BUCKET)
    .list(`${userId}/${store}/${sabor}`);

  const paths = (files ?? [])
    .filter(f => f.name && !f.name.endsWith('/'))
    .map(f => `${userId}/${store}/${sabor}/${f.name}`);

  if (paths.length > 0) {
    await sb.client.storage.from(BUCKET).remove(paths);
  }

  return NextResponse.json({ ok: true });
}
