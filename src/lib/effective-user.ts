/**
 * Resolução de usuário efetivo para acesso a dados compartilhados.
 *
 * Quando um usuário logado é membro de uma equipe RH (via RhTeamMember),
 * todas as queries de dados devem usar o userId do dono (tenantUserId),
 * garantindo compartilhamento total entre admin e membros de equipe.
 *
 * Ordem de resolução:
 * 1. Sem sessão → null
 * 2. É membro ativo de uma equipe RH → retorna tenantUser (dono dos dados)
 * 3. Caso contrário → retorna o próprio User
 */

import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';
import { prisma } from '@/lib/prisma';

export async function getEffectiveDbUser() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;

  const ownUser = await syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    profileImageUrl: stackUser.profileImageUrl || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });

  // Se for membro de uma equipe, retorna o userId do dono (tenant)
  const membership = await prisma.rhTeamMember.findFirst({
    where: { stackUserId: stackUser.id, isActive: true },
    include: { tenantUser: true },
  });

  if (membership?.tenantUser) return membership.tenantUser;

  return ownUser;
}

/**
 * Retorna todos os userIds relevantes para queries históricas:
 * o userId do tenant + todos os userIds dos membros da equipe.
 * Garante que dados criados antes da migração também apareçam.
 */
export async function getEffectiveUserIds(tenantUserId: string): Promise<string[]> {
  // Busca membros ativos que já fizeram login (têm stackUserId)
  const members = await prisma.rhTeamMember.findMany({
    where: { tenantUserId, isActive: true, stackUserId: { not: null } },
    select: { stackUserId: true },
  });

  if (members.length === 0) return [tenantUserId];

  // Resolve os User.id de cada membro pelo seu stackUserId
  const memberUsers = await prisma.user.findMany({
    where: {
      stackUserId: { in: members.map(m => m.stackUserId!).filter(Boolean) },
    },
    select: { id: true },
  });

  return [tenantUserId, ...memberUsers.map(u => u.id)];
}
