import wppconnect from '@wppconnect-team/wppconnect';
import config from '../../config.js';
import logger from '../utils/logger.js';
import prisma from '../db/index.js';
import sessionManager from './sessionManager.js';
import { onQRCode, onStatusChange, extractPhoneNumber, shouldIgnoreMessage } from './qrHandler.js';
import { WhatsAppBotModel, BotSettingsModel } from '../db/models.js';
import { sendToGPT, formatConversationHistory } from '../ai/chat.js';

/**
 * Inicia cliente WPPConnect para um usuário/slot — NÃO BLOQUEIA
 */
export async function startClient(userId, slot) {
  try {
    logger.wpp(userId, slot, 'Iniciando cliente WPPConnect (não bloqueante)...');

    if (sessionManager.hasClient(userId, slot)) {
      return { success: false, message: 'Cliente já está ativo' };
    }

    const sessionName = `${userId}-slot${slot}`;

    // NÃO USA await → inicia em background
    wppconnect
      .create({
        session: sessionName,
        headless: config.wppConnect.headless,
        puppeteerOptions: config.wppConnect.puppeteerOptions,
        autoClose: 60000,
        logQR: false,
        disableWelcome: true,
        updatesLog: false,

        catchQR: async (base64Qr) => {
          await onQRCode(userId, slot, base64Qr);
        },

        statusFind: async (status) => {
          await onStatusChange(userId, slot, status);
        },
      })
      .then(async (client) => {
        logger.wpp(userId, slot, 'Cliente WPPConnect criado.');
        sessionManager.setClient(userId, slot, client);
      })
      .catch((error) => {
        logger.error(`Erro ao criar cliente [${userId}:${slot}]`, error);
        sessionManager.removeClient(userId, slot);
      });

    return {
      success: true,
      message: 'Sessão iniciada. Aguarde o QR Code.',
      connectedNumber: null,
    };

  } catch (error) {
    logger.error(`Erro ao iniciar cliente [${userId}:${slot}]:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * PARA cliente WPPConnect
 */
export async function stopClient(userId, slot) {
  try {
    const client = sessionManager.getClient(userId, slot);

    if (!client) {
      return { success: false, message: 'Cliente não está ativo' };
    }

    await client.close();
    sessionManager.removeClient(userId, slot);
    sessionManager.clearAllConversations(userId, slot);
    await WhatsAppBotModel.setDisconnected(userId, slot);

    return { success: true, message: 'Cliente desconectado com sucesso' };

  } catch (error) {
    logger.error(`Erro ao parar cliente [${userId}:${slot}]:`, error);
    return { success: false, message: error.message };
  }
}

export async function getClientStatus(userId, slot) {
  const client = sessionManager.getClient(userId, slot);

  if (!client) {
    return { isActive: false, isConnected: false };
  }

  try {
    const isConnected = await client.isConnected().catch(() => false);
    return { isActive: true, isConnected };

  } catch {
    return { isActive: true, isConnected: false };
  }
}

export async function restoreAllSessions() {
  try {
    logger.info('Restaurando sessões...');
    const bots = await prisma.whatsAppBot.findMany({ where: { isConnected: true } });

    for (const bot of bots) {
      startClient(bot.userId, bot.slot);
    }

  } catch (error) {
    logger.error('Erro ao restaurar sessões:', error);
  }
}
