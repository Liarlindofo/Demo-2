import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

function processName(userId) {
  return `whatsapp-${userId}`;
}

export async function startWhatsappWorker(userId) {
  const name = processName(userId);

  try {
    const { stdout } = await execAsync(`pm2 describe ${name}`);
    if (stdout.includes("online")) {
      return { success: true, message: "Worker já ativo" };
    }
  } catch {}

  await execAsync(`
    pm2 start workers/whatsapp-worker.js \
    --name ${name} \
    --interpreter=node \
    -- --userId=${userId}
  `);

  return { success: true };
}

export async function stopWhatsappWorker(userId) {
  const name = processName(userId);

  try {
    await execAsync(`pm2 delete ${name}`);
  } catch (error) {
    const msg = `${error.stdout || ''} ${error.stderr || ''} ${error.message || ''}`.toLowerCase();

    // Se o processo não existe mais, consideramos como sucesso (idempotente)
    if (msg.includes('process or namespace') && msg.includes('not found')) {
      return;
    }

    // Para outros erros, propagamos
    throw error;
  }
}


