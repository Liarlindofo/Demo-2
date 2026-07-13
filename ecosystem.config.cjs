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
  ],
};
