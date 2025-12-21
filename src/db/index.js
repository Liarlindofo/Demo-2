import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger.js";

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ❗ NÃO chama prisma.$connect() aqui
// ❗ Prisma conecta automaticamente quando a primeira query roda

// Graceful shutdown
process.on("beforeExit", async () => {
  try {
    await prisma.$disconnect();
    logger.info("🔌 Prisma desconectado com sucesso");
  } catch (err) {
    logger.warn("⚠️ Erro ao desconectar Prisma", err);
  }
});

export default prisma;
