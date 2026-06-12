import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRhPermission } from '@/lib/rh-auth';
import { P, ADMIN_ONLY_PERMISSIONS, PERMISSION_GROUPS } from '@/lib/rh-permissions';

export const dynamic = 'force-dynamic';

const ALL_MEMBER_PERMISSIONS = Object.values(P).filter((p) => !ADMIN_ONLY_PERMISSIONS.has(p));

// GET /api/rh/usuarios/[id]/permissoes — retorna todas as permissões com estado
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ctx, error } = await requireRhPermission(P.USERS_MANAGE);
  if (error) return error;

  const { id } = await params;
  const member = await prisma.rhTeamMember.findFirst({
    where: { id, tenantUserId: ctx.userId },
    include: { permissions: true },
  });
  if (!member) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  // Se o membro não tem nenhum registro explícito, criar todos como ativos (migração automática)
  if (member.permissions.length === 0) {
    await prisma.rhPermission.createMany({
      data: ALL_MEMBER_PERMISSIONS.map((permission) => ({
        memberId: member.id,
        permission,
        grantedBy: ctx.stackUserId,
      })),
      skipDuplicates: true,
    });
    // Recarregar permissões após migração
    const created = await prisma.rhPermission.findMany({ where: { memberId: member.id } });
    member.permissions.push(...created);
  }

  const activePerms = new Set(member.permissions.map((p) => p.permission));

  const groups = PERMISSION_GROUPS.map((g) => ({
    label: g.label,
    permissions: g.permissions.map((perm) => ({
      permission: perm,
      active: activePerms.has(perm),
    })),
  }));

  return NextResponse.json({
    memberId: member.id,
    email: member.email,
    displayName: member.displayName,
    groups,
  });
}

// POST /api/rh/usuarios/[id]/permissoes — toggle de uma permissão
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { ctx, error } = await requireRhPermission(P.USERS_MANAGE);
  if (error) return error;

  const { id } = await params;
  const body = await req.json() as { permission: string; active: boolean };

  if (!body.permission) {
    return NextResponse.json({ error: 'permission obrigatório' }, { status: 400 });
  }

  // Nunca conceder permissões exclusivas de Admin
  if (ADMIN_ONLY_PERMISSIONS.has(body.permission)) {
    return NextResponse.json({ error: 'Permissão não pode ser concedida a usuários RH' }, { status: 403 });
  }

  const member = await prisma.rhTeamMember.findFirst({
    where: { id, tenantUserId: ctx.userId },
  });
  if (!member) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

  if (body.active) {
    await prisma.rhPermission.upsert({
      where: { memberId_permission: { memberId: id, permission: body.permission } },
      create: {
        memberId: id,
        permission: body.permission,
        grantedBy: ctx.stackUserId,
      },
      update: { grantedBy: ctx.stackUserId, grantedAt: new Date() },
    });
  } else {
    await prisma.rhPermission.deleteMany({
      where: { memberId: id, permission: body.permission },
    });
  }

  return NextResponse.json({ ok: true, permission: body.permission, active: body.active });
}
