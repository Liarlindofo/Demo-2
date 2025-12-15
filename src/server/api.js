import { UserModel, WhatsAppBotModel, BotSettingsModel } from '../db/models.js';
import prisma from '../db/index.js';
import logger from '../utils/logger.js';
import { startWhatsappWorker, stopWhatsappWorker } from '../services/pm2.service.js';

/**
 * GET /api/status/:userId
 * SLOT FIXO = 1 (apenas uma sessão por usuário)
 */
export async function getStatus(req, res) {
  try {
    const { userId } = req.params;
    // SLOT FIXO: sempre 1
    const slot = 1;

    // VALIDAÇÃO CRÍTICA
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      logger.error(`[getStatus] userId inválido recebido: ${userId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'userId inválido',
        session: null
      });
    }

    const normalizedUserId = String(userId).trim();

    // LOG DETALHADO para rastreamento
    logger.info(`[getStatus] ==========================================`);
    logger.info(`[getStatus] Buscando status WhatsApp`);
    logger.info(`[getStatus] userId original: "${userId}"`);
    logger.info(`[getStatus] userId normalizado: "${normalizedUserId}"`);
    logger.info(`[getStatus] ==========================================`);
    
    // Validar que o userId existe na tabela stack_users
    const stackUser = await prisma.stackUser.findUnique({
      where: { id: normalizedUserId }
    });
    
    if (!stackUser) {
      logger.warn(`[getStatus] Usuário ${normalizedUserId} não encontrado em stack_users`);
      return res.status(404).json({ 
        success: false, 
        message: `Usuário ${normalizedUserId} não encontrado`,
        session: null
      });
    }
    
    logger.info(`[getStatus] ✅ Usuário encontrado: ${stackUser.id} (${stackUser.primaryEmail})`);
    
    // Buscar apenas a sessão do slot 1 - USAR normalizedUserId
    const bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, slot);

    // Sem acesso direto ao WPPConnect neste processo,
    // o estado vem exclusivamente do banco (whatsapp_bots)
    const isActive = !!bot;
    const isConnected = !!(bot && bot.isConnected);

    const connection = {
      isConnected,
      connectedNumber: (bot && bot.connectedNumber) || null,
      qrCode: (bot && bot.qrCode) || null,
      state: isConnected
        ? 'connected'
        : (bot && bot.qrCode)
          ? 'waiting_qr'
          : isActive
            ? 'connecting'
            : 'offline',
      isActive,
      updatedAt: (bot && bot.updatedAt) || null,
    };

    // Formato simplificado: apenas uma sessão
    let status = 'DISCONNECTED';
    if (connection.isActive) {
      if (connection.isConnected) status = 'CONNECTED';
      else if (connection.qrCode) status = 'QRCODE';
      else status = 'CONNECTING';
    }

    const session = {
      status,
      qrCode: connection.qrCode || null,
      isActive: connection.isActive,
      isConnected: connection.isConnected,
      connectedNumber: connection.connectedNumber || null,
      updatedAt: connection.updatedAt || null,
    };

    res.json({ success: true, userId: normalizedUserId, connection, session });

  } catch (error) {
    logger.error(`[getStatus] ❌ Erro ao buscar status para userId: ${req.params.userId}:`, error);
    res.status(500).json({ success: false, message: 'Erro ao buscar status', error: error.message });
  }
}

/**
 * GET /api/qr/:userId
 * SLOT FIXO = 1 (apenas uma sessão por usuário)
 */
export async function getQRCode(req, res) {
  try {
    const { userId } = req.params;
    // SLOT FIXO: sempre 1
    const slot = 1;

    // VALIDAÇÃO CRÍTICA
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      logger.error(`[getQRCode] userId inválido recebido: ${userId}`);
      return res.status(400).json({ 
        success: false, 
        qrCode: null,
        message: 'userId inválido'
      });
    }

    const normalizedUserId = String(userId).trim();

    logger.info(`[getQRCode] Buscando QR Code para userId: "${normalizedUserId}"`);

    const bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, slot);

    if (!bot) {
      // Com a nova arquitetura com workers isolados,
      // é possível que o worker ainda esteja subindo ou que o banco tenha sido limpo.
      // Neste caso, NÃO devemos retornar erro para o frontend, apenas indicar que
      // ainda não há QR disponível.
      return res.json({
        success: true,
        qrCode: null,
        slot,
        isConnected: false,
        updatedAt: null,
        message: 'Bot ainda não iniciado ou aguardando geração do QR Code',
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
 * POST /api/start/:userId
 * SLOT FIXO = 1 (apenas uma sessão por usuário)
 * NÃO BLOQUEIA — retorna imediatamente
 */
export async function startConnection(req, res) {
  try {
    const { userId } = req.params;

    // VALIDAÇÃO CRÍTICA: Garantir que userId é válido
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      logger.error(`[startConnection] userId inválido recebido: ${userId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'userId inválido',
        error: `userId inválido: ${userId}`
      });
    }

    const normalizedUserId = String(userId).trim();

    // LOG DETALHADO para rastreamento
    logger.info(`[startConnection] ==========================================`);
    logger.info(`[startConnection] Iniciando worker WhatsApp`);
    logger.info(`[startConnection] userId original: "${userId}"`);
    logger.info(`[startConnection] userId normalizado: "${normalizedUserId}"`);
    logger.info(`[startConnection] userId type: ${typeof normalizedUserId}`);
    logger.info(`[startConnection] userId length: ${normalizedUserId.length}`);
    logger.info(`[startConnection] ==========================================`);

    const result = await startWhatsappWorker(normalizedUserId);

    logger.info(`[startConnection] ✅ Worker iniciado com sucesso para userId: "${normalizedUserId}"`);

    return res.json(result);

  } catch (error) {
    logger.error(`[startConnection] ❌ Erro ao iniciar conexão para userId: ${req.params.userId}:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao iniciar conexão', 
      error: error.message 
    });
  }
}

/**
 * POST /api/stop/:userId
 * SLOT FIXO = 1 (apenas uma sessão por usuário)
 */
export async function stopConnection(req, res) {
  try {
    const { userId } = req.params;
    // SLOT FIXO: sempre 1
    const slot = 1;

    // VALIDAÇÃO CRÍTICA
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      logger.error(`[stopConnection] userId inválido recebido: ${userId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'userId inválido'
      });
    }

    const normalizedUserId = String(userId).trim();

    logger.info(`[stopConnection] ==========================================`);
    logger.info(`[stopConnection] Parando worker WhatsApp`);
    logger.info(`[stopConnection] userId original: "${userId}"`);
    logger.info(`[stopConnection] userId normalizado: "${normalizedUserId}"`);
    logger.info(`[stopConnection] ==========================================`);

    await stopWhatsappWorker(normalizedUserId);

    // Além de parar o processo PM2, o banco precisa refletir o estado "desconectado"
    // para que o frontend não veja o usuário como ainda conectado.
    try {
      await WhatsAppBotModel.setDisconnected(normalizedUserId, slot);
      logger.info(`[stopConnection] ✅ Bot marcado como desconectado no banco para [${normalizedUserId}:${slot}]`);
    } catch (dbError) {
      // Não falhar a requisição por erro de banco aqui, apenas logar.
      logger.error(`[stopConnection] Erro ao marcar bot como desconectado para [${normalizedUserId}:${slot}]:`, dbError);
    }

    logger.info(`[stopConnection] ✅ Worker parado com sucesso para userId: "${normalizedUserId}"`);

    res.json({ success: true });

  } catch (error) {
    logger.error(`[stopConnection] ❌ Erro ao parar conexão para userId: ${req.params.userId}:`, error);
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
