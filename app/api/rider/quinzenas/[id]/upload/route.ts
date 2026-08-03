import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRiderSession } from '@/lib/rider-auth';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sendPaymentDocumentsEmail } from '@/lib/rider-payment-email';

export const dynamic = 'force-dynamic';

const BUCKET = 'rider-documents';

async function ensureBucket(supabase: SupabaseClient) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (buckets?.some((b) => b.name === BUCKET)) return;
  const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (createError && !/already exists/i.test(createError.message)) throw createError;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRiderSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[upload rider doc] variáveis Supabase não configuradas');
    return NextResponse.json(
      { error: 'Configuração de storage ausente no servidor' },
      { status: 500 }
    );
  }

  const { id: periodId } = await params;

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

  const existingDoc = period.documents.find((d) => d.documentType === documentType);
  if (existingDoc?.status === 'approved') {
    return NextResponse.json({ error: 'Documento já aprovado, não pode substituir' }, { status: 400 });
  }

  const storagePath = `${session.userId}/${session.riderId}/${periodId}/${documentType}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    await ensureBucket(supabase);
  } catch (bucketError) {
    console.error('[upload rider doc] ensureBucket', bucketError);
    return NextResponse.json(
      { error: 'Não foi possível acessar o storage. Verifique as credenciais do Supabase.' },
      { status: 500 }
    );
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true });

  if (uploadError) {
    console.error('[upload rider doc]', uploadError);
    return NextResponse.json(
      { error: `Falha no upload: ${uploadError.message}` },
      { status: 500 }
    );
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
  const bothReceived = hasNf && hasBoleto && period.status === 'pending_documents';

  if (bothReceived) {
    await prisma.riderPaymentPeriod.update({
      where: { id: periodId },
      data: { status: 'documents_received' },
    });

    // Enviar e-mail de notificação ao responsável de pagamentos (fire and forget)
    notificarResponsavelPagamento(session.userId, period).catch((err) =>
      console.error('[upload rider doc] Falha ao notificar responsável:', err),
    );
  }

  return NextResponse.json({ ok: true, storagePath });
}

async function notificarResponsavelPagamento(
  userId: string,
  period: {
    id: string;
    riderId: string;
    periodLabel: string;
    periodStart: Date;
    periodEnd: Date;
    amountCents: number;
  },
) {
  // Buscar e-mail do responsável configurado para este usuário
  const configKey = `rider_payment_email_${userId}`;
  const config = await prisma.systemConfig.findUnique({ where: { key: configKey } });
  const emailDestino = config?.value?.trim();

  if (!emailDestino) {
    console.info('[rider-payment-email] Nenhum e-mail de responsável configurado — notificação ignorada');
    return;
  }

  // Buscar dados do motoboy e da loja
  const rider = await prisma.deliveryRider.findUnique({
    where: { id: period.riderId },
    include: { loja: { select: { nome: true } } },
  });

  if (!rider) return;

  await sendPaymentDocumentsEmail({
    to: emailDestino,
    riderName: rider.name,
    lojaNome: rider.loja?.nome ?? 'Loja',
    periodLabel: period.periodLabel,
    periodStart: period.periodStart.toISOString(),
    periodEnd: period.periodEnd.toISOString(),
    amountCents: period.amountCents,
    riderId: period.riderId,
  });
}
