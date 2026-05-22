import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

export const dynamic = 'force-dynamic';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: 'Arquivo muito grande (máx 10MB)' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type))
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Use PDF, JPG, PNG ou WEBP.' },
        { status: 400 }
      );

    const ext = file.name.split('.').pop() ?? 'bin';
    const filename = `rh/documentos/${dbUser.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({
      url: blob.url,
      nome: file.name,
      tamanhoBytes: file.size,
      contentType: file.type,
    });
  } catch (err) {
    console.error('[POST /api/rh/documentos/upload]', err);
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
  }
}
