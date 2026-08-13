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

export async function getTenantStackUserId(tenantUserId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: tenantUserId },
    select: { stackUserId: true },
  });
  if (user?.stackUserId) return user.stackUserId;

  const viaStack = await prisma.stackUser.findFirst({
    where: { userId: tenantUserId },
    select: { id: true },
  });
  return viaStack?.id ?? null;
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
    [params.stackUserId, await getTenantStackUserId(params.tenantUserId)].filter(
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
