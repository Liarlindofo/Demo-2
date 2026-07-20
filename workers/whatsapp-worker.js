import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Obter diretório atual (compatível com ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tentar carregar .env de múltiplos locais
const envPaths = [
  resolve(__dirname, '..', '.env'),     // Raiz do projeto (subindo um nível do workers/)
  resolve(process.cwd(), '.env'),       // Diretório de trabalho atual
  '/var/www/I/.env',                    // Caminho absoluto na VPS
  '/var/www/Demo-2/.env',               // Caminho alternativo na VPS
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log(`[worker] ✅ Arquivo .env carregado de: ${envPath}`);
      envLoaded = true;
      break;
    }
  }
}

// Se não encontrou em nenhum lugar, tentar carregar do diretório padrão
if (!envLoaded) {
  const result = dotenv.config();
  if (result.error) {
    console.warn(`[worker] ⚠️ Aviso: Não foi possível carregar arquivo .env`);
    console.warn(`[worker] Tentou os seguintes caminhos:`, envPaths);
  } else {
    console.log(`[worker] ✅ Arquivo .env carregado do diretório padrão`);
  }
}

// Debug: Verificar se a API key foi carregada
const apiKey = process.env.OPENROUTER_API_KEY;
if (apiKey) {
  const maskedKey = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4);
  console.log(`[worker] ✅ OPENROUTER_API_KEY carregada: ${maskedKey}`);
} else {
  console.error(`[worker] ❌ ERRO: OPENROUTER_API_KEY NÃO encontrada!`);
}

import { startClient, stopClient } from "../src/wpp/index.js";
import { initScheduler } from "../src/tarefas/scheduler.js";
import sessionManager from "../src/wpp/sessionManager.js";
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

// Rede de segurança global — apenas logar, nunca encerrar o processo
process.on('unhandledRejection', (reason) =>
  logger.error('[unhandledRejection]', reason?.stack || String(reason)));

process.on('uncaughtException', (err) =>
  logger.error('[uncaughtException]', err?.stack || String(err)));

try {
  logger.info(`[whatsapp-worker] 🚀 Chamando startClient(${userId})...`);
  const result = await startClient(userId);
  logger.success(`[whatsapp-worker] ✅ startClient() retornou com sucesso para userId: "${userId}"`);
  logger.info(`[whatsapp-worker] 📦 Resultado:`, result);
  logger.success(`[whatsapp-worker] ✅ Cliente iniciado com sucesso para userId: "${userId}"`);

  // Inicializar scheduler de tarefas para este worker/tenant.
  // getClient retorna o cliente WPPConnect ativo (slot 1 por padrão).
  // Se ainda não está conectado, as chamadas do scheduler simplesmente
  // retornarão null e serão silenciadas até a próxima execução.
  initScheduler(userId, () => sessionManager.getClient(userId, 1));
  logger.info(`[whatsapp-worker] ✅ Scheduler de tarefas inicializado para userId: "${userId}"`);

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


