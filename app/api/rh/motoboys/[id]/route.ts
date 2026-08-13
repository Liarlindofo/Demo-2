import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const rider = await prisma.deliveryRider.findFirst({
    where: { id, userId: rh.userId },
    include: {
      loja: { select: { nome: true } },
      paymentPeriods: {
        orderBy: { periodStart: 'desc' },
        include: {
          documents: {
            select: { id: true, documentType: true, status: true, fileName: true, uploadedAt: true },
          },
        },
      },
    },
  });

  if (!rider) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  return NextResponse.json(rider);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    name?: string; phone?: string; lojaId?: string; status?: string;
    email?: string; cnpj?: string;
  };

  // Buscar o rider para verificar restrições
  const rider = await prisma.deliveryRider.findFirst({ where: { id, userId: rh.userId } });
  if (!rider) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  // E-mail e CNPJ só podem ser alterados se o motoboy ainda não definiu senha
  if (rider.passwordHash) {
    const emailMudou = body.email !== undefined
      && body.email.toLowerCase() !== (rider.email ?? '').toLowerCase();
    const cnpjMudou = body.cnpj !== undefined
      && body.cnpj.replace(/\D/g, '') !== (rider.cnpj ?? '').replace(/\D/g, '');
    if (emailMudou || cnpjMudou) {
      return NextResponse.json(
        { error: 'E-mail e CNPJ não podem ser alterados após o motoboy criar sua senha' },
        { status: 409 }
      );
    }
  }

  // Verificar unicidade de e-mail (excluindo o próprio registro)
  if (body.email !== undefined && body.email.toLowerCase() !== (rider.email ?? '').toLowerCase()) {
    const emailNorm = body.email.toLowerCase();
    const existente = await prisma.deliveryRider.findFirst({
      where: { userId: rh.userId, email: emailNorm, NOT: { id } },
    });
    if (existente) return NextResponse.json({ error: 'E-mail já cadastrado para outro motoboy' }, { status: 409 });
  }

  // Verificar unicidade de CNPJ (excluindo o próprio registro)
  if (body.cnpj !== undefined && body.cnpj.replace(/\D/g, '') !== (rider.cnpj ?? '').replace(/\D/g, '')) {
    const cnpjNums = body.cnpj.replace(/\D/g, '');
    const existente = await prisma.deliveryRider.findFirst({
      where: { userId: rh.userId, cnpj: cnpjNums, NOT: { id } },
    });
    if (existente) return NextResponse.json({ error: 'CNPJ já cadastrado para outro motoboy' }, { status: 409 });
  }

  await prisma.deliveryRider.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.lojaId !== undefined ? { lojaId: body.lojaId } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      // Com senha: ignora e-mail/CNPJ no update (mesmo se vierem no body iguais)
      ...(!rider.passwordHash && body.email !== undefined ? { email: body.email.toLowerCase() } : {}),
      ...(!rider.passwordHash && body.cnpj !== undefined ? { cnpj: body.cnpj.replace(/\D/g, '') } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rh = await rhGetUser();
  if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { id } = await params;

  const rider = await prisma.deliveryRider.findFirst({
    where: { id, userId: rh.userId },
  });

  if (!rider) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  // Cascade no banco apaga paymentPeriods e documents automaticamente
  await prisma.deliveryRider.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
