import { createClient } from '@supabase/supabase-js';
import { normalizeSupabaseUrl } from '@/lib/whatsapp-evidence-storage';

const BUCKET = 'tarefas-evidencias';
const SIGNED_TTL_SECONDS = 3600;

/**
 * Extrai o path interno do bucket a partir da URL pública (ou path cru) salva em urlArquivo.
 */
export function tarefaEvidenciaStoragePath(urlArquivo: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = urlArquivo.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(urlArquivo.slice(idx + marker.length).split('?')[0]);
  }
  if (!urlArquivo.startsWith('http')) {
    return urlArquivo.replace(/^\//, '');
  }
  return null;
}

export async function signTarefaEvidenciaUrl(
  urlArquivo: string | null | undefined,
  expiresInSeconds = SIGNED_TTL_SECONDS,
): Promise<string | null> {
  if (!urlArquivo) return null;

  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return urlArquivo;

  const path = tarefaEvidenciaStoragePath(urlArquivo);
  if (!path) return urlArquivo;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error('[tarefas-evidencia] Falha ao assinar URL:', path, error?.message);
    return urlArquivo;
  }
  return data.signedUrl;
}

export async function mapEvidenciasComUrlsAssinadas<
  T extends { urlArquivo: string | null },
>(evidencias: T[]): Promise<T[]> {
  return Promise.all(
    evidencias.map(async (ev) => {
      if (!ev.urlArquivo) return ev;
      const signed = await signTarefaEvidenciaUrl(ev.urlArquivo);
      return { ...ev, urlArquivo: signed };
    }),
  );
}
