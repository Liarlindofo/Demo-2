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
    
    // Define userDataDir do Puppeteer (NUNCA usar pastas dentro do nginx)
    const sessionsDir = (config.wppConnect && config.wppConnect.sessionsDir) || '/var/www/whatsapp-sessions';
    const userDataDir = `${sessionsDir}/${sessionName}`;
    
    // Prepara opções do Puppeteer com userDataDir
    const basePuppeteerOptions = (config.wppConnect && config.wppConnect.puppeteerOptions) || {};
    const puppeteerOptions = Object.assign({}, basePuppeteerOptions, {
      userDataDir: userDataDir
    });

    // Garante que o bot existe no banco antes de iniciar
    try {
      await WhatsAppBotModel.upsert(userId, slot, {
        isConnected: false,
        qrCode: null,
        connectedNumber: null
      });
    } catch (error) {
      logger.error(`Erro ao criar/atualizar bot no banco [${userId}:${slot}]:`, error);
      // Continua mesmo se houver erro, mas loga
    }

    // NÃO USA await → inicia em background
    const headless = (config.wppConnect && config.wppConnect.headless) !== undefined 
      ? config.wppConnect.headless 
      : true;
    
    wppconnect
      .create({
        session: sessionName,
        headless: headless,
        puppeteerOptions: puppeteerOptions,
        // Não fechar automaticamente a sessão enquanto aguarda leitura do QR
        // 0 (ou false) desabilita o auto close, evitando "Auto Close remain" e "Failed to authenticate"
        autoClose: 0,
        logQR: false,
        disableWelcome: true,
        updatesLog: false,

        catchQR: async (base64Qr) => {
          await onQRCode(userId, slot, base64Qr);
        },

        statusFind: async (status, session) => {
          // Obtém o client do sessionManager para passar ao onStatusChange
          const client = sessionManager.getClient(userId, slot);
          await onStatusChange(userId, slot, status, client);
        },
      })
      .then(async (client) => {
        logger.wpp(userId, slot, 'Cliente WPPConnect criado.');
        sessionManager.setClient(userId, slot, client);
        
        // Configurar listener de mensagens
        setupMessageListener(client, userId, slot);
        
        // Verifica se já está conectado após criar o client
        try {
          const isConnected = await client.isConnected().catch(() => false);
          if (isConnected) {
            logger.wpp(userId, slot, 'Cliente já está conectado, atualizando status...');
            await onStatusChange(userId, slot, 'chatsAvailable', client);
          }
        } catch (error) {
          // Ignora erro na verificação inicial
        }
      })
      .catch((error) => {
        logger.error(`Erro ao criar cliente [${userId}:${slot}]`, error);
        sessionManager.removeClient(userId, slot);
        WhatsAppBotModel.setDisconnected(userId, slot).catch(() => {});
      });

    return {
      success: true,
      message: 'Sessão iniciada, aguardando QR.',
      isConnected: false,
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

/**
 * Configura listener de mensagens para processar com IA
 */
function setupMessageListener(client, userId, slot) {
  client.onMessage(async (message) => {
    try {
      // Ignorar mensagens de grupos e do próprio bot
      if (message.isGroupMsg || message.fromMe) {
        return;
      }

      // Verificar se deve ignorar a mensagem
      if (shouldIgnoreMessage(message)) {
        return;
      }

      logger.wpp(userId, slot, `Mensagem recebida de ${message.from}: ${message.type}`);

      // Buscar configurações do bot
      const botSettings = await BotSettingsModel.findByUser(userId).catch(() => null);
      
      if (!botSettings || !botSettings.isActive) {
        logger.wpp(userId, slot, 'Bot desabilitado, ignorando mensagem');
        return;
      }

      // Processar apenas mensagens de texto por enquanto
      if (message.type !== 'chat' && message.type !== 'text') {
        logger.wpp(userId, slot, `Tipo de mensagem não suportado: ${message.type}`);
        return;
      }

      const userMessage = message.body || message.text;
      if (!userMessage) {
        return;
      }

      // Buscar histórico de conversa (últimas N mensagens)
      const phoneNumber = message.from;
      const conversationHistory = sessionManager.getConversation(userId, slot, phoneNumber, botSettings.contextLimit || 10);

      // Formatar histórico para o GPT
      const formattedHistory = formatConversationHistory(conversationHistory, botSettings.contextLimit || 10);

      // Preparar configurações para o GPT
      const gptSettings = {
        botName: botSettings.botName || 'Assistente',
        storeType: botSettings.storeType || 'restaurant',
        lineLimit: botSettings.lineLimit || 5,
        basePrompt: botSettings.basePrompt || ''
      };

      // Enviar para GPT e obter resposta
      logger.ai(`Processando mensagem com IA [${userId}:${slot}]`);
      const aiResponse = await sendToGPT(userMessage, formattedHistory, gptSettings);

      // Salvar mensagem do usuário no histórico
      sessionManager.addMessage(userId, slot, phoneNumber, {
        body: userMessage,
        fromMe: false,
        timestamp: Date.now()
      });

      // Enviar resposta
      await client.sendText(message.from, aiResponse);
      logger.success(`Resposta enviada para ${message.from}`);

      // Salvar resposta do bot no histórico
      sessionManager.addMessage(userId, slot, phoneNumber, {
        body: aiResponse,
        fromMe: true,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error(`Erro ao processar mensagem [${userId}:${slot}]:`, error);
      try {
        await client.sendText(message.from, 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
      } catch (sendError) {
        logger.error('Erro ao enviar mensagem de erro:', sendError);
      }
    }
  });
}

export async function restoreAllSessions() {
  try {
    logger.info('Restaurando sessões...');
    
    // Busca todos os bots do banco (não apenas conectados, para restaurar todos)
    const allBots = await prisma.whatsAppBot.findMany();

    logger.info(`Encontrados ${allBots.length} bots para restaurar`);

    for (const bot of allBots) {
      logger.info(`Restaurando sessão [${bot.userId}:${bot.slot}]`);
      // Inicia em background, não bloqueia
      startClient(bot.userId, bot.slot).catch(error => {
        logger.error(`Erro ao restaurar sessão [${bot.userId}:${bot.slot}]:`, error);
      });
    }

    logger.success(`✓ Restauração de sessões concluída`);

  } catch (error) {
    logger.error('Erro ao restaurar sessões:', error);
  }
}
