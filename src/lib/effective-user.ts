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

  // Sincroniza / cria o User do login atual
  const ownUser = await syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    profileImageUrl: stackUser.profileImageUrl || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });

  // Verifica se este usuário é membro de uma equipe RH ativa
  const membership = await prisma.rhTeamMember.findFirst({
    where: { stackUserId: stackUser.id, isActive: true },
    include: { tenantUser: true },
  });

  // Se for membro, retorna o dono dos dados (tenant) para que a query use o userId correto
  if (membership?.tenantUser) return membership.tenantUser;

  return ownUser;
}
