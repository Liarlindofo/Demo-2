import logger from '../utils/logger.js';

/**
 * Gerenciador de sessões WPPConnect em memória
 * Mantém instâncias ativas de clientes e histórico de conversas
 */

class SessionManager {
  constructor() {
    // Armazena os clientes WPPConnect: { "userId:slot": client }
    this.clients = new Map();
    
    // Armazena histórico de conversas: { "userId:slot": { "phoneNumber": [messages] } }
    this.conversations = new Map();
    
    // Armazena estado de modo manual por conversa: { "userId:slot": { "phoneNumber": true/false } }
    this.manualMode = new Map();
  }

  /**
   * Normaliza userId para garantir consistência
   */
  normalizeUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error(`userId inválido: ${userId}`);
    }
    return String(userId).trim();
  }

  /**
   * Gera chave única para identificar sessão
   */
  getKey(userId, slot) {
    const normalizedUserId = this.normalizeUserId(userId);
    const key = `${normalizedUserId}:${slot}`;
    
    // LOG DE DEBUG para rastrear chaves
    logger.info(`[SessionManager] Gerando chave: userId="${userId}" (normalizado="${normalizedUserId}"), slot=${slot} -> key="${key}"`);
    
    return key;
  }

  /**
   * Adiciona cliente WPPConnect
   */
  setClient(userId, slot, client) {
    const normalizedUserId = this.normalizeUserId(userId);
    const key = this.getKey(normalizedUserId, slot);
    
    // Verificar se já existe cliente para esta chave
    if (this.clients.has(key)) {
      logger.warn(`[SessionManager] ⚠️ Já existe cliente para chave "${key}". Substituindo...`);
      const oldClient = this.clients.get(key);
      // Tentar fechar cliente antigo se existir
      if (oldClient && typeof oldClient.close === 'function') {
        oldClient.close().catch(err => {
          logger.warn(`[SessionManager] Erro ao fechar cliente antigo: ${err.message}`);
        });
      }
    }
    
    this.clients.set(key, client);
    logger.wpp(normalizedUserId, slot, `✅ Cliente armazenado na memória com chave: "${key}"`);
    
    // Listar todas as chaves ativas para debug
    const allKeys = Array.from(this.clients.keys());
    logger.info(`[SessionManager] Chaves ativas (${allKeys.length}): ${allKeys.join(', ')}`);
  }

  /**
   * Busca cliente WPPConnect
   */
  getClient(userId, slot) {
    const normalizedUserId = this.normalizeUserId(userId);
    const key = this.getKey(normalizedUserId, slot);
    const client = this.clients.get(key);
    
    if (client) {
      logger.info(`[SessionManager] ✅ Cliente encontrado para chave: "${key}"`);
    } else {
      logger.warn(`[SessionManager] ⚠️ Cliente NÃO encontrado para chave: "${key}"`);
      // Listar chaves disponíveis para debug
      const allKeys = Array.from(this.clients.keys());
      logger.info(`[SessionManager] Chaves disponíveis: ${allKeys.join(', ')}`);
    }
    
    return client;
  }

  /**
   * Remove cliente
   */
  removeClient(userId, slot) {
    const normalizedUserId = this.normalizeUserId(userId);
    const key = this.getKey(normalizedUserId, slot);
    const client = this.clients.get(key);
    
    if (client) {
      this.clients.delete(key);
      logger.wpp(normalizedUserId, slot, `✅ Cliente removido da memória (chave: "${key}")`);
      
      // Listar chaves restantes
      const remainingKeys = Array.from(this.clients.keys());
      logger.info(`[SessionManager] Chaves restantes (${remainingKeys.length}): ${remainingKeys.join(', ')}`);
    } else {
      logger.warn(`[SessionManager] ⚠️ Tentativa de remover cliente inexistente (chave: "${key}")`);
    }
    
    return client;
  }

  /**
   * Verifica se existe cliente ativo
   */
  hasClient(userId, slot) {
    const normalizedUserId = this.normalizeUserId(userId);
    const key = this.getKey(normalizedUserId, slot);
    const has = this.clients.has(key);
    
    logger.info(`[SessionManager] hasClient(${normalizedUserId}, ${slot}) -> chave="${key}" -> ${has ? 'SIM' : 'NÃO'}`);
    
    return has;
  }

  /**
   * Adiciona mensagem ao histórico
   */
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
    
    // Limita a 50 mensagens por conversa para não sobrecarregar memória
    if (messages.length > 50) {
      messages.shift();
    }
  }

  /**
   * Busca histórico de conversa
   */
  getConversation(userId, slot, phoneNumber, limit = 10) {
    const key = this.getKey(userId, slot);
    const sessionConversations = this.conversations.get(key);
    
    if (!sessionConversations || !sessionConversations.has(phoneNumber)) {
      return [];
    }
    
    const messages = sessionConversations.get(phoneNumber);
    return messages.slice(-limit);
  }

  /**
   * Limpa histórico de uma conversa específica
   */
  clearConversation(userId, slot, phoneNumber) {
    const key = this.getKey(userId, slot);
    const sessionConversations = this.conversations.get(key);
    
    if (sessionConversations) {
      sessionConversations.delete(phoneNumber);
    }
  }

  /**
   * Limpa todas as conversas de uma sessão
   */
  clearAllConversations(userId, slot) {
    const key = this.getKey(userId, slot);
    this.conversations.delete(key);
    logger.wpp(userId, slot, 'Histórico de conversas limpo');
  }

  /**
   * Lista todas as sessões ativas
   */
  listActiveSessions() {
    return Array.from(this.clients.keys());
  }

  /**
   * Estatísticas
   */
  getStats() {
    const activeSessions = this.clients.size;
    let totalConversations = 0;
    
    this.conversations.forEach(sessionConv => {
      totalConversations += sessionConv.size;
    });
    
    return {
      activeSessions,
      totalConversations
    };
  }

  /**
   * Ativa modo manual para uma conversa (bot para de responder automaticamente)
   */
  setManualMode(userId, slot, phoneNumber, enabled = true) {
    const key = this.getKey(userId, slot);
    
    if (!this.manualMode.has(key)) {
      this.manualMode.set(key, new Map());
    }
    
    // Normalizar número de telefone (remover sufixos do WhatsApp)
    let normalizedPhone = phoneNumber;
    if (normalizedPhone.includes('@')) {
      normalizedPhone = normalizedPhone.split('@')[0];
    }
    
    const sessionManualMode = this.manualMode.get(key);
    // Salvar tanto com número normalizado quanto original para garantir compatibilidade
    sessionManualMode.set(normalizedPhone, enabled);
    if (normalizedPhone !== phoneNumber) {
      sessionManualMode.set(phoneNumber, enabled);
    }
    
    logger.wpp(userId, slot, `Modo manual ${enabled ? 'ativado' : 'desativado'} para ${normalizedPhone} (original: ${phoneNumber})`);
  }

  /**
   * Verifica se uma conversa está em modo manual
   */
  isManualMode(userId, slot, phoneNumber) {
    const key = this.getKey(userId, slot);
    const sessionManualMode = this.manualMode.get(key);
    
    if (!sessionManualMode) {
      return false;
    }
    
    // Normalizar número de telefone (remover sufixos do WhatsApp)
    let normalizedPhone = phoneNumber;
    if (normalizedPhone && normalizedPhone.includes('@')) {
      normalizedPhone = normalizedPhone.split('@')[0];
    }
    
    // Verificar tanto com número normalizado quanto original
    const isManual = sessionManualMode.get(normalizedPhone) === true || 
                     sessionManualMode.get(phoneNumber) === true;
    
    // Log para debug
    if (isManual) {
      logger.wpp(userId, slot, `🔍 Modo manual encontrado para ${normalizedPhone} (original: ${phoneNumber})`);
    }
    
    return isManual;
  }

  /**
   * Remove modo manual de uma conversa
   */
  clearManualMode(userId, slot, phoneNumber) {
    const key = this.getKey(userId, slot);
    const sessionManualMode = this.manualMode.get(key);
    
    if (sessionManualMode) {
      sessionManualMode.delete(phoneNumber);
    }
  }
}

export default new SessionManager();

