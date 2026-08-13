#!/usr/bin/env node
/**
 * CLI — sobe sessão WPPConnect SOMENTE-ENVIO (sem bot de atendimento).
 *
 * Uso na VPS (na pasta do projeto):
 *   node scripts/wpp-send-only.js --userId=SEU_STACK_USER_ID
 *   node scripts/wpp-send-only.js --userId=SEU_STACK_USER_ID --slot=2
 *
 * O QR em ASCII aparece no terminal (logQR). Também fica disponível em:
 *   GET http://localhost:3001/api/send-only/:userId/qr
 *
 * Enviar mensagem (com worker já conectado via PM2/API):
 *   curl -X POST http://localhost:3001/api/send-only/USER_ID/send \
 *     -H 'Content-Type: application/json' \
 *     -d '{"to":"5541999999999","message":"oi"}'
 *
 * Ou, neste mesmo processo (após escanear o QR):
 *   (mantenha o script rodando — ele já sobe o mini-HTTP na porta 3012)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

for (const envPath of [
  resolve(__dirname, '..', '.env'),
  resolve(process.cwd(), '.env'),
  '/var/www/I/.env',
  '/var/www/Demo-2/.env',
]) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

function parseArg(name) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!arg) return null;
  return arg.split('=').slice(1).join('=').replace(/^["']|["']$/g, '').trim() || null;
}

const userId = parseArg('userId');
const slot = parseInt(parseArg('slot') || '2', 10);

if (!userId) {
  console.error('Uso: node scripts/wpp-send-only.js --userId=STACK_USER_ID [--slot=2]');
  process.exit(1);
}

const { startClient, sendMessage, SLOT_SOMENTE_ENVIO } = await import('../src/wpp/index.js');
const http = await import('http');
const sessionManager = (await import('../src/wpp/sessionManager.js')).default;

const resolvedSlot = Number.isFinite(slot) && slot >= 2 ? slot : SLOT_SOMENTE_ENVIO;

console.log('='.repeat(60));
console.log('📤 WPP SOMENTE-ENVIO');
console.log(`   userId: ${userId}`);
console.log(`   slot:   ${resolvedSlot}`);
console.log('   mode:   somente-envio (SEM listener do bot)');
console.log('='.repeat(60));
console.log('Escaneie o QR ASCII abaixo com o WhatsApp do número de envio.\n');

const result = await startClient(userId, resolvedSlot, { mode: 'somente-envio' });
console.log('startClient:', result);

const port = Number(process.env.SEND_ONLY_HTTP_PORT || 3012);
const server = http.createServer(async (req, res) => {
  const json = (code, body) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (req.method === 'GET' && req.url === '/health') {
    return json(200, {
      ok: true,
      userId,
      slot: resolvedSlot,
      hasClient: sessionManager.hasClient(userId, resolvedSlot),
    });
  }

  if (req.method === 'POST' && req.url === '/send') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    let body = {};
    try { body = JSON.parse(raw || '{}'); } catch {
      return json(400, { success: false, error: 'JSON inválido' });
    }
    if (!body.to || !body.message) {
      return json(400, { success: false, error: 'to e message obrigatórios' });
    }
    const out = await sendMessage(userId, body.to, body.message, resolvedSlot);
    return json(out.success ? 200 : 503, out);
  }

  return json(404, { error: 'Not found' });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`\n🌐 Mini-HTTP: http://127.0.0.1:${port}/send`);
  console.log(`   Ex: curl -X POST http://127.0.0.1:${port}/send -H 'Content-Type: application/json' -d '{"to":"5541...","message":"teste"}'`);
  console.log('\nProcesso mantido vivo. Ctrl+C para sair (sessão pode permanecer no Chromium até stop).\n');
});
