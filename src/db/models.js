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
   * Configuração DURÁVEL da sessão (label / iaAtiva / iaPrompt).
   * Fonte de verdade no banco — nunca assumir default silencioso.
   *
   * @returns {{ label: string|null, iaAtiva: boolean, iaPrompt: string|null } | null}
   *   null se sessão não existe OU iaAtiva ainda não foi persistido (null no banco).
   */
  async getDurableConfig(userId, slot) {
    try {
      const bot = await this.findByUserAndSlot(userId, slot);
      if (!bot) {
        logger.error(`[WhatsAppBotModel.getDurableConfig] Sessão NÃO encontrada [${userId}:${slot}]`);
        return null;
      }
      if (typeof bot.iaAtiva !== 'boolean') {
        logger.error(
          `[WhatsAppBotModel.getDurableConfig] iaAtiva ausente/inválido [${userId}:${slot}] ` +
            `(valor=${String(bot.iaAtiva)}) — recusar start/reconnect com default`,
        );
        return null;
      }
      return {
        label: bot.label ?? null,
        iaAtiva: bot.iaAtiva,
        iaPrompt: bot.iaPrompt ?? null,
      };
    } catch (error) {
      logger.error(`Erro em WhatsAppBotModel.getDurableConfig [${userId}:${slot}]:`, error);
      throw error;
    }
  },

  /**
   * Persiste campos duráveis sem tocar em estado de conexão.
   */
  async saveDurableConfig(userId, slot, { iaAtiva, iaPrompt, label } = {}) {
    const data = {};
    if (typeof iaAtiva === 'boolean') data.iaAtiva = iaAtiva;
    if (iaPrompt !== undefined) data.iaPrompt = iaPrompt;
    if (label !== undefined) data.label = label;
    if (Object.keys(data).length === 0) {
      return this.findByUserAndSlot(userId, slot);
    }
    return this.upsert(userId, slot, data);
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
   * Marca bot como conectado.
   * NÃO sobrescreve iaAtiva / iaPrompt / label.
   * sessionJson efêmero é mergeado (preserva mode legado se existir).
   */
  async setConnected(userId, slot, connectedNumber, ephemeralSessionJson = null) {
    try {
      const user = await prisma.stackUser.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error(`Usuário ${userId} não encontrado na tabela stack_users`);
      }

      const existing = await this.findByUserAndSlot(userId, slot);
      const prevJson =
        existing?.sessionJson && typeof existing.sessionJson === 'object' && !Array.isArray(existing.sessionJson)
          ? { ...existing.sessionJson }
          : {};

      const modeCompat =
        typeof existing?.iaAtiva === 'boolean'
          ? (existing.iaAtiva ? 'atendimento' : 'somente-envio')
          : (prevJson.mode || undefined);

      const sessionJson = {
        ...prevJson,
        ...(ephemeralSessionJson && typeof ephemeralSessionJson === 'object' ? ephemeralSessionJson : {}),
        ...(modeCompat ? { mode: modeCompat } : {}),
      };

      return await this.upsert(userId, slot, {
        isConnected: true,
        connectedNumber,
        sessionJson,
        qrCode: null,
      });
    } catch (error) {
      logger.error(`Erro em WhatsAppBotModel.setConnected [${userId}:${slot}]:`, error);
      throw error;
    }
  },

  /**
   * Marca bot como desconectado.
   * PRESERVA iaAtiva / iaPrompt / label / sessionJson (config durável).
   */
  async setDisconnected(userId, slot) {
    try {
      const user = await prisma.stackUser.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error(`Usuário ${userId} não encontrado na tabela stack_users`);
      }

      return await this.upsert(userId, slot, {
        isConnected: false,
        connectedNumber: null,
        qrCode: null,
      });
    } catch (error) {
      logger.error(`Erro em WhatsAppBotModel.setDisconnected [${userId}:${slot}]:`, error);
      throw error;
    }
  },

  /**
   * Limpa estado de conexão (QR / número). PRESERVA iaAtiva / iaPrompt / label.
   */
  async clearSession(userId, slot) {
    try {
      const user = await prisma.stackUser.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error(`Usuário ${userId} não encontrado na tabela stack_users`);
      }

      return await this.upsert(userId, slot, {
        isConnected: false,
        connectedNumber: null,
        qrCode: null,
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
   * Resolve o userId real da tabela `users` a partir de um id que pode ser:
   * - o próprio `users.id`, ou
   * - o `stack_users.id` (stackUserId usado pelo WhatsAppBot)
   */
  async _resolveUserId(rawUserId) {
    // 1) Se já for um User.id válido, usa direto
    const existingUser = await prisma.user.findUnique({
      where: { id: rawUserId }
    }).catch(() => null);

    if (existingUser) {
      return existingUser.id;
    }

    // 2) Tentar resolver como StackUser.id
    const stackUser = await prisma.stackUser.findUnique({
      where: { id: rawUserId },
      include: { user: true }
    }).catch(() => null);

    if (!stackUser) {
      // Não conseguimos mapear, devolve o id original (vai falhar com FK,
      // mas registramos o erro no caller)
      return rawUserId;
    }

    // 2.1) Se já houver user associado, usa ele
    if (stackUser.user) {
      return stackUser.user.id;
    }

    // 2.2) Criar/associar um User para esse StackUser
    let userForStack = null;

    // Se tiver email, tentar reaproveitar User por email
    if (stackUser.primaryEmail) {
      userForStack = await prisma.user.findUnique({
        where: { email: stackUser.primaryEmail }
      }).catch(() => null);
    }

    if (!userForStack) {
      // Criar novo User mínimo
      const baseName = (stackUser.displayName || stackUser.primaryEmail || 'user')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .slice(0, 20);

      userForStack = await prisma.user.create({
        data: {
          email: stackUser.primaryEmail,
          username: `${baseName}_${Date.now().toString(36)}`,
          fullName: stackUser.displayName || null,
          stackUserId: stackUser.id
        }
      });
    } else if (!userForStack.stackUserId) {
      // Garantir associação se ainda não existir
      userForStack = await prisma.user.update({
        where: { id: userForStack.id },
        data: { stackUserId: stackUser.id }
      });
    }

    // Atualizar StackUser com referência ao User
    await prisma.stackUser.update({
      where: { id: stackUser.id },
      data: { userId: userForStack.id }
    }).catch(() => null);

    return userForStack.id;
  },

  /**
   * Busca configurações por userId
   */
  async findByUser(userId) {
    try {
      const resolvedUserId = await this._resolveUserId(userId);

      let settings = await prisma.botSettings.findUnique({
        where: { userId: resolvedUserId }
      });

      // Se não existir, cria com valores padrão
      if (!settings) {
        settings = await prisma.botSettings.create({
          data: {
            userId: resolvedUserId,
            botName: 'Assistente',
            storeType: 'restaurant',
            contextLimit: 10,
            lineLimit: 5,
            isActive: true
          }
        });
        logger.info(`BotSettings criado para usuário (resolved): ${resolvedUserId} (raw: ${userId})`);
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
      const resolvedUserId = await this._resolveUserId(userId);

      // Remove campos undefined/null para não sobrescrever com null
      const cleanUpdates = {};
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && updates[key] !== null) {
          cleanUpdates[key] = updates[key];
        }
      });

      return await prisma.botSettings.upsert({
        where: { userId: resolvedUserId },
        update: cleanUpdates,
        create: {
          userId: resolvedUserId,
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
