import { WhatsAppBotModel } from '../db/models.js';
import logger from '../utils/logger.js';
import sessionManager from './sessionManager.js';

/**
 * Manipulador de QR Code do WPPConnect
 */

/**
 * Callback quando QR Code é gerado
 */
export async function onQRCode(userId, slot, qrCode) {
  try {
    logger.wpp(userId, slot, 'QR Code gerado');
    
    // Salva QR Code no banco (base64)
    await WhatsAppBotModel.saveQrCode(userId, slot, qrCode);
    
    logger.wpp(userId, slot, 'QR Code salvo no banco');
  } catch (error) {
    logger.error(`Erro ao salvar QR Code [${userId}:${slot}]:`, error);
  }
}

/**
 * Callback de mudança de status
 */
export async function onStatusChange(userId, slot, status, client = null) {
  logger.wpp(userId, slot, `Status mudou: ${status}`);
  
  try {
    // Status possíveis: notLogged, qrReadSuccess, qrReadFail, 
    // autocloseCalled, desconnectedMobile, serverClose, 
    // deleteToken, chatsAvailable, deviceNotConnected, etc.
    
    if (status === 'qrReadSuccess' || status === 'chatsAvailable') {
      logger.success(`✓ WhatsApp conectado [${userId}:${slot}]`);
      
      // Tenta obter o número conectado
      let connectedNumber = null;
      let sessionJson = null;
      
      try {
        // Se client não foi passado, tenta obter do sessionManager
        if (!client) {
          client = sessionManager.getClient(userId, slot);
        }
        
        if (client) {
          // Obtém informações da sessão
          const hostDevice = await client.getHostDevice().catch(() => null);
          if (hostDevice) {
            const widId = (hostDevice.wid && hostDevice.wid.id) || hostDevice.id;
            connectedNumber = extractPhoneNumber(widId);
          }
          
          // Obtém estado da sessão se disponível
          try {
            const state = await client.getState().catch(() => null);
            if (state) {
              sessionJson = { state };
            }
          } catch (e) {
            // Ignora erro ao obter estado
          }
        }
      } catch (error) {
        logger.warn(`Não foi possível obter número conectado [${userId}:${slot}]:`, error.message);
      }
      
      // Marca como conectado no banco
      await WhatsAppBotModel.setConnected(userId, slot, connectedNumber, sessionJson);
      logger.success(`✓ Bot marcado como conectado [${userId}:${slot}]`);

      // Auto-criar entrada em user_apis se não existir
      try {
        await createUserAPIEntry(userId, slot, connectedNumber);
      } catch (error) {
        logger.warn(`Erro ao criar entrada em user_apis [${userId}:${slot}]:`, error.message);
      }
      
    } else if (status === 'qrReadFail') {
      logger.warn(`⚠ QR Code falhou [${userId}:${slot}]`);
      await WhatsAppBotModel.setDisconnected(userId, slot);
    } else if (
      status === 'desconnectedMobile' || 
      status === 'serverClose' || 
      status === 'deleteToken'
    ) {
      logger.warn(`⚠ WhatsApp desconectado [${userId}:${slot}]`);
      await WhatsAppBotModel.setDisconnected(userId, slot);
    }
  } catch (error) {
    logger.error(`Erro ao processar mudança de status [${userId}:${slot}]:`, error);
  }
}

/**
 * Cria entrada em user_apis automaticamente quando conecta
 */
async function createUserAPIEntry(userId, slot, connectedNumber) {
  try {
    const prisma = (await import('../db/index.js')).default;
    
    // Verifica se já existe
    const existing = await prisma.userAPI.findFirst({
      where: {
        userId,
        type: 'whatsapp',
        storeId: userId // Usa userId como storeId para identificar
      }
    });

    if (existing) {
      // Atualiza status
      await prisma.userAPI.update({
        where: { id: existing.id },
        data: {
          status: 'connected',
          name: connectedNumber ? `WhatsApp ${connectedNumber}` : `WhatsApp Slot ${slot}`
        }
      });
      logger.info(`✓ Entrada user_apis atualizada para [${userId}:${slot}]`);
    } else {
      // Cria nova entrada
      await prisma.userAPI.create({
        data: {
          userId,
          name: connectedNumber ? `WhatsApp ${connectedNumber}` : `WhatsApp Slot ${slot}`,
          type: 'whatsapp',
          storeId: userId,
          apiKey: '', // WhatsApp não usa apiKey
          baseUrl: '',
          status: 'connected'
        }
      });
      logger.success(`✓ Nova entrada criada em user_apis para [${userId}:${slot}]`);
    }
  } catch (error) {
    logger.error(`Erro ao criar/atualizar user_apis [${userId}:${slot}]:`, error);
    throw error;
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
export function shouldIgnoreMessage(message, botNumber) {
  // Ignora mensagens do próprio bot
  if (message.fromMe) {
    return true;
  }
  
  // Ignora mensagens de grupos (opcional - pode remover se quiser atender grupos)
  if (message.isGroupMsg) {
    return true;
  }
  
  // Ignora mensagens de broadcast
  if (message.isBroadcast) {
    return true;
  }
  
  // Ignora se não tiver corpo de texto
  if (!message.body && !message.text) {
    return true;
  }
  
  return false;
}

