import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEffectiveDbUser } from '@/lib/effective-user';
import { SystemTool } from '@/types/admin';
import { requireToolPermission } from '@/lib/auth/toolPermissions';

export const dynamic = 'force-dynamic';

const VALID_STORE_SLUGS = ['ahu', 'pilarzinho', 'portao', 'uberaba'] as const;
type StoreSlug = (typeof VALID_STORE_SLUGS)[number];

function isValidSlug(slug: string): slug is StoreSlug {
  return VALID_STORE_SLUGS.includes(slug as StoreSlug);
}

// ── GET: carregar dados da loja ───────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const permissionCheck = await requireToolPermission(SystemTool.CMV);
  if (permissionCheck) return permissionCheck;

  const { storeId } = await params;
  if (!isValidSlug(storeId)) {
    return NextResponse.json({ error: 'Loja inválida' }, { status: 400 });
  }

  try {
    const dbUser = await getEffectiveDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const record = await prisma.cmvStoreData.findUnique({
      where: {
        userId_storeSlug: {
          userId: dbUser.id,
          storeSlug: storeId,
        },
      },
    });

    if (!record) {
      // Retorna dados vazios se ainda não existe registro
      return NextResponse.json({ sabores: [], ingredientes: [] });
    }

    return NextResponse.json(record.data);
  } catch (error) {
    console.error('❌ CMV GET error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados', details: error instanceof Error ? error.message : 'Desconhecido' },
      { status: 500 },
    );
  }
}

// ── PUT: salvar/atualizar dados da loja ───────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const permissionCheck = await requireToolPermission(SystemTool.CMV);
  if (permissionCheck) return permissionCheck;

  const { storeId } = await params;
  if (!isValidSlug(storeId)) {
    return NextResponse.json({ error: 'Loja inválida' }, { status: 400 });
  }

  try {
    const dbUser = await getEffectiveDbUser();
    if (!dbUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validação mínima
    if (!body || typeof body !== 'object' || !Array.isArray(body.sabores) || !Array.isArray(body.ingredientes)) {
      return NextResponse.json({ error: 'Payload inválido. Esperado: { sabores, ingredientes }' }, { status: 400 });
    }

    const record = await prisma.cmvStoreData.upsert({
      where: {
        userId_storeSlug: {
          userId: dbUser.id,
          storeSlug: storeId,
        },
      },
      update: {
        data: body,
      },
      create: {
        userId: dbUser.id,
        storeSlug: storeId,
        data: body,
      },
    });

    return NextResponse.json({ success: true, updatedAt: record.updatedAt });
  } catch (error) {
    console.error('❌ CMV PUT error:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar dados', details: error instanceof Error ? error.message : 'Desconhecido' },
      { status: 500 },
    );
  }
}
