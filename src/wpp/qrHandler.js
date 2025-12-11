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
 * userId aqui é do StackUser, precisa converter para User
 */
async function createUserAPIEntry(stackUserId, slot, connectedNumber) {
  try {
    const prisma = (await import('../db/index.js')).default;
    
    // Buscar o User correspondente ao StackUser
    const stackUser = await prisma.stackUser.findUnique({
      where: { id: stackUserId },
      include: { user: true }
    }).catch(() => null);

    if (!stackUser || !stackUser.user) {
      logger.warn(`StackUser ${stackUserId} não tem User associado. Tentando criar...`);
      
      // Tentar criar User se não existir
      // Isso pode falhar se não houver email, mas pelo menos tentamos
      const stackUserData = await prisma.stackUser.findUnique({
        where: { id: stackUserId }
      });
      
      if (stackUserData && stackUserData.primaryEmail) {
        // Buscar ou criar User
        let dbUser = await prisma.user.findUnique({
          where: { email: stackUserData.primaryEmail }
        });
        
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email: stackUserData.primaryEmail,
              username: stackUserData.primaryEmail.split('@')[0] + '_' + Date.now().toString(36),
              fullName: stackUserData.displayName || '',
              stackUserId: stackUserId
            }
          });
          
          // Atualizar StackUser com referência ao User
          await prisma.stackUser.update({
            where: { id: stackUserId },
            data: { userId: dbUser.id }
          });
        } else if (!dbUser.stackUserId) {
          // Associar User existente ao StackUser
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { stackUserId: stackUserId }
          });
          await prisma.stackUser.update({
            where: { id: stackUserId },
            data: { userId: dbUser.id }
          });
        }
        
        // Tentar novamente buscar o User
        const updatedStackUser = await prisma.stackUser.findUnique({
          where: { id: stackUserId },
          include: { user: true }
        });
        
        if (!updatedStackUser || !updatedStackUser.user) {
          logger.error(`Não foi possível criar/associar User para StackUser ${stackUserId}`);
          return;
        }
        
        stackUser.user = updatedStackUser.user;
      } else {
        logger.error(`StackUser ${stackUserId} não tem email, não é possível criar User`);
        return;
      }
    }
    
    const dbUserId = stackUser.user.id;
    // IMPORTANTE: Usar o stackUserId como storeId para manter consistência
    // com o que o frontend envia quando chama /api/start/${user.id}/${slot}
    const storeId = `whatsapp_${stackUserId}_slot${slot}`; // ID único por usuário e slot
    
    // Verifica se já existe entrada para este slot
    const existing = await prisma.userAPI.findFirst({
      where: {
        userId: dbUserId,
        type: 'whatsapp',
        storeId: storeId
      }
    }).catch(() => null);

    const name = connectedNumber 
      ? `WhatsApp ${connectedNumber}` 
      : `WhatsApp Slot ${slot}`;

    if (existing) {
      // Atualiza status e nome
      await prisma.userAPI.update({
        where: { id: existing.id },
        data: {
          status: 'connected',
          name: name,
          updatedAt: new Date()
        }
      }).catch(err => {
        logger.error(`Erro ao atualizar user_apis: ${err.message}`);
      });
      logger.info(`✓ Entrada user_apis atualizada para [${stackUserId}:${slot}]`);
    } else {
      // Cria nova entrada
      await prisma.userAPI.create({
        data: {
          userId: dbUserId,
          name: name,
          type: 'whatsapp',
          storeId: storeId,
          apiKey: '', // WhatsApp não usa apiKey
          baseUrl: '',
          status: 'connected'
        }
      }).catch(async (err) => {
        logger.error(`Erro ao criar user_apis (tentativa 1): ${err.message}`);
        // Tentar com query raw SQL se Prisma falhar
        try {
          await prisma.$executeRaw`
            INSERT INTO user_apis (id, "userId", name, type, "storeId", "apiKey", "baseUrl", status, "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), ${dbUserId}, ${name}, 'whatsapp', ${storeId}, '', '', 'connected', NOW(), NOW())
            ON CONFLICT DO NOTHING
          `;
          logger.success(`✓ Entrada criada via SQL raw para [${stackUserId}:${slot}]`);
        } catch (sqlErr) {
          logger.error(`Erro SQL raw: ${sqlErr.message}`);
          throw sqlErr;
        }
      });
      logger.success(`✓ Nova entrada criada em user_apis para [${stackUserId}:${slot}]`);
    }
  } catch (error) {
    logger.error(`Erro ao criar/atualizar user_apis [${stackUserId}:${slot}]:`, error);
    // Não lança erro para não quebrar o fluxo principal
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

