import { startClient } from "../src/wpp/index.js";

const arg = process.argv.find((a) => a.startsWith("--userId="));

if (!arg) {
  console.error("USER_ID não informado");
  process.exit(1);
}

const userId = arg.split("=")[1];

console.log(`🚀 Iniciando WhatsApp Worker para usuário ${userId}`);

await startClient(userId);


