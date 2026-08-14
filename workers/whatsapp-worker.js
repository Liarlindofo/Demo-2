import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPaths = [
  resolve(__dirname, '..', '.env'),
  resolve(process.cwd(), '.env'),
  '/var/www/I/.env',
  '/var/www/Demo-2/.env',
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

if (!envLoaded) {
  const result = dotenv.config();
  if (result.error) {
    console.warn(`[worker] ⚠️ Aviso: Não foi possível carregar arquivo .env`);
  }
}

import { startClient, sendMessage, listGroups } from "../src/wpp/index.js";
import { initScheduler } from "../src/tarefas/scheduler.js";
import sessionManager from "../src/wpp/sessionManager.js";
import logger from "../src/utils/logger.js";
import http from "http";
import { sendWorkerPort } from "../src/services/pm2.service.js";

function parseArg(name) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return null;
  let value = arg.split("=").slice(1).join("=");
  value = value.replace(/^["']|["']$/g, '').trim();
  return value || null;
}

const userId = parseArg('userId');
const slotArg = parseArg('slot');
const modeArg = parseArg('mode');

if (!userId) {
  console.error("❌ ERRO: --userId=... não informado");
  console.error("Uso atendimento:  node workers/whatsapp-worker.js --userId=XXX");
  console.error("Uso somente-envio: node workers/whatsapp-worker.js --userId=XXX --slot=2 --mode=somente-envio");
  process.exit(1);
}

const mode = modeArg === 'somente-envio' ? 'somente-envio' : 'atendimento';
const slot = slotArg
  ? parseInt(slotArg, 10)
  : (mode === 'somente-envio' ? 2 : 1);

if (!Number.isFinite(slot) || slot < 1) {
  console.error(`❌ ERRO: slot inválido: ${slotArg}`);
  process.exit(1);
}

console.log('='.repeat(60));
console.log(`🚀 INICIANDO WHATSAPP WORKER`);
console.log(`📌 userId: "${userId}"`);
console.log(`📌 slot: ${slot}`);
console.log(`📌 mode: ${mode}`);
console.log(`📌 Process ID: ${process.pid}`);
console.log(`📌 Timestamp: ${new Date().toISOString()}`);
console.log('='.repeat(60));

logger.info(`[whatsapp-worker] Worker iniciado userId="${userId}" slot=${slot} mode=${mode} (PID: ${process.pid})`);

const shutdown = async (signal) => {
  logger.warn(`[whatsapp-worker] ${signal} recebido. Mantendo sessão ativa para userId="${userId}" slot=${slot}`);
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) =>
  logger.error('[unhandledRejection]', reason?.stack || String(reason)));
process.on('uncaughtException', (err) =>
  logger.error('[uncaughtException]', err?.stack || String(err)));

try {
  // HTTP primeiro: a API consegue /health mesmo enquanto o Chromium restaura o token.
  startSendOnlyHttpServer(userId, slot);

  logger.info(`[whatsapp-worker] 🚀 Chamando startClient(${userId}, ${slot}, { mode: '${mode}' })...`);
  const result = await startClient(userId, slot, { mode });
  logger.success(`[whatsapp-worker] ✅ startClient() retornou:`, result);

  // Scheduler roda em todos os workers; cada job só dispara se este slot
  // for o configurado em User.tarefasSessionSlot (evita duplicar digest).
  initScheduler(userId, slot, () => sessionManager.getClient(userId, slot));
  logger.info(`[whatsapp-worker] ✅ Scheduler de tarefas inicializado (filtra por slot ${slot})`);

  logger.info(`[whatsapp-worker] ✅ Worker mantido vivo. WPPConnect rodando em background.`);
} catch (error) {
  logger.error(`[whatsapp-worker] ❌ ERRO ao iniciar cliente:`, error);
  logger.warn(`[whatsapp-worker] ⚠️ Erro capturado, mas mantendo processo vivo (mini-HTTP ativo). PM2 vai gerenciar.`);
}

/**
 * Mini HTTP no worker somente-envio para a API platefull fazer proxy de POST /send.
 * Porta: SEND_ONLY_HTTP_PORT (default 3012), bind 127.0.0.1.
 */
function startSendOnlyHttpServer(boundUserId, boundSlot) {
  const port = sendWorkerPort(boundSlot);

  const server = http.createServer(async (req, res) => {
    const sendJson = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    if (req.method === 'GET' && req.url === '/health') {
      return sendJson(200, {
        ok: true,
        userId: boundUserId,
        slot: boundSlot,
        mode: sessionManager.getMode(boundUserId, boundSlot),
        iaAtiva: sessionManager.getIaAtiva(boundUserId, boundSlot),
        hasClient: sessionManager.hasClient(boundUserId, boundSlot),
      });
    }

    if (req.method === 'GET' && (req.url === '/groups' || req.url?.startsWith('/groups?'))) {
      const result = await listGroups(boundUserId, boundSlot);
      return sendJson(result.success ? 200 : 503, result);
    }

    if (req.method === 'POST' && req.url === '/send') {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      let body = {};
      try { body = JSON.parse(raw || '{}'); } catch {
        return sendJson(400, { success: false, error: 'JSON inválido' });
      }

      const to = body.to;
      const message = body.message;
      const slot = body.slot != null ? Number(body.slot) : boundSlot;
      const uid = body.userId || boundUserId;

      if (!to || !message) {
        return sendJson(400, { success: false, error: 'Campos "to" e "message" obrigatórios' });
      }

      const result = await sendMessage(uid, to, message, slot);
      return sendJson(result.success ? 200 : 503, result);
    }

    return sendJson(404, { success: false, error: 'Not found' });
  });

  server.listen(port, '127.0.0.1', () => {
    logger.info(`[whatsapp-worker] 🌐 Mini-HTTP somente-envio em http://127.0.0.1:${port} (POST /send, GET /groups)`);
  });

  server.on('error', (err) => {
    logger.error(`[whatsapp-worker] Mini-HTTP falhou (porta ${port}): ${err.message}`);
  });
}
