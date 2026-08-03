export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRhPermission } from '@/lib/rh-auth';
import { P } from '@/lib/rh-permissions';

// Chave usada no SystemConfig — namespaceada por userId para suporte multi-tenant
function configKey(userId: string) {
  return `rider_payment_email_${userId}`;
}

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireRhPermission(P.RIDERS_VIEW);
  if (error) return error;

  const key = configKey(ctx.userId);
  const record = await prisma.systemConfig.findUnique({ where: { key } });

  return NextResponse.json({ email: record?.value ?? '' });
}

export async function PUT(req: NextRequest) {
  const { ctx, error } = await requireRhPermission(P.RIDERS_VIEW);
  if (error) return error;

  const body = await req.json();
  const email: string = (body.email ?? '').trim();

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
  }

  const key = configKey(ctx.userId);
  const label = 'E-mail do responsável por pagamentos de motoboys';

  if (email === '') {
    // Remover configuração
    await prisma.systemConfig.deleteMany({ where: { key } });
  } else {
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value: email, label },
      create: { key, value: email, label },
    });
  }

  return NextResponse.json({ ok: true, email });
}
