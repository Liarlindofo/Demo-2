import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyPassword, hashPassword, createRiderToken,
  generateInviteToken, RIDER_COOKIE,
} from '@/lib/rider-auth';

export const dynamic = 'force-dynamic';

// POST /api/rider/auth — login
export async function POST(req: NextRequest) {
  const body = await req.json() as { email?: string; password?: string; action?: string; token?: string; newPassword?: string };

  // ── Setup de senha via token de convite ─────────────────────────────────────
  if (body.action === 'setup') {
    if (!body.token || !body.newPassword) {
      return NextResponse.json({ error: 'Token e nova senha são obrigatórios' }, { status: 400 });
    }
    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter ao menos 6 caracteres' }, { status: 400 });
    }

    const rider = await prisma.deliveryRider.findFirst({
      where: {
        inviteToken: body.token,
        inviteTokenExpiresAt: { gt: new Date() },
        status: 'active',
      },
    });

    if (!rider) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
    }

    const passwordHash = await hashPassword(body.newPassword);
    const newToken = generateInviteToken();

    await prisma.deliveryRider.update({
      where: { id: rider.id },
      data: {
        passwordHash,
        inviteToken: newToken,
        inviteTokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    const jwtToken = createRiderToken({
      riderId: rider.id,
      userId: rider.userId,
      email: rider.email,
      name: rider.name,
      lojaId: rider.lojaId,
    });

    const res = NextResponse.json({ ok: true, riderId: rider.id });
    res.cookies.set(RIDER_COOKIE, jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60,
      path: '/',
    });
    return res;
  }

  // ── Login normal ────────────────────────────────────────────────────────────
  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'E-mail e senha obrigatórios' }, { status: 400 });
  }

  const rider = await prisma.deliveryRider.findFirst({
    where: { email: body.email.toLowerCase(), status: 'active' },
  });

  if (!rider || !rider.passwordHash) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const valid = await verifyPassword(body.password, rider.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
  }

  const jwtToken = createRiderToken({
    riderId: rider.id,
    userId: rider.userId,
    email: rider.email,
    name: rider.name,
    lojaId: rider.lojaId,
  });

  const res = NextResponse.json({ ok: true, riderId: rider.id });
  res.cookies.set(RIDER_COOKIE, jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60,
    path: '/',
  });
  return res;
}

// DELETE /api/rider/auth — logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(RIDER_COOKIE);
  return res;
}
