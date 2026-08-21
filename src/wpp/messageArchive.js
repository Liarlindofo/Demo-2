/**
 * Gravação de histórico WhatsApp (revisão de reclamações).
 * Multi-tenant: userId = users.id do tenant. Sem contas hardcoded.
 *
 * Roda em paralelo ao bot — falha aqui nunca deve bloquear o listener.
 */

import { createClient } from '@supabase/supabase-js';
import prisma from '../db/index.js';
import logger from '../utils/logger.js';

const BUCKET = 'whatsapp-evidencias';
const MEDIA_TYPES = new Set(['image', 'ptt', 'audio', 'video', 'document', 'sticker']);
const CACHE_MS = 20_000;
const IA_OUT_TTL_MS = 45_000;
const TIMEOUT_MIDIA_MS = 30_000;

/** @type {Map<string, { tenantUserId: string|null, at: number }>} */
const tenantCache = new Map();
/** @type {Map<string, { on: boolean, at: number }>} */
const monitorCache = new Map();
/** @type {Map<string, { allowed: Set<string>, at: number }>} */
const ifoodGroupCache = new Map();
/** @type {Map<string, Array<{ to: string, text: string, at: number }>>} */
const iaOutbound = new Map();

let supabaseClient = null;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${label} ${ms / 1000}s`)), ms)),
  ]);
}

function sessionKey(stackUserId, slot) {
  return `${stackUserId}:${slot}`;
}

function digitsOf(jid) {
  if (!jid) return '';
  const raw = typeof jid === 'object' ? (jid._serialized || jid.user || '') : String(jid);
  const beforeAt = raw.split('@')[0];
  return String(beforeAt).replace(/\D/g, '') || String(beforeAt);
}

/** JID completo do grupo (ex: 120363...@g.us). */
function groupJidOf(jid) {
  if (!jid) return '';
  const raw = typeof jid === 'object' ? (jid._serialized || jid.user || '') : String(jid);
  const s = String(raw).trim();
  if (s.includes('@g.us')) {
    const match = s.match(/[\w.-]+@g\.us/i);
    return match ? match[0] : s.split(/[\s,]/)[0];
  }
  const digits = digitsOf(s);
  return digits ? `${digits}@g.us` : '';
}

function isGroupMessage(message) {
  if (!message) return false;
  if (message.isGroupMsg) return true;
  const from = String(message.from || '');
  const to = String(message.to || '');
  const chatId = String(message.chatId || '');
  return from.includes('@g.us') || to.includes('@g.us') || chatId.includes('@g.us');
}

/** Só pra debug: serializa JID (string ou objeto WPPConnect). */
function jidDebug(jid) {
  if (jid == null) return null;
  if (typeof jid === 'string') return jid;
  if (typeof jid === 'object') {
    return {
      typeof: 'object',
      _serialized: jid._serialized ?? null,
      user: jid.user ?? null,
      server: jid.server ?? null,
      stringified: String(jid),
    };
  }
  return { typeof: typeof jid, value: String(jid) };
}

function extractWppId(message) {
  const id = message?.id;
  if (!id) return null;
  if (typeof id === 'string') return id.slice(0, 191);
  const serialized = id._serialized || id.id || null;
  return serialized ? String(serialized).slice(0, 191) : null;
}

function normalizeMessageType(message) {
  const t = String(message?.type || 'text').toLowerCase();
  if (t === 'chat') return 'text';
  return t;
}

function textFromMessage(message, type) {
  const body = (message.body || message.text || message.caption || '').trim();
  if (body) return body;
  if (type === 'location') {
    const lat = message.lat ?? message.location?.lat;
    const lng = message.lng ?? message.location?.lng ?? message.location?.longitude;
    if (lat != null && lng != null) return `${lat},${lng}`;
  }
  return null;
}

function contactNameOf(message) {
  return (
    message.notifyName ||
    message.sender?.pushname ||
    message.sender?.name ||
    message.sender?.formattedName ||
    null
  );
}

function messageTimestamp(message) {
  const ts = Number(message.timestamp);
  if (Number.isFinite(ts) && ts > 0) {
    return new Date(ts < 1e12 ? ts * 1000 : ts);
  }
  return new Date();
}

/**
 * Marca um sendText da IA para o eco fromMe ser gravado com sentByAgent=false.
 */
export function markIaOutbound(stackUserId, slot, to, text) {
  const key = sessionKey(stackUserId, slot);
  const list = iaOutbound.get(key) || [];
  const now = Date.now();
  const pruned = list.filter((x) => now - x.at < IA_OUT_TTL_MS);
  pruned.push({
    to: digitsOf(to),
    text: String(text || '').trim(),
    at: now,
  });
  iaOutbound.set(key, pruned);
}

function wasIaOutbound(stackUserId, slot, message) {
  const key = sessionKey(stackUserId, slot);
  const list = iaOutbound.get(key);
  if (!list?.length) return false;
  const now = Date.now();
  const text = String(message.body || message.text || '').trim();
  const to = digitsOf(message.to || message.chatId || message.from);
  const idx = list.findIndex(
    (x) => now - x.at < IA_OUT_TTL_MS && x.text === text && (!x.to || !to || x.to === to),
  );
  if (idx < 0) return false;
  list.splice(idx, 1);
  return true;
}

async function resolveTenantUserId(stackUserId) {
  const cached = tenantCache.get(stackUserId);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.tenantUserId;

  let tenantUserId = null;
  try {
    const stackUser = await prisma.stackUser.findUnique({
      where: { id: stackUserId },
      select: { userId: true },
    });
    if (stackUser?.userId) {
      tenantUserId = stackUser.userId;
    } else {
      const user = await prisma.user.findFirst({
        where: { stackUserId },
        select: { id: true },
      });
      tenantUserId = user?.id ?? null;
    }

    if (!tenantUserId) {
      const membership = await prisma.rhTeamMember.findFirst({
        where: { stackUserId, isActive: true },
        select: { tenantUserId: true },
      });
      tenantUserId = membership?.tenantUserId ?? null;
    }
  } catch (err) {
    logger.warn(`[messageArchive] Falha ao resolver tenant de ${stackUserId}: ${err?.message}`);
  }

  tenantCache.set(stackUserId, { tenantUserId, at: Date.now() });
  return tenantUserId;
}

async function isMonitoringOn(stackUserId, slot) {
  const key = sessionKey(stackUserId, slot);
  const cached = monitorCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.on;

  let on = false;
  try {
    const bot = await prisma.whatsAppBot.findUnique({
      where: { userId_slot: { userId: stackUserId, slot } },
      select: { monitorarReclamacoes: true },
    });
    on = bot?.monitorarReclamacoes === true;
  } catch (err) {
    logger.warn(`[messageArchive] Falha ao ler monitorarReclamacoes [${key}]: ${err?.message}`);
  }
  monitorCache.set(key, { on, at: Date.now() });
  return on;
}

/** Whitelist: só grupos cadastrados em IFoodComplaintGroup (tenant + slot + ativo). */
async function allowedIfoodGroupIds(tenantUserId, slot) {
  const key = `${tenantUserId}:${slot}`;
  const cached = ifoodGroupCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.allowed;

  /** @type {Set<string>} */
  let allowed = new Set();
  try {
    const rows = await prisma.iFoodComplaintGroup.findMany({
      where: { userId: tenantUserId, sessionSlot: slot, ativo: true },
      select: { groupWhatsAppId: true },
    });
    allowed = new Set(rows.map((r) => String(r.groupWhatsAppId).trim()).filter(Boolean));
  } catch (err) {
    logger.warn(`[messageArchive] Falha ao ler IFoodComplaintGroup [${key}]: ${err?.message}`);
  }
  ifoodGroupCache.set(key, { allowed, at: Date.now() });
  return allowed;
}

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    logger.warn(
      '[messageArchive] Supabase não configurado — defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. Mídia não será enviada.',
    );
    return null;
  }
  supabaseClient = createClient(url, key);
  return supabaseClient;
}

async function baixarMidia(message, client) {
  try {
    const buf = await withTimeout(client.decryptFile(message), TIMEOUT_MIDIA_MS, 'decryptFile');
    if (Buffer.isBuffer(buf) && buf.length > 0) return buf;
  } catch (err) {
    logger.warn(`[messageArchive] decryptFile falhou: ${err?.message}`);
  }
  try {
    const resultado = await withTimeout(client.downloadMedia(message), TIMEOUT_MIDIA_MS, 'downloadMedia');
    if (!resultado) return null;
    if (Buffer.isBuffer(resultado)) return resultado;
    if (typeof resultado === 'string') {
      const partes = resultado.split(',');
      const b64 = partes.length > 1 ? partes[1] : partes[0];
      return Buffer.from(b64, 'base64');
    }
  } catch (err) {
    logger.warn(`[messageArchive] downloadMedia falhou: ${err?.message}`);
  }
  return null;
}

function extFromMime(mime, type) {
  const m = String(mime || '').toLowerCase();
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
  if (m.includes('png')) return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('gif')) return 'gif';
  if (m.includes('mp4')) return 'mp4';
  if (m.includes('ogg') || m.includes('opus')) return 'ogg';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('pdf')) return 'pdf';
  if (type === 'image') return 'jpg';
  if (type === 'audio' || type === 'ptt') return 'ogg';
  if (type === 'video') return 'mp4';
  if (type === 'document') return 'bin';
  return 'bin';
}

async function uploadMedia({ tenantUserId, slot, contactId, message, client, type }) {
  const supabase = getSupabase();
  if (!supabase) return null;
  const buffer = await baixarMidia(message, client);
  if (!buffer?.length) return null;

  // Bucket privado criado no painel: "whatsapp-evidencias".
  // Persistimos só o path interno — URL assinada é gerada na leitura.
  const mime = message.mimetype || 'application/octet-stream';
  const ext = extFromMime(mime, type);
  const safeContact = String(contactId || 'unknown').replace(/[^\w.-]/g, '').slice(0, 32);
  const fileName = `${tenantUserId}/${slot}/${safeContact}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(fileName, buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) {
    logger.warn(`[messageArchive] upload falhou (bucket=${BUCKET}): ${error.message}`);
    return null;
  }
  return fileName;
}

function shouldSkip(message) {
  if (!message) return true;
  // Grupos: NÃO skip aqui — persistSafe decide via whitelist IFoodComplaintGroup.
  if (message.isStatus || message.isStory) return true;
  const from = String(message.from || '');
  if (from.includes('status') || from.includes('broadcast')) return true;
  if (message.type === 'status' || message.type === 'notification_template') return true;
  return false;
}

/**
 * Fire-and-forget: nunca relança. Chamar no início do onAnyMessage (msg crua, sem debounce).
 */
export function recordWhatsAppMessage(message, client, stackUserId, slot) {
  void persistSafe(message, client, stackUserId, slot);
}

async function persistSafe(message, client, stackUserId, slot) {
  try {
    if (shouldSkip(message)) return;

    const tenantUserId = await resolveTenantUserId(stackUserId);
    if (!tenantUserId) {
      logger.warn(`[messageArchive] Sem tenant User.id para stackUser=${stackUserId} — não gravando.`);
      return;
    }

    const groupMsg = isGroupMessage(message);
    let contactId = '';

    // DEBUG TEMPORÁRIO — investigar por que msgs de grupo iFood não gravam
    // Dispara em fromMe / isGroupMsg / detecção de grupo, pra ver o formato real do chatId.
    if (message.fromMe || message.isGroupMsg || groupMsg) {
      const groupRawCandidate = message.fromMe
        ? (message.to || message.chatId || message.from)
        : (message.chatId || message.from);
      const groupIdNormalizado = groupJidOf(groupRawCandidate);
      const allowed = await allowedIfoodGroupIds(tenantUserId, slot);
      const idsNaWhitelist = [...allowed];
      const bateComWhitelist = Boolean(groupIdNormalizado && allowed.has(groupIdNormalizado));
      // eslint-disable-next-line no-console
      console.log('[DEBUG grupo]', {
        chatIdRecebido: jidDebug(groupRawCandidate),
        from: jidDebug(message.from),
        to: jidDebug(message.to),
        chatId: jidDebug(message.chatId),
        fromMe: Boolean(message.fromMe),
        isGroupMsg: message.isGroupMsg,
        groupMsgDetectado: groupMsg,
        groupIdNormalizado: groupIdNormalizado || null,
        bateComWhitelist,
        idsNaWhitelist,
        tenantUserId,
        slot,
        type: message.type,
      });
      logger.info(
        `[DEBUG grupo] fromMe=${Boolean(message.fromMe)} isGroupMsg=${message.isGroupMsg} groupMsg=${groupMsg} ` +
          `norm=${groupIdNormalizado || '-'} bate=${bateComWhitelist} whitelist=${idsNaWhitelist.length} slot=${slot}`,
      );
    }

    if (groupMsg) {
      const groupRaw = message.fromMe
        ? (message.to || message.chatId || message.from)
        : (message.chatId || message.from);
      const groupId = groupJidOf(groupRaw);
      if (!groupId) return;
      const allowed = await allowedIfoodGroupIds(tenantUserId, slot);
      if (!allowed.has(groupId)) return;
      contactId = groupId;
    } else {
      if (!(await isMonitoringOn(stackUserId, slot))) return;
      const contactRaw = message.fromMe
        ? (message.to || message.chatId || message.from)
        : message.from;
      contactId = digitsOf(contactRaw);
      if (!contactId) return;
    }

    const direction = message.fromMe ? 'OUT' : 'IN';
    const whatsappMessageId = extractWppId(message);
    if (whatsappMessageId) {
      const dup = await prisma.whatsAppMessage.findFirst({
        where: { userId: tenantUserId, sessionSlot: slot, whatsappMessageId },
        select: { id: true },
      });
      if (dup) return;
    }

    const messageType = normalizeMessageType(message);
    const textContent = textFromMessage(message, messageType);
    let mediaUrl = null;
    if (MEDIA_TYPES.has(messageType)) {
      try {
        mediaUrl = await uploadMedia({
          tenantUserId,
          slot,
          contactId,
          message,
          client,
          type: messageType,
        });
      } catch (mediaErr) {
        logger.warn(`[messageArchive] mídia ignorada: ${mediaErr?.message}`);
      }
    }

    const sentByAgent = direction === 'OUT' && !wasIaOutbound(stackUserId, slot, message);

    await prisma.whatsAppMessage.create({
      data: {
        userId: tenantUserId,
        sessionSlot: slot,
        direction,
        contactId,
        contactName: groupMsg ? null : contactNameOf(message),
        messageType,
        textContent,
        mediaUrl,
        sentByAgent,
        whatsappMessageId,
        timestamp: messageTimestamp(message),
      },
    });
  } catch (err) {
    logger.warn(`[messageArchive] Erro ao gravar mensagem: ${err?.message}`);
  }
}
