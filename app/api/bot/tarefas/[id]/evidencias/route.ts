export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { requireBotAuth } from '@/lib/bot-auth';

const TIPOS_VALIDOS = ['FOTO', 'CONFIRMACAO_TEXTO', 'LOCALIZACAO', 'ARQUIVO'];

const MIME_PARA_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'application/pdf': 'pdf',
  'application/octet-stream': 'bin',
};

/**
 * POST /api/bot/tarefas/:id/evidencias
 *
 * Body: {
 *   tipo: 'FOTO' | 'CONFIRMACAO_TEXTO' | 'LOCALIZACAO' | 'ARQUIVO',
 *   conteudoTexto?: string,
 *   latitude?: number,
 *   longitude?: number,
 *   analiseIA?: object,
 *   arquivoBase64?: string,
 *   mimeType?: string
 * }
 *
 * Se arquivoBase64 for fornecido, faz upload para o bucket "tarefas-evidencias"
 * do Supabase Storage com path {lojaId}/{tarefaId}/{timestamp}.{ext}.
 *
 * Se analiseIA.divergencia === true, seta emRevisaoAdm = true na TarefaAtribuida.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireBotAuth(req);
  if (authError) return authError;

  const { id } = await params;

  const atribuicao = await prisma.tarefaAtribuida.findUnique({
    where: { id },
    select: { id: true, lojaId: true, status: true },
  });

  if (!atribuicao) {
    return NextResponse.json({ error: 'Tarefa não encontrada.' }, { status: 404 });
  }

  const body = await req.json();
  const { tipo, conteudoTexto, latitude, longitude, analiseIA, arquivoBase64, mimeType } = body;

  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    return NextResponse.json(
      { error: `Tipo inválido. Use: ${TIPOS_VALIDOS.join(', ')}.` },
      { status: 400 },
    );
  }

  // Upload de arquivo para Supabase Storage, se fornecido
  let urlArquivo: string | null = null;

  if (arquivoBase64) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas.' },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const ext = (mimeType && MIME_PARA_EXT[mimeType]) ?? 'bin';
    const path = `${atribuicao.lojaId}/${id}/${Date.now()}.${ext}`;

    const buffer = Buffer.from(arquivoBase64, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('tarefas-evidencias')
      .upload(path, buffer, {
        contentType: mimeType ?? 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('[evidencias] Erro no upload Supabase:', uploadError);
      return NextResponse.json(
        { error: `Erro ao fazer upload: ${uploadError.message}` },
        { status: 500 },
      );
    }

    const { data: urlData } = supabase.storage
      .from('tarefas-evidencias')
      .getPublicUrl(path);

    urlArquivo = urlData.publicUrl;
  }

  // Gravar evidência no banco
  const evidencia = await prisma.tarefaEvidencia.create({
    data: {
      tarefaAtribuidaId: id,
      tipo,
      conteudoTexto: conteudoTexto ?? null,
      urlArquivo,
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      analiseIA: analiseIA ?? null,
    },
  });

  // Se a IA detectou divergência, marcar para revisão administrativa
  if (analiseIA?.divergencia === true) {
    await prisma.tarefaAtribuida.update({
      where: { id },
      data: { emRevisaoAdm: true },
    });
  }

  return NextResponse.json(evidencia, { status: 201 });
}
