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

/**
 * POST /api/cmv/foto
 *
 * Recebe multipart/form-data com:
 *   file      — arquivo de imagem
 *   saborId   — ID do sabor/produto no CMV
 *   storeSlug — slug da loja (ahu, pilarzinho, portao, uberaba)
 *
 * Faz upload para o bucket "cmv-produtos" do Supabase Storage
 * com upsert (sobrescreve versão anterior do mesmo produto).
 * Retorna { url } com a URL pública permanente.
 */
export async function POST(req: NextRequest) {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)' },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Payload inválido — envie multipart/form-data' }, { status: 400 });
  }

  const file      = formData.get('file')      as File   | null;
  const saborId   = formData.get('saborId')   as string | null;
  const storeSlug = formData.get('storeSlug') as string | null;

  if (!file || !saborId || !storeSlug) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: file, saborId, storeSlug' },
      { status: 400 },
    );
  }

  // Extensão baseada no MIME type ou nome do arquivo (somente alfanumérico)
  const rawExt = file.type.split('/')[1]?.replace('jpeg', 'jpg')
              ?.replace('quicktime', 'mov')
              || file.name.split('.').pop()?.toLowerCase()
              || 'jpg';
  const ext = rawExt.replace(/[^a-z0-9]/g, '') || 'jpg';

  const userId = sanitizeStorageSegment(stackUser.id);
  const store  = sanitizeStorageSegment(storeSlug);
  const sabor  = sanitizeStorageSegment(saborId);

  // Path com timestamp: suporta múltiplos arquivos por produto
  const path = `${userId}/${store}/${sabor}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: false, // path tem timestamp → arquivos distintos
    });

  if (uploadError) {
    console.error('[cmv/foto] Erro no upload Supabase:', uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Adiciona timestamp para invalidar cache do browser após atualização
  const url = `${urlData.publicUrl}?v=${Date.now()}`;

  return NextResponse.json({ url }, { status: 201 });
}

/**
 * DELETE /api/cmv/foto?saborId=&storeSlug=&ext=
 * Remove a foto de um produto do Storage.
 */
export async function DELETE(req: NextRequest) {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 });
  }

  const { searchParams } = req.nextUrl;
  const saborId   = searchParams.get('saborId');
  const storeSlug = searchParams.get('storeSlug');

  if (!saborId || !storeSlug) {
    return NextResponse.json({ error: 'saborId e storeSlug são obrigatórios' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const userId = sanitizeStorageSegment(stackUser.id);
  const store  = sanitizeStorageSegment(storeSlug);
  const sabor  = sanitizeStorageSegment(saborId);

  // Lista arquivos na pasta do produto (path: user/store/sabor/arquivo)
  const { data: files } = await supabase.storage
    .from(BUCKET)
    .list(`${userId}/${store}/${sabor}`);

  const paths = (files ?? [])
    .filter(f => f.name && !f.name.endsWith('/'))
    .map(f => `${userId}/${store}/${sabor}/${f.name}`);

  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  return NextResponse.json({ ok: true });
}
