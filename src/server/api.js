import { startClient, stopClient, getClientStatus } from '../wpp/index.js';
import { UserModel, WhatsAppBotModel, BotSettingsModel } from '../db/models.js';
import logger from '../utils/logger.js';

/**
 * GET /api/status/:userId
 */
export async function getStatus(req, res) {
  try {
    const { userId } = req.params;
    const bots = await WhatsAppBotModel.findAllByUser(userId);

    const connections = await Promise.all(
      [1, 2].map(async (slot) => {
        const bot = bots.find(b => b.slot === slot);
        const clientStatus = await getClientStatus(userId, slot);

        return {
          slot,
          isConnected: bot?.isConnected || false,
          connectedNumber: bot?.connectedNumber || null,
          qrCode: bot?.qrCode || null,
          state: bot?.isConnected ? 'connected' : bot?.qrCode ? 'waiting_qr' : 'offline',
          isActive: clientStatus.isActive,
          updatedAt: bot?.updatedAt || null,
        };
      })
    );

    res.json({ success: true, userId, connections });

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
      return res.status(404).json({ 
        success: false, 
        message: 'QR Code não disponível',
        isConnected: bot.isConnected 
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

    // Valida slot
    if (isNaN(slotNumber) || slotNumber < 1 || slotNumber > 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slot inválido. Deve ser entre 1 e 10.' 
      });
    }

    // Garante que o usuário existe
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        // Se não existe, tenta criar com base no userId (assumindo que userId pode ser email)
        // Se userId não for email, cria um usuário básico
        const email = userId.includes('@') ? userId : `${userId}@temp.local`;
        await UserModel.findOrCreate(email, userId);
        logger.info(`Usuário criado automaticamente: ${userId}`);
      }
    } catch (error) {
      logger.error(`Erro ao validar/criar usuário [${userId}]:`, error);
      // Continua mesmo se houver erro na criação do usuário
    }

    // Inicia cliente (não bloqueia)
    const result = await startClient(userId, slotNumber);

    if (!result.success) {
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

    if (isNaN(slotNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Slot inválido' 
      });
    }

    const result = await stopClient(userId, slotNumber);

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
