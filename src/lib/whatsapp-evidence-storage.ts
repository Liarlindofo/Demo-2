import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Nome fixo do bucket privado — criar no painel do Supabase com este nome. */
export const WHATSAPP_EVIDENCIAS_BUCKET = 'whatsapp-evidencias';

const DEFAULT_SIGNED_TTL_SECONDS = 3600;

let supabaseAdmin: SupabaseClient | null = null;

/** Aceita URL completa ou só o project ref (ex.: uluydllxvrteawtltceu). */
export function normalizeSupabaseUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const v = raw.trim().replace(/^["']|["']$/g, '');
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  if (/^[a-z0-9-]+$/i.test(v)) return `https://${v}.supabase.co`;
  return null;
}

export function getWhatsAppEvidenceSupabase(): SupabaseClient | null {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!supabaseAdmin) supabaseAdmin = createClient(url, key);
  return supabaseAdmin;
}

/**
 * Aceita path interno (`tenant/slot/contato/arquivo.jpg`) ou URL antiga
 * (`.../object/public/whatsapp-evidencias/...` / `.../object/sign/...`).
 */
export function whatsappEvidenceStoragePath(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const raw = stored.trim();
  if (!raw) return null;
  if (!raw.startsWith('http')) return raw.replace(/^\//, '');

  const marker = `/${WHATSAPP_EVIDENCIAS_BUCKET}/`;
  const idx = raw.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(raw.slice(idx + marker.length).split('?')[0]);
}

export async function createWhatsAppEvidenceSignedUrl(
  stored: string | null | undefined,
  expiresInSeconds = DEFAULT_SIGNED_TTL_SECONDS,
): Promise<string | null> {
  const path = whatsappEvidenceStoragePath(stored);
  if (!path) return null;
  const supabase = getWhatsAppEvidenceSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(WHATSAPP_EVIDENCIAS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
