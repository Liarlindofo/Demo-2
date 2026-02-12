import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/checklist/upload-photo - Upload de foto para Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar variáveis de ambiente do Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL não configurada');
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL não configurada. Adicione no .env.local' },
        { status: 500 }
      );
    }

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY não configurada');
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada. Adicione no .env.local' },
        { status: 500 }
      );
    }

    // Validar formato da URL
    try {
      new URL(supabaseUrl);
    } catch (e) {
      console.error('URL do Supabase inválida:', supabaseUrl);
      return NextResponse.json(
        { error: `URL do Supabase inválida: ${supabaseUrl}. Deve ser uma URL HTTP/HTTPS válida.` },
        { status: 500 }
      );
    }

    // Criar cliente Supabase com service role key (tem permissões administrativas)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter arquivo do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Arquivo deve ser uma imagem' }, { status: 400 });
    }

    // Validar tamanho (máximo 10MB por foto)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Nome do bucket (ajuste conforme seu bucket no Supabase)
    const bucketName = 'checklist';

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${stackUser.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false, // Não sobrescrever arquivos existentes
      });

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      return NextResponse.json(
        { error: `Erro ao fazer upload: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obter URL pública da imagem
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: fileName,
      size: file.size,
    });
  } catch (error) {
    console.error('Erro ao processar upload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
