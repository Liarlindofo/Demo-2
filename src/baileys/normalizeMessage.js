/**
 * Normaliza mensagem Baileys → shape WPPConnect usado em onAnyMessage / messageArchive.
 *
 * Campos esperados pelo messageArchive / listener:
 *   from, to, chatId, fromMe, type, body, text, caption,
 *   isGroupMsg, isStatus, isStory, author, sender, senderPn,
 *   timestamp, id / id._serialized, notifyName
 */

function jidServer(jid) {
  if (!jid || typeof jid !== 'string') return '';
  const parts = jid.split('@');
  return parts[1] || '';
}

function isGroupJid(jid) {
  return String(jid || '').includes('@g.us');
}

function isStatusJid(jid) {
  const s = String(jid || '');
  return s.includes('status@broadcast') || s.includes('@broadcast');
}

function extractText(baileysMsg) {
  const m = baileysMsg?.message;
  if (!m) return { body: '', caption: '', type: 'text' };

  if (m.conversation) {
    return { body: m.conversation, caption: '', type: 'chat' };
  }
  if (m.extendedTextMessage?.text) {
    return { body: m.extendedTextMessage.text, caption: '', type: 'chat' };
  }
  if (m.imageMessage) {
    return {
      body: m.imageMessage.caption || '',
      caption: m.imageMessage.caption || '',
      type: 'image',
    };
  }
  if (m.videoMessage) {
    return {
      body: m.videoMessage.caption || '',
      caption: m.videoMessage.caption || '',
      type: 'video',
    };
  }
  if (m.documentMessage) {
    return {
      body: m.documentMessage.caption || m.documentMessage.fileName || '',
      caption: m.documentMessage.caption || '',
      type: 'document',
    };
  }
  if (m.audioMessage) {
    const ptt = m.audioMessage.ptt === true;
    return { body: '', caption: '', type: ptt ? 'ptt' : 'audio' };
  }
  if (m.stickerMessage) {
    return { body: '', caption: '', type: 'sticker' };
  }
  if (m.locationMessage) {
    return { body: '', caption: '', type: 'location' };
  }
  if (m.buttonsResponseMessage?.selectedDisplayText) {
    return {
      body: m.buttonsResponseMessage.selectedDisplayText,
      caption: '',
      type: 'chat',
    };
  }
  if (m.listResponseMessage?.title) {
    return { body: m.listResponseMessage.title, caption: '', type: 'chat' };
  }
  if (m.reactionMessage) {
    return { body: m.reactionMessage.text || '', caption: '', type: 'reaction' };
  }

  return { body: '', caption: '', type: 'unknown' };
}

function pushNameFrom(baileysMsg) {
  return baileysMsg?.pushName || baileysMsg?.verifiedBizName || null;
}

/**
 * @param {import('@whiskeysockets/baileys').WAMessage} baileysMsg
 * @param {{ ourJid?: string|null }} [opts]
 */
export function normalizeBaileysMessage(baileysMsg, opts = {}) {
  const key = baileysMsg?.key || {};
  const remoteJid = key.remoteJid || '';
  const fromMe = Boolean(key.fromMe);
  const participant = key.participant || baileysMsg?.participant || null;
  const group = isGroupJid(remoteJid);
  const { body, caption, type } = extractText(baileysMsg);
  const pushName = pushNameFrom(baileysMsg);

  // WPPConnect: inbound 1:1 → from = contato; outbound → from = nosso número / chat
  // Em grupo: from = grupo, author = participante
  let from = remoteJid;
  let to = opts.ourJid || '';
  if (fromMe && !group) {
    // Eco outbound: WPP costuma ter from = nosso e to/chatId = destino
    from = opts.ourJid || remoteJid;
    to = remoteJid;
  } else if (!fromMe && !group) {
    from = remoteJid;
    to = opts.ourJid || '';
  }

  const author = group ? participant : null;
  const ts =
    typeof baileysMsg.messageTimestamp === 'number'
      ? baileysMsg.messageTimestamp
      : Number(baileysMsg.messageTimestamp) || Math.floor(Date.now() / 1000);

  const idSerialized = key.id
    ? `${fromMe ? 'true' : 'false'}_${remoteJid}_${key.id}`
    : null;

  const senderPn = group
    ? participant
    : fromMe
      ? opts.ourJid || null
      : remoteJid;

  return {
    from,
    to,
    chatId: remoteJid,
    fromMe,
    type,
    body: body || '',
    text: body || '',
    caption: caption || '',
    isGroupMsg: group,
    isStatus: isStatusJid(remoteJid),
    isStory: false,
    author,
    sender: {
      id: senderPn || remoteJid,
      pushname: pushName,
      name: pushName,
      formattedName: pushName,
    },
    senderPn: senderPn || null,
    notifyName: pushName,
    timestamp: ts,
    id: {
      id: key.id || null,
      _serialized: idSerialized,
      fromMe,
      remote: remoteJid,
    },
    // metadados extras (não quebram messageArchive)
    _baileys: {
      remoteJid,
      participant,
      server: jidServer(remoteJid),
    },
  };
}

/**
 * Shape “mínimo” que messageArchive usa (para comparar lado a lado).
 */
export function messageArchiveExpectedFields(normalized) {
  return {
    from: normalized.from ?? null,
    to: normalized.to ?? null,
    chatId: normalized.chatId ?? null,
    fromMe: normalized.fromMe ?? null,
    type: normalized.type ?? null,
    body: normalized.body ?? null,
    text: normalized.text ?? null,
    caption: normalized.caption ?? null,
    isGroupMsg: normalized.isGroupMsg ?? null,
    isStatus: normalized.isStatus ?? null,
    timestamp: normalized.timestamp ?? null,
    id: normalized.id?._serialized ?? normalized.id ?? null,
    sender: normalized.sender
      ? {
          pushname: normalized.sender.pushname ?? null,
          name: normalized.sender.name ?? null,
        }
      : null,
    senderPn: normalized.senderPn ?? null,
    author: normalized.author ?? null,
    notifyName: normalized.notifyName ?? null,
  };
}
