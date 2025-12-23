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

/**
 * Normaliza número de telefone removendo sufixos do WhatsApp
 * Ex: "5511999999999@c.us" -> "5511999999999"
 */
function normalizePhone(phone) {
  if (!phone) return '';
  // Remove @c.us, @g.us, @s.whatsapp.net, etc
  return phone.split('@')[0];
}

function getChatKey(userId, slot, phone) {
  const normalized = normalizePhone(phone);
  const key = `${userId}:${slot}:${normalized}`;
  return key;
}

export function pauseChat(userId, slot, phone) {
  const normalized = normalizePhone(phone);
  const key = getChatKey(userId, slot, normalized);
  pausedChats.add(key);
  logger.wpp(userId, slot, `🛑 pauseChat -> Bot pausado para ${normalized} (original: ${phone})`);
  logger.info(`[pauseChat] Chave adicionada: "${key}"`);
  logger.info(`[pauseChat] Total pausados: ${pausedChats.size} -> ${Array.from(pausedChats).join(', ')}`);
}

export function resumeChat(userId, slot, phone) {
  const normalized = normalizePhone(phone);
  const key = getChatKey(userId, slot, normalized);
  pausedChats.delete(key);
  logger.wpp(userId, slot, `✅ resumeChat -> Bot reativado para ${normalized} (original: ${phone})`);
  logger.info(`[resumeChat] Chave removida: "${key}"`);
  logger.info(`[resumeChat] Total pausados: ${pausedChats.size}`);
}

export function isChatPaused(userId, slot, phone) {
  const normalized = normalizePhone(phone);
  const key = getChatKey(userId, slot, normalized);
  const isPaused = pausedChats.has(key);
  logger.info(`[isChatPaused] Verificando "${key}" -> ${isPaused ? 'SIM (PAUSADO)' : 'NÃO (ATIVO)'}`);
  logger.info(`[isChatPaused] Chaves pausadas: ${Array.from(pausedChats).join(', ')}`);
  return isPaused;
}

/**
 * Limpa SOMENTE processos do Chrome que pertencem ao userDataDir da sessão atual.
 * (IMPORTANTE: não matar processos do diretório pai, senão derruba outras sessões)
 */
async function cleanupOrphanBrowserIsolated(userDataDir) {
  try {
    const sessionName = path.basename(userDataDir);
    logger.info(`🧹 [safeCleanup] Iniciando limpeza segura para: ${userDataDir}`);

    // 1) Mata processos que contenham o userDataDir (somente desta sessão)
    const { stdout } = await execAsync(
      `ps aux | grep -iE "chrome|chromium" | grep "${userDataDir}" | grep -v grep | awk '{print $2}'`
    ).catch(() => ({ stdout: '' }));

    const pids = stdout
      .trim()
      .split('\n')
      .map((x) => x.trim())
      .filter((x) => x && !isNaN(Number(x)));

    if (pids.length) {
      logger.warn(`⚠️ [safeCleanup] Achou ${pids.length} PID(s) da sessão ${sessionName}: ${pids.join(', ')}`);
      for (const pid of pids) {
        await execAsync(`kill -9 ${pid} 2>/dev/null`).catch(() => {});
      }
    } else {
      logger.info(`✅ [safeCleanup] Nenhum PID usando userDataDir encontrado para ${sessionName}`);
    }

    // 2) pkill adicional APENAS pelo userDataDir (não pelo diretório pai)
    await execAsync(`pkill -9 -f "${userDataDir}" 2>/dev/null`).catch(() => {});

    // 3) remove locks do Chromium dentro do userDataDir (sem apagar a pasta toda)
    const lockFiles = [
      'SingletonLock',
      'SingletonCookie',
      'SingletonSocket',
    ].map((f) => path.join(userDataDir, f));

    for (const lf of lockFiles) {
      try {
        if (fs.existsSync(lf)) {
          fs.rmSync(lf, { force: true });
          logger.info(`🧽 [safeCleanup] Removido lock: ${lf}`);
        }
      } catch {}
    }

    // 4) pequeno delay pra garantir que processos morreram
    await new Promise((r) => setTimeout(r, 1200));

    logger.info(`✅ [safeCleanup] Limpeza segura concluída para ${sessionName}`);
  } catch (e) {
    logger.error(`❌ [safeCleanup] Falha na limpeza segura: ${e?.message || e}`);
  }
}

/**
 * Inicia cliente WPPConnect para um usuário/slot — NÃO BLOQUEIA
 */
export async function startClient(userId, slot = 1) {
  let normalizedUserId = userId;

  try {
    logger.wpp(userId, slot, 'Iniciando cliente WPPConnect (não bloqueante)...');

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error(`userId inválido: ${userId}`);
    }

    normalizedUserId = String(userId).trim();
    logger.info(`[startClient] userId original: "${userId}", normalizado: "${normalizedUserId}"`);

    // se já está em memória, não recria
    if (sessionManager.hasClient(normalizedUserId, slot)) {
      logger.wpp(normalizedUserId, slot, 'Cliente já está ativo na memória, retornando...');

      const bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, slot);
      if (bot && bot.qrCode) {
        return {
          success: true,
          message: 'Cliente já está ativo com QR Code',
          qrCode: bot.qrCode,
          isConnected: bot.isConnected,
        };
      }

      return { success: false, message: 'Cliente já está ativo' };
    }

    const sessionName = `${normalizedUserId}-slot${slot}`;
    const sessionsDir = (config.wppConnect && config.wppConnect.sessionsDir) || '/var/www/whatsapp-sessions';
    const userDataDir = `${sessionsDir}/${sessionName}`;

    // garantir pasta
    fs.mkdirSync(userDataDir, { recursive: true });

    // limpeza isolada (não derruba outras sessões)
    logger.wpp(normalizedUserId, slot, '🧹 Limpando processos órfãos/locks (isolado por sessão)...');
    await cleanupOrphanBrowserIsolated(userDataDir);

    const basePuppeteerOptions = (config.wppConnect && config.wppConnect.puppeteerOptions) || {};
    const puppeteerOptions = Object.assign({}, basePuppeteerOptions, { userDataDir });

    // valida stack user e prepara row do bot no banco
    const stackUser = await prisma.stackUser.findUnique({ where: { id: normalizedUserId } });
    if (!stackUser) {
      throw new Error(`Usuário ${normalizedUserId} não encontrado em stack_users`);
    }

    await WhatsAppBotModel.upsert(normalizedUserId, slot, {
      isConnected: false,
      qrCode: null,
      connectedNumber: null,
    });

    const headless =
      (config.wppConnect && config.wppConnect.headless) !== undefined
        ? config.wppConnect.headless
        : true;

    // cria em background
    wppconnect
      .create({
        session: sessionName,
        headless,
        puppeteerOptions,
        autoClose: 0,
        logQR: false,
        disableWelcome: true,
        updatesLog: false,

        catchQR: async (base64Qr) => {
          await onQRCode(normalizedUserId, slot, base64Qr);
        },

        statusFind: async (status) => {
          const client = sessionManager.getClient(normalizedUserId, slot);
          await onStatusChange(normalizedUserId, slot, status, client);
        },
      })
      .then(async (client) => {
        logger.wpp(normalizedUserId, slot, '✅ Cliente WPPConnect criado com sucesso.');
        sessionManager.setClient(normalizedUserId, slot, client);

        logger.wpp(normalizedUserId, slot, '🎧 Registrando listener de mensagens...');
        setupMessageListener(client, normalizedUserId, slot);
        logger.wpp(normalizedUserId, slot, '✅ Listener de mensagens registrado!');

        try {
          const isConnected = await client.isConnected().catch(() => false);
          if (isConnected) {
            logger.wpp(normalizedUserId, slot, '✅ Cliente está conectado! Pronto para receber mensagens.');
            await onStatusChange(normalizedUserId, slot, 'chatsAvailable', client);
          } else {
            logger.warn(`[startClient] Cliente criado mas ainda não conectado [${normalizedUserId}:${slot}]`);
          }
        } catch (connErr) {
          logger.warn(`[startClient] Erro ao verificar conexão: ${connErr?.message || connErr}`);
        }
      })
      .catch(async (error) => {
        logger.error(`❌ Erro CRÍTICO ao criar cliente [${normalizedUserId}:${slot}]`, error);
        // ⚠️ IMPORTANTE: NÃO remover client automaticamente!
        // O client pode ter sido criado parcialmente e ainda estar funcionando.
        // Apenas log o erro e atualiza o banco. O cliente será removido SOMENTE
        // por ação manual (stopClient) ou desconexão real do WhatsApp.
        await WhatsAppBotModel.setDisconnected(normalizedUserId, slot).catch(() => {});
      });

    return {
      success: true,
      message: 'Sessão iniciada, aguardando QR.',
      isConnected: false,
    };
  } catch (error) {
    logger.error(`Erro ao iniciar cliente [${normalizedUserId}:${slot}]:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * PARA cliente WPPConnect
 * (slot default pra bater com worker que pode chamar stopClient(userId) )
 */
export async function stopClient(userId, slot = 1) {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return { success: false, message: 'userId inválido' };
    }

    const normalizedUserId = String(userId).trim();
    logger.info(`[stopClient] Parando cliente para userId="${normalizedUserId}", slot=${slot}`);

    const client = sessionManager.getClient(normalizedUserId, slot);
    if (!client) {
      logger.warn(`[stopClient] Cliente não encontrado para [${normalizedUserId}:${slot}]`);
      return { success: false, message: 'Cliente não está ativo' };
    }

    await client.close().catch(() => {});
    sessionManager.removeClient(normalizedUserId, slot);
    sessionManager.clearAllConversations(normalizedUserId, slot);
    await WhatsAppBotModel.setDisconnected(normalizedUserId, slot).catch(() => {});

    return { success: true, message: 'Cliente desconectado com sucesso' };
  } catch (error) {
    logger.error(`Erro ao parar cliente [${userId}:${slot}]:`, error);
    return { success: false, message: error.message };
  }
}

export async function getClientStatus(userId, slot = 1) {
  if (!userId || typeof userId !== 'string') {
    return { isActive: false, isConnected: false };
  }

  const normalizedUserId = String(userId).trim();
  const client = sessionManager.getClient(normalizedUserId, slot);

  if (!client) return { isActive: false, isConnected: false };

  try {
    const isConnected = await client.isConnected().catch(() => false);
    return { isActive: true, isConnected };
  } catch {
    return { isActive: true, isConnected: false };
  }
}

/**
 * Listener de mensagens (IA)
 */
function setupMessageListener(client, userId, slot) {
  logger.info(`[setupMessageListener] Configurando listeners para [${userId}:${slot}]`);

  // Usamos APENAS onAnyMessage, pois em muitos ambientes o WPPConnect
  // dispara este evento para todas as mensagens (inclusive fromMe),
  // enquanto onMessage pode não ser chamado de forma consistente.
  client.onAnyMessage(async (message) => {
    logger.info(`[🔔 onAnyMessage] Evento disparado! userId: ${userId}, slot: ${slot}`);
    await handleIncomingMessage(message, client, userId, slot);
  });

  logger.success(`[setupMessageListener] ✅ Listener configurado com sucesso para [${userId}:${slot}]`);
}

/**
 * Processa mensagem recebida
 */
async function handleIncomingMessage(message, client, userId, slot) {
    try {
      // LOG CRÍTICO: Detectar quando mensagem chega
      logger.info(`[📨 MENSAGEM RECEBIDA] userId: ${userId}, slot: ${slot}`);
      logger.info(`[📨 MENSAGEM] De: ${message.from}, Tipo: ${message.type}, fromMe: ${message.fromMe}, isGroup: ${message.isGroupMsg}`);
      logger.info(`[📨 MENSAGEM] Corpo: "${message.body || message.text || '(vazio)'}"`);
      
      if (message.isGroupMsg) {
        logger.info(`[setupMessageListener] Ignorando mensagem de grupo`);
        return;
      }

      if (message.type !== 'chat' && message.type !== 'text') {
        logger.info(`[setupMessageListener] Ignorando mensagem do tipo: ${message.type}`);
        return;
      }

      const rawText = (message.body || message.text || '').trim();
      if (!rawText) {
        logger.info(`[setupMessageListener] Ignorando mensagem vazia`);
        return;
      }

      const text = rawText.toLowerCase();

      const phoneRaw = message.fromMe
        ? (message.to || message.chatId || (message.chat && message.chat.id) || message.from)
        : message.from;

      const phone = extractPhoneNumber(phoneRaw) || phoneRaw;
      
      logger.info(`[📱 PROCESSANDO] Telefone: ${phone}, fromMe: ${message.fromMe}, texto: "${rawText}"`);

      // LOG: sempre que alguém mandar #boa noite ou #voltar, registramos,
      // independente de ser fromMe ou não (para facilitar debug).
      if (text === '#boa noite' || text === '#voltar') {
        logger.info(
          `[setupMessageListener] Comando detectado: "${text}" | fromMe=${message.fromMe} | phone=${phone}`
        );
      }

      // comandos do atendente (apenas quando for mensagem do próprio número / WhatsApp Web)
      if (message.fromMe) {
        logger.info(`[setupMessageListener] Mensagem fromMe (atendente humano)`);
        logger.info(`[setupMessageListener] Texto recebido: "${text}"`);
        logger.info(`[setupMessageListener] message.from (chat): ${message.from}`);

        // 🛑 COMANDO #boa noite → PAUSAR BOT PARA ESTE NÚMERO
        if (text === '#boa noite') {
          logger.wpp(userId, slot, `🛑 Comando #boa noite recebido para ${phone}`);

          // Marca como pausado em memória
          pauseChat(userId, slot, phone);

          // Marca como manual no SessionManager (modo atendente)
          sessionManager.setManualMode(userId, slot, phone, true);

          logger.success(
            `[setupMessageListener] ✅ Chat ${phone} pausado (modo manual ATIVADO). Atendente assumiu.`
          );
          return;
        }

        // 🤖 COMANDO #voltar → RETOMAR BOT PARA ESTE NÚMERO
        if (text === '#voltar') {
          logger.wpp(userId, slot, `✅ Comando #voltar recebido para ${phone}`);

          // Remove pausa em memória
          resumeChat(userId, slot, phone);

          // Desativa modo manual no SessionManager
          sessionManager.setManualMode(userId, slot, phone, false);

          logger.success(
            `[setupMessageListener] ✅ Chat ${phone} reativado (modo manual DESATIVADO). Bot voltou.`
          );
          return;
        }

        // atendente digitando normal -> bot não responde (por design)
        logger.info(
          `[setupMessageListener] Atendente humano digitando normalmente, bot não responderá (sem comando).`
        );
        return;
      }

      logger.info(`[🤖 BOT] Processando mensagem de cliente externo: ${phone}`);

      // 🔒 VERIFICAÇÃO DE MODO MANUAL (PAUSADO)
      // Modo simples: usamos apenas o SessionManager como fonte da verdade.
      const isPaused = sessionManager.isManualMode(userId, slot, phone);
      if (isPaused) {
        logger.wpp(
          userId,
          slot,
          `🔕 Chat ${phone} está em MODO MANUAL (atendente humano). Bot não responderá.`
        );
        return;
      }

      logger.info(`[🤖 BOT] Buscando configurações do bot...`);
      const botSettings = await BotSettingsModel.findByUser(userId).catch(() => null);
      
      if (!botSettings) {
        logger.warn(`[setupMessageListener] Bot settings não encontrado para userId: ${userId}`);
        return;
      }
      
      if (!botSettings.isActive) {
        logger.warn(`[setupMessageListener] Bot está INATIVO para userId: ${userId}`);
        return;
      }
      
      logger.info(`[🤖 BOT] Bot ativo! Nome: ${botSettings.botName}, Tipo: ${botSettings.storeType}`);

      const conversationHistory = sessionManager.getConversation(
        userId,
        slot,
        phone,
        botSettings.contextLimit || 10
      );

      const formattedHistory = formatConversationHistory(conversationHistory, botSettings.contextLimit || 10);

      const gptSettings = {
        botName: botSettings.botName || 'Assistente',
        storeType: botSettings.storeType || 'restaurant',
        lineLimit: botSettings.lineLimit || 5,
        basePrompt: botSettings.basePrompt || '',
      };

      // salva msg usuário
      sessionManager.addMessage(userId, slot, phone, {
        body: rawText,
        fromMe: false,
        timestamp: Date.now(),
      });

      logger.info(`[🤖 BOT] Enviando para GPT: "${rawText}"`);
      const aiResponse = await sendToGPT(rawText, formattedHistory, gptSettings);
      logger.info(`[🤖 BOT] Resposta GPT: "${aiResponse}"`);

      logger.info(`[🤖 BOT] Enviando resposta para ${message.from}...`);
      await client.sendText(message.from, aiResponse);

      // salva resposta bot
      sessionManager.addMessage(userId, slot, phone, {
        body: aiResponse,
        fromMe: true,
        timestamp: Date.now(),
      });

      logger.success(`✅ Resposta enviada para ${phone} (${message.from})`);
    } catch (error) {
      logger.error(`❌ Erro ao processar mensagem [${userId}:${slot}]:`, error?.message || error);
      logger.error(`❌ Stack trace:`, error?.stack);
    }
}

export async function restoreAllSessions() {
  try {
    logger.info('Restaurando sessões...');
    const allBots = await prisma.whatsAppBot.findMany();
    logger.info(`Encontrados ${allBots.length} bots para restaurar`);

    for (const bot of allBots) {
      startClient(bot.userId, bot.slot).catch((error) => {
        logger.error(`Erro ao restaurar sessão [${bot.userId}:${bot.slot}]:`, error);
      });
    }

    logger.success(`✓ Restauração de sessões concluída`);
  } catch (error) {
    logger.error('Erro ao restaurar sessões:', error);
  }
}
