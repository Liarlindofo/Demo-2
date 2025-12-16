import express from 'express';
import prisma from '../db/index.js';

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

    // Busca bot no banco (slot fixo = 1)
    const bot = await prisma.whatsAppBot.findFirst({
      where: {
        userId: normalizedUserId,
        slot: 1
      }
    });

    // Se não encontrou bot, retorna not_found
    if (!bot) {
      return res.json({
        exists: false,
        isConnected: false,
        status: 'not_found'
      });
    }

    // Bot encontrado - retorna status completo
    return res.json({
      exists: true,
      isConnected: bot.isConnected || false,
      status: bot.isConnected ? 'connected' : (bot.qrCode ? 'waiting_qr' : 'disconnected'),
      connectedNumber: bot.connectedNumber || null,
      qrCode: bot.qrCode || null
    });

  } catch (error) {
    // Em caso de erro, retorna resposta segura para não quebrar o frontend
    console.error('[status.routes] Erro ao buscar status:', error);
    return res.json({
      exists: false,
      isConnected: false,
      status: 'not_found'
    });
  }
});

export default router;
