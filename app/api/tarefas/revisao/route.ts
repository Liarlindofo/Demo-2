export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

const BUCKET = 'tarefas-evidencias';
const SIGNED_TTL_SECONDS = 3600;

/**
 * Extrai o path interno do bucket a partir da URL pública (ou path cru) salva em urlArquivo.
 * Ex.: https://xxx.supabase.co/storage/v1/object/public/tarefas-evidencias/loja/id/ts.jpg
 *   → loja/id/ts.jpg
 */
function storagePathFromUrl(urlArquivo: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = urlArquivo.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(urlArquivo.slice(idx + marker.length).split('?')[0]);
  }
  // Já é um path relativo ao bucket
  if (!urlArquivo.startsWith('http')) {
    return urlArquivo.replace(/^\//, '');
  }
  return null;
}

/**
 * GET /api/tarefas/revisao
 *
 * Lista TarefaAtribuida com emRevisaoAdm = true e revisadaPor = null,
 * incluindo todas as evidências para exibição na fila de revisão.
 * URLs de arquivo são convertidas em signed URLs (bucket privado).
 */
export async function GET() {
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const pendentes = await prisma.tarefaAtribuida.findMany({
    where: {
      userId: rh.userId,
      emRevisaoAdm: true,
      revisadaPor: null,
    },
    include: {
      template: { select: { titulo: true, descricao: true } },
      funcionario: { select: { id: true, nome: true } },
      loja: { select: { id: true, nome: true } },
      evidencias: {
        select: {
          id: true,
          tipo: true,
          conteudoTexto: true,
          urlArquivo: true,
          latitude: true,
          longitude: true,
          analiseIA: true,
          recebidaEm: true,
        },
        orderBy: { recebidaEm: 'asc' },
      },
    },
    orderBy: { dataAgendada: 'asc' },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(pendentes);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const comUrlsAssinadas = await Promise.all(
    pendentes.map(async (item) => {
      const evidencias = await Promise.all(
        item.evidencias.map(async (ev) => {
          if (!ev.urlArquivo) return ev;

          const path = storagePathFromUrl(ev.urlArquivo);
          if (!path) return ev;

          const { data, error } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(path, SIGNED_TTL_SECONDS);

          if (error || !data?.signedUrl) {
            console.error('[revisao] Falha ao assinar URL:', path, error?.message);
            return ev;
          }

          return { ...ev, urlArquivo: data.signedUrl };
        }),
      );
      return { ...item, evidencias };
    }),
  );

  return NextResponse.json(comUrlsAssinadas);
}
