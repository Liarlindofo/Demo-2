/**
 * Worker isolado Baileys (teste).
 * NÃO importa src/wpp/**. Porta default 3020.
 *
 * Endpoints (127.0.0.1):
 *   GET  /health
 *   GET  /qr
 *   POST /send              { to, message }
 *   POST /typing            { to, action: 'start'|'stop' }
 *   POST /simulate-incoming { from?, body?, ... }
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
  '/var/www/Demo-2/.env',
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`[baileys-worker] .env carregado de: ${envPath}`);
    break;
  }
}

import {
  startClient,
  sendMessage,
  startTyping,
  stopTyping,
  onMessage,
  getQr,
  getSessionStatus,
  simulateIncoming,
  BAILEYS_TEST_USER_ID,
  BAILEYS_TEST_SLOT,
} from '../src/baileys/adapter.js';

const USER_ID = process.env.BAILEYS_TEST_USER_ID || BAILEYS_TEST_USER_ID;
const SLOT = Number(process.env.BAILEYS_TEST_SLOT) || BAILEYS_TEST_SLOT;
const PORT = Number(process.env.BAILEYS_TEST_HTTP_PORT) || 3020;
const AUTH_DIR =
  process.env.BAILEYS_AUTH_DIR || '/var/www/whatsapp-sessions-baileys/teste';

try {
  mkdirSync(AUTH_DIR, { recursive: true });
} catch (err) {
  console.warn(`[baileys-worker] Não foi possível criar AUTH_DIR ${AUTH_DIR}:`, err?.message);
}

console.log('='.repeat(60));
console.log('BAILEYS TEST WORKER');
console.log(`userId:  ${USER_ID}`);
console.log(`slot:    ${SLOT}`);
console.log(`port:    ${PORT}`);
console.log(`authDir: ${AUTH_DIR}`);
console.log(`pid:     ${process.pid}`);
console.log('='.repeat(60));

// Listener de debug: confirma shape normalizado
onMessage((normalized) => {
  console.log(
    `[baileys-worker] onMessage ← from=${normalized.from} type=${normalized.type} fromMe=${normalized.fromMe} body="${String(normalized.body || '').slice(0, 80)}"`,
  );
});

function readJson(req) {
  return new Promise((resolveBody, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw.trim()) return resolveBody({});
      try {
        resolveBody(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function startHttpServer() {
  const server = http.createServer(async (req, res) => {
    const sendJson = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    const url = req.url?.split('?')[0] || '';

    try {
      if (req.method === 'GET' && url === '/health') {
        return sendJson(200, {
          ok: true,
          provider: 'baileys',
          ...getSessionStatus(USER_ID, SLOT),
          port: PORT,
        });
      }

      if (req.method === 'GET' && url === '/qr') {
        const status = getQr(USER_ID, SLOT);
        return sendJson(200, {
          success: true,
          ...status,
          hint: status.connected
            ? 'Já conectado — sem QR'
            : status.qr
              ? 'Escaneie o QR (também impresso no log do PM2)'
              : 'Aguardando geração do QR...',
        });
      }

      if (req.method === 'POST' && url === '/send') {
        const body = await readJson(req);
        if (!body.to || !body.message) {
          return sendJson(400, { success: false, error: 'Campos "to" e "message" obrigatórios' });
        }
        const result = await sendMessage(USER_ID, body.to, body.message, SLOT);
        return sendJson(result.success ? 200 : 503, result);
      }

      if (req.method === 'POST' && url === '/typing') {
        const body = await readJson(req);
        if (!body.to) {
          return sendJson(400, { success: false, error: 'Campo "to" obrigatório' });
        }
        const action = body.action === 'stop' ? 'stop' : 'start';
        try {
          if (action === 'stop') {
            await stopTyping(body.to, { userId: USER_ID, slot: SLOT });
          } else {
            await startTyping(body.to, { userId: USER_ID, slot: SLOT });
          }
          return sendJson(200, { success: true, action, to: body.to });
        } catch (err) {
          return sendJson(503, { success: false, error: err?.message || String(err) });
        }
      }

      if (req.method === 'POST' && url === '/simulate-incoming') {
        const body = await readJson(req);
        const result = simulateIncoming(body);
        return sendJson(200, result);
      }

      return sendJson(404, { success: false, error: 'Not found' });
    } catch (err) {
      return sendJson(500, { success: false, error: err?.message || String(err) });
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[baileys-worker] Mini-HTTP em http://127.0.0.1:${PORT}`);
    console.log('  GET  /health');
    console.log('  GET  /qr');
    console.log('  POST /send');
    console.log('  POST /typing');
    console.log('  POST /simulate-incoming');
  });

  server.on('error', (err) => {
    console.error(`[baileys-worker] Mini-HTTP falhou (porta ${PORT}):`, err.message);
  });
}

process.on('SIGINT', () => {
  console.log('[baileys-worker] SIGINT — encerrando');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('[baileys-worker] SIGTERM — encerrando');
  process.exit(0);
});
process.on('unhandledRejection', (reason) => {
  console.error('[baileys-worker] unhandledRejection', reason?.stack || String(reason));
});

startHttpServer();

try {
  const result = await startClient(USER_ID, SLOT, {
    authDir: AUTH_DIR,
    printQr: true,
  });
  console.log('[baileys-worker] startClient:', result);
} catch (err) {
  console.error('[baileys-worker] Erro ao iniciar Baileys:', err?.message || err);
  console.warn('[baileys-worker] Mantendo processo vivo (mini-HTTP ativo).');
}
