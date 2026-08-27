/**
 * Shim de client WPPConnect sobre Baileys.
 * Expõe sendText / startTyping / stopTyping / downloadMedia / decryptFile / sendFile
 * para que messageArchive, tarefaHandler e jobApplicationFlow funcionem sem alteração.
 */

import {
  downloadContentFromMessage,
  toBuffer,
} from '@whiskeysockets/baileys';
import { sendMessage, startTyping, stopTyping, getBaileysSession, checkNumberStatus } from './adapter.js';

function toJid(to) {
  let dest = String(to || '').trim();
  if (!dest) return '';
  if (!dest.includes('@')) {
    dest = `${dest.replace(/\D/g, '')}@s.whatsapp.net`;
  }
  if (dest.endsWith('@c.us')) {
    dest = dest.replace(/@c\.us$/, '@s.whatsapp.net');
  }
  return dest;
}

function mediaTypeFromMessage(raw) {
  const m = raw?.message;
  if (!m) return null;
  if (m.imageMessage) return { type: 'image', content: m.imageMessage };
  if (m.videoMessage) return { type: 'video', content: m.videoMessage };
  if (m.audioMessage) return { type: 'audio', content: m.audioMessage };
  if (m.documentMessage) return { type: 'document', content: m.documentMessage };
  if (m.stickerMessage) return { type: 'sticker', content: m.stickerMessage };
  return null;
}

async function downloadFromNormalizedOrRaw(message) {
  const raw = message?._baileysRaw || message?._raw || message;
  const found = mediaTypeFromMessage(raw);
  if (!found) {
    throw new Error('Mensagem sem mídia Baileys para download');
  }
  const stream = await downloadContentFromMessage(found.content, found.type);
  return toBuffer(stream);
}

/**
 * @param {string} userId
 * @param {number} slot
 * @param {object} [session] — sessão do adapter (sock, ourJid, connected)
 */
export function createBaileysWppClient(userId, slot, session = null) {
  const client = {
    __provider: 'baileys',
    userId,
    slot,

    async sendText(to, text) {
      const result = await sendMessage(userId, to, text, slot);
      if (!result?.success) {
        throw new Error(result?.error || 'Falha ao enviar mensagem (Baileys)');
      }
      return result;
    },

    async startTyping(to) {
      await startTyping(to, { userId, slot });
    },

    async stopTyping(to) {
      await stopTyping(to, { userId, slot });
    },

    /**
     * Compat WPPConnect checkNumberStatus — usado pelo scheduler de tarefas.
     * Retorno: { numberExists, canReceiveMessage, id: { _serialized } }
     */
    async checkNumberStatus(idOrPhone) {
      return checkNumberStatus(userId, idOrPhone, slot);
    },

    /**
     * Compat WPPConnect: devolve Buffer da mídia.
     * Aceita mensagem normalizada (com _baileysRaw) ou WAMessage cru.
     */
    async downloadMedia(message) {
      return downloadFromNormalizedOrRaw(message);
    },

    /** Alias usado por messageArchive (tenta decryptFile primeiro). */
    async decryptFile(message) {
      return downloadFromNormalizedOrRaw(message);
    },

    /**
     * Compat WPPConnect sendFile(jid, data, filename, caption).
     * data: Buffer | base64 string | data URL
     */
    async sendFile(to, data, filename = 'file.bin', caption = '') {
      const sock = session?.sock || getBaileysSession(userId, slot)?.sock;
      if (!sock) throw new Error('Sessão Baileys sem socket');
      const dest = toJid(to);
      let buffer;
      if (Buffer.isBuffer(data)) {
        buffer = data;
      } else if (typeof data === 'string') {
        const b64 = data.includes(',') ? data.split(',')[1] : data;
        buffer = Buffer.from(b64, 'base64');
      } else {
        throw new Error('sendFile: data inválido');
      }

      const lower = String(filename || '').toLowerCase();
      const isImage = /\.(jpe?g|png|webp|gif)$/.test(lower);
      if (isImage) {
        await sock.sendMessage(dest, {
          image: buffer,
          caption: caption || undefined,
          fileName: filename,
        });
      } else {
        await sock.sendMessage(dest, {
          document: buffer,
          mimetype: 'application/octet-stream',
          fileName: filename || 'arquivo.bin',
          caption: caption || undefined,
        });
      }
      return { success: true };
    },

    /** Usado em alguns caminhos de host device — best-effort. */
    async getHostDevice() {
      const jid = session?.ourJid || getBaileysSession(userId, slot)?.ourJid || null;
      if (!jid) return null;
      return { id: jid, wid: jid, phoneNumber: String(jid).split('@')[0] };
    },

    async getContact(jid) {
      return { id: { _serialized: jid }, phoneNumber: String(jid || '').split('@')[0] };
    },
  };

  return client;
}
