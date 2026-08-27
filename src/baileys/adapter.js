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

/** @type {Map<string, { sock: any, ourJid: string|null, qr: string|null, qrDataUrl: string|null, connected: boolean, authDir: string, userId: string, slot: number }>} */
const sessions = new Map();

/** @type {Set<(msg: any, raw?: any) => void>} */
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

/** Pasta de auth para slots reais: /var/www/whatsapp-sessions-baileys/{userId}-slot{slot} */
export function baileysAuthDir(userId, slot) {
  const root =
    process.env.BAILEYS_SESSIONS_ROOT || '/var/www/whatsapp-sessions-baileys';
  const safeUser = String(userId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(root, `${safeUser}-slot${Number(slot) || 1}`);
}

export function getBaileysSession(userId, slot = TEST_SLOT) {
  return sessions.get(sessionKey(userId, slot)) || null;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function qrStringToDataUrl(qr) {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(qr, { margin: 2, width: 320 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[BAILEYS] Falha ao gerar data URL do QR:', err?.message);
    return null;
  }
}

async function persistQr(userId, slot, qrDataUrl, persistDb) {
  if (!persistDb || !qrDataUrl) return;
  try {
    const { WhatsAppBotModel } = await import('../db/models.js');
    await WhatsAppBotModel.saveQrCode(userId, slot, qrDataUrl);
    await WhatsAppBotModel.saveBotStatus(userId, slot, 'QRCODE').catch(() => {});
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[BAILEYS] persistQr falhou [${userId}:${slot}]:`, err?.message);
  }
}

async function persistConnected(userId, slot, ourJid, persistDb) {
  if (!persistDb) return;
  try {
    const { WhatsAppBotModel } = await import('../db/models.js');
    const number = ourJid ? String(ourJid).split('@')[0].split(':')[0] : null;
    await WhatsAppBotModel.setConnected(userId, slot, number, { provider: 'baileys' });
    await WhatsAppBotModel.saveBotStatus(userId, slot, 'CONNECTED').catch(() => {});
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[BAILEYS] persistConnected falhou [${userId}:${slot}]:`, err?.message);
  }
}

async function persistDisconnected(userId, slot, persistDb) {
  if (!persistDb) return;
  try {
    const { WhatsAppBotModel } = await import('../db/models.js');
    await WhatsAppBotModel.setDisconnected(userId, slot).catch(() => {});
    await WhatsAppBotModel.saveBotStatus(userId, slot, 'DISCONNECTED').catch(() => {});
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[BAILEYS] persistDisconnected falhou [${userId}:${slot}]:`, err?.message);
  }
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
 * @param {{ authDir?: string, printQr?: boolean, persistDb?: boolean }} [options]
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
  const persistDb = options.persistDb === true;
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
    qrDataUrl: null,
    connected: false,
    authDir,
    userId: uid,
    slot: slotNum,
  };
  sessions.set(key, session);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      session.qr = qr;
      session.connected = false;
      // eslint-disable-next-line no-console
      console.log('\n[BAILEYS] QR code gerado — escaneie (também em GET /qr e na UI de conexões)\n');
      if (options.printQr !== false) {
        try {
          qrcode.generate(qr, { small: true });
        } catch {
          // eslint-disable-next-line no-console
          console.log('[BAILEYS] QR (raw):', qr.slice(0, 80) + '...');
        }
      }
      qrStringToDataUrl(qr).then((dataUrl) => {
        session.qrDataUrl = dataUrl;
        return persistQr(uid, slotNum, dataUrl, persistDb);
      }).catch(() => {});
    }

    if (connection === 'open') {
      session.connected = true;
      session.qr = null;
      session.qrDataUrl = null;
      session.ourJid = sock.user?.id || null;
      // eslint-disable-next-line no-console
      console.log(`[BAILEYS] Conectado. ourJid=${session.ourJid}`);
      persistConnected(uid, slotNum, session.ourJid, persistDb).catch(() => {});
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
      persistDisconnected(uid, slotNum, persistDb).catch(() => {});
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
        // Anexa raw para download de mídia nos handlers
        normalized._baileysRaw = raw;
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
    qrDataUrl: session?.qrDataUrl || null,
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
    hasQr: Boolean(session?.qr || session?.qrDataUrl),
    hasClient: Boolean(session?.connected && session?.sock),
    authDir: session?.authDir || defaultAuthDir(),
    provider: 'baileys',
  };
}

/**
 * Lista grupos participantes (compat mini-HTTP /groups do worker WPP).
 */
export async function listGroups(userId = TEST_USER_ID, slot = TEST_SLOT) {
  const session = sessions.get(sessionKey(userId, slot));
  if (!session?.sock || !session.connected) {
    return { success: false, error: 'Sessão Baileys não conectada', groups: [] };
  }
  try {
    const map = await session.sock.groupFetchAllParticipating();
    const groups = Object.values(map || {}).map((g) => ({
      id: g.id,
      name: g.subject || g.id,
      participantsCount: Array.isArray(g.participants) ? g.participants.length : undefined,
    }));
    return { success: true, groups, provider: 'baileys' };
  } catch (err) {
    return { success: false, error: err?.message || String(err), groups: [] };
  }
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
