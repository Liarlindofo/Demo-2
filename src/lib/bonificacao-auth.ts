import { getRhContext } from '@/lib/rh-auth';
import { checkToolPermission } from '@/lib/auth/toolPermissions';
import { SystemTool } from '@/types/admin';
import { stackServerApp } from '@/stack';

export async function getBonificacaoAuth() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;
  const ok = await checkToolPermission(stackUser.id, SystemTool.BONIFICACAO);
  if (!ok) return null;
  const ctx = await getRhContext();
  return ctx;
}
