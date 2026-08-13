/**
 * ============================================
 * PLATEFULL WHATSAPP BOT - API PRINCIPAL
 * ============================================
 * 
 * Este arquivo é o entrypoint da API rodando no PM2.
 * 
 * ORDEM OBRIGATÓRIA:
 * 1. Imports
 * 2. const app = express()
 * 3. Middlewares
 * 4. Rotas (app.use)
 * 5. app.listen()
 * 6. Conexão ao banco dentro do listen
 * 
 * ⚠️ NUNCA usar app antes de const app = express()
 * ⚠️ NUNCA usar rotas antes de middlewares
 */

// ============================================
// 1. IMPORTS
// ============================================
import express from 'express';
import cors from 'cors';
import config from './config.js';
import logger from './src/utils/logger.js';
import router from './src/server/router.js';
import statusRoutes from './src/routes/status.routes.js';
import prisma from './src/db/index.js';
import { requireVpsApiKey } from './src/server/vps-api-auth.js';

// ============================================
// 2. INICIALIZAR EXPRESS
// ============================================
const app = express();

// ============================================
// 3. MIDDLEWARES
// ============================================

// CORS - Configurado para permitir origens múltiplas
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (como ferramentas de teste)
    if (!origin) return callback(null, true);
    
    // Verificar se a origin está na lista de permitidas
    if (config.allowedOrigins.indexOf('*') !== -1 || 
        config.allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`Origem bloqueada por CORS: ${origin}`);
      callback(null, true); // Permitir temporariamente para debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logs de requisições
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.method === 'POST' ? req.body : undefined
  });
  next();
});

// ============================================
// 4. ROTAS
// ============================================

// Healthcheck - GET /health (público, sem API key)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Demais rotas /api exigem x-api-key quando WHATSAPP_API_KEY/BOT_API_KEY estiver setada
app.use('/api', requireVpsApiKey);

// Rotas de status (nova rota conforme prompt)
app.use('/api', statusRoutes);

// Rotas principais da API (WhatsApp, settings, etc.)
app.use('/api', router);

// Rota raiz - Documentação da API
app.get('/', (req, res) => {
  res.json({
    name: 'Platefull WhatsApp Bot',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/health',
      status: '/api/status/:userId',
      qr: '/api/qr/:userId',
      start: 'POST /api/start/:userId',
      stop: 'POST /api/stop/:userId',
      sendOnly: {
        start: 'POST /api/send-only/:userId/start',
        status: 'GET /api/send-only/:userId/status',
        qr: 'GET /api/send-only/:userId/qr',
        groups: 'GET /api/send-only/:userId/groups',
        send: 'POST /api/send-only/:userId/send',
        stop: 'POST /api/send-only/:userId/stop',
      },
      settings: {
        get: '/api/settings/:userId',
        update: 'POST /api/settings/:userId'
      }
    }
  });
});

// ============================================
// 5. ERROR HANDLERS
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.path
  });
});

// Error handler global
app.use((err, req, res, next) => {
  logger.error('Erro não tratado:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// ============================================
// 6. INICIAR SERVIDOR
// ============================================
const PORT = config.port;

app.listen(PORT, '127.0.0.1', async () => {
  // Log de inicialização
  logger.success(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║        🤖 PLATEFULL WHATSAPP BOT 🤖              ║
║                                                   ║
║  Servidor rodando na porta: ${PORT}                 ║
║  Ambiente: ${process.env.NODE_ENV || 'development'}                       ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);

  logger.info('Endpoints disponíveis:');
  logger.info(`  - Health Check: http://localhost:${PORT}/health`);
  logger.info(`  - Status: http://localhost:${PORT}/api/status/:userId`);
  logger.info(`  - API Docs: http://localhost:${PORT}/`);

  // Conectar ao banco dentro do listen (conforme prompt)
  try {
    // Prisma já conecta automaticamente no import, mas garantimos aqui
    await prisma.$connect();
    logger.success('✓ Banco de dados conectado');
  } catch (dbError) {
    logger.error('✗ Erro ao conectar no banco de dados:', dbError);
    // Não encerra o servidor, apenas loga o erro
  }

  // ❌ DESATIVADO: Restauração automática de sessões
  // Sessões só iniciam via ação explícita do usuário (QR Code)
  // Isso garante isolamento total e evita conflitos entre usuários
  logger.info('✓ Sistema iniciado. Sessões WhatsApp só iniciam via ação explícita do usuário.');
});

// ============================================
// 7. GRACEFUL SHUTDOWN
// ============================================
const shutdown = async (signal) => {
  logger.warn(`\n${signal} recebido. Encerrando servidor...`);
  
  try {
    // Fecha conexões do banco
    await prisma.$disconnect();
    logger.info('✓ Banco de dados desconectado');
    
    logger.success('✓ Servidor encerrado com sucesso');
    process.exit(0);
  } catch (error) {
    logger.error('Erro ao encerrar servidor:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Exceção não capturada:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejection não tratada:', { reason, promise });
});

export default app;
