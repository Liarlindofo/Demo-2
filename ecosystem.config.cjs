/**
 * Configuração PM2 para Platefull WhatsApp Bot
 * 
 * Uso:
 *   pm2 start ecosystem.config.cjs
 *   pm2 start ecosystem.config.cjs --env production
 */

module.exports = {
  apps: [
    {
      name: "platefull-api",
      script: "index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};

