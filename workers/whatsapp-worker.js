import dotenv from 'dotenv';

// Carregar variáveis de ambiente ANTES de importar outros módulos
dotenv.config();

import { startClient, stopClient } from "../src/wpp/index.js";
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

// ⚠️ IMPORTANTE: Worker deve ser "long-lived" (processo duradouro)
// NÃO encerrar sessão automaticamente em SIGINT/SIGTERM/erros
// O PM2 gerencia o ciclo de vida do processo, mas o client WhatsApp
// deve permanecer ATIVO até comando manual explícito de desconectar

// Graceful shutdown: quando o PM2 parar/deletar, apenas logar e sair
// NÃO chamar stopClient() automaticamente
const shutdown = async (signal) => {
  logger.warn(`[whatsapp-worker] ${signal} recebido. Mantendo sessão ativa para userId="${userId}"`);
  logger.info(`[whatsapp-worker] ⚠️ Worker sendo finalizado, mas cliente WhatsApp permanece em memória.`);
  logger.info(`[whatsapp-worker] ℹ️ Use comando explícito de desconectar para remover a sessão.`);
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Garantir que erros não capturados sejam logados, mas NÃO matar a sessão
process.on('uncaughtException', async (error) => {
  logger.error(`[whatsapp-worker] ❌ Exceção não capturada (sessão mantida):`, error);
  // NÃO chamar stopClient() - apenas log do erro
  // A sessão continua ativa para não interromper atendimento
});

process.on('unhandledRejection', async (reason) => {
  logger.error(`[whatsapp-worker] ❌ Promise rejection não tratada (sessão mantida):`, reason);
  // NÃO chamar stopClient() - apenas log do erro
  // A sessão continua ativa para não interromper atendimento
});

try {
  logger.info(`[whatsapp-worker] 🚀 Chamando startClient(${userId})...`);
  const result = await startClient(userId);
  logger.success(`[whatsapp-worker] ✅ startClient() retornou com sucesso para userId: "${userId}"`);
  logger.info(`[whatsapp-worker] 📦 Resultado:`, result);
  logger.success(`[whatsapp-worker] ✅ Cliente iniciado com sucesso para userId: "${userId}"`);
  
  // IMPORTANTE: Não sair do processo! O startClient é assíncrono e o WPPConnect
  // continua rodando em background. O worker deve ficar vivo para manter o processo.
  // O WPPConnect cria event listeners que mantêm o processo vivo automaticamente.
  logger.info(`[whatsapp-worker] ✅ Worker mantido vivo. WPPConnect rodando em background.`);
  
} catch (error) {
  logger.error(`[whatsapp-worker] ❌ ERRO ao iniciar cliente para userId: "${userId}"`);
  logger.error(`[whatsapp-worker] ❌ Tipo do erro: ${error.constructor.name}`);
  logger.error(`[whatsapp-worker] ❌ Mensagem: ${error.message}`);
  logger.error(`[whatsapp-worker] ❌ Stack trace:`, error.stack);
  logger.error(`[whatsapp-worker] ❌ Erro completo:`, error);
  
  // NÃO matar o processo! Deixa o PM2 gerenciar os restarts.
  // Se matar com exit(1), o PM2 vai reiniciar infinitamente.
  logger.warn(`[whatsapp-worker] ⚠️ Erro capturado, mas mantendo processo vivo. PM2 vai gerenciar.`);
}


