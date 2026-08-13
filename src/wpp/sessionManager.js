import logger from '../utils/logger.js';

/**
 * Gerenciador de sessões WPPConnect em memória
 * Mantém instâncias ativas de clientes e histórico de conversas
 */

/** @typedef {'atendimento' | 'somente-envio'} SessionMode */

class SessionManager {
  constructor() {
    // Armazena os clientes WPPConnect: { "userId:slot": client }
    this.clients = new Map();

    // Armazena histórico de conversas: { "userId:slot": { "phoneNumber": [messages] } }
    this.conversations = new Map();

    // Armazena estado de modo manual por conversa: { "userId:slot": { "phoneNumber": true/false } }
    this.manualMode = new Map();

    // Modo da sessão: { "userId:slot": 'atendimento' | 'somente-envio' }
    this.sessionModes = new Map();

    // IA ativa por sessão: { "userId:slot": boolean } — default seguro = false
    this.sessionIaAtiva = new Map();
  }

  normalizeUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error(`userId inválido: ${userId}`);
    }
    return String(userId).trim();
  }

  getKey(userId, slot) {
    const normalizedUserId = this.normalizeUserId(userId);
    const key = `${normalizedUserId}:${slot}`;
    logger.info(`[SessionManager] Gerando chave: userId="${userId}" (normalizado="${normalizedUserId}"), slot=${slot} -> key="${key}"`);
    return key;
  }

  /**
   * @param {string} userId
   * @param {number} slot
   * @param {object} client
   * @param {SessionMode} [mode]
   * @param {boolean} [iaAtiva]
   */
  setClient(userId, slot, client, mode, iaAtiva) {
    const normalizedUserId = this.normalizeUserId(userId);
    const key = this.getKey(normalizedUserId, slot);

    if (this.clients.has(key)) {
      logger.warn(`[SessionManager] ⚠️ Já existe cliente para chave "${key}". Substituindo...`);
      const oldClient = this.clients.get(key);
      if (oldClient && typeof oldClient.close === 'function') {
        oldClient.close().catch(err => {
          logger.warn(`[SessionManager] Erro ao fechar cliente antigo: ${err.message}`);
        });
      }
    }

    // Preferir iaAtiva explícito; mode legado só como fallback. Default seguro = SEM IA.
    const resolvedIaAtiva =
      typeof iaAtiva === 'boolean'
        ? iaAtiva
        : mode === 'atendimento';
    const resolvedMode = resolvedIaAtiva ? 'atendimento' : 'somente-envio';

    this.clients.set(key, client);
    this.sessionModes.set(key, resolvedMode);
    this.sessionIaAtiva.set(key, resolvedIaAtiva);
    logger.wpp(
      normalizedUserId,
      slot,
      `✅ Cliente armazenado na memória com chave: "${key}" (mode=${resolvedMode}, iaAtiva=${resolvedIaAtiva})`,
    );

    const allKeys = Array.from(this.clients.keys());
    logger.info(`[SessionManager] Chaves ativas (${allKeys.length}): ${allKeys.join(', ')}`);
  }

  /** @returns {SessionMode} — se ausente na memória, default SEGURO = somente-envio */
  getMode(userId, slot) {
    const key = this.getKey(userId, slot);
    return this.sessionModes.get(key) || 'somente-envio';
  }

  /** @returns {boolean} */
  getIaAtiva(userId, slot) {
    const key = this.getKey(userId, slot);
    return this.sessionIaAtiva.get(key) === true;
  }

  isSendOnly(userId, slot) {
    return !this.getIaAtiva(userId, slot);
  }

  getClient(userId, slot) {
    const normalizedUserId = this.normalizeUserId(userId);
    const key = this.getKey(normalizedUserId, slot);
    const client = this.clients.get(key);

    if (client) {
      logger.info(`[SessionManager] ✅ Cliente encontrado para chave: "${key}"`);
    } else {
      logger.warn(`[SessionManager] ⚠️ Cliente NÃO encontrado para chave: "${key}"`);
      const allKeys = Array.from(this.clients.keys());
      logger.info(`[SessionManager] Chaves disponíveis: ${allKeys.join(', ')}`);
    }

    return client;
  }

  removeClient(userId, slot) {
    const normalizedUserId = this.normalizeUserId(userId);
    const key = this.getKey(normalizedUserId, slot);
    const client = this.clients.get(key);

    if (client) {
      this.clients.delete(key);
      this.sessionModes.delete(key);
      this.sessionIaAtiva.delete(key);
      logger.wpp(normalizedUserId, slot, `✅ Cliente removido da memória (chave: "${key}")`);
      const remainingKeys = Array.from(this.clients.keys());
      logger.info(`[SessionManager] Chaves restantes (${remainingKeys.length}): ${remainingKeys.join(', ')}`);
    } else {
      logger.warn(`[SessionManager] ⚠️ Tentativa de remover cliente inexistente (chave: "${key}")`);
    }

    return client;
  }

  hasClient(userId, slot) {
    const normalizedUserId = this.normalizeUserId(userId);
    const key = this.getKey(normalizedUserId, slot);
    const has = this.clients.has(key);
    logger.info(`[SessionManager] hasClient(${normalizedUserId}, ${slot}) -> chave="${key}" -> ${has ? 'SIM' : 'NÃO'}`);
    return has;
  }

  addMessage(userId, slot, phoneNumber, message) {
    const key = this.getKey(userId, slot);

    if (!this.conversations.has(key)) {
      this.conversations.set(key, new Map());
    }

    const sessionConversations = this.conversations.get(key);

    if (!sessionConversations.has(phoneNumber)) {
      sessionConversations.set(phoneNumber, []);
    }

    const messages = sessionConversations.get(phoneNumber);
    messages.push({
      text: message.body || message.text || '',
      fromMe: message.fromMe || false,
      timestamp: message.timestamp || Date.now()
    });

    if (messages.length > 50) {
      messages.shift();
    }
  }

  getConversation(userId, slot, phoneNumber, limit = 10) {
    const key = this.getKey(userId, slot);
    const sessionConversations = this.conversations.get(key);

    if (!sessionConversations || !sessionConversations.has(phoneNumber)) {
      return [];
    }

    const messages = sessionConversations.get(phoneNumber);
    return messages.slice(-limit);
  }

  clearConversation(userId, slot, phoneNumber) {
    const key = this.getKey(userId, slot);
    const sessionConversations = this.conversations.get(key);

    if (sessionConversations) {
      sessionConversations.delete(phoneNumber);
    }
  }

  clearAllConversations(userId, slot) {
    const key = this.getKey(userId, slot);
    this.conversations.delete(key);
    logger.wpp(userId, slot, 'Histórico de conversas limpo');
  }

  listActiveSessions() {
    return Array.from(this.clients.keys());
  }

  getStats() {
    const activeSessions = this.clients.size;
    let totalConversations = 0;

    this.conversations.forEach(sessionConv => {
      totalConversations += sessionConv.size;
    });

    return { activeSessions, totalConversations };
  }

  setManualMode(userId, slot, phoneNumber, enabled = true) {
    const key = this.getKey(userId, slot);

    if (!this.manualMode.has(key)) {
      this.manualMode.set(key, new Map());
    }

    let normalizedPhone = phoneNumber;
    if (normalizedPhone && normalizedPhone.includes('@')) {
      normalizedPhone = normalizedPhone.split('@')[0];
    }

    const sessionManualMode = this.manualMode.get(key);
    sessionManualMode.set(normalizedPhone, enabled);

    logger.wpp(userId, slot, `🔧 setManualMode: ${enabled ? 'ATIVADO' : 'DESATIVADO'} para ${normalizedPhone} (original: ${phoneNumber})`);
  }

  isManualMode(userId, slot, phoneNumber) {
    const key = this.getKey(userId, slot);
    const sessionManualMode = this.manualMode.get(key);

    if (!sessionManualMode) return false;

    let normalizedPhone = phoneNumber;
    if (normalizedPhone && normalizedPhone.includes('@')) {
      normalizedPhone = normalizedPhone.split('@')[0];
    }

    return sessionManualMode.get(normalizedPhone) === true;
  }

  clearManualMode(userId, slot, phoneNumber) {
    const key = this.getKey(userId, slot);
    const sessionManualMode = this.manualMode.get(key);

    if (sessionManualMode) {
      sessionManualMode.delete(phoneNumber);
    }
  }
}

export default new SessionManager();
