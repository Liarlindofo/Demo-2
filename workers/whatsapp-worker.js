import { startClient } from "../src/wpp/index.js";
import logger from "../src/utils/logger.js";

const arg = process.argv.find((a) => a.startsWith("--userId="));

if (!arg) {
  console.error("❌ ERRO: USER_ID não informado nos argumentos");
  console.error("Argumentos recebidos:", process.argv);
  process.exit(1);
}

// Extrair userId com suporte a aspas
let userId = arg.split("=").slice(1).join("="); // Suporta userId com "="
userId = userId.replace(/^["']|["']$/g, ''); // Remove aspas se houver
userId = userId.trim();

if (!userId || userId.length === 0) {
  console.error("❌ ERRO: userId vazio após extração");
  console.error("Argumento original:", arg);
  process.exit(1);
}

// LOG CRÍTICO: Identificar qual worker está rodando
console.log('='.repeat(60));
console.log(`🚀 INICIANDO WHATSAPP WORKER`);
console.log(`📌 userId recebido: "${userId}"`);
console.log(`📌 userId type: ${typeof userId}`);
console.log(`📌 userId length: ${userId.length}`);
console.log(`📌 Process ID: ${process.pid}`);
console.log(`📌 Timestamp: ${new Date().toISOString()}`);
console.log('='.repeat(60));

logger.info(`[whatsapp-worker] Worker iniciado para userId: "${userId}" (PID: ${process.pid})`);

try {
  await startClient(userId);
  logger.success(`[whatsapp-worker] ✅ Cliente iniciado com sucesso para userId: "${userId}"`);
} catch (error) {
  logger.error(`[whatsapp-worker] ❌ Erro ao iniciar cliente para userId: "${userId}":`, error);
  process.exit(1);
}


