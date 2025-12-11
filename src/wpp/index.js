import wppconnect from '@wppconnect-team/wppconnect';
import config from '../../config.js';
import logger from '../utils/logger.js';
import prisma from '../db/index.js';
import sessionManager from './sessionManager.js';
import { onQRCode, onStatusChange, extractPhoneNumber } from './qrHandler.js';
import { WhatsAppBotModel, BotSettingsModel } from '../db/models.js';
import { sendToGPT, formatConversationHistory } from '../ai/chat.js';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Controle de modo manual (pausa do bot) por conversa.
 * A chave considera usuário, slot e número do cliente para evitar colisões.
 */
const pausedChats = new Set();

function getChatKey(userId, slot, phone) {
  return `${userId}:${slot}:${phone}`;
}

/**
 * Pausa um chat específico (modo humano).
 */
export function pauseChat(userId, slot, phone) {
  const key = getChatKey(userId, slot, phone);
  pausedChats.add(key);
  logger.wpp(userId, slot, `🛑 pauseChat -> Bot pausado para ${phone}`);
}

/**
 * Retoma um chat específico (modo automático).
 */
export function resumeChat(userId, slot, phone) {
  const key = getChatKey(userId, slot, phone);
  pausedChats.delete(key);
  logger.wpp(userId, slot, `✅ resumeChat -> Bot reativado para ${phone}`);
}

/**
 * Verifica se o chat está em modo manual (pausado).
 */
export function isChatPaused(userId, slot, phone) {
  const key = getChatKey(userId, slot, phone);
  return pausedChats.has(key);
}

/**
 * Limpa processos de browser órfãos e lock files
 */
async function cleanupOrphanBrowser(userDataDir) {
  try {
    // Tentar encontrar e matar processos que estão usando o userDataDir
    try {
      // Buscar processos Chrome/Chromium que estão usando esse userDataDir
      const { stdout } = await execAsync(`ps aux | grep -i "chrome.*${userDataDir}" | grep -v grep | awk '{print $2}'`);
      const pids = stdout.trim().split('\n').filter(pid => pid);
      
      if (pids.length > 0) {
        logger.warn(`Encontrados ${pids.length} processos órfãos para ${userDataDir}, tentando finalizar...`);
        for (const pid of pids) {
          try {
            await execAsync(`kill -9 ${pid}`);
            logger.info(`Processo ${pid} finalizado`);
          } catch (killError) {
            logger.warn(`Não foi possível finalizar processo ${pid}: ${killError.message}`);
          }
        }
        // Aguardar um pouco para os processos terminarem
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (psError) {
      // Se o comando ps falhar (pode não estar disponível), apenas loga
      logger.warn(`Não foi possível verificar processos: ${psError.message}`);
    }

    // Limpar lock files do Puppeteer
    const lockFile = path.join(userDataDir, 'SingletonLock');
    const lockSocket = path.join(userDataDir, 'SingletonSocket');
    
    if (fs.existsSync(lockFile)) {
      try {
        fs.unlinkSync(lockFile);
        logger.info(`Lock file removido: ${lockFile}`);
      } catch (unlinkError) {
        logger.warn(`Não foi possível remover lock file: ${unlinkError.message}`);
      }
    }
    
    if (fs.existsSync(lockSocket)) {
      try {
        fs.unlinkSync(lockSocket);
        logger.info(`Lock socket removido: ${lockSocket}`);
      } catch (unlinkError) {
        logger.warn(`Não foi possível remover lock socket: ${unlinkError.message}`);
      }
    }
  } catch (error) {
    logger.warn(`Erro ao limpar processos órfãos: ${error.message}`);
  }
}

/**
 * Inicia cliente WPPConnect para um usuário/slot — NÃO BLOQUEIA
 */
export async function startClient(userId, slot) {
  try {
    logger.wpp(userId, slot, 'Iniciando cliente WPPConnect (não bloqueante)...');

    if (sessionManager.hasClient(userId, slot)) {
      logger.wpp(userId, slot, 'Cliente já está ativo na memória, retornando...');
      return { success: false, message: 'Cliente já está ativo' };
    }

    const sessionName = `${userId}-slot${slot}`;
    
    // Define userDataDir do Puppeteer (NUNCA usar pastas dentro do nginx)
    const sessionsDir = (config.wppConnect && config.wppConnect.sessionsDir) || '/var/www/whatsapp-sessions';
    const userDataDir = `${sessionsDir}/${sessionName}`;
    
    // LOG DE DEBUG - ISOLAMENTO
    console.log('=== 🔍 DEBUG ISOLAMENTO SESSÃO ===');
    console.log('📌 userId recebido:', userId);
    console.log('📌 userId type:', typeof userId);
    console.log('📌 userId length:', userId?.length);
    console.log('📌 slot:', slot);
    console.log('📌 sessionName gerado:', sessionName);
    console.log('📌 userDataDir:', userDataDir);
    console.log('📌 Timestamp:', new Date().toISOString());
    console.log('==================================');
    
    // Limpar processos órfãos antes de tentar criar nova sessão
    logger.wpp(userId, slot, 'Verificando processos órfãos...');
    await cleanupOrphanBrowser(userDataDir);
    
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
      .catch(async (error) => {
        logger.error(`Erro ao criar cliente [${userId}:${slot}]`, error);
        
        // Se o erro for "browser already running", tentar limpar e tentar novamente uma vez
        if (error.message && error.message.includes('browser is already running')) {
          logger.warn(`Browser já está rodando para ${userDataDir}, tentando limpar e reiniciar...`);
          
          // Limpar processos órfãos novamente
          await cleanupOrphanBrowser(userDataDir);
          
          // Aguardar um pouco mais
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Tentar criar novamente (apenas uma vez)
          try {
            logger.wpp(userId, slot, 'Tentando criar cliente novamente após limpeza...');
            
            wppconnect
              .create({
                session: sessionName,
                headless: headless,
                puppeteerOptions: puppeteerOptions,
                autoClose: 0,
                logQR: false,
                disableWelcome: true,
                updatesLog: false,
                catchQR: async (base64Qr) => {
                  await onQRCode(userId, slot, base64Qr);
                },
                statusFind: async (status, session) => {
                  const client = sessionManager.getClient(userId, slot);
                  await onStatusChange(userId, slot, status, client);
                },
              })
              .then(async (client) => {
                logger.wpp(userId, slot, 'Cliente WPPConnect criado após limpeza.');
                sessionManager.setClient(userId, slot, client);
                setupMessageListener(client, userId, slot);
                
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
              .catch((retryError) => {
                logger.error(`Erro ao criar cliente após limpeza [${userId}:${slot}]:`, retryError);
                sessionManager.removeClient(userId, slot);
                WhatsAppBotModel.setDisconnected(userId, slot).catch(() => {});
              });
          } catch (retryError) {
            logger.error(`Erro na tentativa de retry [${userId}:${slot}]:`, retryError);
            sessionManager.removeClient(userId, slot);
            WhatsAppBotModel.setDisconnected(userId, slot).catch(() => {});
          }
        } else {
          // Para outros erros, apenas remove e marca como desconectado
          sessionManager.removeClient(userId, slot);
          WhatsAppBotModel.setDisconnected(userId, slot).catch(() => {});
        }
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
  // Usamos onAnyMessage para receber TANTO mensagens do cliente
  // quanto mensagens enviadas pelo próprio número conectado (fromMe === true).
  client.onAnyMessage(async (message) => {
    try {
      // Ignorar mensagens de grupos
      if (message.isGroupMsg) {
        return;
      }

      // Processar apenas mensagens de texto
      if (message.type !== 'chat' && message.type !== 'text') {
        return;
      }

      const rawText = (message.body || message.text || '').trim();
      if (!rawText) {
        return;
      }

      const text = rawText.toLowerCase();

      // Identificador da conversa (número do cliente).
      // - Se a mensagem vem do cliente (fromMe === false): message.from é o cliente
      // - Se a mensagem vem do atendente (fromMe === true): message.to/chatId é o cliente
      const phoneRaw = message.fromMe
        ? (message.to || message.chatId || (message.chat && message.chat.id) || message.from)
        : message.from;
      const phone = extractPhoneNumber(phoneRaw) || phoneRaw;

      logger.wpp(
        userId,
        slot,
        `📩 Mensagem recebida - from: ${message.from}, to: ${message.to}, fromMe: ${message.fromMe}, phone(normalizado): ${phone}, body: "${rawText}"`
      );

      // ---------------------------------------------
      // 1) Comandos do atendente (#boa noite / #voltar)
      // ---------------------------------------------
      if (message.fromMe) {
        if (text === '#boa noite') {
          pauseChat(userId, slot, phone);
          logger.wpp(userId, slot, `🛑 Bot pausado para o número ${phone} por um atendente humano.`);

          // Opcional: confirmação para o atendente (não para o cliente)
          try {
            await client.sendText(message.from, `🛑 Bot pausado para ${phone}. Use #voltar para reativar.`);
          } catch {
            // Se falhar, apenas logamos – não é crítico
          }

          return; // NÃO seguir para fluxo automático
        }

        if (text === '#voltar') {
          resumeChat(userId, slot, phone);
          logger.wpp(userId, slot, `🤖 Bot reativado para o número ${phone} por um atendente.`);

          try {
            await client.sendText(message.from, `🤖 Bot reativado para ${phone}.`);
          } catch {
            // Silenciar erro de confirmação
          }

          return;
        }

        // Mensagens normais do atendente (sem comando) não entram no fluxo do bot
        return;
      }

      // ---------------------------------------------
      // 2) Mensagens do cliente com chat pausado
      // ---------------------------------------------
      if (isChatPaused(userId, slot, phone)) {
        logger.wpp(userId, slot, `🔕 Chat ${phone} está em modo humano. Bot não responderá.`);
        return;
      }

      // A partir deste ponto, só lidamos com mensagens do cliente em modo automático

      logger.wpp(userId, slot, `📨 Mensagem recebida do CLIENTE ${phone} (${message.from})`);

      // Buscar configurações do bot
      const botSettings = await BotSettingsModel.findByUser(userId).catch(() => null);

      if (!botSettings || !botSettings.isActive) {
        logger.wpp(userId, slot, 'Bot desabilitado, ignorando mensagem');
        return;
      }

      logger.wpp(userId, slot, `🤖 Modo automático - Processando mensagem com IA para ${phone}`);

      // Buscar histórico de conversa (últimas N mensagens)
      const conversationHistory = sessionManager.getConversation(
        userId,
        slot,
        phone,
        botSettings.contextLimit || 10
      );

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
      const aiResponse = await sendToGPT(rawText, formattedHistory, gptSettings);

      // Salvar mensagem do usuário no histórico
      sessionManager.addMessage(userId, slot, phone, {
        body: rawText,
        fromMe: false,
        timestamp: Date.now()
      });

      // Enviar resposta para o cliente
      await client.sendText(message.from, aiResponse);
      logger.success(`Resposta enviada para ${phone} (${message.from})`);

      // Salvar resposta do bot no histórico
      sessionManager.addMessage(userId, slot, phone, {
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
