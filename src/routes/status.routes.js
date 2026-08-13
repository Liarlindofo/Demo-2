import express from 'express';
import { WhatsAppBotModel } from '../db/models.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /status/:userId
 * Retorna o status do bot WhatsApp para um usuário específico
 * Slot fixo = 1 (apenas uma sessão por usuário)
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validação básica do userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return res.json({
        exists: false,
        isConnected: false,
        status: 'not_found'
      });
    }

    const normalizedUserId = userId.trim();
    const slot = 1; // Slot fixo

    // Busca bot no banco usando o Model (mais seguro que acesso direto ao Prisma)
    let bot;
    try {
      bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, slot);
    } catch (dbError) {
      logger.error('[status.routes] Erro ao buscar bot no banco:', dbError);
      // Retorna not_found em caso de erro de banco
      bot = null;
    }

    // Se não encontrou bot, retorna not_found
    if (!bot) {
      return res.json({
        exists: false,
        isConnected: false,
        status: 'not_found',
        success: true,
        userId: normalizedUserId,
        session: {
          status: 'DISCONNECTED',
          qrCode: null,
          isActive: false,
          isConnected: false,
          connectedNumber: null,
          updatedAt: null,
        },
      });
    }

    // Bot encontrado - retorna status completo (+ session no formato do frontend)
    const isConnected = bot.isConnected || false;
    const qrCode = bot.qrCode || null;
    let sessionStatus = 'DISCONNECTED';
    if (isConnected) sessionStatus = 'CONNECTED';
    else if (qrCode) sessionStatus = 'QRCODE';
    else sessionStatus = 'CONNECTING';

    return res.json({
      exists: true,
      isConnected,
      status: isConnected ? 'connected' : (qrCode ? 'waiting_qr' : 'disconnected'),
      connectedNumber: bot.connectedNumber || null,
      qrCode,
      success: true,
      userId: normalizedUserId,
      session: {
        status: sessionStatus,
        qrCode,
        isActive: true,
        isConnected,
        connectedNumber: bot.connectedNumber || null,
        updatedAt: bot.updatedAt ? bot.updatedAt.toISOString() : null,
      },
    });

  } catch (error) {
    // Em caso de erro, retorna resposta segura para não quebrar o frontend
    logger.error('[status.routes] Erro inesperado ao buscar status:', error);
    return res.json({
      exists: false,
      isConnected: false,
      status: 'not_found'
    });
  }
});

export default router;
