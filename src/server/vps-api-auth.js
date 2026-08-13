import logger from '../utils/logger.js';

/**
 * Autenticação servidor→servidor (Vercel → VPS).
 * Header: x-api-key
 * Env na VPS: WHATSAPP_API_KEY
 *
 * Se WHATSAPP_API_KEY não estiver configurada, libera (legado) e loga aviso.
 * Não usa BOT_API_KEY (essa é VPS → Plateful) para não trancar a API sem querer.
 * Health (/health) não passa por este middleware.
 */
export function requireVpsApiKey(req, res, next) {
  const expected = (process.env.WHATSAPP_API_KEY || '').trim();

  if (!expected) {
    logger.warn(
      '[auth] WHATSAPP_API_KEY não configurada — /api aberto. Defina a key na VPS e o mesmo valor em WHATSAPP_VPS_API_KEY no Vercel.',
    );
    return next();
  }

  const provided = (req.headers['x-api-key'] || '').toString().trim();
  if (!provided || provided !== expected) {
    return res.status(401).json({
      success: false,
      message: 'Não autorizado. Envie o header x-api-key.',
    });
  }

  return next();
}
