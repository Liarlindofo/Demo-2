import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' 
    ? ['error', 'warn'] 
    : ['query', 'info', 'warn', 'error'],
});

// Test connection
prisma.$connect()
  .then(() => {
    logger.success('✓ Conectado ao PostgreSQL (Neon)');
  })
  .catch((err) => {
    logger.error('✗ Erro ao conectar no PostgreSQL:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

