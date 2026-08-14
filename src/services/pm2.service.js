import { exec } from "child_process";
import { promisify } from "util";
import logger from "../utils/logger.js";
import { WhatsAppBotModel } from "../db/models.js";

const execAsync = promisify(exec);

function sanitizeUserId(userId) {
  return String(userId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
}

/** Nome PM2 legado do slot 1 (atendimento). */
function processName(userId) {
  return `whatsapp-${sanitizeUserId(userId)}`;
}

function sendOnlyProcessName(userId, slot = 2) {
  return `whatsapp-send-${sanitizeUserId(userId)}-s${slot}`;
}

/** Nome PM2 da sessão: slot 1 mantém o nome antigo; demais usam whatsapp-send-*-sN */
export function sessionProcessName(userId, slot) {
  if (Number(slot) === 1) return processName(userId);
  return sendOnlyProcessName(userId, slot);
}

/**
 * Porta do mini-HTTP de envio no worker.
 * Slot 2 permanece em 3012 (compat); slot 1 → 3011; slot 3 → 3013.
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

export async function startWhatsappWorker(userId) {
  return startSessionWorker(userId, 1);
}

/**
 * Sobe worker PM2 para qualquer slot, usando iaAtiva persistido no banco.
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
  const name = sessionProcessName(normalizedUserId, resolvedSlot);

  logger.info(
    `[startSessionWorker] userId="${normalizedUserId}" slot=${resolvedSlot} iaAtiva=${iaAtiva} mode=${mode} (${name})`,
  );

  try {
    const { stdout } = await execAsync(`pm2 describe ${name}`);
    if (stdout.includes("online")) {
      const health = await pingWorkerHealth(resolvedSlot);
      if (health.ok && health.data?.hasClient) {
        logger.warn(`[startSessionWorker] Worker ${name} já está online e com client.`);
        return { success: true, message: "Worker já está ativo", processName: name, slot: resolvedSlot, mode, iaAtiva };
      }
      logger.warn(
        `[startSessionWorker] Worker ${name} online mas mini-HTTP/client indisponível (${health.error || 'sem client'}). Reiniciando processo (sessão em disco preservada, sem force).`,
      );
      await execAsync(`pm2 restart "${name}"`);
      return {
        success: true,
        message: "Worker reiniciado para religar o client (QR não é necessário se o token ainda for válido)",
        processName: name,
        slot: resolvedSlot,
        mode,
        iaAtiva,
        restarted: true,
      };
    }
    await execAsync(`pm2 delete ${name}`).catch(() => {});
  } catch {}

  const command =
    `pm2 start workers/whatsapp-worker.js --name "${name}" --interpreter=node -- ` +
    `--userId="${normalizedUserId}" --slot=${resolvedSlot} --mode=${mode}`;

  logger.info(`[startSessionWorker] Executando: ${command}`);
  await execAsync(command);

  return { success: true, processName: name, slot: resolvedSlot, mode, iaAtiva };
}

export async function stopSessionWorker(userId, slot = 1) {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error(`userId inválido: ${userId}`);
  }

  const normalizedUserId = String(userId).trim();
  const resolvedSlot = Number(slot) || 1;
  const name = sessionProcessName(normalizedUserId, resolvedSlot);

  try {
    await execAsync(`pm2 stop "${name}"`).catch(() => {});
    await execAsync(`pm2 delete "${name}"`);
    logger.success(`[stopSessionWorker] Worker ${name} parado/removido`);
  } catch {
    logger.warn(`[stopSessionWorker] Worker ${name} não encontrado ou já parado`);
  }

  if (resolvedSlot === 1) {
    const legacy = processName(normalizedUserId);
    if (legacy !== name) {
      try {
        await execAsync(`pm2 stop "${legacy}"`).catch(() => {});
        await execAsync(`pm2 delete "${legacy}"`);
      } catch {}
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
