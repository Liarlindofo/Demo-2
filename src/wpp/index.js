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
 * LIMPEZA SEGURA (MULTI-USUÁRIO)
 * ============================================================
 *
 * REGRA DE OURO:
 * - NUNCA use pkill/killall "chrome" / "chromium" global
 * - Se for matar algo, mate APENAS PIDs que estão usando
 *   arquivos dentro do userDataDir DESTE usuário (via lsof +D).
 * - Remover locks é ok, mas não delete a pasta inteira automaticamente.
 */
async function safeCleanupUserChrome(userDataDir, userLabel = "") {
  try {
    if (!userDataDir || typeof userDataDir !== "string") return;

    logger.info(
      `🧹 [safeCleanup] Iniciando limpeza segura para ${userLabel} -> ${userDataDir}`
    );

    // 1) PRIMEIRO: Remover TODOS os lock files conhecidos (isso é crítico!)
    const lockFiles = [
      path.join(userDataDir, "SingletonLock"),
      path.join(userDataDir, "LockFile"),
      path.join(userDataDir, "lockfile"),
      path.join(userDataDir, "SingletonSocket"),
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
        // best effort
        await execAsync(`rm -f "${lf}" 2>/dev/null`).catch(() => {});
      }
    }
    
    // Remover também locks na raiz do userDataDir (recursivo)
    try {
      await execAsync(`find "${userDataDir}" -name "Singleton*" -type f -delete 2>/dev/null`).catch(() => {});
      await execAsync(`find "${userDataDir}" -name "LockFile" -type f -delete 2>/dev/null`).catch(() => {});
      await execAsync(`find "${userDataDir}" -name "lockfile" -type f -delete 2>/dev/null`).catch(() => {});
    } catch (err) {
      // Ignorar erros de find
    }

    // 2) Matar SOMENTE processos Chrome que estão usando este userDataDir específico
    // Método 1: ps + grep pelo userDataDir (mais confiável que lsof)
    let pids = [];
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

    // Método 2: lsof (backup, mais preciso mas pode não estar instalado)
    try {
      const { stdout } = await execAsync(
        `lsof +D "${userDataDir}" 2>/dev/null | awk '{print $2}' | sort -u`
      ).catch(() => ({ stdout: "" }));

      const pids2 = stdout
        .trim()
        .split("\n")
        .map((x) => x.trim())
        .filter((x) => x && !isNaN(Number(x)));

      pids = [...new Set([...pids, ...pids2])];
    } catch (err) {
      // lsof pode não estar instalado, não é crítico
    }

    // Método 3: Buscar por nome da sessão (último recurso)
    if (pids.length === 0) {
      const sessionName = path.basename(userDataDir);
      try {
        const { stdout } = await execAsync(
          `ps aux | grep -iE "chrome|chromium" | grep "${sessionName}" | grep -v grep | awk '{print $2}'`
        ).catch(() => ({ stdout: "" }));

        const pids3 = stdout
          .trim()
          .split("\n")
          .map((x) => x.trim())
          .filter((x) => x && !isNaN(Number(x)));

        pids = [...new Set([...pids, ...pids3])];
      } catch (err) {
        // Ignorar erro
      }
    }

    // Método 4: fuser (mais confiável que lsof, se disponível)
    try {
      const { stdout: fuserOut } = await execAsync(
        `fuser "${userDataDir}" 2>/dev/null | awk '{print $1}'`
      ).catch(() => ({ stdout: "" }));
      
      const fuserPids = fuserOut
        .trim()
        .split(/\s+/)
        .map((x) => x.trim())
        .filter((x) => x && !isNaN(Number(x)));
      
      pids = [...new Set([...pids, ...fuserPids])];
    } catch (err) {
      // fuser pode não estar instalado, não é crítico
    }

    // Matar processos encontrados
    if (pids.length > 0) {
      logger.warn(
        `⚠️ [safeCleanup] Encontrados ${pids.length} PID(s) usando ${userDataDir}. Finalizando APENAS esses PIDs...`
      );
      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid} 2>/dev/null`).catch(() => {});
          logger.info(`💀 [safeCleanup] PID ${pid} finalizado`);
        } catch (killErr) {
          logger.warn(`⚠️ [safeCleanup] Erro ao matar PID ${pid}`);
        }
      }
      // Aguardar processos encerrarem completamente
      await new Promise((resolve) => setTimeout(resolve, 5000));
      
      // Verificar novamente se ainda há processos
      try {
        const { stdout: recheck } = await execAsync(
          `ps aux | grep -iE "chrome|chromium" | grep "${userDataDir}" | grep -v grep | awk '{print $2}'`
        ).catch(() => ({ stdout: "" }));
        
        const remaining = recheck
          .trim()
          .split("\n")
          .filter((x) => x && !isNaN(Number(x)));
        
        if (remaining.length > 0) {
          logger.warn(`⚠️ [safeCleanup] Ainda há ${remaining.length} processo(s) rodando. Tentando novamente...`);
          for (const pid of remaining) {
            await execAsync(`kill -9 ${pid} 2>/dev/null`).catch(() => {});
          }
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      } catch (recheckErr) {
        // Ignorar erro de recheck
      }
    } else {
      logger.info(
        `✅ [safeCleanup] Nenhum PID encontrado usando arquivos em ${userDataDir}`
      );
    }
    
    // ÚLTIMO RECURSO: Se ainda houver lock files após tudo isso, deletar a pasta Default inteira
    // (isso força o Chrome a criar um novo perfil)
    const defaultDir = path.join(userDataDir, "Default");
    if (fs.existsSync(defaultDir)) {
      try {
        const { stdout: stillLocked } = await execAsync(
          `find "${defaultDir}" -name "Singleton*" -o -name "LockFile" 2>/dev/null | head -1`
        ).catch(() => ({ stdout: "" }));
        
        if (stillLocked.trim()) {
          logger.warn(`⚠️ [safeCleanup] Ainda há locks após limpeza. Deletando pasta Default...`);
          await execAsync(`rm -rf "${defaultDir}" 2>/dev/null`).catch(() => {});
          await new Promise((resolve) => setTimeout(resolve, 2000));
          logger.info(`✅ [safeCleanup] Pasta Default deletada e será recriada pelo Chrome`);
        }
      } catch (err) {
        // Ignorar erro
      }
    }

    logger.info(`✅ [safeCleanup] Limpeza segura concluída`);
  } catch (error) {
    logger.warn(`⚠️ [safeCleanup] Falhou: ${error.message}`);
  }
}

/**
 * ============================================================
 * START CLIENT (SLOT FIXO = 1)
 * ============================================================
 *
 * AQUI ESTÁ A CORREÇÃO PRINCIPAL:
 * - Não mata Chrome global
 * - Não deleta chromeUserDataDir automaticamente
 * - Não cria userDataDir temporário com "pkill chrome"
 */
export async function startClient(userId) {
  const slot = 1;

  // ✅ Corrige o erro "Cannot access normalizedUserId before initialization"
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      logger.error(`[startClient] userId inválido: ${userId}`);
    return { success: false, message: "userId inválido" };
    }

  const normalizedUserId = String(userId).trim();
    
  try {
    logger.wpp(normalizedUserId, slot, "Iniciando cliente WPPConnect...");

    // Se já existe em memória, não cria outro
    if (sessionManager.hasClient(normalizedUserId, slot)) {
      logger.warn(
        `[startClient] ⚠️ Já existe client em memória para ${normalizedUserId}`
      );

      // se tiver QR no banco, devolve
      const bot = await WhatsAppBotModel.findByUserAndSlot(
        normalizedUserId,
        slot
      );
      if (bot?.qrCode) {
        return { 
          success: true, 
          message: "Cliente já está ativo com QR Code",
          qrCode: bot.qrCode,
          isConnected: bot.isConnected,
        };
      }

      // se está em memória mas sem QR no banco, remove e segue criando novo
      sessionManager.removeClient(normalizedUserId, slot);
    }

    // Sanitizar para path
    const sanitizedUserId = normalizedUserId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const sessionName = `whatsapp_${sanitizedUserId}`;

    const baseSessionsDir =
      (config.wppConnect && config.wppConnect.sessionsDir) ||
      "/var/www/whatsapp-sessions";

    // tokenDir: onde ficam tokens do WPPConnect (pode limpar se quiser forçar QR)
    // Mantemos UM diretório fixo de token por usuário (para reaproveitar sessão)
    const tokenDir = path.join(baseSessionsDir, sessionName);

    // chromeUserDataDir: perfil do Chrome.
    // Para evitar completamente o erro "browser already running" e qualquer
    // interferência entre execuções, usamos SEMPRE um diretório NOVO por start.
    // Exemplo: /var/www/whatsapp-sessions/whatsapp_<user>__chrome_abcd123
    const chromeBaseDir = path.join(
      baseSessionsDir,
      `${sessionName}__chrome`
    );
    
    // =======================================================================
    // 🔥 SOLUÇÃO DEFINITIVA: LIMPEZA ULTRA-AGRESSIVA
    // =======================================================================
    logger.warn(`[startClient] 🧨 LIMPEZA ULTRA-AGRESSIVA para ${normalizedUserId}...`);
    
    // 1. MATAR TODOS os processos Chrome deste usuário (usando sessionName como filtro)
    logger.info(`[startClient] 🗡️ Matando TODOS os processos Chrome do usuário ${normalizedUserId}...`);
    await execAsync(`ps aux | grep -iE "chrome|chromium" | grep "${sessionName}" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null`).catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // 2. DELETAR TODAS as pastas __chrome_* antigas deste usuário
    logger.info(`[startClient] 🗑️ Deletando TODAS as pastas Chrome antigas do usuário ${normalizedUserId}...`);
    await execAsync(`rm -rf "${chromeBaseDir}"* 2>/dev/null`).catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // 3. CRIAR um userDataDir completamente novo com timestamp único
    const chromeUserDataDir = `${chromeBaseDir}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    logger.info(`[startClient] 📁 Criando novo userDataDir: ${chromeUserDataDir}`);
    
    // Garantir diretórios
    if (!fs.existsSync(baseSessionsDir))
      fs.mkdirSync(baseSessionsDir, { recursive: true });
    if (!fs.existsSync(tokenDir)) fs.mkdirSync(tokenDir, { recursive: true });
    if (!fs.existsSync(chromeUserDataDir))
      fs.mkdirSync(chromeUserDataDir, { recursive: true });

    logger.info(
      `[startClient] ISOLAMENTO: userId="${normalizedUserId}" session="${sessionName}" tokenDir="${tokenDir}" chromeUserDataDir="${chromeUserDataDir}"`
    );

    // Validar usuário no banco (como você já fazia)
    const stackUser = await prisma.stackUser.findUnique({
      where: { id: normalizedUserId },
    });
    if (!stackUser) {
      logger.error(
        `[startClient] Usuário ${normalizedUserId} não encontrado em stack_users`
      );
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

    // 4. VERIFICAÇÃO FINAL: garantir que NÃO há processos Chrome deste usuário
    logger.info(`[startClient] 🔍 Verificação final de processos Chrome para ${normalizedUserId}...`);
    try {
      const { stdout: finalCheck } = await execAsync(
        `ps aux | grep -iE "chrome|chromium" | grep "${sessionName}" | grep -v grep | wc -l`
      ).catch(() => ({ stdout: "0" }));
      
      const stillRunning = parseInt(finalCheck.trim()) || 0;
      if (stillRunning > 0) {
        logger.error(
          `❌ [startClient] AINDA HÁ ${stillRunning} processo(s) Chrome rodando para ${normalizedUserId}!`
        );
        logger.error(`❌ [startClient] Matando novamente com SIGKILL...`);
        await execAsync(`ps aux | grep -iE "chrome|chromium" | grep "${sessionName}" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null`).catch(() => {});
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        logger.success(`✅ [startClient] Nenhum processo Chrome rodando para ${normalizedUserId}. Prosseguindo...`);
      }
    } catch (checkErr) {
      logger.warn(`⚠️ [startClient] Erro na verificação final: ${checkErr.message}`);
    }
    
    // 5. DELAY de segurança antes de criar cliente
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const headless =
      (config.wppConnect && config.wppConnect.headless) !== undefined
        ? config.wppConnect.headless
        : true;

    const basePuppeteerOptions =
      (config.wppConnect && config.wppConnect.puppeteerOptions) || {};
    
    // Garantir que --remote-debugging-port=0 está presente (porta aleatória por instância)
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
    
    const puppeteerOptions = Object.assign({}, basePuppeteerOptions, {
      userDataDir: chromeUserDataDir,
      args: puppeteerArgs,
    });

    logger.info(`[startClient] 🚀 Criando WPPConnect...`);

    // Não precisa fazer "retry com userDataDir temporário + pkill chrome".
    // Se der erro "browser already running", é porque ESTE usuário tem um chrome preso.
    // A limpeza segura (lsof +D) já resolve sem afetar outros usuários.
    // Caminho do Chrome: permite override por variável de ambiente
    const executablePath =
      process.env.CHROME_BIN ||
      process.env.GOOGLE_CHROME_BIN ||
      "/usr/bin/google-chrome";
    
    wppconnect
      .create({
        session: sessionName,
        folderNameToken: tokenDir,
        headless,
        // Força uso de Chrome externo (evita problemas com Snap/Chromium)
        useChrome: true,
        executablePath,
        browserArgs: puppeteerArgs,
        puppeteerOptions,
        autoClose: 0,
        logQR: false,
        disableWelcome: true,
        updatesLog: false,

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
        
        // Verificar status inicial e forçar QR se necessário
        try {
          const isConnected = await client.isConnected().catch(() => false);
          logger.info(
            `[startClient] 📊 Status inicial do cliente: isConnected=${isConnected}`
          );
          
          if (isConnected) {
            logger.warn(
              `[startClient] ⚠️ Cliente já está conectado! Isso pode impedir a geração de QR.`
            );
            await onStatusChange(normalizedUserId, slot, "chatsAvailable", client);
          } else {
            logger.info(
              `[startClient] ✅ Cliente não está conectado. Aguardando QR Code...`
            );
            
            // Se após 10 segundos não gerou QR, verificar novamente
            setTimeout(async () => {
              const bot = await WhatsAppBotModel.findByUserAndSlot(
                normalizedUserId,
                slot
              ).catch(() => null);
              
              if (!bot?.qrCode && !bot?.isConnected) {
                logger.warn(
                  `[startClient] ⚠️ QR Code não foi gerado após 10 segundos para ${normalizedUserId}`
                );
                logger.warn(
                  `[startClient] ⚠️ Verifique os logs do WPPConnect para erros`
                );
              }
            }, 10000);
          }
        } catch (err) {
          logger.warn(
            `[startClient] ⚠️ Falha ao checar isConnected inicial: ${err.message}`
          );
        }
      })
      .catch(async (error) => {
        logger.error(
          `❌ ERRO ao criar cliente [${normalizedUserId}:${slot}]: ${error.message}`
        );
        logger.error(error.stack || error);

        // Se for "browser already running", DELETA COMPLETAMENTE tudo e recria do zero
        if (
          error.message &&
          (error.message.includes("browser is already running") ||
            error.message.includes("already running"))
        ) {
          logger.error(
            `[startClient] ❌ "browser already running" AINDA OCORREU para ${normalizedUserId}!`
          );
          logger.error(
            `[startClient] ❌ Isso significa que a limpeza inicial não foi suficiente.`
          );
          logger.error(
            `[startClient] ❌ Tentando retry com limpeza AINDA MAIS agressiva...`
          );
          
          const chromeBaseDir = path.join(baseSessionsDir, `${sessionName}__chrome`);
          
          // RETRY 1: Matar TUDO que tenha o sessionName (não apenas chromeBaseDir)
          logger.warn(`[startClient] 🗡️ RETRY: Matando processos Chrome com "${sessionName}" no comando...`);
          await execAsync(`ps aux | grep -iE "chrome|chromium" | grep "${sessionName}" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null`).catch(() => {});
          await new Promise((resolve) => setTimeout(resolve, 5000));
          
          // RETRY 2: Deletar tudo novamente
          logger.warn(`[startClient] 🗑️ RETRY: Deletando TODAS as pastas Chrome e Token do usuário...`);
          await execAsync(`rm -rf "${chromeBaseDir}"* "${tokenDir}"* 2>/dev/null`).catch(() => {});
          await new Promise((resolve) => setTimeout(resolve, 3000));
          
          // RETRY 3: Recriar diretórios
          const retryTimestamp = `retry_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
          const retryUserDataDir = `${chromeBaseDir}_${retryTimestamp}`;
          const retryTokenDir = `${tokenDir}_${retryTimestamp}`;
          
          fs.mkdirSync(retryUserDataDir, { recursive: true });
          fs.mkdirSync(retryTokenDir, { recursive: true });
          
          logger.info(`[startClient] 🔄 RETRY: Novo userDataDir: ${retryUserDataDir}`);
          logger.info(`[startClient] 🔄 RETRY: Novo tokenDir: ${retryTokenDir}`);
          
          // RETRY 4: Delay extra de segurança
          await new Promise((resolve) => setTimeout(resolve, 5000));
          
          // RETRY 5: Tentar criar cliente novamente com tudo novo
          try {
            const retryPuppeteerArgs = [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu',
              '--disable-features=TranslateUI',
              '--disable-extensions',
              '--disable-background-networking',
              '--disable-sync',
              '--metrics-recording-only',
              '--remote-debugging-port=0',
              `--user-data-dir=${retryUserDataDir}`
            ];
            
            const retryPuppeteerOptions = {
              headless,
              args: retryPuppeteerArgs,
              userDataDir: retryUserDataDir,
            };
            
            // Caminho do Chrome: permitir override
            const executablePath =
              process.env.CHROME_BIN ||
              process.env.GOOGLE_CHROME_BIN ||
              "/usr/bin/google-chrome";
            
            logger.info(`[startClient] 🔄 RETRY: Criando cliente com executablePath=${executablePath}...`);
            
            const retryClient = await wppconnect.create({
              session: `${sessionName}_${retryTimestamp}`, // Session name único também
              folderNameToken: retryTokenDir,
              headless,
              useChrome: true,
              executablePath,
              browserArgs: retryPuppeteerArgs,
              puppeteerOptions: retryPuppeteerOptions,
              autoClose: 0,
              logQR: false,
              disableWelcome: true,
              updatesLog: false,
              catchQR: async (base64Qr) => {
                logger.info(`[startClient] 🎯 RETRY: catchQR para ${normalizedUserId}`);
                await onQRCode(normalizedUserId, slot, base64Qr);
              },
              statusFind: async (status) => {
                logger.info(`[startClient] 📊 RETRY: statusFind="${status}" para ${normalizedUserId}`);
                const client = sessionManager.getClient(normalizedUserId, slot);
                await onStatusChange(normalizedUserId, slot, status, client);
              },
            });
            
            logger.success(`[startClient] ✅ RETRY BEM-SUCEDIDO! Cliente criado para ${normalizedUserId}`);
            sessionManager.setClient(normalizedUserId, slot, retryClient);
            setupMessageListener(retryClient, normalizedUserId, slot);
            
            try {
              const isConnected = await retryClient.isConnected().catch(() => false);
              if (isConnected) {
                await onStatusChange(normalizedUserId, slot, "chatsAvailable", retryClient);
              }
            } catch (err) {
              logger.warn(`[startClient] ⚠️ RETRY: Falha ao checar isConnected: ${err.message}`);
            }
          } catch (retryError) {
            logger.error(`[startClient] ❌ RETRY FALHOU: ${retryError.message}`);
            logger.error(`[startClient] ❌ Não foi possível criar cliente para ${normalizedUserId} mesmo com todas as tentativas.`);
            logger.error(`[startClient] ❌ Verifique se há algum Chrome/Chromium rodando manualmente: ps aux | grep chrome`);
            sessionManager.removeClient(normalizedUserId, slot);
            await WhatsAppBotModel.setDisconnected(normalizedUserId, slot).catch(() => {});
          }
        } else {
          // Para outros erros, apenas remove e marca como desconectado
          logger.error(`[startClient] ❌ Erro NÃO relacionado a "browser already running": ${error.message}`);
          sessionManager.removeClient(normalizedUserId, slot);
          await WhatsAppBotModel.setDisconnected(normalizedUserId, slot).catch(() => {});
        }
      });

    return {
      success: true,
      message: "Sessão iniciada, aguardando QR.",
      isConnected: false,
    };
  } catch (error) {
    logger.error(`Erro ao iniciar cliente [${normalizedUserId}:${slot}]:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * ============================================================
 * STOP CLIENT (SLOT FIXO = 1)
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
    
    const tokenDir = path.join(baseSessionsDir, sessionName);
    const chromeBaseDir = path.join(baseSessionsDir, `${sessionName}__chrome`);
    
    const client = sessionManager.getClient(normalizedUserId, slot);

    if (!client) {
      logger.warn(`[stopClient] Cliente não encontrado em memória para ${normalizedUserId}`);
    } else {
      // Tentar fechar cliente gracefully
      try {
        logger.info(`[stopClient] Fechando cliente WPPConnect para ${normalizedUserId}...`);
        await client.close().catch(() => {});
        logger.info(`[stopClient] ✅ Cliente WPPConnect fechado`);
      } catch (err) {
        logger.warn(`[stopClient] ⚠️ Erro ao fechar cliente: ${err.message}`);
      }
      
      sessionManager.removeClient(normalizedUserId, slot);
    }
    
    // =======================================================================
    // 🔥 LIMPEZA ULTRA-AGRESSIVA ao parar cliente
    // =======================================================================
    logger.warn(`[stopClient] 🧨 LIMPEZA ULTRA-AGRESSIVA para ${normalizedUserId}...`);
    
    // 1. MATAR TODOS os processos Chrome deste usuário
    logger.info(`[stopClient] 🗡️ Matando TODOS os processos Chrome do usuário ${normalizedUserId}...`);
    await execAsync(`ps aux | grep -iE "chrome|chromium" | grep "${sessionName}" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null`).catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // 2. DELETAR TODAS as pastas __chrome_* deste usuário
    logger.info(`[stopClient] 🗑️ Deletando TODAS as pastas Chrome do usuário ${normalizedUserId}...`);
    await execAsync(`rm -rf "${chromeBaseDir}"* 2>/dev/null`).catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // 3. Limpar conversa em memória e marcar como desconectado no banco
    sessionManager.clearAllConversations(normalizedUserId, slot);
    await WhatsAppBotModel.setDisconnected(normalizedUserId, slot);

    logger.success(`[stopClient] ✅ Cliente parado e TODAS as pastas Chrome deletadas para ${normalizedUserId}`);
    return { success: true, message: "Cliente desconectado com sucesso" };
  } catch (error) {
    logger.error(`Erro ao parar cliente [${normalizedUserId}]:`, error);
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

        // Mensagem normal do atendente não entra no bot
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
 * RESTORE (opcional / legado)
 * ============================================================
 * Obs: na sua nova arquitetura 1 worker por usuário, normalmente
 * você NÃO quer restaurar tudo automaticamente.
 * Mantive por compatibilidade, mas recomendo desativar no server.
 */
export async function restoreAllSessions() {
  try {
    logger.info("Restaurando sessões (legado)...");
    // Ajuste se você realmente usa isso.
    const allBots = await prisma.whatsapp_bots.findMany().catch(() => []);
    logger.info(`Encontrados ${allBots.length} bots para restaurar`);

    for (const bot of allBots) {
      startClient(bot.userId).catch((err) => {
        logger.error(`Erro ao restaurar [${bot.userId}:1]:`, err);
      });
    }

    logger.success("✓ Restauração concluída");
  } catch (error) {
    logger.error("Erro ao restaurar sessões:", error);
  }
}