import prisma from './index.js';
import logger from '../utils/logger.js';

/**
 * Modelo: USER
 */
export const UserModel = {
  /**
   * Busca ou cria um usuário
   */
  async findOrCreate(email, name = null) {
    try {
      if (!email) {
        throw new Error('Email é obrigatório para criar usuário');
      }

      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0]
          }
        });
        logger.info(`Usuário criado: ${user.id} (${email})`);
      }

      return user;
    } catch (error) {
      logger.error('Erro em UserModel.findOrCreate:', error);
      throw error;
    }
  },

  /**
   * Busca usuário por ID
   */
  async findById(id) {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          botSettings: true,
          whatsappBots: true
        }
      });
    } catch (error) {
      logger.error('Erro em UserModel.findById:', error);
      throw error;
    }
  }
};

/**
 * Modelo: WHATSAPP BOT
 */
export const WhatsAppBotModel = {
  /**
   * Busca bot por userId e slot
   */
  async findByUserAndSlot(userId, slot) {
    try {
      return await prisma.whatsAppBot.findUnique({
        where: {
          userId_slot: {
            userId,
            slot
          }
        }
      });
    } catch (error) {
      logger.error(`Erro em WhatsAppBotModel.findByUserAndSlot [${userId}:${slot}]:`, error);
      throw error;
    }
  },

  /**
   * Cria ou atualiza bot (upsert)
   * Valida que o usuário existe em stack_users antes de criar/atualizar
   */
  async upsert(userId, slot, data) {
    try {
      // Verifica se o usuário existe na tabela correta
      const user = await prisma.stackUser.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error(`Usuário ${userId} não encontrado na tabela stack_users`);
      }

      return await prisma.whatsAppBot.upsert({
        where: {
          userId_slot: {
            userId,
            slot
          }
        },
        update: data,
        create: {
          userId,
          slot,
          ...data
        }
      });
    } catch (error) {
      logger.error(`Erro em WhatsAppBotModel.upsert [${userId}:${slot}]:`, error);
      throw error;
    }
  },

  /**
   * Salva QR Code no banco
   * Valida que o usuário existe em stack_users
   */
  async saveQrCode(userId, slot, qrCode) {
    try {
      // Verifica se o usuário existe na tabela correta
      const user = await prisma.stackUser.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error(`Usuário ${userId} não encontrado na tabela stack_users`);
      }

      return await this.upsert(userId, slot, {
        qrCode,
        isConnected: false,
        connectedNumber: null
      });
    } catch (error) {
      logger.error(`Erro em WhatsAppBotModel.saveQrCode [${userId}:${slot}]:`, error);
      throw error;
    }
  },

  /**
   * Salva status do bot
   * Valida que o usuário existe em stack_users
   */
  async saveBotStatus(userId, slot, status) {
    try {
      // Verifica se o usuário existe na tabela correta
      const user = await prisma.stackUser.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error(`Usuário ${userId} não encontrado na tabela stack_users`);
      }

      return await this.upsert(userId, slot, { status });
    } catch (error) {
      logger.error(`Erro em WhatsAppBotModel.saveBotStatus [${userId}:${slot}]:`, error);
      throw error;
    }
  },

  /**
   * Marca bot como conectado
   * Valida que o usuário existe em stack_users
   */
  async setConnected(userId, slot, connectedNumber, sessionJson = null) {
    try {
      // Verifica se o usuário existe na tabela correta
      const user = await prisma.stackUser.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error(`Usuário ${userId} não encontrado na tabela stack_users`);
      }

      return await this.upsert(userId, slot, {
        isConnected: true,
        connectedNumber,
        sessionJson,
        qrCode: null // Limpa QR após conectar
      });
    } catch (error) {
      logger.error(`Erro em WhatsAppBotModel.setConnected [${userId}:${slot}]:`, error);
      throw error;
    }
  },

  /**
   * Marca bot como desconectado
   * Valida que o usuário existe em stack_users
   */
  async setDisconnected(userId, slot) {
    try {
      // Verifica se o usuário existe na tabela correta
      const user = await prisma.stackUser.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error(`Usuário ${userId} não encontrado na tabela stack_users`);
      }

      return await this.upsert(userId, slot, {
        isConnected: false,
        connectedNumber: null,
        qrCode: null,
        sessionJson: null
      });
    } catch (error) {
      logger.error(`Erro em WhatsAppBotModel.setDisconnected [${userId}:${slot}]:`, error);
      throw error;
    }
  },

  /**
   * Limpa sessão (mantém registro, mas limpa dados)
   * Valida que o usuário existe em stack_users
   */
  async clearSession(userId, slot) {
    try {
      // Verifica se o usuário existe na tabela correta
      const user = await prisma.stackUser.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error(`Usuário ${userId} não encontrado na tabela stack_users`);
      }

      return await this.upsert(userId, slot, {
        isConnected: false,
        connectedNumber: null,
        qrCode: null,
        sessionJson: null
      });
    } catch (error) {
      logger.error(`Erro em WhatsAppBotModel.clearSession [${userId}:${slot}]:`, error);
      throw error;
    }
  },

  /**
   * Busca todos os bots de um usuário
   */
  async findAllByUser(userId) {
    try {
      return await prisma.whatsAppBot.findMany({
        where: { userId },
        orderBy: { slot: 'asc' }
      });
    } catch (error) {
      logger.error(`Erro em WhatsAppBotModel.findAllByUser [${userId}]:`, error);
      throw error;
    }
  }
};

/**
 * Modelo: BOT SETTINGS
 */
export const BotSettingsModel = {
  /**
   * Busca configurações por userId
   */
  async findByUser(userId) {
    try {
      let settings = await prisma.botSettings.findUnique({
        where: { userId }
      });

      // Se não existir, cria com valores padrão
      if (!settings) {
        settings = await prisma.botSettings.create({
          data: {
            userId,
            botName: 'Assistente',
            storeType: 'restaurant',
            contextLimit: 10,
            lineLimit: 5,
            isActive: true
          }
        });
        logger.info(`BotSettings criado para usuário: ${userId}`);
      }

      return settings;
    } catch (error) {
      logger.error(`Erro em BotSettingsModel.findByUser [${userId}]:`, error);
      throw error;
    }
  },

  /**
   * Atualiza configurações
   */
  async update(userId, updates) {
    try {
      // Remove campos undefined/null para não sobrescrever com null
      const cleanUpdates = {};
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && updates[key] !== null) {
          cleanUpdates[key] = updates[key];
        }
      });

      return await prisma.botSettings.upsert({
        where: { userId },
        update: cleanUpdates,
        create: {
          userId,
          botName: 'Assistente',
          storeType: 'restaurant',
          contextLimit: 10,
          lineLimit: 5,
          isActive: true,
          ...cleanUpdates
        }
      });
    } catch (error) {
      logger.error(`Erro em BotSettingsModel.update [${userId}]:`, error);
      throw error;
    }
  }
};
