import wppconnect from '@wppconnect-team/wppconnect';
import { handleJobFlow } from './jobApplicationFlow.js';
import config from '../../config.js';
import logger from '../utils/logger.js';
import prisma from '../db/index.js';
import sessionManager from './sessionManager.js';
import { onQRCode, onStatusChange, extractPhoneNumber } from './qrHandler.js';
import { WhatsAppBotModel, BotSettingsModel } from '../db/models.js';
import { sendToGPT, formatConversationHistory } from '../ai/chat.js';
import * as tarefaHandler from '../tarefas/tarefaHandler.js';
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

// ─── Resolução de telefone real a partir de LIDs ──────────────────────────

/** Cache LID → dígitos do telefone real (sobrevive enquanto o processo estiver vivo). */
const lidToPhoneCache = new Map();
/** LIDs cujo diagnóstico já foi logado (evita repetição). */
const lidSemResolucao = new Set();

/**
 * Devolve os dígitos do telefone real do remetente, mesmo quando message.from
 * é um LID ("173233210945673@lid") em vez de um JID de telefone ("5541...@c.us").
 *
 * Estratégia:
 *   @c.us → dígitos direto do JID.
 *   @lid  → (a) campos diretos do payload, (b) getContact, (c) log + null.
 *
 * O retorno é sempre apenas dígitos (sem "@..."), compatível com
 * canonicalizarTelefone em tarefaHandler.
 *
 * @param {object} client   Cliente WPPConnect ativo
 * @param {object} message  Mensagem recebida
 * @returns {Promise<string|null>}
 */
async function resolverTelefoneReal(client, message) {
  const from = message?.from || '';

  // JID de telefone normal: dígitos antes do "@"
  if (from.endsWith('@c.us')) {
    return from.split('@')[0];
  }

  // LID: requer resolução
  if (from.endsWith('@lid')) {
    if (lidToPhoneCache.has(from)) {
      return lidToPhoneCache.get(from); // pode ser null (já tentamos e falhou)
    }

    // (a) Campos diretos do payload — algumas versões do WPPConnect já expõem
    const candidatos = [
      message.senderPn,
      message.sender?.phoneNumber,
      message.sender?.id?._serialized?.endsWith('@c.us')
        ? message.sender.id._serialized.split('@')[0]
        : null,
      typeof message.author === 'string' && message.author.endsWith('@c.us')
        ? message.author.split('@')[0]
        : null,
    ];

    for (const c of candidatos) {
      if (c && /^\d{7,15}$/.test(String(c))) {
        lidToPhoneCache.set(from, String(c));
        return String(c);
      }
    }

    // (b) getContact — consulta o próprio WhatsApp
    try {
      const contato = await client.getContact(from);
      const camposContato = [
        contato?.phoneNumber,
        contato?.id?.user,
        contato?.id?._serialized?.endsWith('@c.us')
          ? contato.id._serialized.split('@')[0]
          : null,
      ];
      for (const c of camposContato) {
        if (c && /^\d{7,15}$/.test(String(c))) {
          lidToPhoneCache.set(from, String(c));
          return String(c);
        }
      }
    } catch { /* getContact falhou — segue para o log */ }

    // (c) Nada resolveu: loga UMA VEZ para diagnóstico e retorna null
    if (!lidSemResolucao.has(from)) {
      lidSemResolucao.add(from);
      const diag = JSON.stringify({
        from:   message.from,
        sender: message.sender,
        author: message.author,
      });
      logger.warn(
        `[resolverTelefoneReal] Não foi possível resolver LID ${from}. Diagnóstico: ${diag.slice(0, 2000)}`,
      );
    }

    lidToPhoneCache.set(from, null); // cacheia null → evita nova tentativa getContact
    return null;
  }

  // Formato desconhecido (@g.us, @s.whatsapp.net, etc.): fallback seguro
  // Nunca retornar dígitos de um @lid — eles não são números de telefone
  if (from.includes('@')) return null;
  return /^\d+$/.test(from) ? from : null;
}

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

  // 🛡️ Guarda contra listener duplicado: se este mesmo objeto client já
  // recebeu um listener (ex: reconexão que reaproveita o client), não
  // registra de novo — evita respostas repetidas para a mesma mensagem.
  if (client.__listenerRegistrado) {
    logger.warn(`[setupMessageListener] Listener JÁ registrado para [${userId}:${slot}], ignorando novo registro.`);
    return;
  }
  client.__listenerRegistrado = true;

  // Usamos APENAS onAnyMessage, pois em muitos ambientes o WPPConnect
  // dispara este evento para todas as mensagens (inclusive fromMe),
  // enquanto onMessage pode não ser chamado de forma consistente.
  client.onAnyMessage(async (message) => {
    logger.info(`[🔔 onAnyMessage] Evento disparado! userId: ${userId}, slot: ${slot}`);
    await handleIncomingMessage(message, client, userId, slot);
  });

  // 🧪 TESTE DIAGNÓSTICO TEMPORÁRIO — remover depois
  client.onMessage(async (message) => {
    logger.info(`[🧪 onMessage-TESTE] Evento disparado! userId: ${userId}, slot: ${slot}, body: ${message.body}`);
  });

  client.onStateChange((state) => {
    logger.info(`[🧪 onStateChange-TESTE] Estado: ${state}`);
  });

  logger.success(`[setupMessageListener] ✅ Listener configurado com sucesso para [${userId}:${slot}]`);
}

/**
 * Processa mensagem recebida.
 *
 * Ordem de roteamento:
 *  1. Descarte: grupos, status/stories
 *  2. Comandos do atendente (fromMe): #boa noite / #voltar
 *  3. Telefone do remetente externo
 *  4. Verificação de modo manual → descartar se ativo
 *  5. 🎯 SESSÃO DE TAREFA — antes do filtro de tipo e do GPT.
 *     Mensagens de funcionários com tarefa aberta (foto, localização,
 *     documento, texto) são roteadas aqui e não passam para o GPT.
 *  6. 💼 FLUXO DE CANDIDATURA A VAGA — o handleJobFlow gerencia a própria
 *     sessão e detecção de intenção; devolve true quando assume a mensagem.
 *  7. Filtro de tipo para o GPT (apenas chat/text)
 *  8. Fluxo GPT normal
 */
async function handleIncomingMessage(message, client, userId, slot) {
    try {
      logger.info(`[📨 MENSAGEM RECEBIDA] userId: ${userId}, slot: ${slot}`);
      logger.info(`[📨 MENSAGEM] De: ${message.from}, Tipo: ${message.type}, fromMe: ${message.fromMe}, isGroup: ${message.isGroupMsg}`);
      logger.info(`[📨 MENSAGEM] Corpo: "${message.body || message.text || '(vazio)'}"`);

      // ── 1. Descartes imediatos ────────────────────────────────────────────
      if (message.isGroupMsg) {
        logger.info(`[setupMessageListener] Ignorando mensagem de grupo`);
        return;
      }

      if (
        message.isStatus || message.isStory ||
        (message.from && (message.from.includes('status') || message.from.includes('broadcast'))) ||
        message.type === 'status'
      ) {
        logger.info(`[setupMessageListener] Ignorando mensagem de story/status`);
        return;
      }

      // ── 2. Comandos do atendente (fromMe: text only) ──────────────────────
      if (message.fromMe) {
        const rawTextFromMe = (message.body || message.text || '').trim().toLowerCase();

        const phoneRawFromMe = message.to || message.chatId || (message.chat && message.chat.id) || message.from;
        const phoneFromMe = extractPhoneNumber(phoneRawFromMe) || phoneRawFromMe;

        logger.info(`[setupMessageListener] Mensagem fromMe | phone: ${phoneFromMe} | texto: "${rawTextFromMe}"`);

        // ── Eco da mensagem de cobrança: vincula LID à sessão recente ──────
        // O onAnyMessage recebe de volta a própria mensagem enviada pelo bot
        // com fromMe=true. Quando o destinatário usa o sistema LID, message.to
        // / message.chatId termina em "@lid" — esse é o LID real do chat.
        if (rawTextFromMe.startsWith('⏰ hora da tarefa:')) {
          const destinoRaw = message.to || message.chatId;
          const destinoStr = typeof destinoRaw === 'object'
            ? (destinoRaw?._serialized ?? '')
            : String(destinoRaw ?? '');
          if (destinoStr.endsWith('@lid')) {
            const lidEco = destinoStr.split('@')[0];
            try {
              await tarefaHandler.vincularLidASessaoRecente(lidEco);
            } catch (ecoErr) {
              logger.warn(`[onAnyMessage/eco] Falha ao vincular LID ${lidEco}: ${ecoErr?.message}`);
            }
          }
        }

        if (rawTextFromMe === '#boa noite') {
          logger.wpp(userId, slot, `🛑 Comando #boa noite recebido para ${phoneFromMe}`);
          pauseChat(userId, slot, phoneFromMe);
          sessionManager.setManualMode(userId, slot, phoneFromMe, true);
          return;
        }

        if (rawTextFromMe === '#voltar') {
          logger.wpp(userId, slot, `✅ Comando #voltar recebido para ${phoneFromMe}`);
          resumeChat(userId, slot, phoneFromMe);
          sessionManager.setManualMode(userId, slot, phoneFromMe, false);
          return;
        }

        logger.info(`[setupMessageListener] Atendente humano digitando normalmente, bot não responderá.`);
        return;
      }

      // ── 3. Telefone do remetente externo ──────────────────────────────────
      const phone = extractPhoneNumber(message.from) || message.from;
      logger.info(`[📱 PROCESSANDO] Telefone (raw): ${phone}, tipo: ${message.type}`);

      // Resolve o telefone real — null se message.from for @lid não traduzível.
      // NUNCA usar dígitos de um @lid como número de telefone.
      const telefoneLimpo = await resolverTelefoneReal(client, message);

      // Dígitos do LID quando message.from termina em "@lid" (para busca paralela)
      const lidDigits = message.from?.endsWith('@lid')
        ? message.from.split('@')[0]
        : null;

      // Chave de sessão para manual mode / histórico GPT
      // Prefere telefone resolvido; se LID não traduzido, usa raw phone como fallback
      const chaveConversa = telefoneLimpo ?? phone.split('@')[0];

      logger.info(
        `[📱 PROCESSANDO] Telefone resolvido: ${telefoneLimpo ?? '(nulo)'}, LID: ${lidDigits ?? '(nenhum)'}`,
      );

      // ── 4. Modo manual (atendente humano assumiu esta conversa) ───────────
      const isPaused = sessionManager.isManualMode(userId, slot, chaveConversa);
      if (isPaused) {
        logger.wpp(userId, slot, `🔕 Chat ${chaveConversa} em MODO MANUAL. Bot não responderá.`);
        return;
      }

      // ── 5. 🎯 Roteamento de TAREFA (ANTES do filtro de tipo e do GPT) ─────
      // Permite que imagens, localizações e documentos de funcionários
      // sejam processados sem interferir no fluxo GPT dos demais clientes.
      try {
        // Busca por telefone resolvido OU por LID gravado no momento do envio
        const sessaoAtiva = await tarefaHandler.getSessaoAtiva(telefoneLimpo, lidDigits);
        if (sessaoAtiva) {
          const telefoneParaHandler = telefoneLimpo ?? chaveConversa;
          logger.info(`[🎯 TAREFA] Sessão ativa → roteando (tel=${telefoneParaHandler}, lid=${lidDigits ?? '—'})`);
          await tarefaHandler.processarMensagem(message, client, telefoneParaHandler, sessaoAtiva);
          return;
        }
      } catch (tarefaErr) {
        // Erro no módulo de tarefas não deve derrubar o fluxo normal
        logger.error(`[🎯 TAREFA] Erro ao consultar sessão de tarefa:`, tarefaErr?.message);
      }

      // ── 6. 💼 Fluxo de candidatura a vaga ─────────────────────────────────
      // O handleJobFlow detecta a intenção ("quero trabalhar", "vaga", etc),
      // gerencia a própria sessão de perguntas e devolve true quando assume
      // a mensagem. O adaptador abaixo traduz o controle de modo manual do
      // sessionManager para a interface .has(contactId) que o fluxo espera.
      try {
        const humanSessions = {
          has: (contactId) => {
            const phoneVaga = extractPhoneNumber(contactId) || contactId;
            return sessionManager.isManualMode(userId, slot, phoneVaga) === true;
          },
        };
        const assumidoPeloFluxoDeVagas = await handleJobFlow(client, message, humanSessions);
        if (assumidoPeloFluxoDeVagas) {
          logger.info(`[💼 VAGA] Mensagem de ${phone} tratada pelo fluxo de candidatura.`);
          return;
        }
      } catch (vagaErr) {
        // Erro no fluxo de vagas não deve derrubar o fluxo normal
        logger.error(`[💼 VAGA] Erro no fluxo de candidatura:`, vagaErr?.message);
      }

      // ── 7. Filtro de tipo para o fluxo GPT ───────────────────────────────
      if (message.type !== 'chat' && message.type !== 'text') {
        logger.info(`[setupMessageListener] Ignorando tipo "${message.type}" (sem sessão de tarefa ativa)`);
        return;
      }

      const rawText = (message.body || message.text || '').trim();
      if (!rawText) {
        logger.info(`[setupMessageListener] Ignorando mensagem vazia`);
        return;
      }

      // ── 8. Fluxo GPT normal ───────────────────────────────────────────────
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
        chaveConversa,
        botSettings.contextLimit || 10
      );

      const formattedHistory = formatConversationHistory(conversationHistory, botSettings.contextLimit || 10);

      const gptSettings = {
        botName:    botSettings.botName    || 'Assistente',
        storeType:  botSettings.storeType  || 'restaurant',
        lineLimit:  botSettings.lineLimit  || 5,
        basePrompt: botSettings.basePrompt || '',
      };

      sessionManager.addMessage(userId, slot, chaveConversa, {
        body: rawText, fromMe: false, timestamp: Date.now(),
      });

      logger.info(`[🤖 BOT] Enviando para GPT: "${rawText}"`);
      const aiResponse = await sendToGPT(rawText, formattedHistory, gptSettings);
      logger.info(`[🤖 BOT] Resposta GPT: "${aiResponse}"`);

      await client.sendText(message.from, aiResponse);

      sessionManager.addMessage(userId, slot, chaveConversa, {
        body: aiResponse, fromMe: true, timestamp: Date.now(),
      });

      logger.success(`✅ Resposta GPT enviada para ${chaveConversa} (${message.from})`);
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
