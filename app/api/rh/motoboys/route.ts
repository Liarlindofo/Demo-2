import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRhPermission } from '@/lib/rh-auth';
import { P } from '@/lib/rh-permissions';
import { generateInviteToken } from '@/lib/rider-auth';
import { buildInviteLink, sendInviteEmail } from '@/lib/rider-invite-email';

export const dynamic = 'force-dynamic';

const INVITE_DAYS = 30;

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
    include: {
      loja: { select: { nome: true } },
      paymentPeriods: {
        where: { status: { in: ['pending_documents', 'documents_received'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { documents: { select: { documentType: true, status: true } } },
      },
    },
    orderBy: { name: 'asc' },
  });

  const result = riders.map(({ paymentPeriods, ...r }) => {
    const activePeriod = paymentPeriods[0] ?? null;
    let docStatus: 'none' | 'pending' | 'partial' | 'received' = 'none';
    if (activePeriod) {
      const docs = activePeriod.documents;
      const hasNf = docs.some((d) => d.documentType === 'nf');
      const hasBoleto = docs.some((d) => d.documentType === 'boleto');
      if (hasNf && hasBoleto) docStatus = 'received';
      else if (hasNf || hasBoleto) docStatus = 'partial';
      else docStatus = 'pending';
    }
    return { ...r, docStatus, activePeriodId: activePeriod?.id ?? null };
  });

  return NextResponse.json(result);
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
    const inviteTokenExpiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);

    // Buscar loja para o e-mail
    const loja = await prisma.rhLoja.findUnique({ where: { id: body.lojaId }, select: { nome: true } });

    // Verificar se e-mail já existe
    const existente = await prisma.deliveryRider.findFirst({
      where: { userId: ctx.userId, email: body.email.toLowerCase() },
    });

    let rider: { id: string; name: string; email: string; inviteToken: string | null };
    let reativado = false;

    if (existente) {
      // Se está ativo E já tem senha → bloquear
      if (existente.status === 'active' && existente.passwordHash) {
        return NextResponse.json({ error: 'E-mail já cadastrado e ativo' }, { status: 409 });
      }
      // Inativo ou sem senha → reativar como pending_setup
      const updated = await prisma.deliveryRider.update({
        where: { id: existente.id },
        data: {
          name: body.name,
          cnpj: cnpjNums,
          phone: body.phone ?? existente.phone,
          lojaId: body.lojaId,
          status: 'pending_setup',
          passwordHash: null,
          inviteToken,
          inviteTokenExpiresAt,
        },
      });
      rider = updated;
      reativado = true;
    } else {
      const created = await prisma.deliveryRider.create({
        data: {
          userId: ctx.userId,
          lojaId: body.lojaId,
          name: body.name,
          cnpj: cnpjNums,
          email: body.email.toLowerCase(),
          phone: body.phone,
          status: 'pending_setup',
          inviteToken,
          inviteTokenExpiresAt,
        },
      });
      rider = created;
    }

    // Disparar e-mail — falha silenciosa (não bloqueia o cadastro)
    sendInviteEmail({
      to: rider.email,
      riderName: rider.name,
      lojaNome: loja?.nome ?? 'sua loja',
      inviteLink: buildInviteLink(inviteToken),
    }).catch(err => console.error('[POST /api/rh/motoboys] falha ao enviar e-mail de convite:', err));

    return NextResponse.json({ ...rider, inviteToken, reativado }, { status: reativado ? 200 : 201 });
  } catch (err) {
    console.error('[POST /api/rh/motoboys]', err);
    return NextResponse.json({ error: 'Erro interno ao cadastrar motoboy' }, { status: 500 });
  }
}
