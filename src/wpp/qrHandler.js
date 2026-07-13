import { WhatsAppBotModel } from '../db/models.js';
import logger from '../utils/logger.js';
import sessionManager from './sessionManager.js';

// ─── Controle de reconexão ────────────────────────────────────────────────────
// Evita múltiplas tentativas simultâneas para o mesmo userId:slot
const reconnectingSet = new Set();

const RECONNECT_DELAY_MS = 15000; // 15s antes de tentar reconectar
const MAX_RECONNECT_ATTEMPTS = 5;
const reconnectAttempts = new Map(); // chave -> nº de tentativas

/**
 * Callback quando QR Code é gerado
 */
export async function onQRCode(userId, slot, qrCode) {
  try {
    logger.wpp(userId, slot, '🎯 QR Code gerado pelo WPPConnect!');
    await WhatsAppBotModel.saveQrCode(userId, slot, qrCode);
    logger.success(`[onQRCode] ✅ QR Code salvo para [${userId}:${slot}]`);
  } catch (error) {
    logger.error(`❌ Erro ao salvar QR Code [${userId}:${slot}]:`, error);
  }
}

/**
 * Callback de mudança de status — inclui lógica de auto-reconexão
 */
export async function onStatusChange(userId, slot, status, client = null) {
  logger.wpp(userId, slot, `Status mudou: ${status}`);

  try {
    if (status === 'qrReadSuccess' || status === 'chatsAvailable') {
      // ── Conectado com sucesso ──────────────────────────────────────────────
      logger.success(`✓ WhatsApp conectado [${userId}:${slot}]`);

      // Zera tentativas de reconexão ao conectar com sucesso
      const key = `${userId}:${slot}`;
      reconnectAttempts.delete(key);
      reconnectingSet.delete(key);

      let connectedNumber = null;
      let sessionJson = null;

      try {
        if (!client) client = sessionManager.getClient(userId, slot);

        if (client) {
          const hostDevice = await client.getHostDevice().catch(() => null);
          if (hostDevice) {
            const widId = (hostDevice.wid && hostDevice.wid.id) || hostDevice.id;
            connectedNumber = extractPhoneNumber(widId);
          }

          try {
            const state = await client.getState().catch(() => null);
            if (state) sessionJson = { state };
          } catch {}
        }
      } catch (error) {
        logger.warn(`Não foi possível obter número conectado [${userId}:${slot}]: ${error.message}`);
      }

      await WhatsAppBotModel.setConnected(userId, slot, connectedNumber, sessionJson);
      logger.success(`✓ Bot marcado como conectado [${userId}:${slot}]`);

      try {
        await createUserAPIEntry(userId, slot, connectedNumber);
      } catch (error) {
        logger.warn(`Erro ao criar entrada em user_apis [${userId}:${slot}]: ${error.message}`);
      }

    } else if (status === 'qrReadFail') {
      logger.warn(`⚠ QR Code falhou [${userId}:${slot}]`);
      await WhatsAppBotModel.setDisconnected(userId, slot);

    } else if (
      status === 'desconnectedMobile' ||
      status === 'serverClose' ||
      status === 'deleteToken' ||
      status === 'browserClose' ||
      status === 'autocloseCalled'
    ) {
      // ── Desconectado — tenta reconectar automaticamente ───────────────────
      logger.warn(`⚠ WhatsApp desconectado [${userId}:${slot}] — status: ${status}`);
      await WhatsAppBotModel.setDisconnected(userId, slot);

      // deleteToken = usuário deslogou manualmente, não reconecta
      if (status === 'deleteToken') {
        logger.warn(`[onStatusChange] deleteToken detectado — NÃO reconectando [${userId}:${slot}]`);
        return;
      }

      scheduleReconnect(userId, slot);
    }
  } catch (error) {
    logger.error(`Erro ao processar status [${userId}:${slot}]:`, error);
  }
}

/**
 * Agenda reconexão com delay e controle de tentativas
 */
function scheduleReconnect(userId, slot) {
  const key = `${userId}:${slot}`;

  if (reconnectingSet.has(key)) {
    logger.warn(`[scheduleReconnect] Reconexão já agendada para [${userId}:${slot}], ignorando...`);
    return;
  }

  const attempts = (reconnectAttempts.get(key) || 0) + 1;
  reconnectAttempts.set(key, attempts);

  if (attempts > MAX_RECONNECT_ATTEMPTS) {
    logger.error(`[scheduleReconnect] Máximo de ${MAX_RECONNECT_ATTEMPTS} tentativas atingido para [${userId}:${slot}]. Desistindo.`);
    reconnectAttempts.delete(key);
    return;
  }

  // Backoff exponencial: 15s, 30s, 60s, 120s, 240s
  const delay = RECONNECT_DELAY_MS * Math.pow(2, attempts - 1);
  reconnectingSet.add(key);

  logger.warn(`[scheduleReconnect] Tentativa ${attempts}/${MAX_RECONNECT_ATTEMPTS} para [${userId}:${slot}] em ${delay / 1000}s...`);

  setTimeout(async () => {
    reconnectingSet.delete(key);

    try {
      // Remove cliente antigo da memória antes de reconectar
      if (sessionManager.hasClient(userId, slot)) {
        sessionManager.removeClient(userId, slot);
      }

      logger.warn(`[scheduleReconnect] 🔄 Reconectando [${userId}:${slot}]... (tentativa ${attempts})`);

      // Import dinâmico para evitar dependência circular
      const { startClient } = await import('./index.js');
      await startClient(userId, slot);

      logger.success(`[scheduleReconnect] ✅ Reconexão iniciada para [${userId}:${slot}]`);
    } catch (err) {
      logger.error(`[scheduleReconnect] ❌ Falha ao reconectar [${userId}:${slot}]: ${err?.message || err}`);
      // Tenta de novo
      scheduleReconnect(userId, slot);
    }
  }, delay);
}

/**
 * Cria entrada em user_apis automaticamente quando conecta
 */
async function createUserAPIEntry(stackUserId, slot, connectedNumber) {
  try {
    const prisma = (await import('../db/index.js')).default;

    const stackUser = await prisma.stackUser.findUnique({
      where: { id: stackUserId },
      include: { user: true },
    }).catch(() => null);

    if (!stackUser || !stackUser.user) {
      logger.warn(`StackUser ${stackUserId} não tem User associado. Tentando criar...`);

      const stackUserData = await prisma.stackUser.findUnique({ where: { id: stackUserId } });

      if (!stackUserData?.primaryEmail) {
        logger.error(`StackUser ${stackUserId} não tem email, não é possível criar User`);
        return;
      }

      let dbUser = await prisma.user.findUnique({ where: { email: stackUserData.primaryEmail } });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email: stackUserData.primaryEmail,
            username: stackUserData.primaryEmail.split('@')[0] + '_' + Date.now().toString(36),
            fullName: stackUserData.displayName || '',
            stackUserId: stackUserId,
          },
        });
      } else if (!dbUser.stackUserId) {
        await prisma.user.update({ where: { id: dbUser.id }, data: { stackUserId } });
      }

      await prisma.stackUser.update({ where: { id: stackUserId }, data: { userId: dbUser.id } });
      stackUser && (stackUser.user = dbUser);

      if (!dbUser) {
        logger.error(`Não foi possível criar/associar User para StackUser ${stackUserId}`);
        return;
      }
    }

    const dbUserId = stackUser.user.id;
    const storeId = `whatsapp_${stackUserId}_slot${slot}`;
    const name = connectedNumber ? `WhatsApp ${connectedNumber}` : `WhatsApp Slot ${slot}`;

    const existing = await prisma.userAPI.findFirst({
      where: { userId: dbUserId, type: 'whatsapp', storeId },
    }).catch(() => null);

    if (existing) {
      await prisma.userAPI.update({
        where: { id: existing.id },
        data: { status: 'connected', name, updatedAt: new Date() },
      }).catch((err) => logger.error(`Erro ao atualizar user_apis: ${err.message}`));
      logger.info(`✓ Entrada user_apis atualizada para [${stackUserId}:${slot}]`);
    } else {
      await prisma.userAPI.create({
        data: {
          userId: dbUserId,
          name,
          type: 'whatsapp',
          storeId,
          apiKey: '',
          baseUrl: '',
          status: 'connected',
        },
      }).catch(async (err) => {
        logger.error(`Erro ao criar user_apis: ${err.message}`);
        try {
          await prisma.$executeRaw`
            INSERT INTO user_apis (id, "userId", name, type, "storeId", "apiKey", "baseUrl", status, "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), ${dbUserId}, ${name}, 'whatsapp', ${storeId}, '', '', 'connected', NOW(), NOW())
            ON CONFLICT DO NOTHING
          `;
          logger.success(`✓ Entrada criada via SQL raw para [${stackUserId}:${slot}]`);
        } catch (sqlErr) {
          logger.error(`Erro SQL raw: ${sqlErr.message}`);
        }
      });
      logger.success(`✓ Nova entrada criada em user_apis para [${stackUserId}:${slot}]`);
    }
  } catch (error) {
    logger.error(`Erro ao criar/atualizar user_apis [${stackUserId}:${slot}]:`, error);
  }
}

/**
 * Extrai número de telefone do ID do WhatsApp
 * Exemplo: "5511999999999@c.us" -> "5511999999999"
 */
export function extractPhoneNumber(whatsappId) {
  if (!whatsappId) return null;
  return whatsappId.split('@')[0];
}

/**
 * Verifica se a mensagem deve ser ignorada
 */
export function shouldIgnoreMessage(message) {
  if (message.fromMe) return true;
  if (message.isGroupMsg) return true;
  if (message.isBroadcast) return true;
  if (!message.body && !message.text) return true;
  return false;
}
