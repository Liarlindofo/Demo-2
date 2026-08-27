import { exec } from "child_process";
import { promisify } from "util";
import logger from "../utils/logger.js";
import { WhatsAppBotModel } from "../db/models.js";

const execAsync = promisify(exec);

function sanitizeUserId(userId) {
  return String(userId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
}

/** Nome PM2 legado do slot 1 (atendimento) — WPPConnect. */
function processName(userId) {
  return `whatsapp-${sanitizeUserId(userId)}`;
}

function sendOnlyProcessName(userId, slot = 2) {
  return `whatsapp-send-${sanitizeUserId(userId)}-s${slot}`;
}

/** Nome PM2 da sessão WPP: slot 1 mantém o nome antigo; demais usam whatsapp-send-*-sN */
export function sessionProcessName(userId, slot) {
  if (Number(slot) === 1) return processName(userId);
  return sendOnlyProcessName(userId, slot);
}

/** Nome PM2 da sessão Baileys real (nunca colide com WPP nem com whatsapp-baileys-teste). */
export function baileysSessionProcessName(userId, slot) {
  return `whatsapp-baileys-${sanitizeUserId(userId)}-slot${Number(slot) || 1}`;
}

export function resolveProvider(bot) {
  const p = String(bot?.provider || 'wpp').trim().toLowerCase();
  return p === 'baileys' ? 'baileys' : 'wpp';
}

/**
 * Porta do mini-HTTP de envio no worker.
 * Slot 2 permanece em 3012 (compat); slot 1 → 3011; slot 3 → 3013.
 * Igual para WPP e Baileys (API /send não muda).
 */
export function sendWorkerPort(slot) {
  const base = Number(process.env.SEND_ONLY_HTTP_PORT || 3012);
  const n = Number(slot);
  if (!Number.isFinite(n) || n < 1) return base;
  return base + (n - 2);
}

export function workerHttpOrigin(slot) {
  return `http://127.0.0.1:${sendWorkerPort(slot)}`;
}

export async function pingWorkerHealth(slot, timeoutMs = 2000) {
  const url = `${workerHttpOrigin(slot)}/health`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return { ok: false, url };
    const data = await res.json().catch(() => ({}));
    return { ok: true, url, data };
  } catch (err) {
    return { ok: false, url, error: err?.message || String(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function pm2DeleteQuiet(name) {
  try {
    await execAsync(`pm2 delete "${name}"`);
  } catch {
    /* processo inexistente */
  }
}

async function pm2StopDelete(name) {
  try {
    await execAsync(`pm2 stop "${name}"`).catch(() => {});
    await execAsync(`pm2 delete "${name}"`);
    logger.success(`[pm2] Worker ${name} parado/removido`);
  } catch {
    logger.warn(`[pm2] Worker ${name} não encontrado ou já parado`);
  }
}

export async function startWhatsappWorker(userId) {
  return startSessionWorker(userId, 1);
}

/**
 * Sobe worker PM2 para qualquer slot, usando iaAtiva + provider persistidos no banco.
 * provider='wpp' (default): workers/whatsapp-worker.js — comportamento idêntico ao anterior.
 * provider='baileys': workers/whatsapp-baileys-worker.js
 */
export async function startSessionWorker(userId, slot = 1) {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error(`userId inválido: ${userId}`);
  }

  const normalizedUserId = String(userId).trim();
  const resolvedSlot = Number(slot);
  if (!Number.isFinite(resolvedSlot) || resolvedSlot < 1) {
    throw new Error(`slot inválido: ${slot}`);
  }

  const bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, resolvedSlot);
  const provider = resolveProvider(bot);

  let iaAtiva;
  if (typeof bot?.iaAtiva === 'boolean') {
    iaAtiva = bot.iaAtiva;
  } else {
    // Legado sem backfill: slot 1 = IA, demais = somente envio — e persiste pra não assumir de novo
    iaAtiva = resolvedSlot === 1;
    await WhatsAppBotModel.saveDurableConfig(normalizedUserId, resolvedSlot, {
      iaAtiva,
      label: bot?.label || (iaAtiva ? 'Atendimento' : resolvedSlot === 2 ? 'Somente envio' : `Sessão ${resolvedSlot}`),
    }).catch(() => {});
  }
  const mode = iaAtiva ? 'atendimento' : 'somente-envio';

  const wppName = sessionProcessName(normalizedUserId, resolvedSlot);
  const baileysName = baileysSessionProcessName(normalizedUserId, resolvedSlot);
  const name = provider === 'baileys' ? baileysName : wppName;
  const otherName = provider === 'baileys' ? wppName : baileysName;

  logger.info(
    `[startSessionWorker] userId="${normalizedUserId}" slot=${resolvedSlot} provider=${provider} iaAtiva=${iaAtiva} mode=${mode} (${name})`,
  );

  // Libera porta HTTP: o outro motor não pode ficar vivo no mesmo slot
  await pm2DeleteQuiet(otherName);
  if (resolvedSlot === 1 && provider === 'baileys') {
    // slot 1 WPP legado às vezes só com processName
    const legacy = processName(normalizedUserId);
    if (legacy !== otherName) await pm2DeleteQuiet(legacy);
  }

  try {
    const { stdout } = await execAsync(`pm2 describe ${name}`);
    if (stdout.includes("online")) {
      const health = await pingWorkerHealth(resolvedSlot);
      if (health.ok && health.data?.hasClient) {
        logger.warn(`[startSessionWorker] Worker ${name} já está online e com client.`);
        return {
          success: true,
          message: "Worker já está ativo",
          processName: name,
          slot: resolvedSlot,
          mode,
          iaAtiva,
          provider,
        };
      }
      if (health.ok) {
        logger.warn(`[startSessionWorker] Worker ${name} online, mini-HTTP ok, client ainda conectando.`);
        return {
          success: true,
          message: "Worker ativo; client ainda restaurando sessão em disco",
          processName: name,
          slot: resolvedSlot,
          mode,
          iaAtiva,
          provider,
          booting: true,
        };
      }
      logger.warn(
        `[startSessionWorker] Worker ${name} online mas mini-HTTP morto (${health.error || 'sem resposta'}). Reiniciando processo (pasta de sessão preservada, sem force).`,
      );
      await execAsync(`pm2 restart "${name}"`);
      return {
        success: true,
        message: "Worker reiniciado para religar o client (QR não é necessário se o token ainda for válido)",
        processName: name,
        slot: resolvedSlot,
        mode,
        iaAtiva,
        provider,
        restarted: true,
      };
    }
    await execAsync(`pm2 delete ${name}`).catch(() => {});
  } catch {}

  const script =
    provider === 'baileys'
      ? 'workers/whatsapp-baileys-worker.js'
      : 'workers/whatsapp-worker.js';

  const command =
    `pm2 start ${script} --name "${name}" --interpreter=node -- ` +
    `--userId="${normalizedUserId}" --slot=${resolvedSlot} --mode=${mode}`;

  logger.info(`[startSessionWorker] Executando: ${command}`);
  await execAsync(command);

  return { success: true, processName: name, slot: resolvedSlot, mode, iaAtiva, provider };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Garante worker + client em memória, reusando a pasta de sessão (sem force/QR).
 */
export async function ensureSessionWorker(userId, slot, { waitMs = 45000 } = {}) {
  const normalizedUserId = String(userId || '').trim();
  const resolvedSlot = Number(slot);
  const first = await pingWorkerHealth(resolvedSlot);

  if (!(first.ok && first.data?.hasClient)) {
    await startSessionWorker(normalizedUserId, resolvedSlot);
  }

  const deadline = Date.now() + waitMs;
  let last = await pingWorkerHealth(resolvedSlot, 3000);
  while (Date.now() < deadline) {
    if (last.ok && last.data?.hasClient) {
      return { ok: true, slot: resolvedSlot, health: last };
    }
    await sleep(1500);
    last = await pingWorkerHealth(resolvedSlot, 3000);
  }

  return {
    ok: Boolean(last.ok && last.data?.hasClient),
    slot: resolvedSlot,
    health: last,
    timedOut: true,
  };
}

export async function stopSessionWorker(userId, slot = 1) {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error(`userId inválido: ${userId}`);
  }

  const normalizedUserId = String(userId).trim();
  const resolvedSlot = Number(slot) || 1;

  const bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, resolvedSlot).catch(() => null);
  const provider = resolveProvider(bot);

  const wppName = sessionProcessName(normalizedUserId, resolvedSlot);
  const baileysName = baileysSessionProcessName(normalizedUserId, resolvedSlot);

  // Para o motor atual e o outro (evita órfão após troca de provider)
  await pm2StopDelete(provider === 'baileys' ? baileysName : wppName);
  await pm2StopDelete(provider === 'baileys' ? wppName : baileysName);

  if (resolvedSlot === 1) {
    const legacy = processName(normalizedUserId);
    if (legacy !== wppName) {
      await pm2StopDelete(legacy);
    }
  }
}

export async function startSendOnlyWorker(userId, slot = 2) {
  return startSessionWorker(userId, slot);
}

export async function stopSendOnlyWorker(userId, slot = 2) {
  return stopSessionWorker(userId, slot);
}

export async function stopWhatsappWorker(userId) {
  return stopSessionWorker(userId, 1);
}
