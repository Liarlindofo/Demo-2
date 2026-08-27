import express from 'express';
import * as api from './api.js';

const router = express.Router();

/**
 * Wrapper para capturar erros de funções async
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Rotas da API REST
 */

// Health check (mantido para compatibilidade, mas também está em /health)
router.get('/health', api.healthCheck);

// Status de conexões WhatsApp (SLOT FIXO = 1)
// ⚠️ REMOVIDO: Agora está em src/routes/status.routes.js conforme arquitetura solicitada
// router.get('/status/:userId', asyncHandler(api.getStatus));

// QR Code (SLOT FIXO = 1)
router.get('/qr/:userId', asyncHandler(api.getQRCode));

// Gerenciar conexões WhatsApp (SLOT FIXO = 1 — atendimento)
router.post('/start/:userId', asyncHandler(api.startConnection));
router.post('/stop/:userId', asyncHandler(api.stopConnection));

// Sessão SOMENTE-ENVIO (slot 2+ — sem listener do bot)
router.post('/send-only/:userId/start', asyncHandler(api.startSendOnlyConnection));
router.get('/send-only/:userId/status', asyncHandler(api.getSendOnlyStatus));
router.get('/send-only/:userId/qr', asyncHandler(api.getSendOnlyQRCode));
router.get('/send-only/:userId/groups', asyncHandler(api.getSendOnlyGroups));
router.post('/send-only/:userId/send', asyncHandler(api.sendSendOnlyMessage));
router.post('/send-only/:userId/stop', asyncHandler(api.stopSendOnlyConnection));

// Sessões genéricas (N slots)
router.post('/sessions/:userId/start', asyncHandler(api.startSessionConnection));
router.get('/sessions/:userId/status', asyncHandler(api.getSessionStatus));
router.get('/sessions/:userId/qr', asyncHandler(api.getSessionQRCode));
router.post('/sessions/:userId/stop', asyncHandler(api.stopSessionConnection));
router.post('/sessions/:userId/delete', asyncHandler(api.deleteSessionConnection));
router.get('/sessions/:userId/list', asyncHandler(api.listUserSessions));
router.get('/sessions/:userId/groups', asyncHandler(api.getSendOnlyGroups));
router.post('/sessions/:userId/send', asyncHandler(api.sendSendOnlyMessage));

// Configurações do bot
router.get('/settings/:userId', asyncHandler(api.getSettings));
router.post('/settings/:userId', asyncHandler(api.updateSettings));

export default router;

