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

// Controle de pausa do bot (em memória)
const pausedChats = new Set();

// Função para normalizar o número de telefone (remover sufixos do WhatsApp)
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.split('@')[0]; // Remove o @c.us, @g.us, etc.
}

function getChatKey(userId, slot, phone) {
  const normalized = normalizePhone(phone);
  const key = `${userId}:${slot}:${normalized}`;
  return key;
}

// Função para pausar a conversa de um número específico
export function pauseChat(userId, slot, phone) {
  const key = getChatKey(userId, slot, phone);
  pausedChats.add(key);
  logger.wpp(userId, slot, `🛑 Bot pausado para ${phone}`);
  logger.info(`[pauseChat] Chave adicionada: "${key}"`);
  logger.info(`[pauseChat] Total pausados: ${pausedChats.size} -> ${Array.from(pausedChats).join(', ')}`);
}

// Função para retomar a conversa
export function resumeChat(userId, slot, phone) {
  const key = getChatKey(userId, slot, phone);
  pausedChats.delete(key);
  logger.wpp(userId, slot, `✅ Bot reativado para ${phone}`);
  logger.info(`[resumeChat] Chave removida: "${key}"`);
  logger.info(`[resumeChat] Total pausados: ${pausedChats.size}`);
}

// Função para verificar se o chat está pausado
export function isChatPaused(userId, slot, phone) {
  const key = getChatKey(userId, slot, phone);
  const isPaused = pausedChats.has(key);
  logger.info(`[isChatPaused] Verificando "${key}" -> ${isPaused ? 'SIM (PAUSADO)' : 'NÃO (ATIVO)'}`);
  logger.info(`[isChatPaused] Chaves pausadas: ${Array.from(pausedChats).join(', ')}`);
  return isPaused;
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
      return { success: false, message: 'Cliente já está ativo' };
    }

    const sessionName = `${normalizedUserId}-slot${slot}`;
    const sessionsDir = (config.wppConnect && config.wppConnect.sessionsDir) || '/var/www/whatsapp-sessions';
    const userDataDir = `${sessionsDir}/${sessionName}`;

    // garantir pasta
    fs.mkdirSync(userDataDir, { recursive: true });

    // cria em background
    wppconnect
      .create({
        session: sessionName,
        headless: true,
        puppeteerOptions: { userDataDir },
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
        setupMessageListener(client, normalizedUserId, slot);  // Ajuste aqui para implementar a lógica de pausa e retomada
        logger.wpp(normalizedUserId, slot, '✅ Listener de mensagens registrado!');
      })
      .catch(async (error) => {
        logger.error(`❌ Erro CRÍTICO ao criar cliente [${normalizedUserId}:${slot}]`, error);
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
 * Listener de mensagens (IA)
 */
function setupMessageListener(client, userId, slot) {
  logger.info(`[setupMessageListener] Configurando listeners para [${userId}:${slot}]`);

  // Listener 1: onMessage (recomendado)
  client.onMessage(async (message) => {
    logger.info(`[🔔 onMessage] Evento disparado! userId: ${userId}, slot: ${slot}`);

    const phone = message.from;
    const text = message.body?.toLowerCase()?.trim();

    // Comando #boa noite - Pausa o bot
    if (message.fromMe && text === '#boa noite') {
      logger.wpp(userId, slot, `🛑 Comando #boa noite recebido para ${phone}`);
      pauseChat(userId, slot, phone);  // Pausa a conversa
      sessionManager.setManualMode(userId, slot, phone, true);  // Marca como manual (atendente assumiu)
      await client.sendText(phone, "👤 A partir de agora um atendente humano assumirá sua conversa.");
      return;
    }

    // Comando #voltar - Retoma o bot
    if (message.fromMe && text === '#voltar') {
      logger.wpp(userId, slot, `✅ Comando #voltar recebido para ${phone}`);
      resumeChat(userId, slot, phone);  // Retoma a conversa
      sessionManager.setManualMode(userId, slot, phone, false);  // Desativa o modo manual
      await client.sendText(phone, "🤖 O bot voltou a assumir a conversa.");
      return;
    }

    // Verifica se o chat está pausado (modo manual) e não permite que o bot responda
    const isPaused = isChatPaused(userId, slot, phone) || sessionManager.isManualMode(userId, slot, phone);
    if (isPaused) {
      console.log(`Chat ${phone} está em modo humano. O bot não responderá.`);
      return;  // Não responde a mensagem
    }

    // Fluxo normal do bot aqui...
  });

  // Listener 2: onAnyMessage (backup)
  client.onAnyMessage(async (message) => {
    logger.info(`[🔔 onAnyMessage] Evento disparado! userId: ${userId}, slot: ${slot}`);
    // Este é um backup, já será processado pelo onMessage
  });

  logger.success(`[setupMessageListener] ✅ Listeners configurados com sucesso para [${userId}:${slot}]`);
}
