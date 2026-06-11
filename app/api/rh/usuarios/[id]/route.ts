import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRhPermission } from '@/lib/rh-auth';
import { P } from '@/lib/rh-permissions';

export const dynamic = 'force-dynamic';

// GET /api/rh/usuarios/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { ctx, error } = await requireRhPermission(P.USERS_MANAGE);
  if (error) return error;

  const member = await prisma.rhTeamMember.findFirst({
    where: { id: params.id, tenantUserId: ctx.userId },
    include: { permissions: { select: { permission: true } } },
  });

  if (!member) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  return NextResponse.json({
    id: member.id,
    email: member.email,
    displayName: member.displayName,
    isActive: member.isActive,
    stackUserId: member.stackUserId,
    createdAt: member.createdAt,
    permissions: member.permissions.map((p) => p.permission),
  });
}

// PATCH /api/rh/usuarios/[id] — ativar/desativar
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { ctx, error } = await requireRhPermission(P.USERS_MANAGE);
  if (error) return error;

  const member = await prisma.rhTeamMember.findFirst({
    where: { id: params.id, tenantUserId: ctx.userId },
  });
  if (!member) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  const body = await req.json() as { isActive?: boolean; displayName?: string };

  const updated = await prisma.rhTeamMember.update({
    where: { id: params.id },
    data: {
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
    },
  });

  return NextResponse.json({ id: updated.id, isActive: updated.isActive });
}

// DELETE /api/rh/usuarios/[id] — remover convite ou membro
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { ctx, error } = await requireRhPermission(P.USERS_MANAGE);
  if (error) return error;

  const member = await prisma.rhTeamMember.findFirst({
    where: { id: params.id, tenantUserId: ctx.userId },
  });
  if (!member) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  await prisma.rhTeamMember.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
