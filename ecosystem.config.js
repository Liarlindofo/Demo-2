module.exports = {
  apps: [
    {
      name: "platefull-api",
      script: "index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
    },
  ],
};


