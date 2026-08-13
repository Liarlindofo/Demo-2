/**
 * Backfill de label / iaAtiva nas sessões WhatsApp existentes.
 *
 * - slot 1 → iaAtiva=true, label="Atendimento" (se vazio)
 * - demais slots → iaAtiva=false, label="Somente envio" (se vazio)
 * - Se sessionJson.mode existir, ele tem prioridade sobre o slot
 *
 * Uso: node scripts/backfill-whatsapp-session-ia.js
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const p of [resolve(__dirname, '..', '.env'), resolve(process.cwd(), '.env')]) {
  if (existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

import prisma from '../src/db/index.js';

async function main() {
  const bots = await prisma.whatsAppBot.findMany({ orderBy: [{ userId: 'asc' }, { slot: 'asc' }] });
  console.log(`Encontrados ${bots.length} registro(s) em whatsapp_bots`);

  let updated = 0;
  for (const bot of bots) {
    const jsonMode =
      bot.sessionJson && typeof bot.sessionJson === 'object' && !Array.isArray(bot.sessionJson)
        ? bot.sessionJson.mode
        : null;

    let iaAtiva;
    if (jsonMode === 'somente-envio') iaAtiva = false;
    else if (jsonMode === 'atendimento') iaAtiva = true;
    else if (typeof bot.iaAtiva === 'boolean') iaAtiva = bot.iaAtiva;
    else iaAtiva = bot.slot === 1;

    const label =
      (bot.label && String(bot.label).trim()) ||
      (iaAtiva ? 'Atendimento' : bot.slot === 2 ? 'Somente envio' : `Sessão ${bot.slot}`);

    if (bot.iaAtiva === iaAtiva && bot.label === label) continue;

    await prisma.whatsAppBot.update({
      where: { id: bot.id },
      data: { iaAtiva, label },
    });
    updated += 1;
    console.log(
      `✓ [${bot.userId}:${bot.slot}] iaAtiva=${iaAtiva} label="${label}"` +
        (jsonMode ? ` (via sessionJson.mode=${jsonMode})` : ''),
    );
  }

  console.log(`Backfill concluído. Atualizados: ${updated}/${bots.length}`);
}

main()
  .catch((err) => {
    console.error('Falha no backfill:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
