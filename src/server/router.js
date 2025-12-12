import express from 'express';
import * as api from './api.js';

const router = express.Router();

/**
 * Rotas da API REST
 */

// Health check
router.get('/health', api.healthCheck);

// Status de conexões WhatsApp (SLOT FIXO = 1)
router.get('/status/:userId', api.getStatus);

// QR Code (SLOT FIXO = 1)
router.get('/qr/:userId', api.getQRCode);

// Gerenciar conexões WhatsApp (SLOT FIXO = 1)
router.post('/start/:userId', api.startConnection);
router.post('/stop/:userId', api.stopConnection);

// Configurações do bot
router.get('/settings/:userId', api.getSettings);
router.post('/settings/:userId', api.updateSettings);

export default router;

