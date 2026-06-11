import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export interface RhContext {
  userId: string;       // tenantUserId para queries de dados
  stackUserId: string;  // ID do Stack Auth do usuário agindo
  isAdmin: boolean;     // true = dono dos dados; false = membro de equipe
  memberId: string | null; // RhTeamMember.id quando é membro
  hasPermission: (permission: string) => boolean;
}

/**
 * Resolve o contexto RH do usuário autenticado.
 *
 * Ordem de verificação:
 * 1. Se já é membro ativo via stackUserId → contexto de membro (usa dados do tenant)
 * 2. Se email corresponde a convite pendente → vincula e ativa
 * 3. Fallback: usuário é o dono (Admin) → acesso total
 */
export async function getRhContext(): Promise<RhContext | null> {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;

  // 1. Verificar se já é membro ativo (por stackUserId)
  const membership = await prisma.rhTeamMember.findFirst({
    where: { stackUserId: stackUser.id, isActive: true },
    include: { permissions: true },
  });

  if (membership) {
    const permsSet = new Set(membership.permissions.map((p) => p.permission));
    return {
      userId: membership.tenantUserId,
      stackUserId: stackUser.id,
      isAdmin: false,
      memberId: membership.id,
      hasPermission: (p: string) => permsSet.has(p),
    };
  }

  // 2. Verificar convite pendente por e-mail (vincula automaticamente no primeiro login)
  if (stackUser.primaryEmail) {
    const pendingMembership = await prisma.rhTeamMember.findFirst({
      where: {
        email: stackUser.primaryEmail,
        stackUserId: null,
        isActive: true,
      },
      include: { permissions: true },
    });

    if (pendingMembership) {
      const updated = await prisma.rhTeamMember.update({
        where: { id: pendingMembership.id },
        data: { stackUserId: stackUser.id, displayName: stackUser.displayName ?? undefined },
        include: { permissions: true },
      });
      const permsSet = new Set(updated.permissions.map((p) => p.permission));
      return {
        userId: updated.tenantUserId,
        stackUserId: stackUser.id,
        isAdmin: false,
        memberId: updated.id,
        hasPermission: (p: string) => permsSet.has(p),
      };
    }
  }

  // 3. Usuário é o dono (Admin) — cria/atualiza User via sync
  const dbUser = await syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    profileImageUrl: stackUser.profileImageUrl || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });

  if (!dbUser) return null;

  return {
    userId: dbUser.id,
    stackUserId: stackUser.id,
    isAdmin: true,
    memberId: null,
    hasPermission: () => true,
  };
}

/**
 * Helper para uso nas API routes — retorna 401/403 como NextResponse
 * quando o contexto não existe ou não tem a permissão exigida.
 */
export async function requireRhPermission(
  permission?: string
): Promise<{ ctx: RhContext; error: null } | { ctx: null; error: NextResponse }> {
  const ctx = await getRhContext();
  if (!ctx) {
    return {
      ctx: null,
      error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }),
    };
  }
  if (permission && !ctx.hasPermission(permission)) {
    return {
      ctx: null,
      error: NextResponse.json({ error: 'Sem permissão' }, { status: 403 }),
    };
  }
  return { ctx, error: null };
}
