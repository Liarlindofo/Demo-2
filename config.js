import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Obter diretório atual (compatível com ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tentar carregar .env de múltiplos locais
const envPaths = [
  resolve(__dirname, '.env'),           // Raiz do projeto
  resolve(process.cwd(), '.env'),        // Diretório de trabalho atual
  '/var/www/I/.env',                    // Caminho absoluto na VPS
  '/var/www/Demo-2/.env',               // Caminho alternativo na VPS
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      console.log(`[config] ✅ Arquivo .env carregado de: ${envPath}`);
      envLoaded = true;
      break;
    }
  }
}

// Se não encontrou em nenhum lugar, tentar carregar do diretório padrão
if (!envLoaded) {
  const result = dotenv.config();
  if (result.error) {
    console.warn(`[config] ⚠️ Aviso: Não foi possível carregar arquivo .env`);
    console.warn(`[config] Tentou os seguintes caminhos:`, envPaths);
  } else {
    console.log(`[config] ✅ Arquivo .env carregado do diretório padrão`);
  }
}

// Debug: Verificar se a API key foi carregada (sem mostrar o valor completo)
const apiKey = process.env.OPENROUTER_API_KEY;
if (apiKey) {
  const maskedKey = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4);
  console.log(`[config] ✅ OPENROUTER_API_KEY carregada: ${maskedKey}`);
} else {
  console.error(`[config] ❌ ERRO: OPENROUTER_API_KEY NÃO encontrada!`);
  console.error(`[config] Verifique se o arquivo .env existe e contém OPENROUTER_API_KEY`);
}

export default {
  port: process.env.PORT || 3001,
  openRouterKey: (process.env.OPENROUTER_API_KEY || '').trim(),
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

