import { getRhContext, type RhContext } from '@/lib/rh-auth';
import { NextResponse } from 'next/server';

/**
 * Contexto do tenant para o módulo Central de Relatórios.
 * Membros de equipe (RhTeamMember) veem/gravam dados do dono da empresa.
 */
export async function getReportsTenantContext(): Promise<RhContext | null> {
  return getRhContext();
}

export async function requireReportsTenantAuth(): Promise<
  { ctx: RhContext; error: null } | { ctx: null; error: NextResponse }
> {
  const ctx = await getRhContext();
  if (!ctx) {
    return {
      ctx: null,
      error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }),
    };
  }
  return { ctx, error: null };
}

/** Atalho: User.id (CUID) do tenant — dono ou empresa do membro RH. */
export async function getReportsTenantUserId(): Promise<string | null> {
  const ctx = await getRhContext();
  return ctx?.userId ?? null;
}
