import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 3001,
  openRouterKey: process.env.OPENROUTER_API_KEY,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  allowedOrigins: [
    "https://platefull.com.br",
    "https://api.platefull.com.br",
    "http://localhost:3000",
    "http://localhost:3001",
    "*" // Permitir todas as origens temporariamente para debug
  ],
  wppConnect: {
    headless: true,
    puppeteerOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--remote-debugging-port=0', // CRÍTICO: porta aleatória para cada instância
        '--disable-features=TranslateUI',
        '--disable-extensions'
      ]
    },
    // Diretório base para sessões do WhatsApp
    sessionsDir: '/var/www/whatsapp-sessions'
  }
};

