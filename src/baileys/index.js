/**
 * Módulo Baileys (teste paralelo ao WPPConnect).
 * Não importa src/wpp/**.
 */
export {
  startClient,
  sendMessage,
  startTyping,
  stopTyping,
  onMessage,
  getQr,
  getSessionStatus,
  simulateIncoming,
  BAILEYS_TEST_USER_ID,
  BAILEYS_TEST_SLOT,
} from './adapter.js';

export {
  normalizeBaileysMessage,
  messageArchiveExpectedFields,
} from './normalizeMessage.js';
