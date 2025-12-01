import { startClient, stopClient, getClientStatus } from '../wpp/index.js';
import { WhatsAppBotModel, BotSettingsModel } from '../db/models.js';
import logger from '../utils/logger.js';

/**
 * Controllers da API REST
 */

/**
 * GET /api/status/:userId
 * Retorna status de todas as conexões do usuário
 */
export async function getStatus(req, res) {
  try {
    const { userId } = req.params;

    logger.info(`Buscando status para usuário: ${userId}`);

    // Busca todos os bots do usuário
    const bots = await WhatsAppBotModel.findAllByUser(userId);

    // Monta resposta com status de cada slot
    const connections = await Promise.all(
      [1, 2].map(async (slot) => {
        const bot = bots.find(b => b.slot === slot);
        const clientStatus = await getClientStatus(userId, slot);

        return {
          slot,
          isConnected: bot?.isConnected || false,
          connectedNumber: bot?.connectedNumber || null,
          qrCode: bot?.qrCode || null,
          state: bot?.isConnected 
            ? 'connected' 
            : bot?.qrCode 
              ? 'waiting_qr' 
              : 'offline',
          isActive: clientStatus.isActive,
          updatedAt: bot?.updatedAt || null
        };
      })
    );

    res.json({
      success: true,
      userId,
      connections
    });

  } catch (error) {
    logger.error('Erro ao buscar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar status',
      error: error.message
    });
  }
}

/**
 * GET /api/qr/:userId/:slot
 * Retorna QR Code base64
 */
export async function getQRCode(req, res) {
  try {
    const { userId, slot } = req.params;

    logger.info(`Buscando QR Code [${userId}:${slot}]`);

    const bot = await WhatsAppBotModel.findByUserAndSlot(userId, parseInt(slot));

    if (!bot || !bot.qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR Code não disponível'
      });
    }

    res.json({
      success: true,
      qrCode: bot.qrCode,
      slot: bot.slot,
      updatedAt: bot.updatedAt
    });

  } catch (error) {
    logger.error('Erro ao buscar QR Code:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar QR Code',
      error: error.message
    });
  }
}

/**
 * POST /api/start/:userId/:slot
 * Inicia conexão WPPConnect
 */
export async function startConnection(req, res) {
  try {
    const { userId, slot } = req.params;

    logger.info(`Iniciando conexão [${userId}:${slot}]`);

    // Inicia o cliente (não bloqueia - QR Code vem depois)
    const result = await startClient(userId, parseInt(slot));

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Se já está conectado, retorna imediatamente
    if (result.connectedNumber) {
      return res.json({
        success: true,
        message: result.message,
        connectedNumber: result.connectedNumber,
        qrCode: null,
        isConnected: true
      });
    }

    // Aguarda QR Code ser gerado (máximo 30 segundos)
    let qrCode = null;
    const maxWaitTime = 30000; // 30 segundos
    const checkInterval = 1000; // Verifica a cada 1 segundo
    const startTime = Date.now();

    while (!qrCode && (Date.now() - startTime) < maxWaitTime) {
      const bot = await WhatsAppBotModel.findByUserAndSlot(userId, parseInt(slot));
      if (bot && bot.qrCode) {
        qrCode = bot.qrCode;
        break;
      }
      // Aguarda antes de verificar novamente
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    // Retorna resposta com QR Code se disponível
    res.json({
      success: true,
      message: qrCode ? 'QR Code gerado com sucesso' : 'Conexão iniciada, aguardando QR Code...',
      qrCode: qrCode,
      connectedNumber: result.connectedNumber || null,
      isConnected: !!result.connectedNumber
    });

  } catch (error) {
    logger.error('Erro ao iniciar conexão:', error);
    
    // Tratar erro específico de browser já rodando
    if (error.message && error.message.includes('browser is already running')) {
      // Tenta buscar QR Code existente
      try {
        const bot = await WhatsAppBotModel.findByUserAndSlot(userId, parseInt(slot));
        if (bot && bot.qrCode) {
          return res.json({
            success: true,
            message: 'Conexão já está ativa, QR Code disponível',
            qrCode: bot.qrCode,
            connectedNumber: bot.connectedNumber || null,
            isConnected: bot.isConnected || false
          });
        }
      } catch (dbError) {
        logger.error('Erro ao buscar QR Code existente:', dbError);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Uma sessão já está rodando. Pare a sessão atual antes de iniciar uma nova.',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro ao iniciar conexão',
      error: error.message
    });
  }
}

/**
 * POST /api/stop/:userId/:slot
 * Para conexão WPPConnect
 */
export async function stopConnection(req, res) {
  try {
    const { userId, slot } = req.params;

    logger.info(`Parando conexão [${userId}:${slot}]`);

    const result = await stopClient(userId, parseInt(slot));

    res.json({
      success: result.success,
      message: result.message
    });

  } catch (error) {
    logger.error('Erro ao parar conexão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao parar conexão',
      error: error.message
    });
  }
}

/**
 * GET /api/settings/:userId
 * Busca configurações do bot
 */
export async function getSettings(req, res) {
  try {
    const { userId } = req.params;

    logger.info(`Buscando configurações para: ${userId}`);

    const settings = await BotSettingsModel.findByUser(userId);

    res.json({
      success: true,
      settings: {
        botName: settings.botName,
        storeType: settings.storeType,
        contextLimit: settings.contextLimit,
        lineLimit: settings.lineLimit,
        basePrompt: settings.basePrompt,
        isActive: settings.isActive,
        updatedAt: settings.updatedAt
      }
    });

  } catch (error) {
    logger.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar configurações',
      error: error.message
    });
  }
}

/**
 * POST /api/settings/:userId
 * Atualiza configurações do bot
 */
export async function updateSettings(req, res) {
  try {
    const { userId } = req.params;
    const {
      botName,
      storeType,
      contextLimit,
      lineLimit,
      basePrompt,
      isActive
    } = req.body;

    logger.info(`Atualizando configurações para: ${userId}`);

    // Validações
    const updates = {};
    
    if (botName !== undefined) updates.botName = botName;
    if (storeType !== undefined) updates.storeType = storeType;
    if (contextLimit !== undefined) {
      if (contextLimit < 1 || contextLimit > 50) {
        return res.status(400).json({
          success: false,
          message: 'contextLimit deve estar entre 1 e 50'
        });
      }
      updates.contextLimit = parseInt(contextLimit);
    }
    if (lineLimit !== undefined) {
      if (lineLimit < 1 || lineLimit > 20) {
        return res.status(400).json({
          success: false,
          message: 'lineLimit deve estar entre 1 e 20'
        });
      }
      updates.lineLimit = parseInt(lineLimit);
    }
    if (basePrompt !== undefined) updates.basePrompt = basePrompt;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const settings = await BotSettingsModel.update(userId, updates);

    logger.success(`✓ Configurações atualizadas para: ${userId}`);

    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      settings: {
        botName: settings.botName,
        storeType: settings.storeType,
        contextLimit: settings.contextLimit,
        lineLimit: settings.lineLimit,
        basePrompt: settings.basePrompt,
        isActive: settings.isActive,
        updatedAt: settings.updatedAt
      }
    });

  } catch (error) {
    logger.error('Erro ao atualizar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configurações',
      error: error.message
    });
  }
}

/**
 * GET /api/health
 * Health check
 */
export async function healthCheck(req, res) {
  try {
    res.json({
      success: true,
      status: 'online',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no health check'
    });
  }
}

