import express from 'express';
import * as api from './api.js';

const router = express.Router();

/**
 * Rotas da API REST
 */

// Health check
router.get('/health', api.healthCheck);

// Status de conexões
router.get('/status/:userId', api.getStatus);

// QR Code
router.get('/qr/:userId/:slot', api.getQRCode);

// Gerenciar conexões
router.post('/start/:userId/:slot', api.startConnection);
router.post('/stop/:userId/:slot', api.stopConnection);

// Configurações do bot
router.get('/settings/:userId', api.getSettings);
router.post('/settings/:userId', api.updateSettings);

export default router;

