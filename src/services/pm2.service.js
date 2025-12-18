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

  // 🔒 GARANTIA: Verificar se JÁ existe worker rodando para este userId
  try {
    const { stdout } = await execAsync(`pm2 describe ${name}`);
    if (stdout.includes("online")) {
      logger.warn(`[startWhatsappWorker] ⚠️ Worker ${name} já está online. Não subindo novo worker.`);
      return { success: true, message: "Worker já está ativo" };
    }
    if (stdout.includes("stopping") || stdout.includes("stopped")) {
      logger.warn(`[startWhatsappWorker] ⚠️ Worker ${name} está parando. Aguardando...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Tentar deletar se ainda existir
      await execAsync(`pm2 delete ${name}`).catch(() => {});
    }
  } catch {}

  // 🔒 GARANTIA EXTRA: Verificar se há múltiplos processos com o mesmo nome
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
      // Se chegou aqui, todos os processos estão parados, limpar
      await execAsync(`pm2 delete ${name}`).catch(() => {});
    }
  } catch (err) {
    logger.warn(`[startWhatsappWorker] Não foi possível verificar lista de processos: ${err.message}`);
  }

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
    // Tentar parada graciosa primeiro (permite logout/cleanup via SIGINT/SIGTERM)
    await execAsync(`pm2 stop "${name}"`).catch(() => {});
    await execAsync(`pm2 delete "${name}"`);
    logger.success(`[stopWhatsappWorker] ✅ Worker ${name} parado/removido com sucesso`);
  } catch (error) {
    // Para o fluxo da API, o stop deve ser SEMPRE idempotente.
    // Se o processo já não existir ou o PM2 retornar erro,
    // consideramos como "parado" e não propagamos o erro.
    logger.warn(`[stopWhatsappWorker] Worker ${name} não encontrado ou já parado (isso é normal)`);
    return;
  }
}


