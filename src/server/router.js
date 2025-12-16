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

// Gerenciar conexões WhatsApp (SLOT FIXO = 1)
router.post('/start/:userId', asyncHandler(api.startConnection));
router.post('/stop/:userId', asyncHandler(api.stopConnection));

// Configurações do bot
router.get('/settings/:userId', asyncHandler(api.getSettings));
router.post('/settings/:userId', asyncHandler(api.updateSettings));

export default router;

