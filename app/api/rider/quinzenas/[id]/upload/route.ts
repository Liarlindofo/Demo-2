import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRiderSession } from '@/lib/rider-auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = 'rider-documents';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRiderSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id: periodId } = await params;

  // Verificar ownership do period
  const period = await prisma.riderPaymentPeriod.findFirst({
    where: { id: periodId, riderId: session.riderId, userId: session.userId },
    include: { documents: true },
  });
  if (!period) return NextResponse.json({ error: 'Quinzena não encontrada' }, { status: 404 });
  if (period.status === 'approved' || period.status === 'paid') {
    return NextResponse.json({ error: 'Quinzena já encerrada' }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const documentType = formData.get('documentType') as string | null;

  if (!file || !documentType || !['nf', 'boleto'].includes(documentType)) {
    return NextResponse.json({ error: 'Arquivo e tipo (nf|boleto) são obrigatórios' }, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Apenas PDF é aceito' }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo excede 10MB' }, { status: 400 });
  }

  // Verificar se doc já foi aprovado
  const existingDoc = period.documents.find((d) => d.documentType === documentType);
  if (existingDoc?.status === 'approved') {
    return NextResponse.json({ error: 'Documento já aprovado, não pode substituir' }, { status: 400 });
  }

  const storagePath = `${session.userId}/${session.riderId}/${periodId}/${documentType}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true });

  if (uploadError) {
    console.error('[upload rider doc]', uploadError);
    return NextResponse.json({ error: 'Falha no upload' }, { status: 500 });
  }

  // Criar ou atualizar registro do documento
  await prisma.riderDocument.upsert({
    where: {
      // Precisamos de um unique constraint — usar findFirst + create/update
      id: existingDoc?.id ?? 'new',
    },
    update: {
      fileName: file.name,
      storagePath,
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      uploadedAt: new Date(),
    },
    create: {
      userId: session.userId,
      periodId,
      riderId: session.riderId,
      documentType,
      fileName: file.name,
      storagePath,
    },
  }).catch(async () => {
    // fallback: delete existing + create
    if (existingDoc) await prisma.riderDocument.delete({ where: { id: existingDoc.id } });
    await prisma.riderDocument.create({
      data: {
        userId: session.userId,
        periodId,
        riderId: session.riderId,
        documentType,
        fileName: file.name,
        storagePath,
      },
    });
  });

  // Verificar se ambos os docs foram enviados
  const allDocs = await prisma.riderDocument.findMany({ where: { periodId } });
  const hasNf = allDocs.some((d) => d.documentType === 'nf');
  const hasBoleto = allDocs.some((d) => d.documentType === 'boleto');
  if (hasNf && hasBoleto && period.status === 'pending_documents') {
    await prisma.riderPaymentPeriod.update({
      where: { id: periodId },
      data: { status: 'documents_received' },
    });
  }

  return NextResponse.json({ ok: true, storagePath });
}
