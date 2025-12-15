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
    logger.info(`🧹 Iniciando limpeza ULTRA AGRESSIVA para: ${userDataDir}`);
    
    // Extrair o nome da sessão do userDataDir (última parte do caminho)
    const sessionName = path.basename(userDataDir);
    logger.info(`📌 Nome da sessão: ${sessionName}`);
    
    // PASSO 1: REMOVER LOCK FILES DO CHROME ANTES DE TUDO
    // Chrome cria locks que impedem a criação de novas instâncias
    if (fs.existsSync(userDataDir)) {
      try {
        const lockFiles = [
          path.join(userDataDir, 'SingletonLock'),
          path.join(userDataDir, 'LockFile'),
          path.join(userDataDir, 'lockfile'),
          path.join(userDataDir, 'Default', 'SingletonLock'),
          path.join(userDataDir, 'Default', 'LockFile'),
          path.join(userDataDir, 'Default', 'lockfile'),
        ];
        
        for (const lockFile of lockFiles) {
          try {
            if (fs.existsSync(lockFile)) {
              fs.unlinkSync(lockFile);
              logger.info(`🔓 Lock file removido: ${lockFile}`);
            }
          } catch (lockError) {
            // Ignorar erro se arquivo não existe ou está em uso
          }
        }
      } catch (lockCleanError) {
        logger.warn(`⚠️ Erro ao remover locks: ${lockCleanError.message}`);
      }
    }
    
    // PASSO 2: Usar lsof para encontrar processos usando arquivos na pasta (MÉTODO MAIS PRECISO)
    try {
      const { stdout: lsofStdout } = await execAsync(
        `lsof +D "${userDataDir}" 2>/dev/null | grep -iE "chrome|chromium" | awk '{print $2}' | sort -u`
      ).catch(() => ({ stdout: '' }));
      
      const lsofPids = lsofStdout.trim().split('\n').filter(pid => pid && !isNaN(pid));
      
      if (lsofPids.length > 0) {
        logger.warn(`⚠️ [lsof] Encontrados ${lsofPids.length} processos usando arquivos em ${userDataDir}`);
        for (const pid of lsofPids) {
          try {
            logger.info(`💀 [lsof] Finalizando processo ${pid}...`);
            await execAsync(`kill -9 ${pid} 2>/dev/null`).catch(() => {});
            logger.info(`✅ [lsof] Processo ${pid} finalizado`);
          } catch (killError) {
            logger.warn(`⚠️ [lsof] Não foi possível finalizar processo ${pid}: ${killError.message}`);
          }
        }
      }
    } catch (lsofError) {
      logger.warn(`⚠️ lsof não disponível ou falhou: ${lsofError.message}`);
    }
    
    // PASSO 3: Matar processos Chrome/Chromium relacionados APENAS a esta sessão.
    // IMPORTANTE (multi-tenant): NUNCA matar processos pelo diretório pai (ex: /var/www/whatsapp-sessions),
    // pois isso derruba sessões de outros usuários e causa "browserClose".
    // Método 1: Buscar por userDataDir completo
    try {
      const { stdout: stdout1 } = await execAsync(
        `ps aux | grep -iE "chrome|chromium" | grep "${userDataDir}" | grep -v grep | awk '{print $2}'`
      ).catch(() => ({ stdout: '' }));
      const pids1 = stdout1.trim().split('\n').filter(pid => pid && !isNaN(pid));
      
      // Método 2: Buscar por nome da sessão
      const { stdout: stdout2 } = await execAsync(
        `ps aux | grep -iE "chrome|chromium" | grep "${sessionName}" | grep -v grep | awk '{print $2}'`
      ).catch(() => ({ stdout: '' }));
      const pids2 = stdout2.trim().split('\n').filter(pid => pid && !isNaN(pid));

      // Combinar todos os PIDs únicos (apenas do userDataDir/sessionName)
      const allPids = [...new Set([...pids1, ...pids2])];
      
      if (allPids.length > 0) {
        logger.warn(`⚠️ [ps] Encontrados ${allPids.length} processos órfãos para ${sessionName}`);
        for (const pid of allPids) {
          try {
            logger.info(`💀 [ps] Finalizando processo ${pid}...`);
            await execAsync(`kill -9 ${pid} 2>/dev/null`).catch(() => {});
            logger.info(`✅ [ps] Processo ${pid} finalizado`);
          } catch (killError) {
            logger.warn(`⚠️ [ps] Não foi possível finalizar processo ${pid}: ${killError.message}`);
          }
        }
      } else {
        logger.info('✅ [ps] Nenhum processo órfão encontrado');
      }
    } catch (psError) {
      logger.warn(`⚠️ Método ps falhou: ${psError.message}`);
    }
    
    // PASSO 4: Usar pkill como método adicional (mais agressivo)
    try {
      // Matar processos pelo userDataDir
      await execAsync(`pkill -9 -f "${userDataDir}" 2>/dev/null`).catch(() => {});
      
      // Matar processos pelo nome da sessão
      await execAsync(`pkill -9 -f "${sessionName}" 2>/dev/null`).catch(() => {});
      
      logger.info('✅ Processos finalizados via pkill');
    } catch (pkillError) {
      logger.warn(`⚠️ pkill falhou: ${pkillError.message}`);
    }

    // PASSO 5: Confirmar que não sobrou nenhum Chrome/Chromium usando esse userDataDir
    // (evita falso-positivo de "pgrep" se auto-encontrando e entrando em loop)
    for (let i = 0; i < 15; i++) {
      // Verificar com lsof primeiro (mais preciso)
      let stillRunning = false;
      try {
        const { stdout: lsofCheck } = await execAsync(
          `lsof +D "${userDataDir}" 2>/dev/null | grep -iE "chrome|chromium" | wc -l`
        ).catch(() => ({ stdout: '0' }));
        const lsofCount = parseInt(lsofCheck.trim()) || 0;
        if (lsofCount > 0) {
          stillRunning = true;
        }
      } catch {}
      
      // Verificar com ps também
      if (!stillRunning) {
        const { stdout: stillStdout } = await execAsync(
          `ps aux | grep -iE "chrome|chromium" | grep "${userDataDir}" | grep -v grep || true`
        ).catch(() => ({ stdout: '' }));
        const still = (stillStdout || '').trim();
        if (still) {
          stillRunning = true;
        }
      }
      
      if (!stillRunning) {
        logger.info('✅ Nenhum Chrome/Chromium restante usando userDataDir');
        break;
      }
      logger.warn(`⚠️ Ainda existem Chrome/Chromium usando userDataDir (tentativa ${i + 1}/15). Aguardando...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Aguardar para garantir que processos foram encerrados
    logger.info('⏳ Aguardando 5 segundos para processos encerrarem completamente...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // PASSO 6: DELETAR A PASTA INTEIRA E RECRIAR (método mais drástico)
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
            // Última tentativa: forçar com fuser (se disponível)
            try {
              await execAsync(`fuser -k -9 "${userDataDir}" 2>/dev/null`).catch(() => {});
              await new Promise(resolve => setTimeout(resolve, 2000));
              await execAsync(`rm -rf "${userDataDir}"`).catch(() => {});
            } catch {}
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
    
    logger.info('✅ Limpeza ULTRA AGRESSIVA concluída - pasta completamente resetada');
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
    const baseSessionsDir =
      (config.wppConnect && config.wppConnect.sessionsDir) || '/var/www/whatsapp-sessions';

    // Separar tokenDir (sessão) do chromeUserDataDir (perfil do navegador).
    // Isso evita loop "browser already running" por locks do Chrome.
    const tokenDir = path.join(baseSessionsDir, sessionName);
    const chromeUserDataDir = path.join(baseSessionsDir, `${sessionName}__chrome`);
    
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
    console.log('📌 tokenDir:', tokenDir);
    console.log('📌 chromeUserDataDir:', chromeUserDataDir);
    console.log('📌 Process ID:', process.pid);
    console.log('📌 Timestamp:', new Date().toISOString());
    console.log('='.repeat(70));
    
    logger.info(
      `[startClient] ISOLAMENTO - userId: "${normalizedUserId}" -> sessionName: "${sessionName}" -> tokenDir: "${tokenDir}" -> chromeUserDataDir: "${chromeUserDataDir}"`
    );
    
    // CRÍTICO: Limpar banco de dados ANTES de iniciar nova sessão
    // Isso garante que não vamos reutilizar dados de uma sessão anterior
    logger.info(`[startClient] 🗑️ Limpando dados do banco para userId: "${normalizedUserId}" antes de iniciar nova sessão...`);
    try {
      await WhatsAppBotModel.clearSession(normalizedUserId, slot);
      logger.info(`[startClient] ✅ Dados do banco limpos para userId: "${normalizedUserId}"`);
    } catch (dbError) {
      logger.warn(`[startClient] ⚠️ Erro ao limpar banco (continuando mesmo assim): ${dbError.message}`);
    }

    // VERIFICAÇÃO CRÍTICA: Garantir que o diretório de sessão é único para este usuário
    // Se outro usuário estiver usando o mesmo diretório, isso é um BUG CRÍTICO
    if (fs.existsSync(chromeUserDataDir)) {
      // Verificar se há algum arquivo de lock ou sessão de outro usuário
      try {
        const lockFiles = fs.readdirSync(chromeUserDataDir).filter(f => f.includes('lock') || f.includes('session'));
        if (lockFiles.length > 0) {
          logger.warn(`[startClient] ⚠️ Diretório ${chromeUserDataDir} já existe com arquivos. DELETANDO para forçar novo QR code...`);
        }
      } catch (err) {
        // Ignorar erro de leitura
      }
    }

    // IMPORTANTE: Limpar processos órfãos AGRESSIVAMENTE
    logger.wpp(normalizedUserId, slot, `🧹 Limpando processos órfãos e locks para userId: "${normalizedUserId}"...`);
    await cleanupOrphanBrowser(chromeUserDataDir);

    // CRÍTICO: DELETAR diretórios ANTES de criar nova sessão
    // - tokenDir: força novo QR (sessão)
    // - chromeUserDataDir: remove locks do Chrome
    if (fs.existsSync(tokenDir)) {
      logger.warn(`[startClient] 🗑️ DELETANDO tokenDir ${tokenDir} para forçar novo QR code...`);
      try {
        fs.rmSync(tokenDir, { recursive: true, force: true });
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (deleteError) {
        logger.warn(`[startClient] ⚠️ Erro ao deletar tokenDir (seguindo): ${deleteError.message}`);
      }
    }

    if (fs.existsSync(chromeUserDataDir)) {
      logger.warn(`[startClient] 🗑️ DELETANDO chromeUserDataDir ${chromeUserDataDir} para evitar lock do Chrome...`);
      try {
        fs.rmSync(chromeUserDataDir, { recursive: true, force: true });
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (deleteError) {
        logger.warn(`[startClient] ⚠️ Erro ao deletar chromeUserDataDir (seguindo): ${deleteError.message}`);
      }
    }

    // Recriar diretórios vazios
    if (!fs.existsSync(tokenDir)) {
      fs.mkdirSync(tokenDir, { recursive: true });
      logger.info(`[startClient] ✅ tokenDir recriado (vazio) para nova sessão: ${tokenDir}`);
    }
    if (!fs.existsSync(chromeUserDataDir)) {
      fs.mkdirSync(chromeUserDataDir, { recursive: true });
      logger.info(`[startClient] ✅ chromeUserDataDir recriado (vazio) para nova sessão: ${chromeUserDataDir}`);
    }
    
    // Verificar se ainda há processos rodando ANTES de tentar criar o cliente (só para este userDataDir)
    try {
      const { stdout: checkStdout } = await execAsync(`ps aux | grep -iE "chrome|chromium" | grep "${sessionName}" | grep -v grep | wc -l`).catch(() => ({ stdout: '0' }));
      const stillRunning = parseInt(checkStdout.trim()) || 0;
      
      if (stillRunning > 0) {
        logger.warn(`⚠️ Ainda há ${stillRunning} processos Chrome rodando para ${sessionName}. Tentando limpeza adicional...`);
        
        // Limpeza adicional mais agressiva
        try {
          await execAsync(`pkill -9 -f "${sessionName}" 2>/dev/null`).catch(() => {});
          await execAsync(`pkill -9 -f "${chromeUserDataDir}" 2>/dev/null`).catch(() => {});
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
      userDataDir: chromeUserDataDir
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
        // CRÍTICO: garantir que o token/sessão do WhatsApp seja salvo no diretório isolado por usuário.
        // Sem isso, o WPPConnect pode reutilizar tokens em uma pasta padrão e "conectar direto"
        // mesmo após deletarmos o userDataDir.
        folderNameToken: tokenDir,
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
        
        // Verifica se já está conectado após criar o client.
        // IMPORTANTE: Não use "qrCode no banco" como sinal de validade, porque ao conectar
        // o fluxo normal limpa o qrCode no banco (WhatsAppBotModel.setConnected limpa qrCode).
        try {
          const isConnected = await client.isConnected().catch(() => false);
          if (isConnected) {
            logger.wpp(normalizedUserId, slot, 'Cliente já está conectado, atualizando status...');
            await onStatusChange(normalizedUserId, slot, 'chatsAvailable', client);
          }
        } catch (error) {
          // Ignora erro na verificação inicial
          logger.warn(`[startClient] Erro ao verificar conexão inicial: ${error.message}`);
        }
      })
      .catch(async (error) => {
        logger.error(`Erro ao criar cliente [${normalizedUserId}:${slot}]`, error);
        
        // Se o erro for "browser already running", tentar limpar e tentar novamente uma vez
        if (error.message && (error.message.includes('browser is already running') || error.message.includes('already running'))) {
          logger.warn(`🚨 Browser já está rodando para ${chromeUserDataDir}, tentando SOLUÇÃO DEFINITIVA...`);
          
          // SOLUÇÃO DEFINITIVA: Usar um userDataDir temporário único com timestamp
          // Isso força o Puppeteer a criar um novo perfil completamente isolado
          const timestamp = Date.now();
          const tempChromeUserDataDir = `${chromeUserDataDir}_temp_${timestamp}`;
          
          logger.warn(`🔄 Usando userDataDir temporário único: ${tempChromeUserDataDir}`);
          
          // Limpeza EXTRA AGRESSIVA do diretório original
          try {
            // Matar TODOS os processos Chrome relacionados
            await execAsync(`pkill -9 -f "${sessionName}" 2>/dev/null`).catch(() => {});
            await execAsync(`pkill -9 -f "${chromeUserDataDir}" 2>/dev/null`).catch(() => {});
            await execAsync(`pkill -9 -f "whatsapp.*${sessionName}" 2>/dev/null`).catch(() => {});
            
            // Usar lsof para encontrar processos usando arquivos
            try {
              const { stdout: lsofPids } = await execAsync(
                `lsof +D "${chromeUserDataDir}" 2>/dev/null | awk '{print $2}' | sort -u | xargs -r kill -9 2>/dev/null`
              ).catch(() => {});
            } catch {}
            
            // Deletar a pasta inteira
            if (fs.existsSync(chromeUserDataDir)) {
              try {
                fs.rmSync(chromeUserDataDir, { recursive: true, force: true });
                logger.info('✅ Pasta original deletada durante limpeza extra');
              } catch (rmError) {
                await execAsync(`rm -rf "${chromeUserDataDir}" 2>/dev/null`).catch(() => {});
              }
            }
            
            // Aguardar mais tempo
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            logger.wpp(normalizedUserId, slot, 'Limpeza extra concluída. Criando cliente com userDataDir temporário único...');
          } catch (cleanupError) {
            logger.error(`Erro na limpeza extra: ${cleanupError.message}`);
          }

          // Tentar criar novamente com userDataDir temporário único
          try {
            logger.wpp(normalizedUserId, slot, `🔄 Tentando criar cliente com userDataDir temporário: ${tempChromeUserDataDir}`);
            
            // Criar diretório temporário
            if (!fs.existsSync(tempChromeUserDataDir)) {
              fs.mkdirSync(tempChromeUserDataDir, { recursive: true });
            }
            
            // Puppeteer options com userDataDir temporário
            const tempPuppeteerOptions = Object.assign({}, puppeteerOptions, {
              userDataDir: tempChromeUserDataDir
            });
            
            wppconnect
              .create({
                session: sessionName,
                // CRÍTICO: manter tokens no diretório isolado por usuário também no retry
                folderNameToken: tokenDir,
                headless: headless,
                puppeteerOptions: tempPuppeteerOptions,
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
                logger.wpp(normalizedUserId, slot, '✅ Cliente WPPConnect criado com userDataDir temporário.');
                sessionManager.setClient(normalizedUserId, slot, client);
                setupMessageListener(client, normalizedUserId, slot);
                
                // Verifica se já conectou após o retry e atualiza status.
                try {
                  const isConnected = await client.isConnected().catch(() => false);
                  if (isConnected) {
                    logger.wpp(normalizedUserId, slot, 'Cliente já está conectado (retry), atualizando status...');
                    await onStatusChange(normalizedUserId, slot, 'chatsAvailable', client);
                  }
                } catch (error) {
                  // Ignora erro na verificação inicial
                  logger.warn(`[startClient] Erro ao verificar conexão no retry: ${error.message}`);
                }
              })
              .catch((retryError) => {
                logger.error(`❌ Erro ao criar cliente mesmo com userDataDir temporário [${normalizedUserId}:${slot}]:`, retryError);
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
    // Tentar logout antes de fechar para invalidar sessão no WhatsApp Web
    // (evita conflitos quando outro usuário tenta conectar e fica "conectando" até falhar)
    try {
      if (typeof client.logout === 'function') {
        await client.logout().catch(() => {});
      }
    } catch (logoutError) {
      logger.warn(`[stopClient] ⚠️ Erro ao fazer logout (seguindo): ${logoutError.message}`);
    }

    await client.close().catch(() => {});
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

