import { getRhContext } from '@/lib/rh-auth';
import { checkToolPermission } from '@/lib/auth/toolPermissions';
import { SystemTool } from '@/types/admin';
import { stackServerApp } from '@/stack';

/**
 * Auth do Plano de Bonificação (módulo dentro do RH).
 * Dados sempre no tenant (`getRhContext().userId`).
 * Acesso: tool RH, membro da equipe RH, ou flag legada BONIFICACAO.
 */
export async function getBonificacaoAuth() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;

  const ctx = await getRhContext();
  if (!ctx) return null;

  const [hasRh, hasLegacyBonif] = await Promise.all([
    checkToolPermission(stackUser.id, SystemTool.RH),
    checkToolPermission(stackUser.id, SystemTool.BONIFICACAO),
  ]);

  // Membro ativo de equipe RH (mesmo sem flag SystemTool.RH no admin)
  const isRhTeamMember = ctx.memberId != null;

  if (!hasRh && !hasLegacyBonif && !isRhTeamMember) return null;

  return ctx;
}
