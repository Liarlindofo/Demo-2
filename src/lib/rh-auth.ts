import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Drop-in replacement for the old `getDbUser()` pattern used across RH routes.
 *
 * Returns `{ userId, isAdmin }` where `userId` is the TENANT's User.id — i.e.,
 * for team members this is the admin's id (so they see the correct shared data),
 * and for admins it is their own id.
 *
 * NÃO use em recursos isolados por conta pessoal (ex.: /connections sem scope=tenant).
 * Para Central de Relatórios (agendados, ata, reclamações), use getReportsTenantUserId().
 *
 * Usage:
 *   const rh = await rhGetUser();
 *   if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
 *   // use rh.userId instead of dbUser.id
 */
export async function rhGetUser(): Promise<{ userId: string; isAdmin: boolean } | null> {
  const ctx = await getRhContext();
  if (!ctx) return null;
  return { userId: ctx.userId, isAdmin: ctx.isAdmin };
}

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
 * 1. Sincroniza User da sessão
 * 2. Se é dono de equipe RH (tem membros) → contexto admin (próprios dados)
 * 3. Se é membro ativo de outro tenant → contexto de membro
 * 4. Convite pendente por e-mail (outro tenant) → vincula e ativa
 * 5. Fallback: usuário é o dono (Admin) → acesso total
 */
export async function getRhContext(): Promise<RhContext | null> {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;

  const dbUser = await syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    profileImageUrl: stackUser.profileImageUrl || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });

  if (!dbUser) return null;

  // Dono de equipe RH: prioriza os próprios dados (evita sumir relatórios/grupos
  // quando o admin também está cadastrado como membro ou tem convite cruzado).
  const ownsTeam =
    (await prisma.rhTeamMember.count({
      where: { tenantUserId: dbUser.id, isActive: true },
    })) > 0;

  if (ownsTeam) {
    return {
      userId: dbUser.id,
      stackUserId: stackUser.id,
      isAdmin: true,
      memberId: null,
      hasPermission: () => true,
    };
  }

  // Membro ativo de outro tenant (não o próprio dono)
  const membership = await prisma.rhTeamMember.findFirst({
    where: { stackUserId: stackUser.id, isActive: true },
    include: { permissions: true },
  });

  if (membership && membership.tenantUserId !== dbUser.id) {
    const permsSet = new Set(membership.permissions.map((p) => p.permission));
    return {
      userId: membership.tenantUserId,
      stackUserId: stackUser.id,
      isAdmin: false,
      memberId: membership.id,
      hasPermission: (p: string) => permsSet.has(p),
    };
  }

  // Convite pendente por e-mail — só vincula a outro tenant
  if (stackUser.primaryEmail) {
    const pendingMembership = await prisma.rhTeamMember.findFirst({
      where: {
        email: stackUser.primaryEmail.toLowerCase(),
        stackUserId: null,
        isActive: true,
        NOT: { tenantUserId: dbUser.id },
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
  let ctx: RhContext | null;
  try {
    ctx = await getRhContext();
  } catch (err) {
    console.error('[rh-auth] getRhContext error:', err);
    return {
      ctx: null,
      error: NextResponse.json(
        { error: 'Erro interno ao verificar autenticação', details: String(err) },
        { status: 500 }
      ),
    };
  }

  if (!ctx) {
    return {
      ctx: null,
      error: NextResponse.json(
        { error: 'Sessão expirada. Por favor, faça login novamente.', code: 'UNAUTHENTICATED' },
        { status: 401 }
      ),
    };
  }
  if (permission && !ctx.hasPermission(permission)) {
    return {
      ctx: null,
      error: NextResponse.json({ error: 'Sem permissão para esta ação' }, { status: 403 }),
    };
  }
  return { ctx, error: null };
}
