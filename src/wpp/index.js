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

/**
 * ============================================================
 * START CLIENT (SLOT FIXO = 1)
 * ============================================================
 */
export async function startClient(userId) {
  const slot = 1;

  if (!userId || typeof userId !== "string") {
    return { success: false, message: "userId inválido" };
  }

  const normalizedUserId = userId.trim();
  const sanitizedUserId = normalizedUserId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const sessionName = `whatsapp_${sanitizedUserId}`;

  const baseSessionsDir =
    config?.wppConnect?.sessionsDir || "/var/www/whatsapp-sessions";

  const tokenDir = path.join(baseSessionsDir, sessionName);
  const chromeUserDataDir = path.join(
    baseSessionsDir,
    `${sessionName}__chrome`
  );

  try {
    logger.wpp(normalizedUserId, slot, "🚀 Iniciando cliente WPPConnect");

    if (!fs.existsSync(tokenDir)) fs.mkdirSync(tokenDir, { recursive: true });
    if (!fs.existsSync(chromeUserDataDir))
      fs.mkdirSync(chromeUserDataDir, { recursive: true });

    const stackUser = await prisma.stackUser.findUnique({
      where: { id: normalizedUserId },
    });

    if (!stackUser) {
      return { success: false, message: "Usuário não encontrado" };
    }

    await WhatsAppBotModel.upsert(normalizedUserId, slot, {
      isConnected: false,
      qrCode: null,
      connectedNumber: null,
    });

    const puppeteerOptions = {
      executablePath: "/usr/bin/google-chrome", // 🔥 CORREÇÃO REAL
      headless: true,
      userDataDir: chromeUserDataDir,
      args: [
        `--user-data-dir=${chromeUserDataDir}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--remote-debugging-port=0",
      ],
    };

    logger.info(
      `[startClient] Chromium em /usr/bin/chromium-browser | userDataDir=${chromeUserDataDir}`
    );

    wppconnect
      .create({
        session: sessionName,
        folderNameToken: tokenDir,
        puppeteerOptions,
        autoClose: 0,
        logQR: false,
        disableWelcome: true,
        updatesLog: false,
        disableSpins: true,
        disableGoogleAnalytics: true,

        catchQR: async (base64Qr) => {
          await onQRCode(normalizedUserId, slot, base64Qr);
        },

        statusFind: async (status) => {
          const client = sessionManager.getClient(normalizedUserId, slot);
          await onStatusChange(normalizedUserId, slot, status, client);
        },
      })
      .then((client) => {
        sessionManager.setClient(normalizedUserId, slot, client);
        setupMessageListener(client, normalizedUserId, slot);
        logger.success(
          `✅ Cliente iniciado para ${normalizedUserId} aguardando QR`
        );
      })
      .catch((err) => {
        logger.error(
          `❌ Erro ao criar cliente ${normalizedUserId}: ${err.message}`
        );
        sessionManager.removeClient(normalizedUserId, slot);
      });

    return {
      success: true,
      message: "Sessão iniciada, aguardando QR",
      isConnected: false,
    };
  } catch (err) {
    logger.error(err);
    return { success: false, message: err.message };
  }
}

/**
 * ============================================================
 * STATUS
 * ============================================================
 */
export async function getClientStatus(userId) {
  const slot = 1;
  const client = sessionManager.getClient(userId, slot);
  if (!client) return { isActive: false, isConnected: false };

  try {
    return {
      isActive: true,
      isConnected: await client.isConnected(),
    };
  } catch {
    return { isActive: true, isConnected: false };
  }
}
