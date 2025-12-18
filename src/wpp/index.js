import wppconnect from "@wppconnect-team/wppconnect";
import config from "../../config.js";
import logger from "../utils/logger.js";
import prisma from "../db/index.js";
import sessionManager from "./sessionManager.js";
import { onQRCode, onStatusChange, extractPhoneNumber } from "./qrHandler.js";
import { WhatsAppBotModel, BotSettingsModel } from "../db/models.js";
import { sendToGPT, formatConversationHistory } from "../ai/chat.js";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * ============================================================
 * CONTROLE DE PAUSA (modo humano) por conversa
 * ============================================================
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
 * ============================================================
 * LOCK POR USUÁRIO (OBRIGATÓRIO)
 * ============================================================
 */
const LOCK_DIR = "/tmp/whatsapp-locks";

function getLockPath(userId) {
  // Garantir diretório de locks
  if (!fs.existsSync(LOCK_DIR)) {
    fs.mkdirSync(LOCK_DIR, { recursive: true });
  }
  const sanitized = String(userId).trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(LOCK_DIR, `whatsapp_${sanitized}.lock`);
}

function acquireLock(userId) {
  const lockPath = getLockPath(userId);
  
  if (fs.existsSync(lockPath)) {
    try {
      const pidInLock = fs.readFileSync(lockPath, "utf8").trim();
      // Verificar se o processo ainda existe
      try {
        process.kill(pidInLock, 0); // Signal 0 = apenas verificar existência
        logger.warn(`[acquireLock] Lock existe e processo ${pidInLock} está vivo para userId: ${userId}`);
        return false;
      } catch (err) {
        // Processo não existe mais, lock está stale
        logger.warn(`[acquireLock] Lock stale (PID ${pidInLock} não existe). Removendo...`);
        fs.unlinkSync(lockPath);
      }
    } catch (err) {
      logger.warn(`[acquireLock] Erro ao verificar lock: ${err.message}. Removendo...`);
      fs.unlinkSync(lockPath);
    }
  }
  
  // Criar lock
  fs.writeFileSync(lockPath, process.pid.toString(), "utf8");
  logger.info(`[acquireLock] ✅ Lock criado para userId: ${userId} (PID: ${process.pid})`);
  return true;
}

function releaseLock(userId) {
  const lockPath = getLockPath(userId);
  
  if (fs.existsSync(lockPath)) {
    try {
      fs.unlinkSync(lockPath);
      logger.info(`[releaseLock] ✅ Lock removido para userId: ${userId}`);
    } catch (err) {
      logger.warn(`[releaseLock] Erro ao remover lock: ${err.message}`);
    }
  }
}

/**
 * ============================================================
 * LIMPEZA SEGURA (SOMENTE DO USUÁRIO)
 * ============================================================
 */
async function safeCleanupUserChrome(userDataDir, userLabel = "") {
  try {
    if (!userDataDir || typeof userDataDir !== "string") return;

    logger.info(
      `🧹 [safeCleanup] Limpeza segura para ${userLabel} -> ${userDataDir}`
    );

    // 1) Remover locks do Chrome
    const lockFiles = [
      path.join(userDataDir, "SingletonLock"),
      path.join(userDataDir, "LockFile"),
      path.join(userDataDir, "lockfile"),
      path.join(userDataDir, "SingletonSocket"),
      path.join(userDataDir, "SingletonCookie"),
      path.join(userDataDir, "Default", "SingletonLock"),
      path.join(userDataDir, "Default", "LockFile"),
      path.join(userDataDir, "Default", "lockfile"),
      path.join(userDataDir, "Default", "SingletonSocket"),
      path.join(userDataDir, "Default", "SingletonCookie"),
    ];

    for (const lf of lockFiles) {
      try {
        if (fs.existsSync(lf)) {
          fs.unlinkSync(lf);
          logger.info(`🔓 [safeCleanup] Lock removido: ${path.basename(lf)}`);
        }
      } catch {
        await execAsync(`rm -f "${lf}" 2>/dev/null`).catch(() => {});
      }
    }
    
    // Remover locks recursivamente
    try {
      await execAsync(`find "${userDataDir}" -name "Singleton*" -type f -delete 2>/dev/null`).catch(() => {});
      await execAsync(`find "${userDataDir}" -name "LockFile" -type f -delete 2>/dev/null`).catch(() => {});
      await execAsync(`find "${userDataDir}" -name "lockfile" -type f -delete 2>/dev/null`).catch(() => {});
    } catch (err) {
      // Ignorar erros
    }

    // 2) Matar SOMENTE processos Chrome deste userDataDir
    let pids = [];
    
    // Método 1: ps + grep
    try {
      const { stdout } = await execAsync(
        `ps aux | grep -iE "chrome|chromium" | grep "${userDataDir}" | grep -v grep | awk '{print $2}'`
      ).catch(() => ({ stdout: "" }));

      const pids1 = stdout
        .trim()
        .split("\n")
        .map((x) => x.trim())
        .filter((x) => x && !isNaN(Number(x)));

      pids = [...pids, ...pids1];
    } catch (err) {
      logger.warn(`⚠️ [safeCleanup] ps+grep falhou: ${err.message}`);
    }

    // Método 2: fuser
    try {
      const { stdout: fuserOut } = await execAsync(
        `fuser "${userDataDir}" 2>/dev/null`
      ).catch(() => ({ stdout: "" }));
      
      const fuserPids = fuserOut
        .trim()
        .split(/\s+/)
        .map((x) => x.trim())
        .filter((x) => x && !isNaN(Number(x)));
      
      pids = [...new Set([...pids, ...fuserPids])];
    } catch (err) {
      // fuser pode não estar instalado
    }

    // Matar processos encontrados
    if (pids.length > 0) {
      logger.warn(
        `⚠️ [safeCleanup] Encontrados ${pids.length} PID(s) usando ${userDataDir}. Finalizando...`
      );
      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid} 2>/dev/null`).catch(() => {});
          logger.info(`💀 [safeCleanup] PID ${pid} finalizado`);
        } catch (killErr) {
          logger.warn(`⚠️ [safeCleanup] Erro ao matar PID ${pid}`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } else {
      logger.info(
        `✅ [safeCleanup] Nenhum PID encontrado usando ${userDataDir}`
      );
    }

    logger.info(`✅ [safeCleanup] Limpeza segura concluída`);
  } catch (error) {
    logger.warn(`⚠️ [safeCleanup] Falhou: ${error.message}`);
  }
}

/**
 * ============================================================
 * START CLIENT - ÚNICA IMPLEMENTAÇÃO (SLOT FIXO = 1)
 * ============================================================
 */
export async function startClient(userId) {
  const slot = 1;

  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    logger.error(`[startClient] userId inválido: ${userId}`);
    return { success: false, message: "userId inválido" };
  }

  const normalizedUserId = String(userId).trim();
    
  try {
    logger.wpp(normalizedUserId, slot, "Iniciando cliente WPPConnect...");

    // 🔐 LOCK: Verificar se já existe sessão iniciando/ativa
    if (!acquireLock(normalizedUserId)) {
      logger.warn(`[startClient] ⚠️ Sessão já está sendo iniciada ou já está ativa para ${normalizedUserId}`);
      
      // Verificar se tem QR no banco
      const bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, slot);
      if (bot?.qrCode) {
        return { 
          success: true, 
          message: "Sessão já está ativa",
          qrCode: bot.qrCode,
          isConnected: bot.isConnected,
        };
      }
      
      return {
        success: false,
        message: "Sessão já está sendo iniciada ou já está ativa"
      };
    }

    // Se já existe em memória, não cria outro
    if (sessionManager.hasClient(normalizedUserId, slot)) {
      logger.warn(
        `[startClient] ⚠️ Cliente já existe em memória para ${normalizedUserId}`
      );

      const bot = await WhatsAppBotModel.findByUserAndSlot(
        normalizedUserId,
        slot
      );
      if (bot?.qrCode) {
        return { 
          success: true, 
          message: "Cliente já está ativo",
          qrCode: bot.qrCode,
          isConnected: bot.isConnected,
        };
      }

      // Cliente em memória mas sem QR, remover e recriar
      sessionManager.removeClient(normalizedUserId, slot);
    }

    // Sanitizar para path
    const sanitizedUserId = normalizedUserId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const sessionName = `whatsapp_${sanitizedUserId}`;

    const baseSessionsDir =
      (config.wppConnect && config.wppConnect.sessionsDir) ||
      "/var/www/whatsapp-sessions";

    // tokenDir: onde ficam tokens do WPPConnect
    const tokenDir = path.join(baseSessionsDir, sessionName);

    // chromeUserDataDir: FIXO por usuário (SEM timestamp)
    const chromeUserDataDir = path.join(
      baseSessionsDir,
      `${sessionName}__chrome`
    );
    
    logger.info(
      `[startClient] ISOLAMENTO: userId="${normalizedUserId}" session="${sessionName}"`
    );
    logger.info(`[startClient] tokenDir="${tokenDir}"`);
    logger.info(`[startClient] chromeUserDataDir="${chromeUserDataDir}"`);

    // Limpeza segura ANTES de iniciar
    await safeCleanupUserChrome(chromeUserDataDir, normalizedUserId);
    
    // Garantir diretórios
    if (!fs.existsSync(baseSessionsDir))
      fs.mkdirSync(baseSessionsDir, { recursive: true });
    if (!fs.existsSync(tokenDir)) 
      fs.mkdirSync(tokenDir, { recursive: true });
    if (!fs.existsSync(chromeUserDataDir))
      fs.mkdirSync(chromeUserDataDir, { recursive: true });

    // Validar usuário no banco
    const stackUser = await prisma.stackUser.findUnique({
      where: { id: normalizedUserId },
    });
    if (!stackUser) {
      logger.error(
        `[startClient] Usuário ${normalizedUserId} não encontrado em stack_users`
      );
      releaseLock(normalizedUserId);
      return { 
        success: false, 
        message: `Usuário ${normalizedUserId} não encontrado`,
      };
    }

    // Garantir registro do bot no banco
    await WhatsAppBotModel.upsert(normalizedUserId, slot, {
      isConnected: false,
      qrCode: null,
      connectedNumber: null,
    });

    const headless =
      (config.wppConnect && config.wppConnect.headless) !== undefined
        ? config.wppConnect.headless
        : true;

    const basePuppeteerOptions =
      (config.wppConnect && config.wppConnect.puppeteerOptions) || {};
    
    // Garantir args de isolamento
    const baseArgs = (basePuppeteerOptions.args || []).filter(
      (arg) =>
        arg &&
        !arg.includes("--remote-debugging-port") &&
        !arg.includes("--user-data-dir")
    );
    
    const puppeteerArgs = [
      ...baseArgs,
      "--remote-debugging-port=0",
      `--user-data-dir=${chromeUserDataDir}`,
    ];
    
    const puppeteerOptions = {
      ...basePuppeteerOptions,
      userDataDir: chromeUserDataDir,
      args: puppeteerArgs,
    };

    // Detectar Chrome
    let executablePath = process.env.CHROME_BIN || process.env.GOOGLE_CHROME_BIN;
    
    if (!executablePath) {
      const chromePaths = [
        "/usr/bin/google-chrome-stable",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium",
        "/snap/bin/chromium"
      ];
      
      for (const chromePath of chromePaths) {
        if (fs.existsSync(chromePath)) {
          executablePath = chromePath;
          break;
        }
      }
    }
    
    logger.info(`[startClient] Chrome: ${executablePath || "PADRÃO"}`);
    logger.info(`[startClient] headless: ${headless}`);
    logger.info(`[startClient] 🚀 Criando WPPConnect...`);
    
    const finalPuppeteerOptions = {
      headless,
      executablePath: executablePath || undefined,
      userDataDir: chromeUserDataDir,
      args: puppeteerArgs,
      pipe: true,
      dumpio: false,
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
    };
    
    wppconnect
      .create({
        session: sessionName,
        folderNameToken: tokenDir,
        headless,
        puppeteerOptions: finalPuppeteerOptions,
        autoClose: 0,
        logQR: false,
        disableWelcome: true,
        updatesLog: false,
        disableSpins: true,
        disableGoogleAnalytics: true,

        catchQR: async (base64Qr) => {
          logger.info(
            `[startClient] 🎯 catchQR para userId="${normalizedUserId}"`
          );
          await onQRCode(normalizedUserId, slot, base64Qr);
        },

        statusFind: async (status) => {
          logger.info(
            `[startClient] 📊 statusFind="${status}" userId="${normalizedUserId}"`
          );
          const client = sessionManager.getClient(normalizedUserId, slot);
          await onStatusChange(normalizedUserId, slot, status, client);
        },
      })
      .then(async (client) => {
        logger.wpp(normalizedUserId, slot, "✅ Cliente WPPConnect criado!");

        sessionManager.setClient(normalizedUserId, slot, client);
        
        setupMessageListener(client, normalizedUserId, slot);
        
        try {
          const isConnected = await client.isConnected().catch(() => false);
          logger.info(
            `[startClient] 📊 Status inicial: isConnected=${isConnected}`
          );
          
          if (isConnected) {
            await onStatusChange(normalizedUserId, slot, "chatsAvailable", client);
          }
        } catch (err) {
          logger.warn(
            `[startClient] ⚠️ Falha ao checar isConnected: ${err.message}`
          );
        }
      })
      .catch(async (error) => {
        logger.error(
          `❌ ERRO ao criar cliente [${normalizedUserId}:${slot}]: ${error.message}`
        );
        logger.error(error.stack || error);

        // Remover lock em caso de erro
        releaseLock(normalizedUserId);
        sessionManager.removeClient(normalizedUserId, slot);
        await WhatsAppBotModel.setDisconnected(normalizedUserId, slot).catch(() => {});
      });

    return {
      success: true,
      message: "Sessão iniciada, aguardando QR.",
      isConnected: false,
    };
  } catch (error) {
    logger.error(`Erro ao iniciar cliente [${normalizedUserId}:${slot}]:`, error);
    releaseLock(normalizedUserId);
    return { success: false, message: error.message };
  }
}

/**
 * ============================================================
 * STOP CLIENT (SLOT FIXO = 1) - GRACEFUL SHUTDOWN
 * ============================================================
 */
export async function stopClient(userId) {
  const slot = 1;
  
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    logger.error(`[stopClient] userId inválido: ${userId}`);
    return { success: false, message: "userId inválido" };
  }
    
  const normalizedUserId = String(userId).trim();
    
  try {
    logger.info(`[stopClient] 🛑 Parando cliente para ${normalizedUserId}...`);
    
    const sanitizedUserId = normalizedUserId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const sessionName = `whatsapp_${sanitizedUserId}`;
    const baseSessionsDir =
      (config.wppConnect && config.wppConnect.sessionsDir) ||
      "/var/www/whatsapp-sessions";
    
    const chromeUserDataDir = path.join(
      baseSessionsDir,
      `${sessionName}__chrome`
    );
    
    const client = sessionManager.getClient(normalizedUserId, slot);

    if (!client) {
      logger.warn(`[stopClient] Cliente não encontrado em memória para ${normalizedUserId}`);
    } else {
      // Fechar cliente gracefully
      try {
        logger.info(`[stopClient] Fechando cliente WPPConnect...`);
        await client.close().catch(() => {});
        logger.info(`[stopClient] ✅ Cliente WPPConnect fechado`);
      } catch (err) {
        logger.warn(`[stopClient] ⚠️ Erro ao fechar cliente: ${err.message}`);
      }
      
      sessionManager.removeClient(normalizedUserId, slot);
    }
    
    // Limpeza segura (somente deste usuário)
    await safeCleanupUserChrome(chromeUserDataDir, normalizedUserId);
    
    // Limpar conversa em memória e marcar como desconectado no banco
    sessionManager.clearAllConversations(normalizedUserId, slot);
    await WhatsAppBotModel.setDisconnected(normalizedUserId, slot);

    // 🔓 Remover lock
    releaseLock(normalizedUserId);

    logger.success(`[stopClient] ✅ Cliente parado com sucesso para ${normalizedUserId}`);
    return { success: true, message: "Cliente desconectado com sucesso" };
  } catch (error) {
    logger.error(`Erro ao parar cliente [${normalizedUserId}]:`, error);
    releaseLock(normalizedUserId);
    return { success: false, message: error.message };
  }
}

/**
 * ============================================================
 * STATUS
 * ============================================================
 */
export async function getClientStatus(userId) {
  const slot = 1;
  
  if (!userId || typeof userId !== "string") {
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
 * ============================================================
 * LISTENER DE MENSAGENS + IA + PAUSA (#boa noite / #voltar)
 * ============================================================
 */
function setupMessageListener(client, userId, slot) {
  client.onAnyMessage(async (message) => {
    try {
      if (message.isGroupMsg) return;
      if (message.type !== "chat" && message.type !== "text") return;

      const rawText = (message.body || message.text || "").trim();
      if (!rawText) return;

      const text = rawText.toLowerCase();

      const phoneRaw = message.fromMe
        ? message.to ||
          message.chatId ||
          (message.chat && message.chat.id) ||
          message.from
        : message.from;

      const phone = extractPhoneNumber(phoneRaw) || phoneRaw;

      logger.wpp(
        userId,
        slot,
        `📩 Msg - from: ${message.from}, to: ${message.to}, fromMe: ${message.fromMe}, phone: ${phone}, body: "${rawText}"`
      );

      // Comandos do atendente (fromMe)
      if (message.fromMe) {
        if (text === "#boa noite") {
          pauseChat(userId, slot, phone);
          try {
            await client.sendText(
              message.from,
              `🛑 Bot pausado para ${phone}. Use #voltar para reativar.`
            );
          } catch {}
          return;
        }

        if (text === "#voltar") {
          resumeChat(userId, slot, phone);
          try {
            await client.sendText(message.from, `🤖 Bot reativado para ${phone}.`);
          } catch {}
          return;
        }

        return;
      }

      // Cliente em modo humano
      if (isChatPaused(userId, slot, phone)) {
        logger.wpp(userId, slot, `🔕 Chat ${phone} em modo humano. Ignorando.`);
        return;
      }

      // Buscar settings
      const botSettings = await BotSettingsModel.findByUser(userId).catch(
        () => null
      );
      if (!botSettings || !botSettings.isActive) {
        logger.wpp(userId, slot, "Bot desabilitado, ignorando mensagem");
        return;
      }

      const conversationHistory = sessionManager.getConversation(
        userId,
        slot,
        phone,
        botSettings.contextLimit || 10
      );

      const formattedHistory = formatConversationHistory(
        conversationHistory,
        botSettings.contextLimit || 10
      );

      const gptSettings = {
        botName: botSettings.botName || "Assistente",
        storeType: botSettings.storeType || "restaurant",
        lineLimit: botSettings.lineLimit || 5,
        basePrompt: botSettings.basePrompt || "",
      };

      logger.ai(`Processando mensagem com IA [${userId}:${slot}]`);

      const aiResponse = await sendToGPT(rawText, formattedHistory, gptSettings);

      sessionManager.addMessage(userId, slot, phone, {
        body: rawText,
        fromMe: false,
        timestamp: Date.now(),
      });

      await client.sendText(message.from, aiResponse);

      sessionManager.addMessage(userId, slot, phone, {
        body: aiResponse,
        fromMe: true,
        timestamp: Date.now(),
      });

      logger.success(`Resposta enviada para ${phone}`);
    } catch (error) {
      logger.error(`Erro ao processar msg [${userId}:${slot}]:`, error);
      try {
        await client.sendText(
          message.from,
          "Desculpe, ocorreu um erro. Tente novamente."
        );
      } catch {}
    }
  });
}

/**
 * ============================================================
 * GRACEFUL SHUTDOWN - REMOVER LOCKS EM SIGINT/SIGTERM
 * ============================================================
 */
process.on('SIGINT', async () => {
  logger.warn('SIGINT recebido, limpando locks...');
  // Limpar todos os locks deste processo
  try {
    const files = fs.readdirSync(LOCK_DIR);
    for (const file of files) {
      const lockPath = path.join(LOCK_DIR, file);
      try {
        const pid = fs.readFileSync(lockPath, 'utf8').trim();
        if (pid === process.pid.toString()) {
          fs.unlinkSync(lockPath);
          logger.info(`Lock removido: ${file}`);
        }
      } catch (err) {
        // Ignorar erros
      }
    }
  } catch (err) {
    logger.warn(`Erro ao limpar locks: ${err.message}`);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.warn('SIGTERM recebido, limpando locks...');
  try {
    const files = fs.readdirSync(LOCK_DIR);
    for (const file of files) {
      const lockPath = path.join(LOCK_DIR, file);
      try {
        const pid = fs.readFileSync(lockPath, 'utf8').trim();
        if (pid === process.pid.toString()) {
          fs.unlinkSync(lockPath);
          logger.info(`Lock removido: ${file}`);
        }
      } catch (err) {
        // Ignorar erros
      }
    }
  } catch (err) {
    logger.warn(`Erro ao limpar locks: ${err.message}`);
  }
  process.exit(0);
});

/**
 * ============================================================
 * RESTORE (DESATIVADO - NÃO USAR EM MULTI-USUÁRIO)
 * ============================================================
 */
export async function restoreAllSessions() {
  logger.warn("restoreAllSessions() está desativado em modo multi-usuário");
  return;
}
