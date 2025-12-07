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
      // Ignorar mensagens de grupos
      if (message.isGroupMsg) {
        return;
      }

      // Processar apenas mensagens de texto
      if (message.type !== 'chat' && message.type !== 'text') {
        return;
      }

      const userMessage = message.body || message.text;
      if (!userMessage) {
        return;
      }

      // Log TODAS as mensagens que chegam
      logger.wpp(userId, slot, `📩 MENSAGEM RECEBIDA - from: ${message.from}, fromMe: ${message.fromMe}, body: "${userMessage}"`);

      const trimmedMessage = userMessage.trim().toLowerCase();
      const normalizedCommand = trimmedMessage.replace(/\s+/g, ' ').trim();
      
      logger.wpp(userId, slot, `🔍 Após normalização: "${normalizedCommand}"`);

      // Obter número conectado do bot
      let botConnectedNumber = null;
      try {
        const bot = await WhatsAppBotModel.findByUserAndSlot(userId, slot).catch(() => null);
        if (bot && bot.connectedNumber) {
          botConnectedNumber = extractPhoneNumber(bot.connectedNumber) || bot.connectedNumber;
          logger.wpp(userId, slot, `📱 Bot conectado no número: ${botConnectedNumber}`);
        } else {
          logger.wpp(userId, slot, `⚠️ Número do bot não encontrado no banco`);
        }
      } catch (error) {
        logger.wpp(userId, slot, `❌ Erro ao buscar número conectado: ${error.message}`);
      }

      // Extrair número do remetente
      const senderNumber = extractPhoneNumber(message.from) || message.from;
      logger.wpp(userId, slot, `📤 Remetente: ${senderNumber}`);

      // Verificar se o remetente é o número conectado do bot
      const isBotNumber = botConnectedNumber && senderNumber === botConnectedNumber;
      logger.wpp(userId, slot, `🔍 Remetente é o bot? ${isBotNumber} (${senderNumber} === ${botConnectedNumber})`);

      // Verificar se é um comando (APENAS com #)
      const isBoaNoite = normalizedCommand === '#boa noite' || normalizedCommand === '#boanoite';
      const isBrigado = normalizedCommand === '#brigado' || normalizedCommand === '#obrigado';
      const isCommand = isBoaNoite || isBrigado;
      
      logger.wpp(userId, slot, `🔍 É comando? ${isCommand} (isBoaNoite: ${isBoaNoite}, isBrigado: ${isBrigado})`);

      // ============================================
      // COMANDOS DO ESTABELECIMENTO
      // Apenas se: 1) É um comando E 2) O remetente é o número conectado do bot
      // ============================================
      if (isCommand && isBotNumber) {
        // Identificar o cliente através do chatId
        // Quando você envia "#boa noite" em uma conversa com um cliente,
        // o chatId dessa mensagem é o identificador da conversa com esse cliente
        let clientPhoneNumber = null;
        
        // Tentar múltiplos campos para identificar o cliente/conversa
        if (message.chatId) {
          clientPhoneNumber = message.chatId;
        } else if (message.chat && message.chat.id) {
          clientPhoneNumber = message.chat.id;
        } else if (message.to) {
          clientPhoneNumber = message.to;
        } else if (message.id && message.id.remote) {
          clientPhoneNumber = message.id.remote;
        }
        
        logger.wpp(userId, slot, `🔍 Tentando identificar cliente:`);
        logger.wpp(userId, slot, `   - message.chatId: ${message.chatId}`);
        logger.wpp(userId, slot, `   - message.chat?.id: ${message.chat?.id}`);
        logger.wpp(userId, slot, `   - message.to: ${message.to}`);
        logger.wpp(userId, slot, `   - message.id?.remote: ${message.id?.remote}`);
        logger.wpp(userId, slot, `   - clientPhoneNumber identificado: ${clientPhoneNumber}`);
        
        if (!clientPhoneNumber) {
          logger.wpp(userId, slot, `❌ Não foi possível identificar o cliente. Campos disponíveis: ${Object.keys(message).join(', ')}`);
          return;
        }
        
        // Normalizar número do cliente
        clientPhoneNumber = extractPhoneNumber(clientPhoneNumber) || clientPhoneNumber;
        
        logger.wpp(userId, slot, `✨✨✨ COMANDO DETECTADO! ✨✨✨`);
        logger.wpp(userId, slot, `   - Comando: "${normalizedCommand}"`);
        logger.wpp(userId, slot, `   - Remetente: ${senderNumber} (bot)`);
        logger.wpp(userId, slot, `   - Cliente: ${clientPhoneNumber}`);
        
        // Comando para assumir chat (ativar modo manual)
        if (isBoaNoite) {
          sessionManager.setManualMode(userId, slot, clientPhoneNumber, true);
          logger.wpp(userId, slot, `✅✅✅ Modo manual ATIVADO para cliente ${clientPhoneNumber}`);
          // Verificar se foi salvo corretamente
          const verifyManual = sessionManager.isManualMode(userId, slot, clientPhoneNumber);
          logger.wpp(userId, slot, `🔍 Verificação imediata: ${verifyManual ? '✅ MODO MANUAL CONFIRMADO ATIVO' : '❌ FALHOU - NÃO ESTÁ ATIVO'}`);
          
          // Enviar confirmação visual
          try {
            await client.sendText(message.chatId || message.chat?.id || message.from, '✅ Modo manual ativado. Bot pausado para este chat. Use #brigado para reativar.');
          } catch (e) {
            logger.wpp(userId, slot, `Erro ao enviar confirmação: ${e.message}`);
          }
          return;
        }
        
        // Comando para bot assumir (desativar modo manual)
        if (isBrigado) {
          sessionManager.setManualMode(userId, slot, clientPhoneNumber, false);
          logger.wpp(userId, slot, `✅✅✅ Modo automático ATIVADO para cliente ${clientPhoneNumber}`);
          // Verificar se foi salvo corretamente
          const verifyManual = sessionManager.isManualMode(userId, slot, clientPhoneNumber);
          logger.wpp(userId, slot, `🔍 Verificação imediata: ${verifyManual ? '❌ AINDA ATIVO (ERRO)' : '✅ MODO AUTOMÁTICO CONFIRMADO'}`);
          
          // Enviar confirmação visual
          try {
            await client.sendText(message.chatId || message.chat?.id || message.from, '✅ Modo automático ativado. Bot voltou a responder automaticamente. Use #boa noite para pausar.');
          } catch (e) {
            logger.wpp(userId, slot, `Erro ao enviar confirmação: ${e.message}`);
          }
          return;
        }
      }
      
      // Se o remetente é o bot mas não é um comando válido, ignorar
      if (isBotNumber) {
        logger.wpp(userId, slot, `📝 Mensagem do bot (não é comando): ignorando processamento com IA`);
        return;
        
        logger.wpp(userId, slot, `✨✨✨ COMANDO DETECTADO! ✨✨✨`);
        logger.wpp(userId, slot, `   - Comando: "${normalizedCommand}"`);
        logger.wpp(userId, slot, `   - Cliente (from): ${clientPhoneNumber} (${message.from})`);
        logger.wpp(userId, slot, `   - fromMe: ${message.fromMe}`);
        
        // Comando para assumir chat (ativar modo manual)
        if (isBoaNoite) {
          sessionManager.setManualMode(userId, slot, clientPhoneNumber, true);
          logger.wpp(userId, slot, `✅✅✅ Modo manual ATIVADO para cliente ${clientPhoneNumber}`);
          // Verificar se foi salvo corretamente
          const verifyManual = sessionManager.isManualMode(userId, slot, clientPhoneNumber);
          logger.wpp(userId, slot, `🔍 Verificação imediata: ${verifyManual ? '✅ MODO MANUAL CONFIRMADO ATIVO' : '❌ FALHOU - NÃO ESTÁ ATIVO'}`);
          
          // Enviar confirmação visual (opcional)
          try {
            await client.sendText(message.from, '✅ Modo manual ativado. Bot pausado para este chat. Use #brigado para reativar.');
          } catch (e) {
            logger.wpp(userId, slot, `Erro ao enviar confirmação: ${e.message}`);
          }
          return;
        }
        
        // Comando para bot assumir (desativar modo manual)
        if (isBrigado) {
          sessionManager.setManualMode(userId, slot, clientPhoneNumber, false);
          logger.wpp(userId, slot, `✅✅✅ Modo automático ATIVADO para cliente ${clientPhoneNumber}`);
          // Verificar se foi salvo corretamente
          const verifyManual = sessionManager.isManualMode(userId, slot, clientPhoneNumber);
          logger.wpp(userId, slot, `🔍 Verificação imediata: ${verifyManual ? '❌ AINDA ATIVO (ERRO)' : '✅ MODO AUTOMÁTICO CONFIRMADO'}`);
          
          // Enviar confirmação visual (opcional)
          try {
            await client.sendText(message.from, '✅ Modo automático ativado. Bot voltou a responder automaticamente. Use #boa noite para pausar.');
          } catch (e) {
            logger.wpp(userId, slot, `Erro ao enviar confirmação: ${e.message}`);
          }
          return;
        }
      }

      // ============================================
      // MENSAGENS DO CLIENTE (message.fromMe === false)
      // ============================================
      
      // Verificar se deve ignorar a mensagem (mas não verificar fromMe aqui, já foi verificado acima)
      if (message.isGroupMsg || message.isBroadcast || (!message.body && !message.text)) {
        return;
      }

      logger.wpp(userId, slot, `📨 Mensagem recebida do CLIENTE ${message.from}: ${message.type}`);

      // Buscar configurações do bot
      const botSettings = await BotSettingsModel.findByUser(userId).catch(() => null);
      
      if (!botSettings || !botSettings.isActive) {
        logger.wpp(userId, slot, 'Bot desabilitado, ignorando mensagem');
        return;
      }

      // Extrair número de telefone do cliente
      const phoneNumber = extractPhoneNumber(message.from) || message.from;
      
      logger.wpp(userId, slot, `📨 Mensagem do cliente ${phoneNumber} (${message.from}): "${userMessage}"`);
      
      // IMPORTANTE: Verificar modo manual ANTES de processar com IA
      const isManual = sessionManager.isManualMode(userId, slot, phoneNumber);
      logger.wpp(userId, slot, `🔍 Verificando modo manual para ${phoneNumber} (${message.from}): ${isManual ? '✅ ATIVO - BLOQUEANDO IA' : '❌ INATIVO - PROCESSANDO COM IA'}`);
      
      // Debug: listar todos os modos manuais ativos
      logger.wpp(userId, slot, `🔍 DEBUG - Verificando estado do modo manual...`);
      
      if (isManual) {
        logger.wpp(userId, slot, `🚫🚫🚫 Modo manual ATIVO para ${phoneNumber} - IGNORANDO processamento com IA - Mensagem: "${userMessage}"`);
        // Salvar mensagem do cliente no histórico mesmo em modo manual
        sessionManager.addMessage(userId, slot, phoneNumber, {
          body: userMessage,
          fromMe: false,
          timestamp: Date.now()
        });
        // RETORNAR IMEDIATAMENTE - NÃO processa com IA
        return;
      }
      
      logger.wpp(userId, slot, `🤖 Modo automático - Processando mensagem com IA para ${phoneNumber}`);

      // Buscar histórico de conversa (últimas N mensagens)
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

      // Enviar resposta (usar phoneNumber normalizado)
      await client.sendText(message.from, aiResponse);
      logger.success(`Resposta enviada para ${phoneNumber} (${message.from})`);

      // Salvar resposta do bot no histórico
      sessionManager.addMessage(userId, slot, phoneNumber, {
        body: aiResponse,
        fromMe: true,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error(`Erro ao processar mensagem [${userId}:${slot}]:`, error.message || error);
      try {
        await client.sendText(message.from, 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
      } catch (sendError) {
        logger.error('Erro ao enviar mensagem de erro:', sendError.message || sendError);
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
