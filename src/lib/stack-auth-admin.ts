import { stackServerApp } from '@/stack';

export interface StackAuthAdminUpdate {
  primaryEmail?: string;
  displayName?: string;
  password?: string;
}

/**
 * Atualiza perfil/senha no Stack Auth (fonte real do login).
 * O painel admin antes só gravava no Prisma local — login continuava com dados antigos.
 */
export async function updateStackAuthUserFromAdmin(
  stackUserId: string,
  data: StackAuthAdminUpdate,
): Promise<void> {
  const saUser = await stackServerApp.getUser(stackUserId);
  if (!saUser) {
    throw new Error('Usuário não encontrado no Stack Auth');
  }

  const update: Record<string, unknown> = {};

  if (data.displayName !== undefined) {
    update.displayName = data.displayName;
  }

  if (data.primaryEmail !== undefined) {
    update.primaryEmail = data.primaryEmail.trim();
    update.primaryEmailVerified = true;
    update.primaryEmailAuthEnabled = true;
  }

  if (data.password !== undefined) {
    update.password = data.password;
  }

  if (Object.keys(update).length === 0) {
    return;
  }

  await saUser.update(update);
}

export function stackAuthErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/already exists|já existe|duplicate|unique/i.test(msg)) {
    return 'Já existe um usuário com este email';
  }
  if (/password|senha/i.test(msg) && /requirement|caracter|short|mínim/i.test(msg)) {
    return 'Senha não atende aos requisitos do sistema de autenticação';
  }
  return msg || 'Erro ao atualizar no Stack Auth';
}
