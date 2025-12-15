import express from 'express';
import cors from 'cors';
import config from './config.js';
import logger from './src/utils/logger.js';
import router from './src/server/router.js';
import prisma from './src/db/index.js';
// ❌ REMOVIDO: restoreAllSessions - Sessões só iniciam via ação explícita do usuário

/**
 * Servidor principal do Platefull WhatsApp Bot
 */

const app = express();

// Middlewares - CORS configurado para permitir origens múltiplas
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

// Rotas da API
app.use('/api', router);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'Platefull WhatsApp Bot',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      status: '/api/status/:userId',
      qr: '/api/qr/:userId/:slot',
      start: 'POST /api/start/:userId/:slot',
      stop: 'POST /api/stop/:userId/:slot',
      settings: {
        get: '/api/settings/:userId',
        update: 'POST /api/settings/:userId'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Erro não tratado:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// Inicia servidor
const PORT = config.port;

app.listen(PORT, async () => {
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
  logger.info(`  - Health Check: http://localhost:${PORT}/api/health`);
  logger.info(`  - API Docs: http://localhost:${PORT}/`);

  // ❌ DESATIVADO: Restauração automática de sessões
  // Sessões só iniciam via ação explícita do usuário (QR Code)
  // Isso garante isolamento total e evita conflitos entre usuários
  logger.info('✓ Sistema iniciado. Sessões WhatsApp só iniciam via ação explícita do usuário.');
});

// Graceful shutdown
const shutdown = async (signal) => {
  logger.warn(`\n${signal} recebido. Encerrando servidor...`);
  
  try {
    // Fecha conexões do banco
    await prisma.$disconnect();
    logger.info('✓ Banco de dados desconectado');
    
    // Aqui você pode adicionar lógica para fechar clientes WPPConnect se necessário
    
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

