import prisma from './index.js';
import logger from '../utils/logger.js';

/**
 * Funções auxiliares para manipular dados do banco
 */

export const UserModel = {
  /**
   * Busca ou cria um usuário
   */
  async findOrCreate(email, name = null) {
    try {
      let user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        user = await prisma.user.create({
          data: { email, name },
          include: {
            botSettings: true,
            whatsappBots: true
          }
        });
        logger.info(`Novo usuário criado: ${email}`);
      }
      
      return user;
    } catch (error) {
      logger.error('Erro ao buscar/criar usuário:', error);
      throw error;
    }
  },

  async findById(userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        botSettings: true,
        whatsappBots: true
      }
    });
  }
};

export const WhatsAppBotModel = {
  /**
   * Busca bot por userId e slot
   */
  async findByUserAndSlot(userId, slot) {
    return await prisma.whatsAppBot.findUnique({
      where: {
        userId_slot: { userId, slot: parseInt(slot) }
      }
    });
  },

  /**
   * Cria ou atualiza bot
   */
  async upsert(userId, slot, data) {
    try {
      return await prisma.whatsAppBot.upsert({
        where: {
          userId_slot: { userId, slot: parseInt(slot) }
        },
        update: data,
        create: {
          userId,
          slot: parseInt(slot),
          ...data
        }
      });
    } catch (error) {
      logger.error(`Erro ao upsert WhatsAppBot [${userId}:${slot}]:`, error);
      throw error;
    }
  },

  /**
   * Salva QR Code
   */
  async saveQrCode(userId, slot, qrCode) {
    return await this.upsert(userId, slot, {
      qrCode,
      isConnected: false
    });
  },

  /**
   * Marca como conectado
   */
  async setConnected(userId, slot, connectedNumber, sessionJson) {
    return await this.upsert(userId, slot, {
      isConnected: true,
      connectedNumber,
      sessionJson,
      qrCode: null
    });
  },

  /**
   * Marca como desconectado
   */
  async setDisconnected(userId, slot) {
    return await this.upsert(userId, slot, {
      isConnected: false,
      connectedNumber: null,
      qrCode: null
    });
  },

  /**
   * Limpa sessão
   */
  async clearSession(userId, slot) {
    return await this.upsert(userId, slot, {
      isConnected: false,
      connectedNumber: null,
      sessionJson: null,
      qrCode: null
    });
  },

  /**
   * Lista todos os bots de um usuário
   */
  async findAllByUser(userId) {
    return await prisma.whatsAppBot.findMany({
      where: { userId },
      orderBy: { slot: 'asc' }
    });
  }
};

export const BotSettingsModel = {
  /**
   * Busca configurações do bot
   */
  async findByUser(userId) {
    let settings = await prisma.botSettings.findUnique({
      where: { userId }
    });

    // Cria settings padrão se não existir
    if (!settings) {
      settings = await prisma.botSettings.create({
        data: { userId }
      });
    }

    return settings;
  },

  /**
   * Atualiza configurações
   */
  async update(userId, data) {
    try {
      return await prisma.botSettings.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          ...data
        }
      });
    } catch (error) {
      logger.error(`Erro ao atualizar BotSettings [${userId}]:`, error);
      throw error;
    }
  }
};

