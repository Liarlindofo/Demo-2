import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRhDbUser } from '@/lib/rh-api-auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = 'rider-documents';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getRhDbUser();
  if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id: periodId } = await params;
  const period = await prisma.riderPaymentPeriod.findFirst({
    where: { id: periodId, userId: dbUser.id },
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getRhDbUser();
  if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id: periodId } = await params;
  const body = await req.json() as { documentId: string; status: 'approved' | 'rejected' };

  // Verificar que o period pertence ao usuário
  const period = await prisma.riderPaymentPeriod.findFirst({
    where: { id: periodId, userId: dbUser.id },
  });
  if (!period) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  await prisma.riderDocument.update({
    where: { id: body.documentId },
    data: { status: body.status, reviewedBy: dbUser.id, reviewedAt: new Date() },
  });

  // Se ambos os docs foram aprovados → marcar quinzena como approved
  if (body.status === 'approved') {
    const docs = await prisma.riderDocument.findMany({ where: { periodId } });
    const nf = docs.find((d) => d.documentType === 'nf');
    const boleto = docs.find((d) => d.documentType === 'boleto');
    if (nf?.status === 'approved' && boleto?.status === 'approved') {
      await prisma.riderPaymentPeriod.update({
        where: { id: periodId },
        data: { status: 'approved' },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
