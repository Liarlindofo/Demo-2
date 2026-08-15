import { prisma } from '@/lib/prisma';

export type WhatsAppSessionDto = {
  slot: number;
  label: string;
  status: string;
  isConnected: boolean;
  isActive: boolean;
  connectedNumber: string | null;
  qrCode: string | null;
  iaAtiva: boolean;
  iaPrompt: string | null;
  monitorarReclamacoes: boolean;
  updatedAt: string | null;
};

/** Número real: ignora valores curtos tipo "1" (slot vazando como telefone). */
export function realPhoneNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}

export function mapBotToDto(bot: {
  slot: number;
  label: string | null;
  isConnected: boolean;
  qrCode: string | null;
  connectedNumber: string | null;
  iaAtiva: boolean | null;
  iaPrompt: string | null;
  monitorarReclamacoes?: boolean | null;
  updatedAt: Date;
}): WhatsAppSessionDto {
  const qrCode = bot.qrCode ?? null;
  const isConnected = Boolean(bot.isConnected);
  let status = 'DISCONNECTED';
  if (isConnected) status = 'CONNECTED';
  else if (qrCode) status = 'QRCODE';
  else status = 'CONNECTING';

  return {
    slot: bot.slot,
    label: (bot.label && bot.label.trim()) || `Sessão ${bot.slot}`,
    status,
    isConnected,
    isActive: isConnected || Boolean(qrCode),
    connectedNumber: realPhoneNumber(bot.connectedNumber),
    qrCode,
    iaAtiva: bot.iaAtiva === true,
    iaPrompt: bot.iaPrompt ?? null,
    monitorarReclamacoes: bot.monitorarReclamacoes === true,
    updatedAt: bot.updatedAt.toISOString(),
  };
}

export async function listSessionsForStackUser(stackUserId: string) {
  const bots = await prisma.whatsAppBot.findMany({
    where: { userId: stackUserId },
    orderBy: { slot: 'asc' },
  });
  return bots.map(mapBotToDto);
}

/**
 * IDs de `stack_users` que pertencem ao tenant (`users.id` / CUID da API key).
 *
 * WhatsAppBot.userId → stack_users.id (UUID)
 * ServiceApiKey / ReportDefinition.userId → users.id (CUID)
 *
 * O vínculo pode estar em User.stackUserId, StackUser.userId, ou só no e-mail.
 */
export async function resolveStackUserIdsForTenant(tenantUserId: string): Promise<string[]> {
  const ids = new Set<string>();
  if (!tenantUserId) return [];

  const asStack = await prisma.stackUser.findUnique({
    where: { id: tenantUserId },
    select: { id: true },
  });
  if (asStack) ids.add(asStack.id);

  const user = await prisma.user.findUnique({
    where: { id: tenantUserId },
    select: { stackUserId: true, email: true },
  });
  if (user?.stackUserId) ids.add(user.stackUserId);

  const linked = await prisma.stackUser.findMany({
    where: { userId: tenantUserId },
    select: { id: true },
  });
  for (const row of linked) ids.add(row.id);

  if (user?.email) {
    const byEmail = await prisma.stackUser.findMany({
      where: { primaryEmail: { equals: user.email, mode: 'insensitive' } },
      select: { id: true },
    });
    for (const row of byEmail) ids.add(row.id);
  }

  return [...ids];
}

export async function getTenantStackUserId(tenantUserId: string): Promise<string | null> {
  const ids = await resolveStackUserIdsForTenant(tenantUserId);
  return ids[0] ?? null;
}

export async function findWhatsAppBotForTenant(tenantUserId: string, slot: number) {
  const stackIds = await resolveStackUserIdsForTenant(tenantUserId);
  if (stackIds.length === 0) return null;

  return prisma.whatsAppBot.findFirst({
    where: { userId: { in: stackIds }, slot },
    select: {
      userId: true,
      slot: true,
      isConnected: true,
      label: true,
    },
  });
}

/**
 * Sessões visíveis para o ator: as do Stack Auth logado (mesmo critério de
 * /connections) + as do tenant, se o vínculo User.stackUserId existir.
 */
export async function listSessionsForActor(params: {
  tenantUserId: string;
  stackUserId: string;
}) {
  const ids = [...new Set(
    [params.stackUserId, ...(await resolveStackUserIdsForTenant(params.tenantUserId))].filter(
      (id): id is string => Boolean(id),
    ),
  )];

  const bySlot = new Map<number, WhatsAppSessionDto>();
  for (const id of ids) {
    const list = await listSessionsForStackUser(id);
    for (const session of list) {
      if (!bySlot.has(session.slot)) bySlot.set(session.slot, session);
    }
  }
  return [...bySlot.values()].sort((a, b) => a.slot - b.slot);
}

export async function nextAvailableSlot(stackUserId: string): Promise<number> {
  const bots = await prisma.whatsAppBot.findMany({
    where: { userId: stackUserId },
    select: { slot: true },
    orderBy: { slot: 'asc' },
  });
  const used = new Set(bots.map((b) => b.slot));
  let slot = 1;
  while (used.has(slot)) slot += 1;
  return slot;
}
