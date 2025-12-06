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
   * Gera chave única para identificar sessão
   */
  getKey(userId, slot) {
    return `${userId}:${slot}`;
  }

  /**
   * Adiciona cliente WPPConnect
   */
  setClient(userId, slot, client) {
    const key = this.getKey(userId, slot);
    this.clients.set(key, client);
    logger.wpp(userId, slot, 'Cliente armazenado na memória');
  }

  /**
   * Busca cliente WPPConnect
   */
  getClient(userId, slot) {
    const key = this.getKey(userId, slot);
    return this.clients.get(key);
  }

  /**
   * Remove cliente
   */
  removeClient(userId, slot) {
    const key = this.getKey(userId, slot);
    const client = this.clients.get(key);
    
    if (client) {
      this.clients.delete(key);
      logger.wpp(userId, slot, 'Cliente removido da memória');
    }
    
    return client;
  }

  /**
   * Verifica se existe cliente ativo
   */
  hasClient(userId, slot) {
    const key = this.getKey(userId, slot);
    return this.clients.has(key);
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

