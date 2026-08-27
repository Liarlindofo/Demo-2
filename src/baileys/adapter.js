/**
 * Adapter Baileys com superfície compatível ao WPPConnect (src/wpp/index.js).
 *
 * Isolado: NÃO importa src/wpp/**. Auth em pasta própria.
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode-terminal';
import {
  normalizeBaileysMessage,
  messageArchiveExpectedFields,
} from './normalizeMessage.js';

const TEST_USER_ID = 'baileys-teste';
const TEST_SLOT = 1;

/** @type {Map<string, { sock: any, ourJid: string|null, qr: string|null, connected: boolean, authDir: string }>} */
const sessions = new Map();

/** @type {Set<(msg: any) => void>} */
const messageHandlers = new Set();

function sessionKey(userId, slot) {
  return `${userId}:${slot}`;
}

function defaultAuthDir() {
  return (
    process.env.BAILEYS_AUTH_DIR ||
    '/var/www/whatsapp-sessions-baileys/teste'
  );
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function toJid(to) {
  let dest = String(to || '').trim();
  if (!dest) return '';
  if (!dest.includes('@')) {
    dest = `${dest.replace(/\D/g, '')}@s.whatsapp.net`;
  }
  // Baileys usa @s.whatsapp.net; WPP usa @c.us — aceita ambos
  if (dest.endsWith('@c.us')) {
    dest = dest.replace(/@c\.us$/, '@s.whatsapp.net');
  }
  return dest;
}

/**
 * Log lado a lado: normalizado vs campos que messageArchive espera.
 */
function logShapeCompare(normalized, rawBaileys) {
  const expected = messageArchiveExpectedFields(normalized);
  const payload = {
    at: new Date().toISOString(),
    note: 'Baileys normalizado vs shape esperado por messageArchive / onAnyMessage',
    hadLid: Boolean(normalized.hadLid ?? normalized._baileys?.hadLid),
    resolvedFromAlt: Boolean(normalized.resolvedFromAlt ?? normalized._baileys?.resolvedFromAlt),
    normalizedWppShape: {
      from: normalized.from,
      body: normalized.body,
      fromMe: normalized.fromMe,
      type: normalized.type,
      isGroupMsg: normalized.isGroupMsg,
      timestamp: normalized.timestamp,
      id: normalized.id,
      sender: normalized.sender,
      to: normalized.to,
      chatId: normalized.chatId,
      caption: normalized.caption,
      author: normalized.author,
      senderPn: normalized.senderPn,
      notifyName: normalized.notifyName,
    },
    messageArchiveExpectedFields: expected,
    baileysRawKey: rawBaileys?.key || null,
    baileysRawAlt: {
      remoteJidAlt: rawBaileys?.key?.remoteJidAlt ?? rawBaileys?.remoteJidAlt ?? null,
      participantAlt: rawBaileys?.key?.participantAlt ?? rawBaileys?.participantAlt ?? null,
    },
  };

  // eslint-disable-next-line no-console
  console.log('\n========== [BAILEYS shape-compare] ==========');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload, null, 2));
  // eslint-disable-next-line no-console
  console.log('=============================================\n');

  try {
    const logDir = path.resolve(process.cwd(), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const file = path.join(logDir, 'baileys-shape-compare.jsonl');
    fs.appendFileSync(file, `${JSON.stringify(payload)}\n`, 'utf8');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[BAILEYS] Falha ao gravar shape-compare:', err?.message);
  }
}

/**
 * @param {string} [userId='baileys-teste']
 * @param {number} [slot=1]
 * @param {{ authDir?: string, printQr?: boolean }} [options]
 */
export async function startClient(
  userId = TEST_USER_ID,
  slot = TEST_SLOT,
  options = {},
) {
  const uid = String(userId || TEST_USER_ID).trim() || TEST_USER_ID;
  const slotNum = Number.isFinite(Number(slot)) && Number(slot) >= 1 ? Number(slot) : TEST_SLOT;
  const key = sessionKey(uid, slotNum);
  const authDir = options.authDir || defaultAuthDir();
  ensureDir(authDir);

  if (sessions.has(key) && sessions.get(key).connected) {
    return {
      success: true,
      message: 'Sessão Baileys já conectada',
      userId: uid,
      slot: slotNum,
      mode: 'somente-envio',
      provider: 'baileys',
    };
  }

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  let version;
  try {
    const latest = await fetchLatestBaileysVersion();
    version = latest.version;
  } catch {
    version = undefined;
  }

  const logger = pino({ level: process.env.BAILEYS_LOG_LEVEL || 'silent' });

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  const session = {
    sock,
    ourJid: null,
    qr: null,
    connected: false,
    authDir,
  };
  sessions.set(key, session);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      session.qr = qr;
      // eslint-disable-next-line no-console
      console.log('\n[BAILEYS] QR code gerado — escaneie (também em GET /qr)\n');
      if (options.printQr !== false) {
        try {
          qrcode.generate(qr, { small: true });
        } catch {
          // eslint-disable-next-line no-console
          console.log('[BAILEYS] QR (raw):', qr.slice(0, 80) + '...');
        }
      }
    }

    if (connection === 'open') {
      session.connected = true;
      session.qr = null;
      session.ourJid = sock.user?.id || null;
      // eslint-disable-next-line no-console
      console.log(`[BAILEYS] Conectado. ourJid=${session.ourJid}`);
    }

    if (connection === 'close') {
      session.connected = false;
      const statusCode =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output?.statusCode
          : lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      // eslint-disable-next-line no-console
      console.log(
        `[BAILEYS] Conexão fechada. status=${statusCode} reconnect=${shouldReconnect}`,
      );
      sessions.delete(key);
      if (shouldReconnect) {
        setTimeout(() => {
          startClient(uid, slotNum, { ...options, authDir }).catch((err) => {
            // eslint-disable-next-line no-console
            console.error('[BAILEYS] Reconnect falhou:', err?.message);
          });
        }, 2000);
      }
    }
  });

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return;
    for (const raw of messages || []) {
      if (!raw?.message && !raw?.messageStubType) continue;
      try {
        const normalized = normalizeBaileysMessage(raw, {
          ourJid: session.ourJid,
        });
        logShapeCompare(normalized, raw);
        for (const handler of messageHandlers) {
          try {
            handler(normalized, raw);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[BAILEYS] onMessage handler error:', err?.message);
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[BAILEYS] normalize error:', err?.message);
      }
    }
  });

  return {
    success: true,
    message: 'Sessão Baileys iniciada — aguarde QR ou restauração de auth',
    userId: uid,
    slot: slotNum,
    mode: 'somente-envio',
    provider: 'baileys',
    authDir,
  };
}

/**
 * @param {string} userId
 * @param {string} to
 * @param {string} message
 * @param {number} [slot=1]
 */
export async function sendMessage(userId, to, message, slot = TEST_SLOT) {
  const uid = String(userId || TEST_USER_ID).trim() || TEST_USER_ID;
  const slotNum = Number(slot) || TEST_SLOT;
  const session = sessions.get(sessionKey(uid, slotNum));

  if (!session?.sock) {
    return { success: false, error: `Sessão Baileys não encontrada [${uid}:${slotNum}]` };
  }
  if (!session.connected) {
    return { success: false, error: 'Sessão Baileys ainda não está conectada' };
  }

  const dest = toJid(to);
  if (!dest) {
    return { success: false, error: 'Destino inválido' };
  }
  if (!message) {
    return { success: false, error: 'message é obrigatório' };
  }

  try {
    await session.sock.sendMessage(dest, { text: String(message) });
    return {
      success: true,
      to: dest,
      slot: slotNum,
      mode: 'somente-envio',
      provider: 'baileys',
    };
  } catch (err) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Equivalente a client.startTyping(jid) do WPPConnect.
 * @param {string} jid
 * @param {{ userId?: string, slot?: number }} [opts]
 */
export async function startTyping(jid, opts = {}) {
  const uid = opts.userId || TEST_USER_ID;
  const slot = opts.slot || TEST_SLOT;
  const session = sessions.get(sessionKey(uid, slot));
  if (!session?.sock || !session.connected) {
    throw new Error('Sessão Baileys não conectada');
  }
  const dest = toJid(jid);
  await session.sock.sendPresenceUpdate('composing', dest);
}

/**
 * Equivalente a client.stopTyping(jid).
 */
export async function stopTyping(jid, opts = {}) {
  const uid = opts.userId || TEST_USER_ID;
  const slot = opts.slot || TEST_SLOT;
  const session = sessions.get(sessionKey(uid, slot));
  if (!session?.sock || !session.connected) {
    throw new Error('Sessão Baileys não conectada');
  }
  const dest = toJid(jid);
  await session.sock.sendPresenceUpdate('paused', dest);
}

/**
 * Registra listener de mensagens normalizadas (shape WPP).
 * @param {(normalized: any, raw?: any) => void} handler
 * @returns {() => void} unsubscribe
 */
export function onMessage(handler) {
  if (typeof handler !== 'function') {
    throw new Error('onMessage: handler deve ser function');
  }
  messageHandlers.add(handler);
  return () => messageHandlers.delete(handler);
}

export function getQr(userId = TEST_USER_ID, slot = TEST_SLOT) {
  const session = sessions.get(sessionKey(userId, slot));
  return {
    qr: session?.qr || null,
    connected: Boolean(session?.connected),
    ourJid: session?.ourJid || null,
    hasSession: Boolean(session),
  };
}

export function getSessionStatus(userId = TEST_USER_ID, slot = TEST_SLOT) {
  const session = sessions.get(sessionKey(userId, slot));
  return {
    userId,
    slot,
    connected: Boolean(session?.connected),
    ourJid: session?.ourJid || null,
    hasQr: Boolean(session?.qr),
    authDir: session?.authDir || defaultAuthDir(),
    provider: 'baileys',
  };
}

/**
 * Injeta uma mensagem “simulada” no pipeline onMessage (teste de reclamação).
 */
export function simulateIncoming(partial = {}) {
  const normalized = {
    from: partial.from || '5511999999999@c.us',
    to: partial.to || 'baileys-teste@s.whatsapp.net',
    chatId: partial.chatId || partial.from || '5511999999999@c.us',
    fromMe: partial.fromMe === true,
    type: partial.type || 'chat',
    body: partial.body || partial.text || 'mensagem simulada de teste',
    text: partial.text || partial.body || 'mensagem simulada de teste',
    caption: partial.caption || '',
    isGroupMsg: partial.isGroupMsg === true,
    isStatus: false,
    isStory: false,
    author: null,
    sender: {
      id: partial.from || '5511999999999@c.us',
      pushname: partial.notifyName || 'Teste',
      name: partial.notifyName || 'Teste',
      formattedName: partial.notifyName || 'Teste',
    },
    senderPn: partial.from || '5511999999999@c.us',
    notifyName: partial.notifyName || 'Teste',
    timestamp: Math.floor(Date.now() / 1000),
    id: {
      id: `sim-${Date.now()}`,
      _serialized: `false_${partial.from || '5511999999999@c.us'}_sim-${Date.now()}`,
      fromMe: false,
      remote: partial.from || '5511999999999@c.us',
    },
  };

  logShapeCompare(normalized, { simulated: true, partial });
  for (const handler of messageHandlers) {
    try {
      handler(normalized, { simulated: true });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[BAILEYS] simulateIncoming handler error:', err?.message);
    }
  }
  return { success: true, message: normalized };
}

export const BAILEYS_TEST_USER_ID = TEST_USER_ID;
export const BAILEYS_TEST_SLOT = TEST_SLOT;
