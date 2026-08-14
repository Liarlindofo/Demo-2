import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

/**
 * User.id da sessão Stack Auth atual (conta realmente logada).
 *
 * Não remapeia para RhTeamMember.tenantUserId. Use isto para dados
 * isolados por conta (relatórios, Saipos, WhatsApp). Para dados RH
 * compartilhados no tenant, use rhGetUser().
 */
export async function getSessionDbUser() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;
  return syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    profileImageUrl: stackUser.profileImageUrl || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });
}

/** @deprecated Prefer getSessionDbUser — mesmo comportamento (User da sessão). */
export const getRhDbUser = getSessionDbUser;
