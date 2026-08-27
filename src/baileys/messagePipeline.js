/**
 * Pipeline de negócio Baileys — espelha setupMessageListener / handleIncomingMessage
 * de src/wpp/index.js, reutilizando os mesmos handlers (messageArchive, tarefa,
 * jobApplicationFlow, GPT/typing).
 *
 * Não altera src/wpp/**; importa módulos de negócio compartilhados.
 */

import { handleJobFlow } from '../wpp/jobApplicationFlow.js';
import * as tarefaHandler from '../tarefas/tarefaHandler.js';
import { recordWhatsAppMessage, markIaOutbound } from '../wpp/messageArchive.js';
import sessionManager from '../wpp/sessionManager.js';
import { WhatsAppBotModel, BotSettingsModel } from '../db/models.js';
import { sendToGPT, formatConversationHistory } from '../ai/chat.js';
import logger from '../utils/logger.js';

function extractPhoneNumber(whatsappId) {
  if (!whatsappId) return null;
  if (typeof whatsappId === 'object') {
    const raw = whatsappId._serialized || whatsappId.user || whatsappId.id || '';
    return extractPhoneNumber(raw);
  }
  const s = String(whatsappId);
  const beforeAt = s.split('@')[0];
  const digits = beforeAt.replace(/\D/g, '');
  return digits || beforeAt || null;
}

/**
 * Resolve telefone real a partir da mensagem já normalizada (com fix @lid).
 * Diferente do WPP: o normalizeBaileysMessage já preferiu remoteJidAlt.
 */
function telefoneFromNormalized(message) {
  const from = message?.from || '';
  if (from.endsWith('@s.whatsapp.net') || from.endsWith('@c.us')) {
    return from.split('@')[0];
  }
  if (message?.senderPn && !String(message.senderPn).endsWith('@lid')) {
    const pn = String(message.senderPn);
    return pn.includes('@') ? pn.split('@')[0] : pn.replace(/\D/g, '') || null;
  }
  if (from.endsWith('@lid')) return null;
  if (from.includes('@')) return null;
  return /^\d+$/.test(from) ? from : null;
}

/**
 * @param {object} client — shim createBaileysWppClient
 * @param {string} userId
 * @param {number} slot
 * @param {boolean} iaAtiva
 */
export function setupBaileysMessagePipeline(client, userId, slot, iaAtiva) {
  const messageBuffers = new Map();

  sessionManager.setClient(
    userId,
    slot,
    client,
    iaAtiva ? 'atendimento' : 'somente-envio',
    iaAtiva,
  );

  /**
   * @param {object} normalized — shape WPP (normalizeBaileysMessage)
   * @param {object} [raw] — WAMessage Baileys (anexado em _baileysRaw)
   */
  async function onNormalizedMessage(normalized, raw) {
    const message = {
      ...normalized,
      _baileysRaw: raw || normalized._baileysRaw || null,
      // mimetype helper para messageArchive / tarefaHandler
      mimetype:
        raw?.message?.imageMessage?.mimetype ||
        raw?.message?.videoMessage?.mimetype ||
        raw?.message?.audioMessage?.mimetype ||
        raw?.message?.documentMessage?.mimetype ||
        normalized.mimetype ||
        undefined,
    };

    logger.info(`[🔔 baileys/onMessage] userId=${userId} slot=${slot}`);

    // Histórico (sempre) — mesmo contrato do WPP
    try {
      recordWhatsAppMessage(message, client, userId, slot);
    } catch (err) {
      logger.warn(`[baileys/messageArchive] ${err?.message}`);
    }

    if (!sessionManager.getIaAtiva(userId, slot)) {
      return;
    }

    const isTextType = message.type === 'chat' || message.type === 'text';
    if (
      message.isGroupMsg ||
      message.isStatus ||
      message.isStory ||
      (message.from && (String(message.from).includes('status') || String(message.from).includes('broadcast'))) ||
      message.type === 'status' ||
      message.fromMe ||
      !isTextType
    ) {
      await handleIncomingMessage(message, client, userId, slot);
      return;
    }

    const phone = message.from;
    const text = (message.body || message.text || '').trim();
    if (!text) {
      await handleIncomingMessage(message, client, userId, slot);
      return;
    }

    if (messageBuffers.has(phone)) {
      clearTimeout(messageBuffers.get(phone).timer);
      messageBuffers.get(phone).texts.push(text);
      messageBuffers.get(phone).lastMessage = message;
    } else {
      messageBuffers.set(phone, { texts: [text], lastMessage: message, timer: null });
    }

    const count = messageBuffers.get(phone).texts.length;
    logger.info(`[📦 BUFFER/baileys] Acumulando msg de ${phone} (${count}) — 8s`);

    const timer = setTimeout(async () => {
      const buffer = messageBuffers.get(phone);
      messageBuffers.delete(phone);
      if (!buffer || buffer.texts.length === 0) return;

      const combinedText = buffer.texts.join('\n');
      const combinedMessage = Object.assign({}, buffer.lastMessage, {
        body: combinedText,
        text: combinedText,
      });
      try {
        await handleIncomingMessage(combinedMessage, client, userId, slot);
      } catch (bufferErr) {
        logger.warn(`[📦 BUFFER/baileys] Erro ${phone}: ${bufferErr?.message}`);
      }
    }, 8000);

    messageBuffers.get(phone).timer = timer;
  }

  return { onNormalizedMessage };
}

async function handleIncomingMessage(message, client, userId, slot) {
  try {
    logger.info(`[📨 baileys] De: ${message.from} tipo=${message.type} fromMe=${message.fromMe}`);

    let sessionIaPrompt = '';
    try {
      const durable = await WhatsAppBotModel.getDurableConfig(userId, slot);
      if (!durable || durable.iaAtiva !== true) {
        logger.warn(
          `[baileys/handle] ignorando: sessão ${userId}:${slot} iaAtiva=${durable ? durable.iaAtiva : 'ausente'}`,
        );
        return;
      }
      sessionIaPrompt = (durable.iaPrompt || '').trim();
    } catch (iaErr) {
      logger.error(`[baileys/handle] falha iaAtiva: ${iaErr?.message}`);
      return;
    }

    if (message.isGroupMsg) return;

    if (
      message.isStatus ||
      message.isStory ||
      (message.from && (String(message.from).includes('status') || String(message.from).includes('broadcast'))) ||
      message.type === 'status'
    ) {
      return;
    }

    if (message.fromMe) {
      const rawTextFromMe = (message.body || message.text || '').trim().toLowerCase();
      const phoneRawFromMe = message.to || message.chatId || message.from;
      const phoneFromMe = extractPhoneNumber(phoneRawFromMe) || phoneRawFromMe;

      if (rawTextFromMe.startsWith('⏰ hora da tarefa:')) {
        const destinoStr = String(message.to || message.chatId || '');
        if (destinoStr.endsWith('@lid')) {
          const lidEco = destinoStr.split('@')[0];
          try {
            await tarefaHandler.vincularLidASessaoRecente(lidEco);
          } catch (ecoErr) {
            logger.warn(`[baileys/eco] LID ${lidEco}: ${ecoErr?.message}`);
          }
        }
      }

      if (rawTextFromMe === '#boa noite') {
        sessionManager.setManualMode(userId, slot, phoneFromMe, true);
        return;
      }
      if (rawTextFromMe === '#ativar ia') {
        sessionManager.setManualMode(userId, slot, phoneFromMe, false);
        return;
      }
      return;
    }

    const phone = extractPhoneNumber(message.from) || message.from;
    const telefoneLimpo = telefoneFromNormalized(message);
    const lidDigits = String(message.from || '').endsWith('@lid')
      ? String(message.from).split('@')[0]
      : (message._baileys?.remoteJid && String(message._baileys.remoteJid).endsWith('@lid')
          ? String(message._baileys.remoteJid).split('@')[0]
          : null);

    const chaveConversa = telefoneLimpo ?? String(phone).split('@')[0];

    if (sessionManager.isManualMode(userId, slot, chaveConversa)) {
      logger.wpp(userId, slot, `🔕 Chat ${chaveConversa} em MODO MANUAL (baileys).`);
      return;
    }

    try {
      const sessaoAtiva = await tarefaHandler.getSessaoAtiva(telefoneLimpo, lidDigits);
      if (sessaoAtiva) {
        const telefoneParaHandler = telefoneLimpo ?? chaveConversa;
        await tarefaHandler.processarMensagem(message, client, telefoneParaHandler, sessaoAtiva);
        return;
      }
    } catch (tarefaErr) {
      logger.error(`[🎯 TAREFA/baileys] ${tarefaErr?.message}`);
    }

    try {
      const humanSessions = {
        has: (contactId) => {
          const phoneVaga = extractPhoneNumber(contactId) || contactId;
          return sessionManager.isManualMode(userId, slot, phoneVaga) === true;
        },
      };
      const assumido = await handleJobFlow(client, message, humanSessions);
      if (assumido) return;
    } catch (vagaErr) {
      logger.error(`[💼 VAGA/baileys] ${vagaErr?.message}`);
    }

    if (message.type !== 'chat' && message.type !== 'text') return;

    const rawText = (message.body || message.text || '').trim();
    if (!rawText) return;

    const botSettings = await BotSettingsModel.findByUser(userId).catch(() => null);
    if (!botSettings?.isActive) return;

    const conversationHistory = sessionManager.getConversation(
      userId,
      slot,
      chaveConversa,
      botSettings.contextLimit || 10,
    );
    const formattedHistory = formatConversationHistory(
      conversationHistory,
      botSettings.contextLimit || 10,
    );

    const exclusivePrompt = sessionIaPrompt;
    const fallbackPrompt = (botSettings.basePrompt || '').trim();
    const basePrompt = exclusivePrompt
      ? `Siga EXCLUSIVAMENTE as instruções desta sessão. Não use persona padrão de pizzaria/atendimento se ela contradisser o que está abaixo.\n\n${exclusivePrompt}`
      : fallbackPrompt;

    const gptSettings = {
      botName: botSettings.botName || 'Assistente',
      storeType: botSettings.storeType || 'restaurant',
      lineLimit: botSettings.lineLimit || 5,
      basePrompt,
    };

    sessionManager.addMessage(userId, slot, chaveConversa, {
      body: rawText,
      fromMe: false,
      timestamp: Date.now(),
    });

    try {
      await client.startTyping(message.from);
    } catch (typingErr) {
      logger.warn(`[baileys/typing] start: ${typingErr?.message}`);
    }

    try {
      const aiResponse = await sendToGPT(rawText, formattedHistory, gptSettings);
      markIaOutbound(userId, slot, message.from, aiResponse);
      await client.sendText(message.from, aiResponse);
      sessionManager.addMessage(userId, slot, chaveConversa, {
        body: aiResponse,
        fromMe: true,
        timestamp: Date.now(),
      });
      logger.success(`✅ [baileys] Resposta GPT enviada para ${chaveConversa}`);
    } finally {
      try {
        await client.stopTyping(message.from);
      } catch (typingErr) {
        logger.warn(`[baileys/typing] stop: ${typingErr?.message}`);
      }
    }
  } catch (error) {
    logger.error(`❌ [baileys] Erro ao processar [${userId}:${slot}]:`, error?.message || error);
  }
}
