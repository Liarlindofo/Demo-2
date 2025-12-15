import wppconnect from '@wppconnect-team/wppconnect';
import config from '../../config.js';
import logger from '../utils/logger.js';
import prisma from '../db/index.js';
import sessionManager from './sessionManager.js';
import { onQRCode, onStatusChange, extractPhoneNumber } from './qrHandler.js';
import { WhatsAppBotModel, BotSettingsModel } from '../db/models.js';
import { sendToGPT, formatConversationHistory } from '../ai/chat.js';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Controle de modo manual (pausa do bot) por conversa.
 * A chave considera usuário, slot e número do cliente para evitar colisões.
 */
const pausedChats = new Set();

function getChatKey(userId, slot, phone) {
  return `${userId}:${slot}:${phone}`;
}

/**
 * Pausa um chat específico (modo humano).
 */
export function pauseChat(userId, slot, phone) {
  const key = getChatKey(userId, slot, phone);
  pausedChats.add(key);
  logger.wpp(userId, slot, `🛑 pauseChat -> Bot pausado para ${phone}`);
}

/**
 * Retoma um chat específico (modo automático).
 */
export function resumeChat(userId, slot, phone) {
  const key = getChatKey(userId, slot, phone);
  pausedChats.delete(key);
  logger.wpp(userId, slot, `✅ resumeChat -> Bot reativado para ${phone}`);
}

/**
 * Verifica se o chat está em modo manual (pausado).
 */
export function isChatPaused(userId, slot, phone) {
  const key = getChatKey(userId, slot, phone);
  return pausedChats.has(key);
}

/**
 * Limpa processos de browser órfãos e lock files
 */
async function cleanupOrphanBrowser(userDataDir) {
  try {
    logger.info(`🧹 Iniciando limpeza DRÁSTICA para: ${userDataDir}`);
    
    // Extrair o nome da sessão do userDataDir (última parte do caminho)
    const sessionName = path.basename(userDataDir);
    logger.info(`📌 Nome da sessão: ${sessionName}`);
    
    // PASSO 1: Matar TODOS os processos Chrome relacionados a esta sessão
    // Método 1: Buscar por userDataDir completo
    try {
      const { stdout: stdout1 } = await execAsync(`ps aux | grep -i "chrome" | grep "${userDataDir}" | grep -v grep | awk '{print $2}'`).catch(() => ({ stdout: '' }));
      const pids1 = stdout1.trim().split('\n').filter(pid => pid && !isNaN(pid));
      
      // Método 2: Buscar por nome da sessão
      const { stdout: stdout2 } = await execAsync(`ps aux | grep -i "chrome" | grep "${sessionName}" | grep -v grep | awk '{print $2}'`).catch(() => ({ stdout: '' }));
      const pids2 = stdout2.trim().split('\n').filter(pid => pid && !isNaN(pid));
      
      // Método 3: Buscar todos os processos Chrome que usam o diretório de sessões
      const sessionsDir = path.dirname(userDataDir);
      const { stdout: stdout3 } = await execAsync(`ps aux | grep -i "chrome" | grep "${sessionsDir}" | grep -v grep | awk '{print $2}'`).catch(() => ({ stdout: '' }));
      const pids3 = stdout3.trim().split('\n').filter(pid => pid && !isNaN(pid));
      
      // Combinar todos os PIDs únicos
      const allPids = [...new Set([...pids1, ...pids2, ...pids3])];
      
      if (allPids.length > 0) {
        logger.warn(`⚠️ Encontrados ${allPids.length} processos órfãos para ${sessionName}`);
        for (const pid of allPids) {
          try {
            logger.info(`💀 Finalizando processo ${pid}...`);
            await execAsync(`kill -9 ${pid} 2>/dev/null`).catch(() => {});
            logger.info(`✅ Processo ${pid} finalizado`);
          } catch (killError) {
            logger.warn(`⚠️ Não foi possível finalizar processo ${pid}: ${killError.message}`);
          }
        }
      } else {
        logger.info('✅ Nenhum processo órfão encontrado pelo método ps');
      }
    } catch (psError) {
      logger.warn(`⚠️ Método ps falhou: ${psError.message}`);
    }
    
    // PASSO 1.5: Usar pkill como método adicional (mais agressivo)
    try {
      // Matar processos pelo userDataDir
      await execAsync(`pkill -9 -f "${userDataDir}" 2>/dev/null`).catch(() => {});
      
      // Matar processos pelo nome da sessão
      await execAsync(`pkill -9 -f "${sessionName}" 2>/dev/null`).catch(() => {});
      
      logger.info('✅ Processos finalizados via pkill');
    } catch (pkillError) {
      logger.warn(`⚠️ pkill falhou: ${pkillError.message}`);
    }
    
    // Aguardar para garantir que processos foram encerrados
    logger.info('⏳ Aguardando 3 segundos para processos encerrarem...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // PASSO 1.6: Verificar se ainda há processos e matar TODOS os Chrome se necessário
    try {
      const { stdout: checkStdout } = await execAsync(`ps aux | grep -iE "chrome|chromium" | grep -v grep | wc -l`).catch(() => ({ stdout: '0' }));
      const chromeCount = parseInt(checkStdout.trim()) || 0;
      
      if (chromeCount > 10) {
        logger.warn(`⚠️ Muitos processos Chrome rodando (${chromeCount}). Matando todos os processos Chrome relacionados ao WhatsApp...`);
        await execAsync(`pkill -9 -f "whatsapp" 2>/dev/null`).catch(() => {});
        await execAsync(`pkill -9 -f "wppconnect" 2>/dev/null`).catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (checkError) {
      // Ignorar erro de verificação
    }

    // PASSO 2: DELETAR A PASTA INTEIRA E RECRIAR (método mais drástico)
    if (fs.existsSync(userDataDir)) {
      try {
        logger.warn(`🗑️ DELETANDO pasta inteira: ${userDataDir}`);
        
        // Tentar deletar recursivamente
        try {
          fs.rmSync(userDataDir, { recursive: true, force: true });
          logger.info('✅ Pasta deletada com fs.rmSync');
        } catch (rmError) {
          logger.warn(`⚠️ fs.rmSync falhou: ${rmError.message}, tentando rm -rf...`);
          
          // Tentar com comando rm -rf
          try {
            await execAsync(`rm -rf "${userDataDir}"`);
            logger.info('✅ Pasta deletada com rm -rf');
          } catch (rmRfError) {
            logger.error(`❌ rm -rf também falhou: ${rmRfError.message}`);
          }
        }
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Recriar pasta vazia
        if (!fs.existsSync(userDataDir)) {
          fs.mkdirSync(userDataDir, { recursive: true });
          logger.info(`✅ Pasta recriada: ${userDataDir}`);
        }
      } catch (deleteError) {
        logger.error(`❌ Erro ao deletar/recriar pasta: ${deleteError.message}`);
      }
    } else {
      logger.info('📁 Pasta não existe, criando nova...');
      fs.mkdirSync(userDataDir, { recursive: true });
    }
    
    logger.info('✅ Limpeza DRÁSTICA concluída - pasta completamente resetada');
  } catch (error) {
    logger.error(`❌ Erro ao limpar processos órfãos: ${error.message}`);
  }
}

/**
 * Inicia cliente WPPConnect para um usuário — NÃO BLOQUEIA
 * SLOT FIXO = 1 (apenas uma sessão por usuário)
 */
export async function startClient(userId) {
  // SLOT FIXO: sempre 1
  const slot = 1;
  let normalizedUserId = null;

  try {
    // VALIDAÇÃO CRÍTICA: Garantir que userId é válido (ANTES de normalizar)
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      logger.error(`[startClient] userId inválido: ${userId}`);
      throw new Error(`userId inválido: ${userId}`);
    }

    // Normalizar userId (remover espaços, garantir que é string) - FAZER PRIMEIRO!
    normalizedUserId = String(userId).trim();
    
    logger.info(`[startClient] userId original: "${userId}", normalizado: "${normalizedUserId}"`);
    logger.wpp(normalizedUserId, slot, 'Iniciando cliente WPPConnect (não bloqueante)...');

    // ❌ BLOQUEAR: Este usuário já possui uma sessão WhatsApp ativa
    // IMPORTANTE: Verificar usando normalizedUserId para garantir consistência
    if (sessionManager.hasClient(normalizedUserId, slot)) {
      logger.warn(`[startClient] ⚠️ Usuário ${normalizedUserId} já possui uma sessão WhatsApp ativa em memória`);
      
      // Verificar se está realmente conectado no banco
      const bot = await WhatsAppBotModel.findByUserAndSlot(normalizedUserId, slot);
      if (bot && bot.qrCode) {
        logger.info(`[startClient] ✅ Sessão já existe com QR Code para userId: "${normalizedUserId}"`);
        return { 
          success: true, 
          message: 'Cliente já está ativo com QR Code',
          qrCode: bot.qrCode,
          isConnected: bot.isConnected
        };
      }
      
      logger.warn(`[startClient] ⚠️ Sessão em memória mas sem QR Code no banco. Removendo sessão em memória...`);
      // Remover sessão em memória se não há QR Code no banco (pode ser sessão órfã)
      sessionManager.removeClient(normalizedUserId, slot);
      // Continuar para criar nova sessão
    }
    
    // ISOLAMENTO TOTAL: Gerar sessionName único por usuário (SEM slot no nome)
    // IMPORTANTE: Sanitizar userId para evitar problemas com caracteres especiais no nome do arquivo
    const sanitizedUserId = normalizedUserId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const sessionName = `whatsapp_${sanitizedUserId}`;
    
    // Diretório de sessão 100% isolado por usuário
    // Slot é fixo = 1, então nunca há mais de uma sessão por StackUser.
    // NUNCA reutilizar diretórios, NUNCA compartilhar Chrome entre usuários.
    const userDataDir = `/var/www/whatsapp-sessions/${sessionName}`;
    
    // LOG DE DEBUG - ISOLAMENTO (CRÍTICO PARA DIAGNÓSTICO)
    console.log('='.repeat(70));
    console.log('🔍 DEBUG ISOLAMENTO SESSÃO - CRÍTICO');
    console.log('='.repeat(70));
    console.log('📌 userId recebido (original):', JSON.stringify(userId));
    console.log('📌 userId normalizado:', JSON.stringify(normalizedUserId));
    console.log('📌 userId sanitizado (para arquivo):', JSON.stringify(sanitizedUserId));
    console.log('📌 userId type:', typeof normalizedUserId);
    console.log('📌 userId length:', normalizedUserId.length);
    console.log('📌 slot: 1 (FIXO)');
    console.log('📌 sessionName gerado:', sessionName);
    console.log('📌 userDataDir:', userDataDir);
    console.log('📌 Process ID:', process.pid);
    console.log('📌 Timestamp:', new Date().toISOString());
    console.log('='.repeat(70));
    
    logger.info(`[startClient] ISOLAMENTO - userId: "${normalizedUserId}" -> sessionName: "${sessionName}" -> userDataDir: "${userDataDir}"`);
    
    // VERIFICAÇÃO CRÍTICA: Garantir que o diretório de sessão é único para este usuário
    // Se outro usuário estiver usando o mesmo diretório, isso é um BUG CRÍTICO
    if (fs.existsSync(userDataDir)) {
      // Verificar se há algum arquivo de lock ou sessão de outro usuário
      try {
        const lockFiles = fs.readdirSync(userDataDir).filter(f => f.includes('lock') || f.includes('session'));
        if (lockFiles.length > 0) {
          logger.warn(`[startClient] ⚠️ Diretório ${userDataDir} já existe com arquivos. Isso é normal se for a primeira vez após limpeza.`);
        }
      } catch (err) {
        // Ignorar erro de leitura
      }
    }

    // IMPORTANTE: Limpar processos órfãos AGRESSIVAMENTE
    logger.wpp(normalizedUserId, slot, `🧹 Limpando processos órfãos e locks para userId: "${normalizedUserId}"...`);
    await cleanupOrphanBrowser(userDataDir);
    
    // Verificar se ainda há processos rodando ANTES de tentar criar o cliente
    try {
      const { stdout: checkStdout } = await execAsync(`ps aux | grep -iE "chrome|chromium" | grep "${sessionName}" | grep -v grep | wc -l`).catch(() => ({ stdout: '0' }));
      const stillRunning = parseInt(checkStdout.trim()) || 0;
      
      if (stillRunning > 0) {
        logger.warn(`⚠️ Ainda há ${stillRunning} processos Chrome rodando para ${sessionName}. Tentando limpeza adicional...`);
        
        // Limpeza adicional mais agressiva
        try {
          await execAsync(`pkill -9 -f "${sessionName}" 2>/dev/null`).catch(() => {});
          await execAsync(`pkill -9 -f "${userDataDir}" 2>/dev/null`).catch(() => {});
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Verificar novamente
          const { stdout: recheckStdout } = await execAsync(`ps aux | grep -iE "chrome|chromium" | grep "${sessionName}" | grep -v grep | wc -l`).catch(() => ({ stdout: '0' }));
          const stillRunningAfter = parseInt(recheckStdout.trim()) || 0;
          
          if (stillRunningAfter > 0) {
            logger.error(`❌ AINDA há ${stillRunningAfter} processos rodando após limpeza adicional. Isso pode causar erro "browser already running".`);
            // Continuar mesmo assim, mas avisar
          } else {
            logger.info(`✅ Limpeza adicional bem-sucedida. Nenhum processo restante.`);
          }
        } catch (additionalCleanupError) {
          logger.warn(`⚠️ Erro na limpeza adicional: ${additionalCleanupError.message}`);
        }
      } else {
        logger.info('✅ Nenhum processo Chrome rodando para esta sessão. Prosseguindo...');
      }
    } catch (checkError) {
      logger.warn(`⚠️ Erro ao verificar processos: ${checkError.message}. Prosseguindo mesmo assim...`);
    }
    
    // Aguardar um pouco após limpeza para garantir que os processos foram encerrados
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Prepara opções do Puppeteer com userDataDir
    const basePuppeteerOptions = (config.wppConnect && config.wppConnect.puppeteerOptions) || {};
    const puppeteerOptions = Object.assign({}, basePuppeteerOptions, {
      userDataDir: userDataDir
    });

    // Garante que o bot existe no banco antes de iniciar
    try {
      // VALIDAÇÃO: Verificar se o usuário existe antes de criar bot
      const stackUser = await prisma.stackUser.findUnique({
        where: { id: userId }
      });
      
      if (!stackUser) {
        logger.error(`[startClient] Usuário ${userId} não encontrado em stack_users`);
        throw new Error(`Usuário ${userId} não encontrado em stack_users`);
      }
      
      logger.info(`[startClient] ✅ Usuário validado: ${stackUser.id} (${stackUser.primaryEmail})`);
      
      await WhatsAppBotModel.upsert(userId, slot, {
        isConnected: false,
        qrCode: null,
        connectedNumber: null
      });
      
      logger.info(`[startClient] ✅ Bot criado/atualizado no banco para [${userId}:${slot}]`);
    } catch (error) {
      logger.error(`Erro ao criar/atualizar bot no banco [${userId}:${slot}]:`, error);
      throw error; // Re-throw para não continuar com erro
    }

    // NÃO USA await → inicia em background
    const headless = (config.wppConnect && config.wppConnect.headless) !== undefined 
      ? config.wppConnect.headless 
      : true;
    
    wppconnect
      .create({
        session: sessionName,
        headless: headless,
        puppeteerOptions: puppeteerOptions,
        // Não fechar automaticamente a sessão enquanto aguarda leitura do QR
        // 0 (ou false) desabilita o auto close, evitando "Auto Close remain" e "Failed to authenticate"
        autoClose: 0,
        logQR: false,
        disableWelcome: true,
        updatesLog: false,

        catchQR: async (base64Qr) => {
          await onQRCode(normalizedUserId, slot, base64Qr);
        },

        statusFind: async (status, session) => {
          // Obtém o client do sessionManager para passar ao onStatusChange
          const client = sessionManager.getClient(normalizedUserId, slot);
          await onStatusChange(normalizedUserId, slot, status, client);
        },
      })
      .then(async (client) => {
        logger.wpp(normalizedUserId, slot, 'Cliente WPPConnect criado.');
        // IMPORTANTE: Usar normalizedUserId para garantir consistência
        sessionManager.setClient(normalizedUserId, slot, client);
        
        // Configurar listener de mensagens (usar normalizedUserId)
        setupMessageListener(client, normalizedUserId, slot);
        
        // Verifica se já está conectado após criar o client
        try {
          const isConnected = await client.isConnected().catch(() => false);
          if (isConnected) {
            logger.wpp(normalizedUserId, slot, 'Cliente já está conectado, atualizando status...');
            await onStatusChange(normalizedUserId, slot, 'chatsAvailable', client);
          }
        } catch (error) {
          // Ignora erro na verificação inicial
        }
      })
      .catch(async (error) => {
        logger.error(`Erro ao criar cliente [${normalizedUserId}:${slot}]`, error);
        
        // Se o erro for "browser already running", tentar limpar e tentar novamente uma vez
        if (error.message && (error.message.includes('browser is already running') || error.message.includes('already running'))) {
          logger.warn(`Browser já está rodando para ${userDataDir}, tentando limpeza EXTRA AGRESSIVA...`);
          
          // Limpeza EXTRA AGRESSIVA
          try {
            // Matar TODOS os processos Chrome relacionados
            await execAsync(`pkill -9 -f "${sessionName}" 2>/dev/null`).catch(() => {});
            await execAsync(`pkill -9 -f "${userDataDir}" 2>/dev/null`).catch(() => {});
            await execAsync(`pkill -9 -f "whatsapp.*${sessionName}" 2>/dev/null`).catch(() => {});
            
            // Deletar a pasta inteira e recriar
            if (fs.existsSync(userDataDir)) {
              try {
                fs.rmSync(userDataDir, { recursive: true, force: true });
                logger.info('✅ Pasta deletada durante limpeza extra');
              } catch (rmError) {
                await execAsync(`rm -rf "${userDataDir}" 2>/dev/null`).catch(() => {});
              }
              await new Promise(resolve => setTimeout(resolve, 2000));
              if (!fs.existsSync(userDataDir)) {
                fs.mkdirSync(userDataDir, { recursive: true });
                logger.info('✅ Pasta recriada durante limpeza extra');
              }
            }
            
            // Aguardar mais tempo
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            logger.wpp(normalizedUserId, slot, 'Limpeza extra concluída. Tentando criar cliente novamente...');
          } catch (cleanupError) {
            logger.error(`Erro na limpeza extra: ${cleanupError.message}`);
          }
          
          // Tentar criar novamente (apenas uma vez)
          try {
            logger.wpp(normalizedUserId, slot, 'Tentando criar cliente novamente após limpeza extra...');
            
            wppconnect
              .create({
                session: sessionName,
                headless: headless,
                puppeteerOptions: puppeteerOptions,
                autoClose: 0,
                logQR: false,
                disableWelcome: true,
                updatesLog: false,
                catchQR: async (base64Qr) => {
                  await onQRCode(normalizedUserId, slot, base64Qr);
                },
                statusFind: async (status, session) => {
                  const client = sessionManager.getClient(normalizedUserId, slot);
                  await onStatusChange(normalizedUserId, slot, status, client);
                },
              })
              .then(async (client) => {
                logger.wpp(normalizedUserId, slot, '✅ Cliente WPPConnect criado após limpeza extra.');
                sessionManager.setClient(normalizedUserId, slot, client);
                setupMessageListener(client, normalizedUserId, slot);
                
                try {
                  const isConnected = await client.isConnected().catch(() => false);
                  if (isConnected) {
                    logger.wpp(normalizedUserId, slot, 'Cliente já está conectado, atualizando status...');
                    await onStatusChange(normalizedUserId, slot, 'chatsAvailable', client);
                  }
                } catch (error) {
                  // Ignora erro na verificação inicial
                }
              })
              .catch((retryError) => {
                logger.error(`❌ Erro ao criar cliente após limpeza extra [${normalizedUserId}:${slot}]:`, retryError);
                sessionManager.removeClient(normalizedUserId, slot);
                WhatsAppBotModel.setDisconnected(normalizedUserId, slot).catch(() => {});
                
                // Se ainda falhar, marcar no banco que houve erro
                WhatsAppBotModel.upsert(normalizedUserId, slot, {
                  isConnected: false,
                  qrCode: null,
                  connectedNumber: null
                }).catch(() => {});
              });
          } catch (retryError) {
            logger.error(`❌ Erro na tentativa de retry [${normalizedUserId}:${slot}]:`, retryError);
            sessionManager.removeClient(normalizedUserId, slot);
            WhatsAppBotModel.setDisconnected(normalizedUserId, slot).catch(() => {});
          }
        } else {
          // Para outros erros, apenas remove e marca como desconectado
          logger.error(`Erro ao criar cliente [${normalizedUserId}:${slot}]:`, error.message);
          sessionManager.removeClient(normalizedUserId, slot);
          WhatsAppBotModel.setDisconnected(normalizedUserId, slot).catch(() => {});
        }
      });

    return {
      success: true,
      message: 'Sessão iniciada, aguardando QR.',
      isConnected: false,
    };

  } catch (error) {
    // Usar normalizedUserId se disponível, senão usar userId original
    const errorUserId = typeof normalizedUserId !== 'undefined' ? normalizedUserId : userId;
    logger.error(`Erro ao iniciar cliente [${errorUserId}:${slot}]:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * PARA cliente WPPConnect
 * SLOT FIXO = 1 (apenas uma sessão por usuário)
 */
export async function stopClient(userId) {
  // SLOT FIXO: sempre 1
  const slot = 1;
  
  try {
    // VALIDAÇÃO: Normalizar userId
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      logger.error(`[stopClient] userId inválido: ${userId}`);
      return { success: false, message: 'userId inválido' };
    }
    
    const normalizedUserId = String(userId).trim();
    
    logger.info(`[stopClient] Parando cliente para userId: "${normalizedUserId}" (original: "${userId}")`);
    
    // ISOLAMENTO TOTAL: Buscar apenas a sessão deste usuário
    const client = sessionManager.getClient(normalizedUserId, slot);

    if (!client) {
      logger.warn(`[stopClient] Cliente não encontrado para usuário ${normalizedUserId}`);
      return { success: false, message: 'Cliente não está ativo' };
    }

    logger.info(`[stopClient] ✅ Cliente encontrado. Fechando...`);
    await client.close();
    sessionManager.removeClient(normalizedUserId, slot);
    sessionManager.clearAllConversations(normalizedUserId, slot);
    await WhatsAppBotModel.setDisconnected(normalizedUserId, slot);

    logger.info(`[stopClient] ✅ Cliente desconectado com sucesso para usuário ${normalizedUserId}`);
    return { success: true, message: 'Cliente desconectado com sucesso' };

  } catch (error) {
    logger.error(`Erro ao parar cliente [${userId}]:`, error);
    return { success: false, message: error.message };
  }
}

/**
 * Obtém status do cliente
 * SLOT FIXO = 1 (apenas uma sessão por usuário)
 */
export async function getClientStatus(userId) {
  // SLOT FIXO: sempre 1
  const slot = 1;
  
  // VALIDAÇÃO: Normalizar userId
  if (!userId || typeof userId !== 'string') {
    return { isActive: false, isConnected: false };
  }
  
  const normalizedUserId = String(userId).trim();
  const client = sessionManager.getClient(normalizedUserId, slot);

  if (!client) {
    return { isActive: false, isConnected: false };
  }

  try {
    const isConnected = await client.isConnected().catch(() => false);
    return { isActive: true, isConnected };

  } catch {
    return { isActive: true, isConnected: false };
  }
}

/**
 * Configura listener de mensagens para processar com IA
 */
function setupMessageListener(client, userId, slot) {
  // Usamos onAnyMessage para receber TANTO mensagens do cliente
  // quanto mensagens enviadas pelo próprio número conectado (fromMe === true).
  client.onAnyMessage(async (message) => {
    try {
      // Ignorar mensagens de grupos
      if (message.isGroupMsg) {
        return;
      }

      // Processar apenas mensagens de texto
      if (message.type !== 'chat' && message.type !== 'text') {
        return;
      }

      const rawText = (message.body || message.text || '').trim();
      if (!rawText) {
        return;
      }

      const text = rawText.toLowerCase();

      // Identificador da conversa (número do cliente).
      // - Se a mensagem vem do cliente (fromMe === false): message.from é o cliente
      // - Se a mensagem vem do atendente (fromMe === true): message.to/chatId é o cliente
      const phoneRaw = message.fromMe
        ? (message.to || message.chatId || (message.chat && message.chat.id) || message.from)
        : message.from;
      const phone = extractPhoneNumber(phoneRaw) || phoneRaw;

      logger.wpp(
        userId,
        slot,
        `📩 Mensagem recebida - from: ${message.from}, to: ${message.to}, fromMe: ${message.fromMe}, phone(normalizado): ${phone}, body: "${rawText}"`
      );

      // ---------------------------------------------
      // 1) Comandos do atendente (#boa noite / #voltar)
      // ---------------------------------------------
      if (message.fromMe) {
        if (text === '#boa noite') {
          pauseChat(userId, slot, phone);
          logger.wpp(userId, slot, `🛑 Bot pausado para o número ${phone} por um atendente humano.`);

          // Opcional: confirmação para o atendente (não para o cliente)
          try {
            await client.sendText(message.from, `🛑 Bot pausado para ${phone}. Use #voltar para reativar.`);
          } catch {
            // Se falhar, apenas logamos – não é crítico
          }

          return; // NÃO seguir para fluxo automático
        }

        if (text === '#voltar') {
          resumeChat(userId, slot, phone);
          logger.wpp(userId, slot, `🤖 Bot reativado para o número ${phone} por um atendente.`);

          try {
            await client.sendText(message.from, `🤖 Bot reativado para ${phone}.`);
          } catch {
            // Silenciar erro de confirmação
          }

          return;
        }

        // Mensagens normais do atendente (sem comando) não entram no fluxo do bot
        return;
      }

      // ---------------------------------------------
      // 2) Mensagens do cliente com chat pausado
      // ---------------------------------------------
      if (isChatPaused(userId, slot, phone)) {
        logger.wpp(userId, slot, `🔕 Chat ${phone} está em modo humano. Bot não responderá.`);
        return;
      }

      // A partir deste ponto, só lidamos com mensagens do cliente em modo automático

      logger.wpp(userId, slot, `📨 Mensagem recebida do CLIENTE ${phone} (${message.from})`);

      // Buscar configurações do bot
      const botSettings = await BotSettingsModel.findByUser(userId).catch(() => null);

      if (!botSettings || !botSettings.isActive) {
        logger.wpp(userId, slot, 'Bot desabilitado, ignorando mensagem');
        return;
      }

      logger.wpp(userId, slot, `🤖 Modo automático - Processando mensagem com IA para ${phone}`);

      // Buscar histórico de conversa (últimas N mensagens)
      const conversationHistory = sessionManager.getConversation(
        userId,
        slot,
        phone,
        botSettings.contextLimit || 10
      );

      // Formatar histórico para o GPT
      const formattedHistory = formatConversationHistory(conversationHistory, botSettings.contextLimit || 10);

      // Preparar configurações para o GPT
      const gptSettings = {
        botName: botSettings.botName || 'Assistente',
        storeType: botSettings.storeType || 'restaurant',
        lineLimit: botSettings.lineLimit || 5,
        basePrompt: botSettings.basePrompt || ''
      };

      // Enviar para GPT e obter resposta
      logger.ai(`Processando mensagem com IA [${userId}:${slot}]`);
      const aiResponse = await sendToGPT(rawText, formattedHistory, gptSettings);

      // Salvar mensagem do usuário no histórico
      sessionManager.addMessage(userId, slot, phone, {
        body: rawText,
        fromMe: false,
        timestamp: Date.now()
      });

      // Enviar resposta para o cliente
      await client.sendText(message.from, aiResponse);
      logger.success(`Resposta enviada para ${phone} (${message.from})`);

      // Salvar resposta do bot no histórico
      sessionManager.addMessage(userId, slot, phone, {
        body: aiResponse,
        fromMe: true,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error(`Erro ao processar mensagem [${userId}:${slot}]:`, error.message || error);
      try {
        await client.sendText(message.from, 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
      } catch (sendError) {
        logger.error('Erro ao enviar mensagem de erro:', sendError.message || sendError);
      }
    }
  });
}

export async function restoreAllSessions() {
  try {
    logger.info('Restaurando sessões...');
    
    // Busca todos os bots do banco (não apenas conectados, para restaurar todos)
    const allBots = await prisma.whatsAppBot.findMany();

    logger.info(`Encontrados ${allBots.length} bots para restaurar`);

    for (const bot of allBots) {
      logger.info(`Restaurando sessão [${bot.userId}:${bot.slot}]`);
      // Inicia em background, não bloqueia
      startClient(bot.userId, bot.slot).catch(error => {
        logger.error(`Erro ao restaurar sessão [${bot.userId}:${bot.slot}]:`, error);
      });
    }

    logger.success(`✓ Restauração de sessões concluída`);

  } catch (error) {
    logger.error('Erro ao restaurar sessões:', error);
  }
}

