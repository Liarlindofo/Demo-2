import { UserModel, WhatsAppBotModel, BotSettingsModel } from '../db/models.js';
import prisma from '../db/index.js';
import logger from '../utils/logger.js';
import { startWhatsappWorker, stopWhatsappWorker } from '../services/pm2.service.js';
import { stopClient } from '../wpp/index.js';
import config from '../../config.js';
import * as path from 'path';
import * as fs from 'fs';

/**
 * GET /api/status/:userId
 * SLOT FIXO = 1 (apenas uma sessão por usuário)
 */
export async function getStatus(req, res) {
  let normalizedUserId = null;
  
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
        session: null,
        connection: null
      });
    }

    normalizedUserId = String(userId).trim();

    // LOG DETALHADO para rastreamento (reduzido para não poluir logs)
    logger.info(`[getStatus] Buscando status para userId: "${normalizedUserId}"`);
    
    // Validar que o userId existe na tabela stack_users
    let stackUser;
    try {
      stackUser = await prisma.stackUser.findUnique({
        where: { id: normalizedUserId }
      });
    } catch (dbError) {
      logger.error(`[getStatus] Erro ao buscar usuário no banco:`, dbError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao buscar usuário no banco de dados',
        error: dbError.message,
        session: null,
        connection: null
      });
    }
    
    if (!stackUser) {
      logger.warn(`[getStatus] Usuário ${normalizedUserId} não encontrado em stack_users`);
      // Retornar status vazio ao invés de 404 para não quebrar o frontend
      return res.json({ 
        success: true, 
        userId: normalizedUserId,
        message: `Usuário ${normalizedUserId} não encontrado`,
        session: {
          status: 'DISCONNECTED',
          qrCode: null,
          isActive: false,
          isConnected: false,
          connectedNumber: null,
          updatedAt: null,
        },
        connection: {
          isConnected: false,
          connectedNumber: null,
          qrCode: null,
          state: 'offline',
          isActive: false,
          updatedAt: null,
        }
      });
    }
    
    logger.info(`[getStatus] ✅ Usuário encontrado: ${stackUser.id} (${stackUser.primaryEmail})`);
    
    // Buscar apenas a sessão do slot 1 - USAR normalizedUserId
    let bot;
    try {
      bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, slot);
    } catch (botError) {
      logger.error(`[getStatus] Erro ao buscar bot no banco:`, botError);
      // Retornar status vazio ao invés de erro para não quebrar o frontend
      bot = null;
    }

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
      updatedAt: (bot && bot.updatedAt) ? bot.updatedAt.toISOString() : null,
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
      updatedAt: connection.updatedAt,
    };

    return res.json({ 
      success: true, 
      userId: normalizedUserId, 
      connection, 
      session 
    });

  } catch (error) {
    logger.error(`[getStatus] ❌ Erro inesperado ao buscar status para userId: ${req.params?.userId || 'unknown'}:`, error);
    logger.error(`[getStatus] Stack trace:`, error.stack);
    
    // Sempre retornar uma resposta válida, mesmo em caso de erro
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar status', 
      error: error.message || 'Erro desconhecido',
      userId: normalizedUserId || req.params?.userId || null,
      session: {
        status: 'DISCONNECTED',
        qrCode: null,
        isActive: false,
        isConnected: false,
        connectedNumber: null,
        updatedAt: null,
      },
      connection: {
        isConnected: false,
        connectedNumber: null,
        qrCode: null,
        state: 'offline',
        isActive: false,
        updatedAt: null,
      }
    });
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

    let bot;
    try {
      bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, slot);
    } catch (dbError) {
      logger.error(`[getQRCode] Erro ao buscar bot no banco:`, dbError);
      // Retornar resposta válida mesmo com erro
      return res.json({
        success: true,
        qrCode: null,
        slot,
        isConnected: false,
        updatedAt: null,
        message: 'Erro ao buscar dados do bot',
      });
    }

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
        isConnected: bot.isConnected || false,
        updatedAt: bot.updatedAt ? bot.updatedAt.toISOString() : null,
        message: 'Aguardando geração do QR Code'
      });
    }

    return res.json({
      success: true,
      qrCode: bot.qrCode,
      slot: bot.slot,
      updatedAt: bot.updatedAt ? bot.updatedAt.toISOString() : null,
    });

  } catch (error) {
    logger.error(`[getQRCode] ❌ Erro inesperado:`, error);
    logger.error(`[getQRCode] Stack trace:`, error.stack);
    // Sempre retornar resposta válida
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar QR Code', 
      error: error.message || 'Erro desconhecido',
      qrCode: null,
      slot: 1,
      updatedAt: null
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
    const slot = 1; // SLOT FIXO
    const force =
      String(req.query?.force || '').toLowerCase() === '1' ||
      String(req.query?.force || '').toLowerCase() === 'true';

    // LOG DETALHADO para rastreamento
    logger.info(`[startConnection] ==========================================`);
    logger.info(`[startConnection] Iniciando worker WhatsApp`);
    logger.info(`[startConnection] userId original: "${userId}"`);
    logger.info(`[startConnection] userId normalizado: "${normalizedUserId}"`);
    logger.info(`[startConnection] userId type: ${typeof normalizedUserId}`);
    logger.info(`[startConnection] userId length: ${normalizedUserId.length}`);
    logger.info(`[startConnection] ==========================================`);

    // IMPORTANTE (anti-bug): NÃO parar o worker por padrão.
    // Se o usuário clicar 2x ou abrir 2 abas, parar/recriar no meio do pareamento
    // costuma causar "conectando..." e falha ao ler o QR.
    //
    // Para "resetar" e forçar novo QR, usar:
    //   POST /api/start/:userId?force=1
    if (force) {
      logger.info(`[startConnection] 🧨 force=1: resetando sessão (parar worker + limpar banco) para userId: "${normalizedUserId}"...`);
      try {
        await stopWhatsappWorker(normalizedUserId);
      } catch (stopError) {
        logger.warn(`[startConnection] ⚠️ force=1: erro ao parar worker (seguindo): ${stopError.message}`);
      }

      try {
        await WhatsAppBotModel.clearSession(normalizedUserId, slot);
      } catch (dbError) {
        logger.warn(`[startConnection] ⚠️ force=1: erro ao limpar sessão no banco (seguindo): ${dbError.message}`);
      }

      // Aguardar um pouco para garantir que processos foram encerrados
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

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
    const forget =
      String(req.query?.forget || '').toLowerCase() === '1' ||
      String(req.query?.forget || '').toLowerCase() === 'true';

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
    logger.info(`[stopConnection] Parando sessão WhatsApp`);
    logger.info(`[stopConnection] userId original: "${userId}"`);
    logger.info(`[stopConnection] userId normalizado: "${normalizedUserId}"`);
    logger.info(`[stopConnection] ==========================================`);

    // IMPORTANTE: Fechar client ANTES de parar o worker
    // Isso garante cleanup correto e evita processos órfãos
    logger.info(`[stopConnection] 1️⃣ Fechando client WPPConnect...`);
    try {
      const stopResult = await stopClient(normalizedUserId, slot);
      if (stopResult.success) {
        logger.success(`[stopConnection] ✅ Client fechado com sucesso`);
      } else {
        logger.warn(`[stopConnection] ⚠️ Client não estava ativo ou erro ao fechar: ${stopResult.message}`);
      }
    } catch (clientError) {
      logger.warn(`[stopConnection] ⚠️ Erro ao fechar client (continuando): ${clientError.message}`);
    }

    // Agora para o worker PM2
    logger.info(`[stopConnection] 2️⃣ Parando worker PM2...`);
    await stopWhatsappWorker(normalizedUserId);

    // Além de parar o processo PM2, o banco precisa refletir o estado "desconectado"
    // para que o frontend não veja o usuário como ainda conectado.
    try {
      // Se o usuário está desconectando, geralmente ele quer "esquecer" a sessão.
      // Isso também evita que ao clicar em "Gerar QR Code" ele reconecte direto.
      if (forget) {
        await WhatsAppBotModel.clearSession(normalizedUserId, slot);
        logger.info(`[stopConnection] ✅ (forget=1) Sessão limpa no banco para [${normalizedUserId}:${slot}]`);
      } else {
        await WhatsAppBotModel.setDisconnected(normalizedUserId, slot);
        logger.info(`[stopConnection] ✅ Bot marcado como desconectado no banco para [${normalizedUserId}:${slot}]`);
      }
    } catch (dbError) {
      // Não falhar a requisição por erro de banco aqui, apenas logar.
      logger.error(`[stopConnection] Erro ao marcar bot como desconectado para [${normalizedUserId}:${slot}]:`, dbError);
    }

    // (forget=1) também remove os arquivos de sessão/token no disco
    // para forçar novo QR na próxima conexão (troca de número).
    if (forget) {
      try {
        const baseSessionsDir =
          (config.wppConnect && config.wppConnect.sessionsDir) || '/var/www/whatsapp-sessions';
        const sanitizedUserId = normalizedUserId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const sessionName = `whatsapp_${sanitizedUserId}`;
        const userSessionDir = path.join(baseSessionsDir, sessionName);

        if (fs.existsSync(userSessionDir)) {
          logger.warn(`[stopConnection] (forget=1) 🗑️ Deletando diretório de sessão: ${userSessionDir}`);
          fs.rmSync(userSessionDir, { recursive: true, force: true });
        }
      } catch (fsError) {
        logger.warn(`[stopConnection] (forget=1) ⚠️ Erro ao deletar diretório de sessão: ${fsError.message}`);
      }
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
