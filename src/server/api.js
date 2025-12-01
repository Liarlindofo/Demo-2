import { startClient, stopClient, getClientStatus } from '../wpp/index.js';
import { WhatsAppBotModel, BotSettingsModel } from '../db/models.js';
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
    const bot = await WhatsAppBotModel.findByUserAndSlot(userId, Number(slot));

    if (!bot?.qrCode) {
      return res.status(404).json({ success: false, message: 'QR Code não disponível' });
    }

    res.json({
      success: true,
      qrCode: bot.qrCode,
      slot: bot.slot,
      updatedAt: bot.updatedAt,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar QR Code', error: error.message });
  }
}

/**
 * POST /api/start/:userId/:slot
 * NÃO BLOQUEIA — retorna imediatamente
 */
export async function startConnection(req, res) {
  try {
    const { userId, slot } = req.params;

    const result = await startClient(userId, Number(slot));

    return res.json({
      success: true,
      message: result.message,
      isConnected: false,
      qrCode: null,
      connectedNumber: null,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao iniciar conexão', error: error.message });
  }
}

/**
 * POST /api/stop/:userId/:slot
 */
export async function stopConnection(req, res) {
  try {
    const { userId, slot } = req.params;

    const result = await stopClient(userId, Number(slot));

    res.json(result);

  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao parar conexão', error: error.message });
  }
}

/**
 * GET /api/settings/:userId
 */
export async function getSettings(req, res) {
  try {
    const settings = await BotSettingsModel.findByUser(req.params.userId);
    res.json({ success: true, settings });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar configurações' });
  }
}

/**
 * POST /api/settings/:userId
 */
export async function updateSettings(req, res) {
  try {
    const updates = { ...req.body };
    const settings = await BotSettingsModel.update(req.params.userId, updates);

    res.json({ success: true, message: 'Configurações atualizadas', settings });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar configurações' });
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
