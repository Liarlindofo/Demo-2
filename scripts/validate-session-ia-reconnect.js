/**
 * Validação offline da resolução de iaAtiva (sem subir WPPConnect).
 *
 * Simula:
 *  1) start com mode=somente-envio → iaAtiva=false
 *  2) reconnect lendo do "banco" → preserva iaAtiva=false
 *  3) start sem options e sem banco → FALHA (não assume atendimento)
 *  4) handleIncomingMessage guard: iaAtiva=false → ignora
 *
 * Uso: node scripts/validate-session-ia-reconnect.js
 */
import assert from 'assert';

// Espelho da lógica de resolveSessionIaOptions (sem imports pesados)
async function resolveSessionIaOptions(userId, slot, options = {}, getDurable) {
  let iaAtiva;
  let iaPrompt = options.iaPrompt !== undefined ? options.iaPrompt : undefined;
  let label = options.label !== undefined ? options.label : undefined;

  if (typeof options.iaAtiva === 'boolean') {
    iaAtiva = options.iaAtiva;
  } else if (options.mode === 'somente-envio') {
    iaAtiva = false;
  } else if (options.mode === 'atendimento') {
    iaAtiva = true;
  } else {
    const durable = await getDurable(userId, slot);
    if (!durable) {
      throw new Error(`[startClient] Sessão [${userId}:${slot}] sem iaAtiva persistido`);
    }
    iaAtiva = durable.iaAtiva;
    if (iaPrompt === undefined) iaPrompt = durable.iaPrompt;
    if (label === undefined) label = durable.label;
  }

  return {
    iaAtiva,
    iaPrompt: iaPrompt ?? null,
    label: label ?? null,
    mode: iaAtiva ? 'atendimento' : 'somente-envio',
  };
}

function shouldIgnoreIncoming(durable) {
  return !durable || durable.iaAtiva !== true;
}

async function main() {
  const db = new Map();
  const getDurable = async (userId, slot) => {
    const row = db.get(`${userId}:${slot}`);
    if (!row || typeof row.iaAtiva !== 'boolean') return null;
    return row;
  };

  // 1) Start somente-envio
  const start = await resolveSessionIaOptions('u1', 2, { mode: 'somente-envio' }, getDurable);
  assert.strictEqual(start.iaAtiva, false);
  assert.strictEqual(start.mode, 'somente-envio');
  db.set('u1:2', { iaAtiva: false, iaPrompt: null, label: 'Somente envio' });
  console.log('✓ start mode=somente-envio → iaAtiva=false');

  // 2) Reconnect lê do banco (como scheduleReconnect)
  const reconnect = await resolveSessionIaOptions('u1', 2, {
    iaAtiva: (await getDurable('u1', 2)).iaAtiva,
  }, getDurable);
  assert.strictEqual(reconnect.iaAtiva, false);
  assert.strictEqual(reconnect.mode, 'somente-envio');
  console.log('✓ reconnect com iaAtiva do banco → continua false (SEM listener)');

  // 3) Sem options e sem banco → falha
  let failed = false;
  try {
    await resolveSessionIaOptions('u1', 9, {}, getDurable);
  } catch {
    failed = true;
  }
  assert.ok(failed, 'deveria falhar sem iaAtiva persistido');
  console.log('✓ start sem options/banco → ERRO (não assume atendimento)');

  // 4) Defesa handleIncomingMessage
  assert.strictEqual(shouldIgnoreIncoming({ iaAtiva: false }), true);
  assert.strictEqual(shouldIgnoreIncoming({ iaAtiva: true }), false);
  assert.strictEqual(shouldIgnoreIncoming(null), true);
  console.log('✓ defesa: mensagem ignorada quando iaAtiva!==true');

  // 5) Atendimento explícito
  const att = await resolveSessionIaOptions('u1', 1, { mode: 'atendimento' }, getDurable);
  assert.strictEqual(att.iaAtiva, true);
  console.log('✓ start mode=atendimento → iaAtiva=true');

  console.log('\nTodas as validações passaram.');
}

main().catch((err) => {
  console.error('FALHA:', err);
  process.exit(1);
});
