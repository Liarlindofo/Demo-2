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

/** Slot padrão da sessão de atendimento (bot). Não alterar. */
export const SLOT_ATENDIMENTO = 1;
/** Slot padrão da sessão somente-envio (sem listener do bot). */
export const SLOT_SOMENTE_ENVIO = 2;

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
 * Resolve iaAtiva a partir de options explícitas OU do banco.
 * Nunca assume default silencioso (ex.: "atendimento").
 *
 * Aceita legado `mode: 'atendimento'|'somente-envio'` OU novo `iaAtiva: boolean`.
 *
 * @returns {Promise<{ iaAtiva: boolean, iaPrompt: string|null, label: string|null, mode: 'atendimento'|'somente-envio' }>}
 */
async function resolveSessionIaOptions(userId, slot, options = {}) {
  let iaAtiva;
  let iaPrompt = options.iaPrompt !== undefined ? options.iaPrompt : undefined;
  let label = options.label !== undefined ? options.label : undefined;

  if (typeof options.iaAtiva === 'boolean') {
    iaAtiva = options.iaAtiva;
  } else if (options.mode === 'somente-envio') {
    iaAtiva = false;
  } else if (options.mode === 'atendimento') {
    iaAtiva = true;
  } else {
    const durable = await WhatsAppBotModel.getDurableConfig(userId, slot);
    if (!durable) {
      throw new Error(
        `[startClient] Sessão [${userId}:${slot}] sem iaAtiva persistido — ` +
          `NÃO iniciando (evita default silencioso de atendimento). Rode o backfill ou reconecte pela UI.`,
      );
    }
    iaAtiva = durable.iaAtiva;
    if (iaPrompt === undefined) iaPrompt = durable.iaPrompt;
    if (label === undefined) label = durable.label;
  }

  const mode = iaAtiva ? 'atendimento' : 'somente-envio';
  return {
    iaAtiva,
    iaPrompt: iaPrompt ?? null,
    label: label ?? null,
    mode,
  };
}

/**
 * Inicia cliente WPPConnect para um usuário/slot — NÃO BLOQUEIA
 *
 * @param {string} userId
 * @param {number} [slot=1]
 * @param {{ mode?: 'atendimento' | 'somente-envio', iaAtiva?: boolean, iaPrompt?: string|null, label?: string|null }} [options]
 *   - mode 'atendimento' / iaAtiva=true: registra listener do bot
 *   - mode 'somente-envio' / iaAtiva=false: conecta, SEM listener
 *   - sem mode/iaAtiva: lê do banco; se ausente, FALHA (não assume default)
 */
export async function startClient(userId, slot = SLOT_ATENDIMENTO, options = {}) {
  let normalizedUserId = userId;
  let mode = 'somente-envio';
  let iaAtiva = false;

  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error(`userId inválido: ${userId}`);
    }

    normalizedUserId = String(userId).trim();
    const resolved = await resolveSessionIaOptions(normalizedUserId, slot, options);
    iaAtiva = resolved.iaAtiva;
    mode = resolved.mode;
    const { iaPrompt, label } = resolved;
    const isSendOnly = !iaAtiva;

    logger.wpp(
      normalizedUserId,
      slot,
      `Iniciando cliente WPPConnect (não bloqueante)... mode=${mode} iaAtiva=${iaAtiva}`,
    );
    logger.info(
      `[startClient] userId="${normalizedUserId}" slot=${slot} mode=${mode} iaAtiva=${iaAtiva} label=${label ?? '—'}`,
    );

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
          mode: sessionManager.getMode(normalizedUserId, slot),
          iaAtiva: sessionManager.getIaAtiva(normalizedUserId, slot),
          slot,
        };
      }

      return { success: false, message: 'Cliente já está ativo', mode, iaAtiva, slot };
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

    // Persiste config DURÁVEL (iaAtiva/label/iaPrompt) — sobrevive a disconnect/reconnect
    const existingBot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, slot);
    const persistLabel =
      label ??
      existingBot?.label ??
      (iaAtiva ? (slot === 1 ? 'Atendimento' : `Sessão ${slot}`) : (slot === 2 ? 'Somente envio' : `Sessão ${slot}`));

    await WhatsAppBotModel.upsert(normalizedUserId, slot, {
      isConnected: false,
      qrCode: null,
      connectedNumber: null,
      iaAtiva,
      iaPrompt: iaPrompt ?? existingBot?.iaPrompt ?? null,
      label: persistLabel,
      sessionJson: {
        ...(existingBot?.sessionJson && typeof existingBot.sessionJson === 'object' && !Array.isArray(existingBot.sessionJson)
          ? existingBot.sessionJson
          : {}),
        mode, // compat legado — fonte de verdade é iaAtiva
      },
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
        // ASCII QR no terminal da VPS (útil pra sessão somente-envio)
        logQR: isSendOnly,
        disableWelcome: true,
        updatesLog: false,

        catchQR: async (base64Qr, asciiQR) => {
          if (isSendOnly && asciiQR) {
            console.log('\n========== QR CODE (somente-envio) ==========\n');
            console.log(asciiQR);
            console.log('\n=============================================\n');
          }
          await onQRCode(normalizedUserId, slot, base64Qr);
        },

        statusFind: async (status) => {
          const client = sessionManager.getClient(normalizedUserId, slot);
          await onStatusChange(normalizedUserId, slot, status, client);
        },
      })
      .then(async (client) => {
        logger.wpp(normalizedUserId, slot, '✅ Cliente WPPConnect criado com sucesso.');
        sessionManager.setClient(normalizedUserId, slot, client, mode, iaAtiva);

        if (iaAtiva) {
          logger.wpp(normalizedUserId, slot, '🎧 Registrando listener de mensagens (iaAtiva=true)...');
          setupMessageListener(client, normalizedUserId, slot);
          logger.wpp(normalizedUserId, slot, '✅ Listener de mensagens registrado!');
        } else {
          logger.wpp(
            normalizedUserId,
            slot,
            '📤 Sessão SEM IA (iaAtiva=false) — listener do bot NÃO registrado.',
          );
        }

        try {
          const isConnected = await client.isConnected().catch(() => false);
          if (isConnected) {
            logger.wpp(normalizedUserId, slot, '✅ Cliente está conectado!');
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
        await WhatsAppBotModel.setDisconnected(normalizedUserId, slot).catch(() => {});
      });

    return {
      success: true,
      message: isSendOnly
        ? 'Sessão somente-envio iniciada, aguardando QR (veja o log do worker / GET /api/send-only/:userId/qr).'
        : 'Sessão iniciada, aguardando QR.',
      isConnected: false,
      mode,
      iaAtiva,
      slot,
    };
  } catch (error) {
    logger.error(`Erro ao iniciar cliente [${normalizedUserId}:${slot}]:`, error);
    return { success: false, message: error.message, mode, iaAtiva, slot };
  }
}

/**
 * Envia mensagem de texto via uma sessão ativa (tipicamente somente-envio).
 * @param {string} userId
 * @param {string} to - número com DDI (ex: 5541999999999) ou JID
 * @param {string} message
 * @param {number} [slot=SLOT_SOMENTE_ENVIO]
 */
export async function sendMessage(userId, to, message, slot = SLOT_SOMENTE_ENVIO) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    return { success: false, error: 'userId inválido' };
  }
  if (!to || !message) {
    return { success: false, error: 'Campos "to" e "message" são obrigatórios' };
  }

  const client = sessionManager.getClient(normalizedUserId, slot);
  if (!client) {
    return { success: false, error: `Sessão não encontrada em memória [${normalizedUserId}:${slot}]` };
  }

  try {
    const isConnected = await client.isConnected().catch(() => false);
    if (!isConnected) {
      return { success: false, error: 'Sessão ainda não está conectada ao WhatsApp' };
    }

    let dest = String(to).trim();
    if (!dest.includes('@')) {
      dest = `${dest.replace(/\D/g, '')}@c.us`;
    }

    await client.sendText(dest, message);
    logger.wpp(normalizedUserId, slot, `📤 sendMessage OK → ${dest}`);
    return { success: true, to: dest, slot, mode: sessionManager.getMode(normalizedUserId, slot) };
  } catch (error) {
    logger.error(`[sendMessage] Erro [${normalizedUserId}:${slot}]:`, error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Lista grupos visíveis pela sessão (somente leitura).
 * Usa listChats({ onlyGroups: true }) — API atual do WPPConnect 2.2.x.
 * Fallback: getAllGroups() (deprecated).
 *
 * IMPORTANTE: o WhatsApp só retorna grupos em que ESTE número já participa.
 * Se o número de Relatórios não estiver no grupo, ele não aparece aqui.
 *
 * @returns {{ success: boolean, groups?: Array<{id:string,name:string}>, error?: string, note?: string }}
 */
export async function listGroups(userId, slot = SLOT_SOMENTE_ENVIO) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    return { success: false, error: 'userId inválido', groups: [] };
  }

  const client = sessionManager.getClient(normalizedUserId, slot);
  if (!client) {
    return {
      success: false,
      error: `Sessão não encontrada em memória [${normalizedUserId}:${slot}]. Inicie com POST /api/send-only/:userId/start e conecte o QR.`,
      groups: [],
    };
  }

  try {
    const isConnected = await client.isConnected().catch(() => false);
    if (!isConnected) {
      return {
        success: false,
        error: 'Sessão ainda não está conectada ao WhatsApp',
        groups: [],
      };
    }

    let chats = [];
    if (typeof client.listChats === 'function') {
      chats = await client.listChats({ onlyGroups: true });
    } else if (typeof client.getAllGroups === 'function') {
      chats = await client.getAllGroups();
    } else {
      return {
        success: false,
        error: 'Cliente WPPConnect sem listChats/getAllGroups',
        groups: [],
      };
    }

    const groups = (Array.isArray(chats) ? chats : [])
      .map((chat) => {
        let id = null;
        if (chat?.id?._serialized) id = chat.id._serialized;
        else if (typeof chat?.id === 'string') id = chat.id;
        else if (chat?.id?.user) id = `${chat.id.user}@${chat.id.server || 'g.us'}`;
        else if (chat?.contact?.id?._serialized) id = chat.contact.id._serialized;

        if (!id || !String(id).endsWith('@g.us')) return null;

        const name =
          chat?.name ||
          chat?.formattedTitle ||
          chat?.contact?.name ||
          chat?.contact?.pushname ||
          chat?.groupMetadata?.subject ||
          String(id);

        return { id: String(id), name: String(name) };
      })
      .filter(Boolean)
      // dedupe por id
      .filter((g, i, arr) => arr.findIndex((x) => x.id === g.id) === i)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    return {
      success: true,
      slot,
      mode: sessionManager.getMode(normalizedUserId, slot) || 'somente-envio',
      count: groups.length,
      groups,
      note:
        'Só aparecem grupos em que ESTE número (sessão somente-envio) já participa. ' +
        'Adicione o número de Relatórios no grupo desejado antes de consultar, se a lista vier vazia ou incompleta.',
    };
  } catch (error) {
    logger.error(`[listGroups] Erro [${normalizedUserId}:${slot}]:`, error);
    return { success: false, error: error.message || String(error), groups: [] };
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

  /**
   * Buffer de debounce por número de telefone.
   * Estrutura: Map<phone, { texts: string[], lastMessage: object, timer: Timeout }>
   * Escopo local à sessão — cada client tem seu próprio Map independente.
   */
  const messageBuffers = new Map();

  // Usamos APENAS onAnyMessage, pois em muitos ambientes o WPPConnect
  // dispara este evento para todas as mensagens (inclusive fromMe),
  // enquanto onMessage pode não ser chamado de forma consistente.
  client.onAnyMessage(async (message) => {
    logger.info(`[🔔 onAnyMessage] Evento disparado! userId: ${userId}, slot: ${slot}`);

    // ── Bypass do buffer ─────────────────────────────────────────────────
    // Grupos, status, mensagens fromMe e tipos não-texto (imagens, áudio,
    // localização, documentos) são processados imediatamente, sem debounce.
    // Isso preserva: comandos #boa noite/#voltar, sessões de tarefa com mídia
    // e o fluxo de candidatura a vaga.
    const isTextType = message.type === 'chat' || message.type === 'text';
    if (
      message.isGroupMsg ||
      message.isStatus ||
      message.isStory ||
      (message.from && (message.from.includes('status') || message.from.includes('broadcast'))) ||
      message.type === 'status' ||
      message.fromMe ||
      !isTextType
    ) {
      await handleIncomingMessage(message, client, userId, slot);
      return;
    }

    const phone = message.from;
    const text = (message.body || message.text || '').trim();

    // Texto vazio mesmo sendo tipo chat/text → processa direto (será
    // descartado internamente, mas sem segurar o loop do buffer)
    if (!text) {
      await handleIncomingMessage(message, client, userId, slot);
      return;
    }

    // ── Acumula no buffer e (re)agenda o timer de 8 s ────────────────────
    if (messageBuffers.has(phone)) {
      clearTimeout(messageBuffers.get(phone).timer);
      messageBuffers.get(phone).texts.push(text);
      messageBuffers.get(phone).lastMessage = message;
    } else {
      messageBuffers.set(phone, { texts: [text], lastMessage: message, timer: null });
    }

    const count = messageBuffers.get(phone).texts.length;
    logger.info(`[📦 BUFFER] Acumulando msg de ${phone} (${count} no buffer) — aguardando 8s`);

    const timer = setTimeout(async () => {
      const buffer = messageBuffers.get(phone);
      messageBuffers.delete(phone); // limpa antes de processar para não vazar em caso de erro

      if (!buffer || buffer.texts.length === 0) return;

      const combinedText = buffer.texts.join('\n');
      logger.info(
        `[📦 BUFFER] Disparando: ${buffer.texts.length} msg(s) de ${phone} → "${combinedText.slice(0, 120)}${combinedText.length > 120 ? '…' : ''}"`,
      );

      // Mensagem sintética com texto combinado, mantendo todos os metadados
      // da última mensagem recebida (from, type, chatId, etc.)
      const combinedMessage = Object.assign({}, buffer.lastMessage, {
        body: combinedText,
        text: combinedText,
      });

      try {
        await handleIncomingMessage(combinedMessage, client, userId, slot);
      } catch (bufferErr) {
        logger.warn(`[📦 BUFFER] Erro ao processar buffer de ${phone}: ${bufferErr?.message}`);
      }
    }, 8000);

    messageBuffers.get(phone).timer = timer;
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

      // ── 0. Defesa em camadas: iaAtiva no BANCO (tempo real) ────────────────
      // Mesmo que um listener tenha sido anexado por bug de reconnect, uma
      // sessão sem IA nunca deve responder de verdade.
      try {
        const durable = await WhatsAppBotModel.getDurableConfig(userId, slot);
        if (!durable || durable.iaAtiva !== true) {
          logger.warn(
            `[handleIncomingMessage] mensagem ignorada: sessão ${userId}:${slot} ` +
              `não tem IA ativa (iaAtiva=${durable ? durable.iaAtiva : 'ausente'})`,
          );
          return;
        }
      } catch (iaErr) {
        logger.error(
          `[handleIncomingMessage] Falha ao consultar iaAtiva [${userId}:${slot}] — ` +
            `ignorando mensagem por segurança: ${iaErr?.message || iaErr}`,
        );
        return;
      }

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

        if (rawTextFromMe === '#ativar ia') {
          logger.wpp(userId, slot, `✅ Comando #ativar ia recebido para ${phoneFromMe}`);
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

      // ── Indicador "digitando..." ──────────────────────────────────────────
      // Ativado antes da chamada à IA; desativado após o envio ou em erro.
      // O try/catch isola falhas do typing para não bloquear a resposta.
      try {
        await client.startTyping(message.from);
        logger.info(`[🤖 BOT] Typing ativado para ${chaveConversa}`);
      } catch (typingErr) {
        logger.warn(`[🤖 BOT] Erro ao ativar typing para ${chaveConversa}: ${typingErr?.message}`);
      }

      let aiResponse;
      try {
        logger.info(`[🤖 BOT] Enviando para GPT: "${rawText}"`);
        aiResponse = await sendToGPT(rawText, formattedHistory, gptSettings);
        logger.info(`[🤖 BOT] Resposta GPT: "${aiResponse}"`);

        await client.sendText(message.from, aiResponse);

        sessionManager.addMessage(userId, slot, chaveConversa, {
          body: aiResponse, fromMe: true, timestamp: Date.now(),
        });

        logger.success(`✅ Resposta GPT enviada para ${chaveConversa} (${message.from})`);
      } finally {
        // Garante desativação do typing mesmo em caso de exceção
        try {
          await client.stopTyping(message.from);
          logger.info(`[🤖 BOT] Typing desativado para ${chaveConversa}`);
        } catch (typingErr) {
          logger.warn(`[🤖 BOT] Erro ao desativar typing para ${chaveConversa}: ${typingErr?.message}`);
        }
      }
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
      // Lê config DURÁVEL — sem iaAtiva explícito no banco, NÃO sobe (não assume atendimento)
      WhatsAppBotModel.getDurableConfig(bot.userId, bot.slot)
        .then(async (durable) => {
          if (!durable) {
            logger.error(
              `[restoreAllSessions] ❌ Sessão [${bot.userId}:${bot.slot}] sem iaAtiva persistido — ` +
                `mantendo DESCONECTADA (não restauro com comportamento assumido).`,
            );
            return;
          }
          logger.info(
            `[restoreAllSessions] Restaurando [${bot.userId}:${bot.slot}] iaAtiva=${durable.iaAtiva}`,
          );
          await startClient(bot.userId, bot.slot, {
            iaAtiva: durable.iaAtiva,
            iaPrompt: durable.iaPrompt,
            label: durable.label,
          });
        })
        .catch((error) => {
          logger.error(`Erro ao restaurar sessão [${bot.userId}:${bot.slot}]:`, error);
        });
    }

    logger.success(`✓ Restauração de sessões concluída`);
  } catch (error) {
    logger.error('Erro ao restaurar sessões:', error);
  }
}
