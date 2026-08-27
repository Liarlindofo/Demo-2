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

function isLidJid(jid) {
  return String(jid || '').endsWith('@lid');
}

function isPhoneWhatsappJid(jid) {
  const s = String(jid || '');
  return s.endsWith('@s.whatsapp.net') || s.endsWith('@c.us');
}

function pickPhoneJid(...candidates) {
  for (const jid of candidates) {
    if (isPhoneWhatsappJid(jid)) return jid;
  }
  return null;
}

/**
 * Extrai JIDs alternativos expostos pelo Baileys (remoteJidAlt / participantAlt).
 * @param {import('@whiskeysockets/baileys').WAMessage} baileysMsg
 * @param {object} key
 */
function extractAltJids(baileysMsg, key) {
  return {
    remoteJidAlt:
      key.remoteJidAlt ??
      baileysMsg?.remoteJidAlt ??
      baileysMsg?.key?.remoteJidAlt ??
      null,
    participantAlt:
      key.participantAlt ??
      baileysMsg?.participantAlt ??
      baileysMsg?.key?.participantAlt ??
      null,
  };
}

/**
 * Resolve @lid → @s.whatsapp.net quando o Baileys fornece jid alternativo.
 * @returns {{ contactJid: string, chatJid: string, author: string|null, hadLid: boolean, resolvedFromAlt: boolean, warn?: string }}
 */
function resolveLidJids({
  remoteJid,
  remoteJidAlt,
  participant,
  participantAlt,
  group,
}) {
  const hadLid = isLidJid(remoteJid) || (group && isLidJid(participant));
  let resolvedFromAlt = false;
  let warn;

  if (group) {
    const chatJid = remoteJid;
    let author = participant || null;

    if (isLidJid(participant)) {
      const alt = pickPhoneJid(participantAlt);
      if (alt) {
        author = alt;
        resolvedFromAlt = true;
      } else {
        warn = `[BAILEYS normalize] Participante @lid sem participantAlt resolvido: ${participant}`;
      }
    }

    return {
      contactJid: author || chatJid,
      chatJid,
      author,
      hadLid,
      resolvedFromAlt,
      warn,
    };
  }

  // 1:1 — remoteJid @lid deve ser substituído pelo telefone real quando disponível
  if (isLidJid(remoteJid)) {
    const alt = pickPhoneJid(remoteJidAlt);
    if (alt) {
      return {
        contactJid: alt,
        chatJid: alt,
        author: null,
        hadLid: true,
        resolvedFromAlt: true,
        warn,
      };
    }
    warn = `[BAILEYS normalize] Contato @lid sem remoteJidAlt resolvido: ${remoteJid}`;
    return {
      contactJid: remoteJid,
      chatJid: remoteJid,
      author: null,
      hadLid: true,
      resolvedFromAlt: false,
      warn,
    };
  }

  return {
    contactJid: remoteJid,
    chatJid: remoteJid,
    author: null,
    hadLid,
    resolvedFromAlt,
    warn,
  };
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
  const { remoteJidAlt, participantAlt } = extractAltJids(baileysMsg, key);
  const group = isGroupJid(remoteJid);
  const { body, caption, type } = extractText(baileysMsg);
  const pushName = pushNameFrom(baileysMsg);

  const lid = resolveLidJids({
    remoteJid,
    remoteJidAlt,
    participant,
    participantAlt,
    group,
  });

  if (lid.warn) {
    // eslint-disable-next-line no-console
    console.warn(lid.warn);
  }

  const { contactJid, chatJid, author, hadLid, resolvedFromAlt } = lid;

  // WPPConnect: inbound 1:1 → from = contato; outbound → from = nosso número / chat
  // Em grupo: from = grupo, author = participante (com LID resolvido quando possível)
  let from = group ? chatJid : contactJid;
  let to = opts.ourJid || '';
  if (fromMe && !group) {
    from = opts.ourJid || contactJid;
    to = chatJid;
  } else if (!fromMe && !group) {
    from = contactJid;
    to = opts.ourJid || '';
  }

  const ts =
    typeof baileysMsg.messageTimestamp === 'number'
      ? baileysMsg.messageTimestamp
      : Number(baileysMsg.messageTimestamp) || Math.floor(Date.now() / 1000);

  const idRemote = group ? remoteJid : chatJid;
  const idSerialized = key.id
    ? `${fromMe ? 'true' : 'false'}_${idRemote}_${key.id}`
    : null;

  const senderPn = group
    ? (author || participant)
    : fromMe
      ? opts.ourJid || null
      : contactJid;

  return {
    from,
    to,
    chatId: chatJid,
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
      id: senderPn || contactJid,
      pushname: pushName,
      name: pushName,
      formattedName: pushName,
    },
    senderPn: senderPn || null,
    notifyName: pushName,
    timestamp: ts,
    hadLid,
    resolvedFromAlt,
    id: {
      id: key.id || null,
      _serialized: idSerialized,
      fromMe,
      remote: idRemote,
    },
    // metadados extras (não quebram messageArchive)
    _baileys: {
      remoteJid,
      remoteJidAlt,
      participant,
      participantAlt,
      hadLid,
      resolvedFromAlt,
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
