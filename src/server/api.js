import { UserModel, WhatsAppBotModel, BotSettingsModel } from '../db/models.js';
import prisma from '../db/index.js';
import logger from '../utils/logger.js';
import {
  startWhatsappWorker,
  stopWhatsappWorker,
  startSendOnlyWorker,
  stopSendOnlyWorker,
  startSessionWorker,
  stopSessionWorker,
  sendWorkerPort,
} from '../services/pm2.service.js';
import { stopClient, sendMessage, listGroups, SLOT_SOMENTE_ENVIO } from '../wpp/index.js';
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

// ─── Sessão SOMENTE-ENVIO (slot 2 por padrão — não mexe no bot de atendimento) ─

function resolveAnySlot(req, fallback = 1) {
  const raw = req.query?.slot ?? req.body?.slot ?? fallback;
  const slot = parseInt(String(raw), 10);
  return Number.isFinite(slot) && slot >= 1 ? slot : fallback;
}

function resolveSendOnlySlot(req) {
  return resolveAnySlot(req, SLOT_SOMENTE_ENVIO);
}

/**
 * POST /api/send-only/:userId/start
 * Sobe worker PM2 separado com mode=somente-envio (sem listener do bot).
 * Query: ?slot=2 (default 2)  ?force=1 para resetar
 */
export async function startSendOnlyConnection(req, res) {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'userId inválido' });
    }

    const normalizedUserId = userId.trim();
    const slot = resolveSendOnlySlot(req);
    const force =
      String(req.query?.force || '').toLowerCase() === '1' ||
      String(req.query?.force || '').toLowerCase() === 'true';

    if (force) {
      await stopSendOnlyWorker(normalizedUserId, slot).catch(() => {});
      await WhatsAppBotModel.clearSession(normalizedUserId, slot).catch(() => {});
      await new Promise((r) => setTimeout(r, 1500));
    }

    const result = await startSendOnlyWorker(normalizedUserId, slot);
    return res.json({
      ...result,
      mode: 'somente-envio',
      message:
        result.message ||
        'Worker somente-envio iniciado. Escaneie o QR via GET /api/send-only/:userId/qr ou veja o ASCII no log do PM2.',
    });
  } catch (error) {
    logger.error('[startSendOnlyConnection]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/send-only/:userId/status
 * Status da sessão somente-envio (mesmo formato de /api/status, slot 2+).
 */
export async function getSendOnlyStatus(req, res) {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'userId inválido', session: null });
    }

    const normalizedUserId = userId.trim();
    const slot = resolveSendOnlySlot(req);
    const bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, slot);

    const isActive = !!bot;
    const isConnected = !!(bot && bot.isConnected);
    const qrCode = (bot && bot.qrCode) || null;

    let status = 'DISCONNECTED';
    if (isActive) {
      if (isConnected) status = 'CONNECTED';
      else if (qrCode) status = 'QRCODE';
      else status = 'CONNECTING';
    }

    return res.json({
      success: true,
      userId: normalizedUserId,
      slot,
      mode: 'somente-envio',
      session: {
        status,
        qrCode,
        isActive,
        isConnected,
        connectedNumber: (bot && bot.connectedNumber) || null,
        updatedAt: bot?.updatedAt ? bot.updatedAt.toISOString() : null,
      },
    });
  } catch (error) {
    logger.error('[getSendOnlyStatus]', error);
    return res.status(500).json({
      success: false,
      message: error.message,
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
}

/**
 * GET /api/send-only/:userId/qr
 * Retorna o QR (base64) da sessão somente-envio.
 */
export async function getSendOnlyQRCode(req, res) {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ success: false, qrCode: null, message: 'userId inválido' });
    }

    const normalizedUserId = userId.trim();
    const slot = resolveSendOnlySlot(req);
    const bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, slot);

    if (!bot) {
      return res.json({
        success: true,
        qrCode: null,
        slot,
        mode: 'somente-envio',
        isConnected: false,
        message: 'Sessão ainda não iniciada ou aguardando QR',
      });
    }

    return res.json({
      success: true,
      qrCode: bot.qrCode || null,
      slot: bot.slot,
      mode: bot.sessionJson?.mode || 'somente-envio',
      isConnected: bot.isConnected || false,
      connectedNumber: bot.connectedNumber || null,
      updatedAt: bot.updatedAt ? bot.updatedAt.toISOString() : null,
      message: bot.qrCode
        ? undefined
        : bot.isConnected
          ? 'Já conectado'
          : 'Aguardando geração do QR Code',
    });
  } catch (error) {
    logger.error('[getSendOnlyQRCode]', error);
    return res.status(500).json({ success: false, qrCode: null, message: error.message });
  }
}

/**
 * GET /api/send-only/:userId/groups
 * Lista grupos que a sessão somente-envio enxerga (somente leitura).
 * Só retorna grupos em que o número conectado já é participante.
 */
export async function getSendOnlyGroups(req, res) {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'userId inválido', groups: [] });
    }

    const normalizedUserId = userId.trim();
    const slot = resolveSendOnlySlot(req);

    // 1) Mesmo processo (script CLI / API com client local)
    const local = await listGroups(normalizedUserId, slot);
    if (local.success) {
      return res.json(local);
    }

    // 2) Proxy pro mini-HTTP do worker PM2
    const port = sendWorkerPort(slot);
    try {
      const proxyRes = await fetch(`http://127.0.0.1:${port}/groups`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const data = await proxyRes.json().catch(() => ({}));
      return res.status(proxyRes.status).json(data);
    } catch (proxyErr) {
      return res.status(503).json({
        success: false,
        groups: [],
        message:
          local.error ||
          'Sessão somente-envio não acessível. Confirme POST /api/send-only/:userId/start e que o worker está online.',
        detail: proxyErr.message,
        note:
          'Só aparecem grupos em que o número de Relatórios já participa. ' +
          'Adicione esse número no grupo desejado antes de consultar.',
        slot,
      });
    }
  } catch (error) {
    logger.error('[getSendOnlyGroups]', error);
    return res.status(500).json({ success: false, groups: [], message: error.message });
  }
}

/**
 * POST /api/send-only/:userId/send
 * Body: { to: "5541...", message: "texto", slot?: 2 }
 *
 * NOTA: o client vive no processo do worker PM2. Esta rota só funciona se
 * sendMessage for chamado DENTRO do worker — na arquitetura atual o client
 * não está na memória da API. Por isso preferimos proxy via worker HTTP
 * interno OU documentar uso do script.
 *
 * Implementação prática: gravamos um "pedido" não é ideal.
 * Melhor: expor send no mesmo processo do worker via IPC é complexo.
 *
 * Solução adotada: a API tenta sendMessage no processo atual (funciona se
 * a sessão foi iniciada no mesmo processo). Caso contrário retorna instrução
 * para usar o script CLI `scripts/wpp-send-only-send.js` OU reiniciamos
 * orientando que o envio deve ser feito via endpoint no worker.
 *
 * Alternativa rápida e robusta: worker também sobe um mini HTTP local.
 * Por simplicidade, usamos o client se estiver no mesmo process; senão
 * falhamos com mensagem clara.
 *
 * ATUALIZAÇÃO: na VPS o client está no worker. Vamos usar uma abordagem
 * onde o script CLI e um helper no worker resolvem. Para a API da platefull-api,
 * documentamos que send via HTTP precisa do client no mesmo processo.
 *
 * Melhor fix: iniciar sessão somente-envio DENTRO da API (sem PM2) para
 * send-only — mais simples para o caso de uso "só enviar". Mas browser
 * no processo da API é pesado.
 *
 * Pragmático: manter worker PM2 + para send, usar `pm2 send` não existe.
 * Exportar função e um segundo mini-server no worker? Overkill.
 *
 * Solução escolhida: criar `workers/whatsapp-send-worker.js` que além de
 * startClient, escuta um arquivo de fila ou socket — too complex.
 *
 * Mais simples e alinhado ao pedido: a rota /send chama sendMessage;
 * se o client não estiver na API, retorna 503 pedindo para usar o script
 * `node scripts/wpp-send-message.js --userId=... --to=... --message=...`
 * que se conecta ao client... mas client só existe no worker process!
 *
 * A ÚNICA forma de send funcionar via HTTP na arquitetura PM2 é:
 * 1) Ter a sessão no processo da API, OU
 * 2) Ter um endpoint HTTP no próprio worker.
 *
 * Vou adicionar um pequeno HTTP server no worker quando mode=somente-envio
 * na porta SEND_ONLY_HTTP_PORT (default 3012) com POST /send.
 * A API platefull faz proxy para esse porto local.
 */
export async function sendSendOnlyMessage(req, res) {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'userId inválido' });
    }

    const normalizedUserId = userId.trim();
    const slot = resolveSendOnlySlot(req);
    const { to, message } = req.body || {};

    if (!to || !message) {
      return res.status(400).json({ success: false, message: 'Body precisa de "to" e "message"' });
    }

    // 1) Tenta no processo atual (útil se rodando sem PM2 / script CLI)
    const local = await sendMessage(normalizedUserId, to, message, slot);
    if (local.success) {
      return res.json(local);
    }

    // 2) Proxy para o mini-HTTP do worker somente-envio
    const port = sendWorkerPort(slot);
    try {
      const proxyRes = await fetch(`http://127.0.0.1:${port}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: normalizedUserId, slot, to, message }),
      });
      const data = await proxyRes.json().catch(() => ({}));
      return res.status(proxyRes.status).json(data);
    } catch (proxyErr) {
      return res.status(503).json({
        success: false,
        message:
          'Sessão somente-envio não acessível neste processo. Confirme que o worker está online ' +
          '(POST /api/send-only/:userId/start) e que SEND_ONLY_HTTP_PORT está liberado.',
        detail: local.error || proxyErr.message,
        slot,
      });
    }
  } catch (error) {
    logger.error('[sendSendOnlyMessage]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/send-only/:userId/stop
 */
export async function stopSendOnlyConnection(req, res) {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'userId inválido' });
    }

    const normalizedUserId = userId.trim();
    const slot = resolveSendOnlySlot(req);

    await stopSendOnlyWorker(normalizedUserId, slot).catch(() => {});
    await stopClient(normalizedUserId, slot).catch(() => {});
    await WhatsAppBotModel.setDisconnected(normalizedUserId, slot).catch(() => {});

    return res.json({ success: true, message: 'Sessão somente-envio parada', slot, mode: 'somente-envio' });
  } catch (error) {
    logger.error('[stopSendOnlyConnection]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

// ─── Sessões genéricas (N slots por usuário) ───────────────────────────────

function sessionStatusPayload(bot, slot) {
  const isActive = !!bot;
  const isConnected = !!(bot && bot.isConnected);
  const qrCode = (bot && bot.qrCode) || null;
  let status = 'DISCONNECTED';
  if (isActive) {
    if (isConnected) status = 'CONNECTED';
    else if (qrCode) status = 'QRCODE';
    else status = 'CONNECTING';
  }
  return {
    status,
    qrCode,
    isActive,
    isConnected,
    connectedNumber: (bot && bot.connectedNumber) || null,
    updatedAt: bot?.updatedAt ? bot.updatedAt.toISOString() : null,
    label: bot?.label ?? null,
    iaAtiva: bot?.iaAtiva === true,
    iaPrompt: bot?.iaPrompt ?? null,
    slot: bot?.slot ?? slot,
  };
}

/**
 * POST /api/sessions/:userId/start?slot=N&force=1
 */
export async function startSessionConnection(req, res) {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'userId inválido' });
    }

    const normalizedUserId = userId.trim();
    const slot = resolveAnySlot(req, 1);
    const force =
      String(req.query?.force || '').toLowerCase() === '1' ||
      String(req.query?.force || '').toLowerCase() === 'true';

    if (force) {
      await stopSessionWorker(normalizedUserId, slot).catch(() => {});
      await WhatsAppBotModel.clearSession(normalizedUserId, slot).catch(() => {});
      await new Promise((r) => setTimeout(r, 1500));
    }

    const result = await startSessionWorker(normalizedUserId, slot);
    return res.json({
      ...result,
      message: result.message || 'Worker iniciado. Escaneie o QR via GET /api/sessions/:userId/qr?slot=N',
    });
  } catch (error) {
    logger.error('[startSessionConnection]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/sessions/:userId/status?slot=N
 */
export async function getSessionStatus(req, res) {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'userId inválido', session: null });
    }

    const normalizedUserId = userId.trim();
    const slot = resolveAnySlot(req, 1);
    const bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, slot);
    const session = sessionStatusPayload(bot, slot);

    return res.json({
      success: true,
      userId: normalizedUserId,
      slot,
      iaAtiva: session.iaAtiva,
      mode: session.iaAtiva ? 'atendimento' : 'somente-envio',
      session,
    });
  } catch (error) {
    logger.error('[getSessionStatus]', error);
    return res.status(500).json({ success: false, message: error.message, session: null });
  }
}

/**
 * GET /api/sessions/:userId/qr?slot=N
 */
export async function getSessionQRCode(req, res) {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ success: false, qrCode: null, message: 'userId inválido' });
    }

    const normalizedUserId = userId.trim();
    const slot = resolveAnySlot(req, 1);
    const bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, slot);
    const session = sessionStatusPayload(bot, slot);

    return res.json({
      success: true,
      qrCode: session.qrCode,
      slot,
      isConnected: session.isConnected,
      connectedNumber: session.connectedNumber,
      session,
      message: session.qrCode
        ? undefined
        : session.isConnected
          ? 'Já conectado'
          : 'Aguardando geração do QR Code',
    });
  } catch (error) {
    logger.error('[getSessionQRCode]', error);
    return res.status(500).json({ success: false, qrCode: null, message: error.message });
  }
}

/**
 * POST /api/sessions/:userId/stop?slot=N
 */
export async function stopSessionConnection(req, res) {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'userId inválido' });
    }

    const normalizedUserId = userId.trim();
    const slot = resolveAnySlot(req, 1);

    await stopSessionWorker(normalizedUserId, slot).catch(() => {});
    await stopClient(normalizedUserId, slot).catch(() => {});
    await WhatsAppBotModel.setDisconnected(normalizedUserId, slot).catch(() => {});

    return res.json({ success: true, message: 'Sessão parada', slot });
  } catch (error) {
    logger.error('[stopSessionConnection]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/sessions/:userId/list
 */
export async function listUserSessions(req, res) {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return res.status(400).json({ success: false, message: 'userId inválido', sessions: [] });
    }

    const bots = await WhatsAppBotModel.findAllByUser(userId.trim());
    return res.json({
      success: true,
      sessions: bots.map((bot) => sessionStatusPayload(bot, bot.slot)),
    });
  } catch (error) {
    logger.error('[listUserSessions]', error);
    return res.status(500).json({ success: false, message: error.message, sessions: [] });
  }
}
