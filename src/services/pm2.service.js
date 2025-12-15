import { exec } from "child_process";
import { promisify } from "util";
import logger from "../utils/logger.js";

const execAsync = promisify(exec);

function processName(userId) {
  // Sanitizar userId para evitar problemas com caracteres especiais
  const sanitized = String(userId).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `whatsapp-${sanitized}`;
}

export async function startWhatsappWorker(userId) {
  // VALIDAÇÃO CRÍTICA: Garantir que userId é válido
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
      logger.info(`[startWhatsappWorker] Worker ${name} já está online`);
      return { success: true, message: "Worker já ativo" };
    }
  } catch {}

  // IMPORTANTE: Usar aspas para proteger o userId caso tenha caracteres especiais
  // E garantir que o userId seja passado corretamente para o worker
  const command = `pm2 start workers/whatsapp-worker.js --name "${name}" --interpreter=node -- --userId="${normalizedUserId}"`;
  
  logger.info(`[startWhatsappWorker] Executando comando: ${command}`);
  
  await execAsync(command);

  logger.success(`[startWhatsappWorker] ✅ Worker ${name} iniciado com sucesso para userId: ${normalizedUserId}`);

  return { success: true };
}

export async function stopWhatsappWorker(userId) {
  // VALIDAÇÃO CRÍTICA
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    logger.error(`[stopWhatsappWorker] userId inválido: ${userId}`);
    throw new Error(`userId inválido: ${userId}`);
  }

  const normalizedUserId = String(userId).trim();
  const name = processName(normalizedUserId);

  logger.info(`[stopWhatsappWorker] Parando worker para userId: "${normalizedUserId}" (processo: ${name})`);

  try {
    await execAsync(`pm2 delete "${name}"`);
    logger.success(`[stopWhatsappWorker] ✅ Worker ${name} parado com sucesso`);
  } catch (error) {
    // Para o fluxo da API, o stop deve ser SEMPRE idempotente.
    // Se o processo já não existir ou o PM2 retornar erro,
    // consideramos como "parado" e não propagamos o erro.
    logger.warn(`[stopWhatsappWorker] Worker ${name} não encontrado ou já parado (isso é normal)`);
    return;
  }
}


