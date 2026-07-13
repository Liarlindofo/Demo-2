/**
 * Cliente HTTP para a API Plateful — módulo de tarefas do bot.
 *
 * Autenticação: header X-API-Key = process.env.BOT_API_KEY
 * Retry: 3 tentativas com backoff exponencial (500 ms, 1 s, 2 s).
 *
 * Env vars necessárias:
 *   PLATEFUL_API_URL  — URL base do Next.js (ex: https://app.plateful.com.br)
 *   BOT_API_KEY       — chave secreta compartilhada
 */

const BASE_URL = (process.env.PLATEFUL_API_URL || '').replace(/\/$/, '');
const API_KEY  = process.env.BOT_API_KEY || '';

/**
 * Faz uma requisição com retry e backoff exponencial.
 * @param {string} url
 * @param {RequestInit} [options]
 * @param {number} [tentativas]
 * @returns {Promise<unknown>}
 */
async function fetchComRetry(url, options = {}, tentativas = 3) {
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
          ...(options.headers || {}),
        },
      });

      if (!res.ok) {
        const corpo = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${corpo}`);
      }

      return res.json();
    } catch (err) {
      if (i === tentativas - 1) throw err;
      const espera = 500 * 2 ** i; // 500 ms, 1 s, 2 s
      await delay(espera);
    }
  }
}

/**
 * GET /api/bot/tarefas/digest?data=YYYY-MM-DD
 * Retorna tarefas AGENDADA do dia agrupadas por funcionário.
 */
export function getDigest(data) {
  return fetchComRetry(`${BASE_URL}/api/bot/tarefas/digest?data=${data}`);
}

/**
 * GET /api/bot/tarefas/pendentes?ate=ISO
 * Retorna tarefas AGENDADA com dataAgendada <= agora.
 */
export function getPendentes() {
  const agora = new Date().toISOString();
  return fetchComRetry(
    `${BASE_URL}/api/bot/tarefas/pendentes?ate=${encodeURIComponent(agora)}`,
  );
}

/**
 * PATCH /api/bot/tarefas/:id/status
 * Atualiza o status da tarefa com validação de transição no servidor.
 */
export function patchStatus(id, body) {
  return fetchComRetry(`${BASE_URL}/api/bot/tarefas/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * POST /api/bot/tarefas/:id/evidencias
 * Registra uma evidência (texto, localização, foto em base64, arquivo).
 */
export function postEvidencia(id, body) {
  return fetchComRetry(`${BASE_URL}/api/bot/tarefas/${id}/evidencias`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
