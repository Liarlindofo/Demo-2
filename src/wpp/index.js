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

export function pauseChat(userId, slot, phone) {
  const key = getChatKey(userId, slot, phone);
  pausedChats.add(key);
  logger.wpp(userId, slot, `🛑 pauseChat -> Bot pausado para ${phone}`);
}

export function resumeChat(userId, slot, phone) {
  const key = getChatKey(userId, slot, phone);
  pausedChats.delete(key);
  logger.wpp(userId, slot, `✅ resumeChat -> Bot reativado para ${phone}`);
}

export function isChatPaused(userId, slot, phone) {
  const key = getChatKey(userId, slot, phone);
  return pausedChats.has(key);
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
        logger.wpp(normalizedUserId, slot, 'Cliente WPPConnect criado.');
        sessionManager.setClient(normalizedUserId, slot, client);

        setupMessageListener(client, normalizedUserId, slot);

        try {
          const isConnected = await client.isConnected().catch(() => false);
          if (isConnected) {
            await onStatusChange(normalizedUserId, slot, 'chatsAvailable', client);
          }
        } catch {}
      })
      .catch(async (error) => {
        logger.error(`Erro ao criar cliente [${normalizedUserId}:${slot}]`, error);
        sessionManager.removeClient(normalizedUserId, slot);
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
  client.onAnyMessage(async (message) => {
    try {
      if (message.isGroupMsg) return;

      if (message.type !== 'chat' && message.type !== 'text') return;

      const rawText = (message.body || message.text || '').trim();
      if (!rawText) return;

      const text = rawText.toLowerCase();

      const phoneRaw = message.fromMe
        ? (message.to || message.chatId || (message.chat && message.chat.id) || message.from)
        : message.from;

      const phone = extractPhoneNumber(phoneRaw) || phoneRaw;

      // comandos do atendente
      if (message.fromMe) {
        if (text === '#boa noite') {
          pauseChat(userId, slot, phone);
          try {
            await client.sendText(message.from, `🛑 Bot pausado para ${phone}. Use #voltar para reativar.`);
          } catch {}
          return;
        }

        if (text === '#voltar') {
          resumeChat(userId, slot, phone);
          try {
            await client.sendText(message.from, `🤖 Bot reativado para ${phone}.`);
          } catch {}
          return;
        }

        // atendente digitando normal -> bot não responde (por design)
        return;
      }

      if (isChatPaused(userId, slot, phone)) {
        logger.wpp(userId, slot, `🔕 Chat ${phone} está em modo humano. Bot não responderá.`);
        return;
      }

      const botSettings = await BotSettingsModel.findByUser(userId).catch(() => null);
      if (!botSettings || !botSettings.isActive) return;

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

      const aiResponse = await sendToGPT(rawText, formattedHistory, gptSettings);

      await client.sendText(message.from, aiResponse);

      // salva resposta bot
      sessionManager.addMessage(userId, slot, phone, {
        body: aiResponse,
        fromMe: true,
        timestamp: Date.now(),
      });

      logger.success(`Resposta enviada para ${phone} (${message.from})`);
    } catch (error) {
      logger.error(`Erro ao processar mensagem [${userId}:${slot}]:`, error?.message || error);
    }
  });
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
