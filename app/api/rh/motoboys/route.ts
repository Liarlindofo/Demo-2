import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRhPermission } from '@/lib/rh-auth';
import { P } from '@/lib/rh-permissions';
import { generateInviteToken } from '@/lib/rider-auth';

export const dynamic = 'force-dynamic';

function validarCNPJ(cnpj: string): boolean {
  const nums = cnpj.replace(/\D/g, '');
  if (nums.length !== 14 || /^(\d)\1{13}$/.test(nums)) return false;
  const calc = (n: number) => {
    let sum = 0; let pos = n - 7;
    for (let i = n; i >= 1; i--) {
      sum += parseInt(nums[n - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === parseInt(nums[12]) && calc(13) === parseInt(nums[13]);
}

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireRhPermission(P.RIDERS_VIEW);
  if (error) return error;

  const lojaId = req.nextUrl.searchParams.get('lojaId');
  const status = req.nextUrl.searchParams.get('status');

  const riders = await prisma.deliveryRider.findMany({
    where: {
      userId: ctx.userId,
      ...(lojaId ? { lojaId } : {}),
      ...(status ? { status } : {}),
    },
    include: { loja: { select: { nome: true } } },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(riders);
}

export async function POST(req: NextRequest) {
  try {
    const { ctx, error } = await requireRhPermission(P.RIDERS_CREATE);
    if (error) return error;

    const body = await req.json() as {
      name: string; cnpj: string; email: string;
      phone?: string; lojaId: string;
    };

    if (!body.name || !body.cnpj || !body.email || !body.lojaId) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const cnpjNums = body.cnpj.replace(/\D/g, '');
    if (!validarCNPJ(cnpjNums)) {
      return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
    }

    const inviteToken = generateInviteToken();
    const inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Verificar se e-mail já existe
    const existente = await prisma.deliveryRider.findFirst({
      where: { userId: ctx.userId, email: body.email.toLowerCase() },
    });

    if (existente) {
      // Se está ativo → bloquear
      if (existente.status === 'active') {
        return NextResponse.json({ error: 'E-mail já cadastrado e ativo' }, { status: 409 });
      }
      // Se está inativo → reativar com novos dados e novo token de convite
      const reativado = await prisma.deliveryRider.update({
        where: { id: existente.id },
        data: {
          name: body.name,
          cnpj: cnpjNums,
          phone: body.phone ?? existente.phone,
          lojaId: body.lojaId,
          status: 'active',
          passwordHash: null,
          inviteToken,
          inviteTokenExpiresAt,
        },
      });
      return NextResponse.json({ ...reativado, inviteToken, reativado: true }, { status: 200 });
    }

    const rider = await prisma.deliveryRider.create({
      data: {
        userId: ctx.userId,
        lojaId: body.lojaId,
        name: body.name,
        cnpj: cnpjNums,
        email: body.email.toLowerCase(),
        phone: body.phone,
        inviteToken,
        inviteTokenExpiresAt,
      },
    });

    return NextResponse.json({ ...rider, inviteToken }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rh/motoboys]', err);
    return NextResponse.json({ error: 'Erro interno ao cadastrar motoboy' }, { status: 500 });
  }
}
