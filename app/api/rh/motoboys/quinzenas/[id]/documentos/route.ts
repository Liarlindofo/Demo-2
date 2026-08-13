import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = 'rider-documents';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id: periodId } = await params;
  const period = await prisma.riderPaymentPeriod.findFirst({
    where: { id: periodId, userId: rh.userId },
    include: { documents: true },
  });

  if (!period) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  // Gerar signed URLs para visualização (1 hora)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const docsComUrl = await Promise.all(
    period.documents.map(async (doc) => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.storagePath, 3600);
      return { ...doc, signedUrl: data?.signedUrl ?? null };
    })
  );

  return NextResponse.json(docsComUrl);
}
