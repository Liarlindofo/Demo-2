/**
 * Worker Baileys para slots REAIS (migrados via WhatsAppBot.provider = 'baileys').
 *
 * Uso:
 *   node workers/whatsapp-baileys-worker.js --userId=XXX --slot=N --mode=atendimento|somente-envio
 *
 * Auth: /var/www/whatsapp-sessions-baileys/{userId}-slot{slot}
 * PM2 name: whatsapp-baileys-{userId}-slot{slot}
 *
 * Porta HTTP: mesma do worker WPP (sendWorkerPort) — /health, /send, /groups, /qr
 * Isolado do whatsapp-baileys-teste (porta 3020).
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import http from 'http';

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
      console.log(`[baileys-real] ✅ .env carregado de: ${envPath}`);
      envLoaded = true;
      break;
    }
  }
}
if (!envLoaded) {
  dotenv.config();
  console.warn('[baileys-real] ⚠️ .env não encontrado nos paths conhecidos');
}

import {
  startClient,
  sendMessage,
  onMessage,
  getQr,
  getSessionStatus,
  getBaileysSession,
  baileysAuthDir,
  listGroups,
  checkNumberStatus,
} from '../src/baileys/adapter.js';
import { createBaileysWppClient } from '../src/baileys/wppClientShim.js';
import { setupBaileysMessagePipeline } from '../src/baileys/messagePipeline.js';
import { initScheduler } from '../src/tarefas/scheduler.js';
import sessionManager from '../src/wpp/sessionManager.js';
import logger from '../src/utils/logger.js';
import { sendWorkerPort } from '../src/services/pm2.service.js';

function parseArg(name) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return null;
  let value = arg.split('=').slice(1).join('=');
  value = value.replace(/^["']|["']$/g, '').trim();
  return value || null;
}

const userId = parseArg('userId');
const slotArg = parseArg('slot');
const modeArg = parseArg('mode');

if (!userId) {
  console.error('❌ ERRO: --userId=... não informado');
  console.error(
    'Uso: node workers/whatsapp-baileys-worker.js --userId=XXX --slot=N --mode=atendimento|somente-envio',
  );
  process.exit(1);
}

const mode = modeArg === 'somente-envio' ? 'somente-envio' : 'atendimento';
const slot = slotArg ? parseInt(slotArg, 10) : 1;
const iaAtiva = mode === 'atendimento';

if (!Number.isFinite(slot) || slot < 1) {
  console.error(`❌ ERRO: slot inválido: ${slotArg}`);
  process.exit(1);
}

const AUTH_DIR = baileysAuthDir(userId, slot);
const PORT = sendWorkerPort(slot);

try {
  mkdirSync(AUTH_DIR, { recursive: true });
} catch (err) {
  console.warn(`[baileys-real] Não foi possível criar AUTH_DIR ${AUTH_DIR}:`, err?.message);
}

console.log('='.repeat(60));
console.log('🚀 WHATSAPP BAILEYS WORKER (slot real)');
console.log(`📌 userId:  ${userId}`);
console.log(`📌 slot:    ${slot}`);
console.log(`📌 mode:    ${mode} (iaAtiva=${iaAtiva})`);
console.log(`📌 port:    ${PORT}`);
console.log(`📌 authDir: ${AUTH_DIR}`);
console.log(`📌 pid:     ${process.pid}`);
console.log('='.repeat(60));

logger.info(
  `[baileys-real] Worker iniciado userId="${userId}" slot=${slot} mode=${mode} authDir=${AUTH_DIR}`,
);

const shutdown = async (signal) => {
  logger.warn(`[baileys-real] ${signal} — encerrando userId="${userId}" slot=${slot}`);
  process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) =>
  logger.error('[baileys-real/unhandledRejection]', reason?.stack || String(reason)));
process.on('uncaughtException', (err) =>
  logger.error('[baileys-real/uncaughtException]', err?.stack || String(err)));

function startHttpServer(boundUserId, boundSlot) {
  const server = http.createServer(async (req, res) => {
    const sendJson = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    const url = req.url?.split('?')[0] || '';

    try {
      if (req.method === 'GET' && url === '/health') {
        const st = getSessionStatus(boundUserId, boundSlot);
        return sendJson(200, {
          ok: true,
          userId: boundUserId,
          slot: boundSlot,
          mode: sessionManager.getMode(boundUserId, boundSlot) || mode,
          iaAtiva: sessionManager.getIaAtiva(boundUserId, boundSlot) ?? iaAtiva,
          hasClient: Boolean(st.hasClient || st.connected),
          provider: 'baileys',
          connected: st.connected,
          ourJid: st.ourJid,
        });
      }

      if (req.method === 'GET' && url === '/qr') {
        const status = getQr(boundUserId, boundSlot);
        return sendJson(200, {
          success: true,
          ...status,
          qrCode: status.qrDataUrl || null,
          hint: status.connected
            ? 'Já conectado — sem QR'
            : status.qr || status.qrDataUrl
              ? 'Escaneie o QR (UI de conexões / log PM2)'
              : 'Aguardando geração do QR...',
        });
      }

      if (req.method === 'GET' && (url === '/groups' || req.url?.startsWith('/groups?'))) {
        const result = await listGroups(boundUserId, boundSlot);
        return sendJson(result.success ? 200 : 503, result);
      }

      // Diagnóstico: GET /check-number?phone=41996420791
      if (req.method === 'GET' && url === '/check-number') {
        const qs = new URL(req.url || '', 'http://127.0.0.1').searchParams;
        const phone = qs.get('phone') || qs.get('to') || '';
        if (!phone) {
          return sendJson(400, { success: false, error: 'Query ?phone= obrigatória' });
        }
        try {
          const result = await checkNumberStatus(boundUserId, phone, boundSlot);
          return sendJson(200, {
            success: true,
            phone,
            numberExists: result.numberExists,
            canReceiveMessage: result.canReceiveMessage,
            jid: result.id?._serialized || null,
            queried: result.queried || null,
            raw: result,
          });
        } catch (err) {
          return sendJson(503, { success: false, error: err?.message || String(err) });
        }
      }

      if (req.method === 'POST' && url === '/send') {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let body = {};
        try {
          body = JSON.parse(raw || '{}');
        } catch {
          return sendJson(400, { success: false, error: 'JSON inválido' });
        }

        const to = body.to;
        const message = body.message;
        const slotBody = body.slot != null ? Number(body.slot) : boundSlot;
        const uid = body.userId || boundUserId;

        if (!to || !message) {
          return sendJson(400, { success: false, error: 'Campos "to" e "message" obrigatórios' });
        }

        const result = await sendMessage(uid, to, message, slotBody);
        return sendJson(result.success ? 200 : 503, result);
      }

      return sendJson(404, { success: false, error: 'Not found' });
    } catch (err) {
      return sendJson(500, { success: false, error: err?.message || String(err) });
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    logger.info(
      `[baileys-real] 🌐 Mini-HTTP em http://127.0.0.1:${PORT} (GET /health /qr /groups /check-number, POST /send)`,
    );
  });

  server.on('error', (err) => {
    logger.error(`[baileys-real] Mini-HTTP falhou (porta ${PORT}): ${err.message}`);
  });
}

try {
  startHttpServer(userId, slot);

  const sessionRef = { current: null };
  const client = createBaileysWppClient(userId, slot, {
    get sock() {
      return getBaileysSession(userId, slot)?.sock;
    },
    get ourJid() {
      return getBaileysSession(userId, slot)?.ourJid;
    },
    get connected() {
      return Boolean(getBaileysSession(userId, slot)?.connected);
    },
  });

  const { onNormalizedMessage } = setupBaileysMessagePipeline(client, userId, slot, iaAtiva);
  onMessage((normalized, raw) => {
    onNormalizedMessage(normalized, raw).catch((err) => {
      logger.error(`[baileys-real] pipeline error: ${err?.message}`);
    });
  });

  const result = await startClient(userId, slot, {
    authDir: AUTH_DIR,
    printQr: true,
    persistDb: true,
  });
  sessionRef.current = getBaileysSession(userId, slot);
  logger.success(`[baileys-real] startClient:`, result);

  initScheduler(userId, slot, () => sessionManager.getClient(userId, slot));
  logger.info(`[baileys-real] ✅ Scheduler de tarefas inicializado (slot ${slot})`);
} catch (error) {
  logger.error(`[baileys-real] ❌ Erro ao iniciar:`, error);
  logger.warn(`[baileys-real] ⚠️ Mantendo processo vivo (mini-HTTP ativo).`);
}
