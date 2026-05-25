import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'checklist';

const EXT_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

async function ensureBucket(supabase: SupabaseClient, bucketName: string) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (buckets?.some((b) => b.name === bucketName)) return;

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
  });
  if (createError && !/already exists/i.test(createError.message)) {
    throw createError;
  }
}

function resolveContentType(file: File): string | null {
  if (ALLOWED_TYPES.includes(file.type)) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext ? EXT_TO_MIME[ext] ?? null : null;
}

async function getDbUser() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;
  return syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    profileImageUrl: stackUser.profileImageUrl || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });
}

export async function POST(req: Request) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SUPABASE_URL não configurada' },
        { status: 500 }
      );
    }
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: 'Arquivo muito grande (máx 10MB)' }, { status: 400 });

    const contentType = resolveContentType(file);
    if (!contentType) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Use PDF, JPG, PNG ou WEBP.' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const bucketName = process.env.SUPABASE_RH_BUCKET || DEFAULT_BUCKET;

    try {
      await ensureBucket(supabase, bucketName);
    } catch (bucketError) {
      console.error('[POST /api/rh/documentos/upload] ensureBucket', bucketError);
      return NextResponse.json(
        {
          error:
            'Bucket de storage não encontrado. Crie um bucket público no Supabase (ex: "checklist") ou configure SUPABASE_STORAGE_BUCKET.',
        },
        { status: 500 }
      );
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const fileName = `rh/documentos/${dbUser.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('[POST /api/rh/documentos/upload]', uploadError);
      return NextResponse.json(
        { error: `Erro ao fazer upload: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    return NextResponse.json({
      url: urlData.publicUrl,
      nome: file.name,
      tamanhoBytes: file.size,
      contentType,
    });
  } catch (err) {
    console.error('[POST /api/rh/documentos/upload]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao fazer upload' },
      { status: 500 }
    );
  }
}
