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
        '--single-process', // CRÍTICO: força processo único (evita singleton)
        '--disable-gpu',
        '--remote-debugging-port=0', // CRÍTICO: porta aleatória
        '--disable-features=TranslateUI',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-default-browser-check',
        '--safebrowsing-disable-auto-update',
        '--password-store=basic',
        '--use-mock-keychain'
      ]
    },
    // Diretório base para sessões do WhatsApp
    sessionsDir: '/var/www/whatsapp-sessions'
  }
};

