require("dotenv").config({ path: "/var/www/Demo-2/.env" });

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
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      },

      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      },
    },
    {
      name: "whatsapp-baileys-teste",
      script: "workers/baileys-teste-worker.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        BAILEYS_TEST_USER_ID: "baileys-teste",
        BAILEYS_TEST_SLOT: "1",
        BAILEYS_TEST_HTTP_PORT: "3020",
        BAILEYS_AUTH_DIR: "/var/www/whatsapp-sessions-baileys/teste",
      },
      env_production: {
        NODE_ENV: "production",
        BAILEYS_TEST_USER_ID: "baileys-teste",
        BAILEYS_TEST_SLOT: "1",
        BAILEYS_TEST_HTTP_PORT: "3020",
        BAILEYS_AUTH_DIR: "/var/www/whatsapp-sessions-baileys/teste",
      },
    },
  ],
};
