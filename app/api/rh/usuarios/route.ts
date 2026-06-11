import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRhPermission } from '@/lib/rh-auth';
import { P, ADMIN_ONLY_PERMISSIONS } from '@/lib/rh-permissions';

export const dynamic = 'force-dynamic';

// GET /api/rh/usuarios — lista membros da equipe (apenas Admin)
export async function GET() {
  const { ctx, error } = await requireRhPermission(P.USERS_MANAGE);
  if (error) return error;

  const members = await prisma.rhTeamMember.findMany({
    where: { tenantUserId: ctx.userId },
    include: { permissions: { select: { permission: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(
    members.map((m) => ({
      id: m.id,
      email: m.email,
      displayName: m.displayName,
      isActive: m.isActive,
      stackUserId: m.stackUserId,
      acceptedAt: m.stackUserId ? m.updatedAt : null,
      createdAt: m.createdAt,
      permissions: m.permissions.map((p) => p.permission),
    }))
  );
}

// POST /api/rh/usuarios — convidar novo membro (apenas Admin)
export async function POST(req: NextRequest) {
  const { ctx, error } = await requireRhPermission(P.USERS_MANAGE);
  if (error) return error;

  const body = await req.json() as { email: string; displayName?: string };

  if (!body.email) {
    return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();

  // Verificar duplicata
  const existing = await prisma.rhTeamMember.findUnique({
    where: { tenantUserId_email: { tenantUserId: ctx.userId, email } },
  });

  if (existing) {
    if (existing.isActive) {
      return NextResponse.json({ error: 'Usuário já convidado com este e-mail' }, { status: 409 });
    }
    // Reativar membro inativo
    const reativado = await prisma.rhTeamMember.update({
      where: { id: existing.id },
      data: { isActive: true, displayName: body.displayName ?? existing.displayName },
    });
    return NextResponse.json({ id: reativado.id, email: reativado.email, reativado: true });
  }

  const member = await prisma.rhTeamMember.create({
    data: {
      tenantUserId: ctx.userId,
      email,
      displayName: body.displayName?.trim() || null,
      invitedBy: ctx.stackUserId,
    },
  });

  return NextResponse.json({ id: member.id, email: member.email }, { status: 201 });
}

// Exportar P para uso interno
export { ADMIN_ONLY_PERMISSIONS };
