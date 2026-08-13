import { exec } from "child_process";
import { promisify } from "util";
import logger from "../utils/logger.js";

const execAsync = promisify(exec);

function processName(userId) {
  const sanitized = String(userId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `whatsapp-${sanitized}`;
}

function sendOnlyProcessName(userId, slot = 2) {
  const sanitized = String(userId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `whatsapp-send-${sanitized}-s${slot}`;
}

export async function startWhatsappWorker(userId) {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    logger.error(`[startWhatsappWorker] userId inválido: ${userId}`);
    throw new Error(`userId inválido: ${userId}`);
  }

  const normalizedUserId = String(userId).trim();
  const name = processName(normalizedUserId);

  logger.info(`[startWhatsappWorker] Iniciando worker para userId: "${normalizedUserId}" (processo: ${name})`);

  try {
    const { stdout } = await execAsync(`pm2 describe ${name}`);
    if (stdout.includes("online")) {
      logger.warn(`[startWhatsappWorker] ⚠️ Worker ${name} já está online. Não subindo novo worker.`);
      return { success: true, message: "Worker já está ativo" };
    }
    if (stdout.includes("stopping") || stdout.includes("stopped")) {
      logger.warn(`[startWhatsappWorker] ⚠️ Worker ${name} está parando. Aguardando...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await execAsync(`pm2 delete ${name}`).catch(() => {});
    }
  } catch {}

  try {
    const { stdout: listOutput } = await execAsync(`pm2 jlist`);
    const processes = JSON.parse(listOutput);
    const matchingProcesses = processes.filter(p => p.name === name);

    if (matchingProcesses.length > 0) {
      logger.warn(`[startWhatsappWorker] ⚠️ Encontrados ${matchingProcesses.length} processo(s) com nome ${name}. Limpando...`);
      for (const proc of matchingProcesses) {
        if (proc.pm2_env && proc.pm2_env.status === 'online') {
          logger.warn(`[startWhatsappWorker] ⚠️ Processo ${name} (PID ${proc.pid}) já está online. Não subindo novo worker.`);
          return { success: true, message: "Worker já está ativo" };
        }
      }
      await execAsync(`pm2 delete ${name}`).catch(() => {});
    }
  } catch (err) {
    logger.warn(`[startWhatsappWorker] Não foi possível verificar lista de processos: ${err.message}`);
  }

  const command = `pm2 start workers/whatsapp-worker.js --name "${name}" --interpreter=node -- --userId="${normalizedUserId}"`;

  logger.info(`[startWhatsappWorker] Executando comando: ${command}`);

  await execAsync(command);

  logger.success(`[startWhatsappWorker] ✅ Worker ${name} iniciado com sucesso para userId: ${normalizedUserId}`);

  return { success: true };
}

/**
 * Sobe worker PM2 separado para sessão somente-envio (não mexe no bot de atendimento).
 */
export async function startSendOnlyWorker(userId, slot = 2) {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error(`userId inválido: ${userId}`);
  }

  const normalizedUserId = String(userId).trim();
  const name = sendOnlyProcessName(normalizedUserId, slot);

  logger.info(`[startSendOnlyWorker] Iniciando worker somente-envio userId="${normalizedUserId}" slot=${slot} (${name})`);

  try {
    const { stdout } = await execAsync(`pm2 describe ${name}`);
    if (stdout.includes("online")) {
      return { success: true, message: "Worker somente-envio já está ativo", processName: name, slot };
    }
    await execAsync(`pm2 delete ${name}`).catch(() => {});
  } catch {}

  const command =
    `pm2 start workers/whatsapp-worker.js --name "${name}" --interpreter=node -- ` +
    `--userId="${normalizedUserId}" --slot=${slot} --mode=somente-envio`;

  logger.info(`[startSendOnlyWorker] Executando: ${command}`);
  await execAsync(command);

  return { success: true, processName: name, slot, mode: 'somente-envio' };
}

export async function stopSendOnlyWorker(userId, slot = 2) {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error(`userId inválido: ${userId}`);
  }

  const normalizedUserId = String(userId).trim();
  const name = sendOnlyProcessName(normalizedUserId, slot);

  try {
    await execAsync(`pm2 stop "${name}"`).catch(() => {});
    await execAsync(`pm2 delete "${name}"`);
    logger.success(`[stopSendOnlyWorker] ✅ Worker ${name} parado/removido`);
  } catch {
    logger.warn(`[stopSendOnlyWorker] Worker ${name} não encontrado ou já parado`);
  }
}

export async function stopWhatsappWorker(userId) {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    logger.error(`[stopWhatsappWorker] userId inválido: ${userId}`);
    throw new Error(`userId inválido: ${userId}`);
  }

  const normalizedUserId = String(userId).trim();
  const name = processName(normalizedUserId);

  logger.info(`[stopWhatsappWorker] Parando worker para userId: "${normalizedUserId}" (processo: ${name})`);

  try {
    await execAsync(`pm2 stop "${name}"`).catch(() => {});
    await execAsync(`pm2 delete "${name}"`);
    logger.success(`[stopWhatsappWorker] ✅ Worker ${name} parado/removido com sucesso`);
  } catch (error) {
    logger.warn(`[stopWhatsappWorker] Worker ${name} não encontrado ou já parado (isso é normal)`);
    return;
  }
}
