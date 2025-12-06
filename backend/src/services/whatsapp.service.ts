import { create, Whatsapp, SocketState } from '@wppconnect-team/wppconnect';
import prisma from '../config/prisma';
import { Logger } from '../utils/logger';
import openRouterService from './openrouter.service';
import clientConfigService from './clientConfig.service';
import * as path from 'path';
import * as fs from 'fs';

const logger = new Logger('WhatsAppService');

interface SessionData {
  client: Whatsapp;
  status: SocketState;
  qrCode?: string;
}

export class WhatsAppService {
  private sessions: Map<string, SessionData> = new Map();
  private messageContexts: Map<string, { messages: string[]; timestamp: number }> = new Map();
  private manualMode: Map<string, boolean> = new Map(); // Armazena modo manual por conversa: "clientId_slot_phoneNumber" => true/false

  private getSessionKey(clientId: string, slot: number): string {
    return `${clientId}_${slot}`;
  }

  private getSessionPath(clientId: string, slot: number): string {
    return path.join(__dirname, '../../sessions', clientId, slot.toString());
  }

  async startSession(clientId: string, slot: number): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    const sessionKey = this.getSessionKey(clientId, slot);

    try {
      // Verificar se já existe sessão ativa
      if (this.sessions.has(sessionKey)) {
        const sessionData = this.sessions.get(sessionKey)!;
        if (sessionData.status === 'CONNECTED') {
          return { success: true };
        }
      }

      logger.info(`Iniciando sessão para ${clientId} slot ${slot}`);

      const sessionPath = this.getSessionPath(clientId, slot);
      
      // Criar diretório se não existir
      if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
      }

      let qrCodeData: string | undefined;

      const client = await create({
        session: sessionKey,
        headless: true,
        devtools: false,
        useChrome: false,
        debug: false,
        logQR: false,
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        folderNameToken: sessionPath,
        catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
          logger.info(`QR Code gerado para ${sessionKey} - Tentativa ${attempts}`);
          qrCodeData = base64Qr;
          
          // Salvar QR no banco
          this.updateSessionQR(clientId, slot, base64Qr).catch(err => {
            logger.error('Erro ao salvar QR no banco:', err);
          });
        },
        statusFind: (statusSession, session) => {
          logger.info(`Status da sessão ${sessionKey}: ${statusSession}`);
          this.updateSessionStatus(clientId, slot, statusSession).catch(err => {
            logger.error('Erro ao atualizar status:', err);
          });
        },
      });

      // Configurar listeners
      this.setupMessageListeners(client, clientId, slot);

      // Salvar sessão
      this.sessions.set(sessionKey, {
        client,
        status: await client.getConnectionState(),
        qrCode: qrCodeData
      });

      await this.updateSession(clientId, slot, 'connecting', qrCodeData);

      return { success: true, qrCode: qrCodeData };
    } catch (error: any) {
      logger.error(`Erro ao iniciar sessão ${sessionKey}:`, error);
      await this.updateSession(clientId, slot, 'error');
      return { success: false, error: error.message };
    }
  }

  private setupMessageListeners(client: Whatsapp, clientId: string, slot: number): void {
    client.onMessage(async (message) => {
      try {
        // Ignorar mensagens de grupos
        if (message.isGroupMsg) {
          return;
        }

        // Processar apenas mensagens de texto
        if (message.type !== 'chat' && message.type !== 'text') {
          return;
        }

        const userMessage = message.body?.trim() || '';
        if (!userMessage) {
          return;
        }

        const trimmedMessage = userMessage.trim().toLowerCase();
        const normalizedCommand = trimmedMessage.replace(/\s+/g, ' ').trim();

        // ============================================
        // COMANDOS DO ESTABELECIMENTO (message.fromMe === true)
        // ============================================
        if (message.fromMe) {
          // Identificar para qual conversa o comando foi enviado
          const clientPhoneNumber = (message.to || message.chatId || message.from)?.split('@')[0] || (message.to || message.chatId || message.from);
          const manualModeKey = `${clientId}_${slot}_${clientPhoneNumber}`;
          
          logger.info(`📤 Mensagem do ESTABELECIMENTO para ${clientPhoneNumber}: "${userMessage}"`);
          
          // Comando para assumir chat (ativar modo manual)
          if (normalizedCommand === '#boa noite' || normalizedCommand.startsWith('#boa noite')) {
            this.manualMode.set(manualModeKey, true);
            logger.info(`✅ Modo manual ATIVADO pelo estabelecimento para ${clientPhoneNumber} (${clientId}:${slot})`);
            return;
          }
          
          // Comando para bot assumir (desativar modo manual)
          if (normalizedCommand === '#brigado' || normalizedCommand.startsWith('#brigado')) {
            this.manualMode.set(manualModeKey, false);
            logger.info(`✅ Modo automático ATIVADO pelo estabelecimento para ${clientPhoneNumber} (${clientId}:${slot})`);
            return;
          }
          
          // Se não for comando, é mensagem normal do estabelecimento - não processar
          return;
        }

        // ============================================
        // MENSAGENS DO CLIENTE (message.fromMe === false)
        // ============================================
        
        logger.info(`📨 Mensagem recebida do CLIENTE ${message.from}: ${message.type}`);

        // Verificar se o bot está habilitado
        const clientConfig = await clientConfigService.getClient(clientId);
        if (!clientConfig || !clientConfig.botEnabled) {
          logger.info(`Bot desabilitado para cliente ${clientId}`);
          return;
        }

        const phoneNumber = message.from?.split('@')[0] || message.from;
        const manualModeKey = `${clientId}_${slot}_${phoneNumber}`;

        // Se estiver em modo manual, não processar com IA
        if (this.manualMode.get(manualModeKey) === true) {
          logger.info(`🚫 Modo manual ativo para ${phoneNumber} (${clientId}:${slot}), ignorando processamento com IA`);
          return; // Não processa com IA, deixa o usuário responder manualmente
        }

        // Processar mensagem
        let response: string;

        if (message.type === 'chat' || message.type === 'text') {
          response = await this.processTextMessage(clientId, message.from, message.body);
        } else if (message.type === 'ptt' || message.type === 'audio') {
          response = await this.processAudioMessage(clientId, message);
        } else if (message.type === 'image') {
          response = await this.processImageMessage(clientId, message);
        } else {
          response = 'Desculpe, esse tipo de mensagem não é suportado no momento.';
        }

        // Enviar resposta
        await client.sendText(message.from, response);
        logger.info(`Resposta enviada para ${message.from}`);
      } catch (error: any) {
        logger.error('Erro ao processar mensagem:', error);
        try {
          await client.sendText(message.from, 'Desculpe, ocorreu um erro ao processar sua mensagem.');
        } catch (sendError) {
          logger.error('Erro ao enviar mensagem de erro:', sendError);
        }
      }
    });

    client.onStateChange((state) => {
      logger.info(`Estado mudou para: ${state}`);
      this.updateSessionStatus(clientId, slot, state).catch(err => {
        logger.error('Erro ao atualizar status:', err);
      });
    });
  }

  private async processTextMessage(clientId: string, phoneNumber: string, text: string): Promise<string> {
    const clientConfig = await clientConfigService.getClient(clientId);
    if (!clientConfig) {
      throw new Error('Cliente não encontrado');
    }

    const systemPrompt = clientConfigService.buildSystemPrompt(clientConfig);
    
    // Gerenciar contexto de mensagens
    const contextKey = `${clientId}_${phoneNumber}`;
    const context = this.getOrCreateContext(contextKey, clientConfig.contextTime || 60);
    
    // Adicionar mensagem ao contexto
    context.messages.push(`Usuário: ${text}`);
    
    // Limitar número de mensagens no contexto
    const limit = clientConfig.messageLimit || 30;
    if (context.messages.length > limit) {
      context.messages = context.messages.slice(-limit);
    }

    // Criar mensagem completa com contexto
    const fullMessage = context.messages.join('\n');

    const response = await openRouterService.sendTextMessage(systemPrompt, fullMessage);
    
    // Adicionar resposta ao contexto
    context.messages.push(`Assistente: ${response}`);
    
    return response;
  }

  private async processAudioMessage(clientId: string, message: any): Promise<string> {
    try {
      const clientConfig = await clientConfigService.getClient(clientId);
      if (!clientConfig) {
        throw new Error('Cliente não encontrado');
      }

      // Baixar áudio
      const buffer = await message.downloadMedia();
      const audioBase64 = buffer.toString('base64');

      const systemPrompt = clientConfigService.buildSystemPrompt(clientConfig);
      
      const response = await openRouterService.sendAudioMessage(
        systemPrompt,
        audioBase64,
        'ogg' // WhatsApp geralmente usa ogg
      );

      return response;
    } catch (error: any) {
      logger.error('Erro ao processar áudio:', error);
      return 'Desculpe, não consegui processar o áudio. Pode enviar como texto?';
    }
  }

  private async processImageMessage(clientId: string, message: any): Promise<string> {
    try {
      const clientConfig = await clientConfigService.getClient(clientId);
      if (!clientConfig) {
        throw new Error('Cliente não encontrado');
      }

      // Baixar imagem
      const buffer = await message.downloadMedia();
      const imageBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;

      const systemPrompt = clientConfigService.buildSystemPrompt(clientConfig);
      const caption = message.caption || 'O que você vê nesta imagem?';

      const response = await openRouterService.sendImageMessage(
        systemPrompt,
        imageBase64,
        caption
      );

      return response;
    } catch (error: any) {
      logger.error('Erro ao processar imagem:', error);
      return 'Desculpe, não consegui processar a imagem.';
    }
  }

  private getOrCreateContext(
    contextKey: string,
    contextTimeMinutes: number
  ): { messages: string[]; timestamp: number } {
    const now = Date.now();
    const existing = this.messageContexts.get(contextKey);

    if (existing) {
      const ageMinutes = (now - existing.timestamp) / 1000 / 60;
      if (ageMinutes < contextTimeMinutes) {
        return existing;
      }
    }

    const newContext = { messages: [], timestamp: now };
    this.messageContexts.set(contextKey, newContext);
    return newContext;
  }

  async stopSession(clientId: string, slot: number): Promise<{ success: boolean; error?: string }> {
    const sessionKey = this.getSessionKey(clientId, slot);

    try {
      const sessionData = this.sessions.get(sessionKey);
      if (!sessionData) {
        return { success: false, error: 'Sessão não encontrada' };
      }

      logger.info(`Parando sessão ${sessionKey}`);
      
      await sessionData.client.close();
      this.sessions.delete(sessionKey);

      await this.updateSession(clientId, slot, 'disconnected');

      return { success: true };
    } catch (error: any) {
      logger.error(`Erro ao parar sessão ${sessionKey}:`, error);
      return { success: false, error: error.message };
    }
  }

  async getSessionStatus(clientId: string, slot: number): Promise<any> {
    const sessionKey = this.getSessionKey(clientId, slot);
    const sessionData = this.sessions.get(sessionKey);

    const dbSession = await prisma.session.findUnique({
      where: {
        clientId_slot: { clientId, slot }
      }
    });

    if (sessionData) {
      return {
        status: await sessionData.client.getConnectionState(),
        qrCode: sessionData.qrCode || dbSession?.qrCode,
        isActive: true
      };
    }

    return {
      status: dbSession?.status || 'disconnected',
      qrCode: dbSession?.qrCode,
      isActive: false
    };
  }

  async getAllSessionsStatus(clientId: string): Promise<any[]> {
    const sessions = [];
    
    for (let slot = 1; slot <= 3; slot++) {
      const status = await this.getSessionStatus(clientId, slot);
      sessions.push({
        slot,
        ...status
      });
    }

    return sessions;
  }

  async sendMessage(
    clientId: string,
    slot: number,
    to: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    const sessionKey = this.getSessionKey(clientId, slot);
    const sessionData = this.sessions.get(sessionKey);

    if (!sessionData) {
      return { success: false, error: 'Sessão não encontrada' };
    }

    try {
      await sessionData.client.sendText(to, message);
      return { success: true };
    } catch (error: any) {
      logger.error('Erro ao enviar mensagem:', error);
      return { success: false, error: error.message };
    }
  }

  private async updateSession(
    clientId: string,
    slot: number,
    status: string,
    qrCode?: string
  ): Promise<void> {
    await prisma.session.upsert({
      where: {
        clientId_slot: { clientId, slot }
      },
      update: {
        status,
        qrCode: qrCode || undefined,
        updatedAt: new Date()
      },
      create: {
        clientId,
        slot,
        status,
        qrCode
      }
    });
  }

  private async updateSessionStatus(clientId: string, slot: number, status: string): Promise<void> {
    await this.updateSession(clientId, slot, status);
  }

  private async updateSessionQR(clientId: string, slot: number, qrCode: string): Promise<void> {
    await this.updateSession(clientId, slot, 'qrcode', qrCode);
  }
}

export default new WhatsAppService();

