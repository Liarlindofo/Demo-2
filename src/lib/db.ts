import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Configurar PrismaClient com pool de conexões otimizado para produção
export const db: PrismaClient = global.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Garantir que apenas uma instância do Prisma existe
if (process.env.NODE_ENV !== 'production') global.prisma = db

// Função helper para garantir conexão ativa
export async function ensureConnection() {
  try {
    await db.$connect()
  } catch (error) {
    // Se a conexão já estiver ativa, ignorar o erro
    if (error instanceof Error && !error.message.includes('already connected')) {
      console.warn('⚠️ Aviso ao verificar conexão:', error.message)
    }
  }
}

// Graceful shutdown - desconectar quando o processo terminar
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await db.$disconnect()
  })
}


