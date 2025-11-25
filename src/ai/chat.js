import axios from 'axios';
import config from '../../config.js';
import logger from '../utils/logger.js';

/**
 * Integração com OpenRouter (GPT-4o)
 */

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o';

/**
 * Envia mensagem para o GPT-4o
 * @param {string} userMessage - Mensagem do usuário
 * @param {Array} conversationHistory - Histórico de mensagens
 * @param {Object} settings - Configurações do bot
 * @returns {Promise<string>} - Resposta do GPT
 */
export async function sendToGPT(userMessage, conversationHistory = [], settings = {}) {
  try {
    const {
      botName = 'Assistente',
      storeType = 'loja',
      lineLimit = 8,
      basePrompt = ''
    } = settings;

    // Monta o prompt base
    const systemPrompt = buildSystemPrompt(botName, storeType, lineLimit, basePrompt);

    // Monta as mensagens
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    logger.ai('Enviando mensagem para GPT-4o', {
      model: MODEL,
      messagesCount: messages.length,
      userMessage: userMessage.substring(0, 100)
    });

    const response = await axios.post(
      OPENROUTER_ENDPOINT,
      {
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openRouterKey}`,
          'HTTP-Referer': 'https://platefull.com.br',
          'X-Title': 'Platefull WhatsApp Bot',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const reply = response.data.choices[0].message.content;
    
    // Limita número de linhas
    const limitedReply = limitLines(reply, lineLimit);

    logger.ai('Resposta recebida do GPT-4o', {
      originalLength: reply.length,
      finalLength: limitedReply.length,
      linesCount: limitedReply.split('\n').length
    });

    return limitedReply;

  } catch (error) {
    logger.error('Erro ao comunicar com OpenRouter:', error);
    
    if (error.response) {
      logger.error('Resposta do OpenRouter:', {
        status: error.response.status,
        data: error.response.data
      });
    }

    throw new Error('Erro ao processar sua mensagem. Tente novamente.');
  }
}

/**
 * Constrói o prompt do sistema
 */
function buildSystemPrompt(botName, storeType, lineLimit, basePrompt) {
  let prompt = basePrompt || '';

  // Adiciona instruções base se não houver prompt customizado
  if (!prompt) {
    prompt = `Você é ${botName}, um assistente virtual de atendimento ao cliente`;
    
    if (storeType) {
      const storeDescriptions = {
        'pizzaria': 'de uma pizzaria',
        'mercado': 'de um mercado',
        'lanchonete': 'de uma lanchonete',
        'restaurante': 'de um restaurante',
        'loja': 'de uma loja'
      };
      prompt += ` ${storeDescriptions[storeType] || 'de um estabelecimento comercial'}`;
    }

    prompt += `.

Suas características:
- Seja educado, prestativo e objetivo
- Responda de forma clara e direta
- Use linguagem natural e amigável
- Não seja prolixo
- Ajude o cliente com suas dúvidas e pedidos
`;
  }

  prompt += `\n\nIMPORTANTE: Suas respostas devem ter no máximo ${lineLimit} linhas. Seja conciso!`;

  return prompt;
}

/**
 * Limita o número de linhas da resposta
 */
function limitLines(text, maxLines) {
  const lines = text.split('\n');
  
  if (lines.length <= maxLines) {
    return text;
  }

  return lines.slice(0, maxLines).join('\n') + '\n...';
}

/**
 * Formata histórico de conversa para o formato do GPT
 */
export function formatConversationHistory(messages, contextLimit = 10) {
  // Pega apenas as últimas N mensagens
  const recentMessages = messages.slice(-contextLimit);

  return recentMessages.map(msg => ({
    role: msg.fromMe ? 'assistant' : 'user',
    content: msg.text
  }));
}

