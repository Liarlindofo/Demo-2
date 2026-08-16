import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { normalizeSupabaseUrl } from '@/lib/whatsapp-evidence-storage';

/** Bucket privado das atas Word de reclamações. */
export const ATAS_RECLAMACOES_BUCKET = 'atas-reclamacoes';

const DEFAULT_SIGNED_TTL_SECONDS = 3600;

let supabaseAdmin: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!supabaseAdmin) supabaseAdmin = createClient(url, key);
  return supabaseAdmin;
}

export function ataStoragePath(tenantId: string, reviewRunId: string): string {
  return `${tenantId}/${reviewRunId}/ata.docx`;
}

export async function uploadAtaDocx(
  path: string,
  bytes: Buffer | Uint8Array,
): Promise<{ path: string } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: 'Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' };
  }

  const { error } = await supabase.storage.from(ATAS_RECLAMACOES_BUCKET).upload(path, bytes, {
    contentType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    upsert: true,
  });

  if (error) return { error: error.message };
  return { path };
}

export async function createAtaSignedUrl(
  path: string | null | undefined,
  expiresInSeconds = DEFAULT_SIGNED_TTL_SECONDS,
): Promise<string | null> {
  if (!path?.trim()) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(ATAS_RECLAMACOES_BUCKET)
    .createSignedUrl(path.trim(), expiresInSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Garante que o bucket exista (idempotente). Falha silenciosa se sem permissão. */
export async function ensureAtasBucket(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === ATAS_RECLAMACOES_BUCKET)) return;
  await supabase.storage.createBucket(ATAS_RECLAMACOES_BUCKET, {
    public: false,
    fileSizeLimit: 50 * 1024 * 1024,
  });
}
