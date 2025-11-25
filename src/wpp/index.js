import wppconnect from 'wppconnect';
import config from '../../config.js';
import logger from '../utils/logger.js';
import prisma from '../db/index.js';
import sessionManager from './sessionManager.js';
import { onQRCode, onStatusChange, extractPhoneNumber, shouldIgnoreMessage } from './qrHandler.js';
import { WhatsAppBotModel, BotSettingsModel } from '../db/models.js';
import { sendToGPT, formatConversationHistory } from '../ai/chat.js';

/**
 * Inicializa e gerencia clientes WPPConnect
 */

/**
 * Inicia cliente WPPConnect para um usuário/slot
 */
export async function startClient(userId, slot) {
  try {
    logger.wpp(userId, slot, 'Iniciando cliente WPPConnect...');

    // Verifica se já existe cliente ativo
    if (sessionManager.hasClient(userId, slot)) {
      logger.warn(`Cliente já ativo [${userId}:${slot}]`);
      return { success: false, message: 'Cliente já está ativo' };
    }

    // Busca dados do banco
    const botData = await WhatsAppBotModel.findByUserAndSlot(userId, slot);
    
    const sessionName = `${userId}-slot${slot}`;

    // Cria cliente WPPConnect
    const client = await wppconnect.create({
      session: sessionName,
      headless: config.wppConnect.headless,
      puppeteerOptions: config.wppConnect.puppeteerOptions,
      autoClose: 60000,
      logQR: false,
      disableWelcome: true,
      updatesLog: false,
      
      // Callback do QR Code
      catchQR: async (base64Qr, asciiQR, attempts, urlCode) => {
        await onQRCode(userId, slot, base64Qr);
      },
      
      // Callback de status
      statusFind: async (statusSession, session) => {
        await onStatusChange(userId, slot, statusSession);
      }
    });

    // Salva cliente na memória
    sessionManager.setClient(userId, slot, client);

    // Aguarda conexão completa
    await client.isConnected();

    // Busca informações da conexão
    const hostDevice = await client.getHostDevice();
    const connectedNumber = extractPhoneNumber(hostDevice.id._serialized);

    logger.success(`✓ WhatsApp conectado: ${connectedNumber} [${userId}:${slot}]`);

    // Atualiza banco de dados
    await WhatsAppBotModel.setConnected(userId, slot, connectedNumber, {
      hostDevice,
      connectedAt: new Date().toISOString()
    });

    // Configura listener de mensagens
    setupMessageListener(client, userId, slot);

    return {
      success: true,
      message: 'Cliente conectado com sucesso',
      connectedNumber
    };

  } catch (error) {
    logger.error(`Erro ao iniciar cliente [${userId}:${slot}]:`, error);
    
    // Remove cliente em caso de erro
    sessionManager.removeClient(userId, slot);
    
    return {
      success: false,
      message: error.message || 'Erro ao iniciar cliente'
    };
  }
}

/**
 * Para cliente WPPConnect
 */
export async function stopClient(userId, slot) {
  try {
    logger.wpp(userId, slot, 'Parando cliente...');

    const client = sessionManager.getClient(userId, slot);
    
    if (!client) {
      logger.warn(`Cliente não encontrado [${userId}:${slot}]`);
      return { success: false, message: 'Cliente não está ativo' };
    }

    // Fecha cliente
    await client.close();

    // Remove da memória
    sessionManager.removeClient(userId, slot);
    sessionManager.clearAllConversations(userId, slot);

    // Atualiza banco
    await WhatsAppBotModel.setDisconnected(userId, slot);

    logger.success(`✓ Cliente desconectado [${userId}:${slot}]`);

    return {
      success: true,
      message: 'Cliente desconectado com sucesso'
    };

  } catch (error) {
    logger.error(`Erro ao parar cliente [${userId}:${slot}]:`, error);
    return {
      success: false,
      message: error.message || 'Erro ao parar cliente'
    };
  }
}

/**
 * Configura listener de mensagens recebidas
 */
function setupMessageListener(client, userId, slot) {
  client.onMessage(async (message) => {
    try {
      // Busca configurações do bot
      const settings = await BotSettingsModel.findByUser(userId);

      // Verifica se bot está ativo
      if (!settings.isActive) {
        logger.debug(`Bot inativo, mensagem ignorada [${userId}:${slot}]`);
        return;
      }

      // Busca número conectado
      const botData = await WhatsAppBotModel.findByUserAndSlot(userId, slot);
      const botNumber = botData?.connectedNumber;

      // Verifica se deve ignorar mensagem
      if (shouldIgnoreMessage(message, botNumber)) {
        return;
      }

      const fromNumber = extractPhoneNumber(message.from);
      const messageText = message.body || message.text || '';

      logger.wpp(userId, slot, `Mensagem recebida de ${fromNumber}`, {
        preview: messageText.substring(0, 50)
      });

      // Adiciona mensagem ao histórico
      sessionManager.addMessage(userId, slot, fromNumber, {
        text: messageText,
        fromMe: false,
        timestamp: message.timestamp
      });

      // Busca histórico da conversa
      const conversationHistory = sessionManager.getConversation(
        userId, 
        slot, 
        fromNumber, 
        settings.contextLimit
      );

      // Formata histórico para o GPT
      const formattedHistory = formatConversationHistory(conversationHistory);

      // Envia para GPT-4o
      const reply = await sendToGPT(messageText, formattedHistory, {
        botName: settings.botName,
        storeType: settings.storeType,
        lineLimit: settings.lineLimit,
        basePrompt: settings.basePrompt
      });

      // Envia resposta
      await client.sendText(message.from, reply);

      logger.wpp(userId, slot, `Resposta enviada para ${fromNumber}`);

      // Adiciona resposta ao histórico
      sessionManager.addMessage(userId, slot, fromNumber, {
        text: reply,
        fromMe: true,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error(`Erro ao processar mensagem [${userId}:${slot}]:`, error);
      
      // Tenta enviar mensagem de erro ao usuário
      try {
        await client.sendText(
          message.from, 
          'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.'
        );
      } catch (sendError) {
        logger.error('Erro ao enviar mensagem de erro:', sendError);
      }
    }
  });

  logger.wpp(userId, slot, 'Listener de mensagens configurado');
}

/**
 * Verifica status de um cliente
 */
export async function getClientStatus(userId, slot) {
  const client = sessionManager.getClient(userId, slot);
  
  if (!client) {
    return {
      isActive: false,
      isConnected: false
    };
  }

  try {
    const isConnected = await client.isConnected();
    const batteryLevel = await client.getBatteryLevel().catch(() => null);
    
    return {
      isActive: true,
      isConnected,
      batteryLevel
    };
  } catch (error) {
    return {
      isActive: true,
      isConnected: false,
      error: error.message
    };
  }
}

/**
 * Restaura sessões ao reiniciar servidor
 */
export async function restoreAllSessions() {
  try {
    logger.info('Restaurando sessões do banco de dados...');
    
    // Busca todos os bots conectados
    const connectedBots = await prisma.whatsAppBot.findMany({
      where: {
        isConnected: true
      }
    });

    logger.info(`Encontrados ${connectedBots.length} bots para restaurar`);

    for (const bot of connectedBots) {
      try {
        logger.info(`Restaurando sessão [${bot.userId}:${bot.slot}]...`);
        await startClient(bot.userId, bot.slot);
      } catch (error) {
        logger.error(`Erro ao restaurar [${bot.userId}:${bot.slot}]:`, error);
        // Marca como desconectado
        await WhatsAppBotModel.setDisconnected(bot.userId, bot.slot);
      }
    }

    logger.success('✓ Processo de restauração concluído');
  } catch (error) {
    logger.error('Erro ao restaurar sessões:', error);
  }
}

