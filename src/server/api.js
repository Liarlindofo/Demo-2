import { startClient, stopClient, getClientStatus } from '../wpp/index.js';
import { UserModel, WhatsAppBotModel, BotSettingsModel } from '../db/models.js';
import prisma from '../db/index.js';
import logger from '../utils/logger.js';

/**
 * GET /api/status/:userId
 */
export async function getStatus(req, res) {
  try {
    const { userId } = req.params;
    
    // Log para debug: verificar qual userId está sendo usado
    logger.info(`[getStatus] Buscando status para userId: ${userId}`);
    
    // Validar que o userId existe na tabela stack_users
    const stackUser = await prisma.stackUser.findUnique({
      where: { id: userId }
    });
    
    if (!stackUser) {
      logger.warn(`[getStatus] Usuário ${userId} não encontrado em stack_users`);
      return res.status(404).json({ 
        success: false, 
        message: `Usuário ${userId} não encontrado`,
        sessions: []
      });
    }
    
    logger.info(`[getStatus] Usuário encontrado: ${stackUser.id} (${stackUser.primaryEmail})`);
    
    const bots = await WhatsAppBotModel.findAllByUser(userId);

    const connections = await Promise.all(
      [1, 2, 3].map(async (slot) => {
        const bot = bots.find(b => b.slot === slot);
        const clientStatus = await getClientStatus(userId, slot);

        return {
          slot,
          isConnected: (bot && bot.isConnected) || false,
          connectedNumber: (bot && bot.connectedNumber) || null,
          qrCode: (bot && bot.qrCode) || null,
          state: (bot && bot.isConnected) ? 'connected' : (bot && bot.qrCode) ? 'waiting_qr' : (clientStatus.isActive ? 'connecting' : 'offline'),
          isActive: clientStatus.isActive,
          updatedAt: (bot && bot.updatedAt) || null,
        };
      })
    );

    // Compatibilidade com o frontend: devolver também "sessions" no formato esperado
    const sessions = connections.map((c) => {
      let status = 'DISCONNECTED';
      if (c.isActive) {
        if (c.isConnected) status = 'CONNECTED';
        else if (c.qrCode) status = 'QRCODE';
        else status = 'CONNECTING';
      }
      return {
        slot: c.slot,
        status,
        qrCode: c.qrCode || null,
        isActive: c.isActive,
        connectedNumber: c.connectedNumber || null,
        updatedAt: c.updatedAt || null,
      };
    });

    res.json({ success: true, userId, connections, sessions });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar status', error: error.message });
  }
}

/**
 * GET /api/qr/:userId/:slot
 */
export async function getQRCode(req, res) {
  try {
    const { userId, slot } = req.params;
    const slotNumber = Number(slot);

    if (isNaN(slotNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slot inválido' 
      });
    }

    const bot = await WhatsAppBotModel.findByUserAndSlot(userId, slotNumber);

    if (!bot) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bot não encontrado' 
      });
    }

    if (!bot.qrCode) {
      // Não retornar 404 enquanto o QR ainda não foi gerado
      // Evita erro imediato no frontend e permite polling suave
      return res.json({
        success: true,
        qrCode: null,
        slot: bot.slot,
        isConnected: bot.isConnected,
        updatedAt: bot.updatedAt,
        message: 'Aguardando geração do QR Code'
      });
    }

    res.json({
      success: true,
      qrCode: bot.qrCode,
      slot: bot.slot,
      updatedAt: bot.updatedAt,
    });

  } catch (error) {
    logger.error('Erro em getQRCode:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar QR Code', 
      error: error.message 
    });
  }
}

/**
 * POST /api/start/:userId/:slot
 * NÃO BLOQUEIA — retorna imediatamente
 */
export async function startConnection(req, res) {
  try {
    const { userId, slot } = req.params;
    const slotNumber = Number(slot);

    // LOG DE DEBUG - ISOLAMENTO
    console.log('=== 🔍 DEBUG START CONNECTION ===');
    console.log('📌 userId da URL:', userId);
    console.log('📌 userId type:', typeof userId);
    console.log('📌 userId length:', userId?.length);
    console.log('📌 slot:', slotNumber);
    console.log('📌 URL completa:', req.url);
    console.log('📌 Timestamp:', new Date().toISOString());
    console.log('=================================');

    // Log para debug: verificar qual userId está sendo usado
    logger.info(`[startConnection] Iniciando sessão para userId: ${userId}, slot: ${slotNumber}`);

    // Valida slot
    if (isNaN(slotNumber) || slotNumber < 1 || slotNumber > 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slot inválido. Deve ser entre 1 e 10.' 
      });
    }

    // Valida que o usuário existe na tabela stack_users
    let user;
    try {
      user = await prisma.stackUser.findUnique({
        where: { id: userId }
      });

      if (!user) {
        logger.warn(`[startConnection] Usuário ${userId} não encontrado em stack_users`);
        return res.status(400).json({
          success: false,
          message: `Usuário ${userId} não encontrado na tabela stack_users`
        });
      }
      
      logger.info(`[startConnection] Usuário validado: ${user.id} (${user.primaryEmail})`);
    } catch (error) {
      logger.error(`Erro ao validar usuário [${userId}]:`, error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao validar usuário',
        error: error.message
      });
    }

    // Garantir que estamos usando o ID completo do stack_users (não truncado)
    const actualUserId = user.id;
    
    // CRÍTICO: Validar que o userId recebido corresponde ao stackUser.id
    if (actualUserId !== userId) {
      logger.warn(`[startConnection] ID mismatch! Recebido: ${userId}, Correto: ${actualUserId}`);
      logger.warn(`[startConnection] Usando ID correto do banco: ${actualUserId}`);
      // Usar o ID correto do banco
      userId = actualUserId;
    }

    // VALIDAÇÃO ADICIONAL: Garantir que o userId não está vazio ou undefined
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      logger.error(`[startConnection] userId inválido: ${userId}`);
      return res.status(400).json({
        success: false,
        message: 'userId inválido ou vazio'
      });
    }

    // LOG FINAL: Confirmar qual userId será usado
    logger.info(`[startConnection] ✅ Usando userId final: ${userId} (tipo: ${typeof userId}, tamanho: ${userId.length})`);

    // Inicia cliente (não bloqueia)
    const result = await startClient(userId, slotNumber);

    if (!result.success) {
      // Se o cliente já está ativo, não trate como erro — permita o frontend continuar
      if ((result.message || '').toLowerCase().includes('cliente já está ativo')) {
        const bot = await WhatsAppBotModel.findByUserAndSlot(userId, slotNumber).catch(() => null);
        return res.json({
          success: true,
          message: result.message,
          isConnected: bot?.isConnected || false,
          qrCode: bot?.qrCode || null,
        });
      }
      return res.status(400).json(result);
    }

    return res.json({
      success: true,
      message: result.message || 'Sessão iniciada, aguardando QR.',
      isConnected: false,
    });

  } catch (error) {
    logger.error('Erro em startConnection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao iniciar conexão', 
      error: error.message 
    });
  }
}

/**
 * POST /api/stop/:userId/:slot
 */
export async function stopConnection(req, res) {
  try {
    const { userId, slot } = req.params;
    const slotNumber = Number(slot);

    // Log para debug: verificar qual userId está sendo usado
    logger.info(`[stopConnection] Parando sessão para userId: ${userId}, slot: ${slotNumber}`);

    if (isNaN(slotNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slot inválido' 
      });
    }

    // Validar que o usuário existe na tabela stack_users
    const stackUser = await prisma.stackUser.findUnique({
      where: { id: userId }
    });

    if (!stackUser) {
      logger.warn(`[stopConnection] Usuário ${userId} não encontrado em stack_users`);
      return res.status(404).json({
        success: false,
        message: `Usuário ${userId} não encontrado na tabela stack_users`
      });
    }

    logger.info(`[stopConnection] Usuário validado: ${stackUser.id} (${stackUser.primaryEmail})`);

    // Garantir que estamos usando o ID completo do stack_users (não truncado)
    const actualUserId = stackUser.id;
    
    // Normalizar userId (remover espaços, garantir consistência)
    let normalizedUserId = String(actualUserId).trim();
    
    if (normalizedUserId !== userId.trim()) {
      logger.warn(`[stopConnection] ID mismatch! Recebido: "${userId}", Correto: "${normalizedUserId}"`);
    }
    
    // Usar sempre o ID normalizado do banco
    logger.info(`[stopConnection] ✅ Usando userId normalizado: "${normalizedUserId}" para parar slot ${slotNumber}`);

    const result = await stopClient(normalizedUserId, slotNumber);

    res.json(result);

  } catch (error) {
    logger.error('Erro em stopConnection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao parar conexão', 
      error: error.message 
    });
  }
}

/**
 * GET /api/settings/:userId
 */
export async function getSettings(req, res) {
  try {
    const { userId } = req.params;
    const settings = await BotSettingsModel.findByUser(userId);
    res.json({ success: true, settings });

  } catch (error) {
    logger.error('Erro em getSettings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar configurações',
      error: error.message 
    });
  }
}

/**
 * POST /api/settings/:userId
 */
export async function updateSettings(req, res) {
  try {
    const { userId } = req.params;
    const updates = { ...req.body };
    
    // Remove campos que não devem ser atualizados diretamente
    delete updates.userId;
    delete updates.id;
    delete updates.createdAt;
    delete updates.updatedAt;
    
    const settings = await BotSettingsModel.update(userId, updates);

    res.json({ 
      success: true, 
      message: 'Configurações atualizadas', 
      settings 
    });

  } catch (error) {
    logger.error('Erro em updateSettings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar configurações',
      error: error.message 
    });
  }
}

/**
 * GET /api/health
 */
export async function healthCheck(req, res) {
  res.json({
    success: true,
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
