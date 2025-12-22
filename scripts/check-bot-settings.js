import prisma from './src/db/index.js';
import logger from './src/utils/logger.js';

/**
 * Script de diagnóstico para verificar configurações do bot
 * 
 * Uso:
 *   node scripts/check-bot-settings.js
 */

async function checkBotSettings() {
  try {
    logger.info('🔍 Verificando bot_settings...');
    
    // Buscar todos os stack_users
    const stackUsers = await prisma.stackUser.findMany({
      include: {
        user: true
      }
    });
    
    logger.info(`📊 Encontrados ${stackUsers.length} stack_users`);
    
    for (const stackUser of stackUsers) {
      logger.info(`\n📋 Stack User: ${stackUser.id}`);
      logger.info(`   Email: ${stackUser.primaryEmail || '(sem email)'}`);
      logger.info(`   Display Name: ${stackUser.displayName || '(sem nome)'}`);
      
      if (!stackUser.user) {
        logger.warn(`   ⚠️ Stack User não tem User associado!`);
        
        // Tentar criar User se tiver email
        if (stackUser.primaryEmail) {
          logger.info(`   🔨 Criando User para este StackUser...`);
          
          let dbUser = await prisma.user.findUnique({
            where: { email: stackUser.primaryEmail }
          });
          
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: stackUser.primaryEmail,
                username: stackUser.primaryEmail.split('@')[0] + '_' + Date.now().toString(36),
                fullName: stackUser.displayName || '',
                stackUserId: stackUser.id
              }
            });
            logger.success(`   ✅ User criado: ${dbUser.id}`);
          }
          
          // Atualizar StackUser
          await prisma.stackUser.update({
            where: { id: stackUser.id },
            data: { userId: dbUser.id }
          });
          logger.success(`   ✅ StackUser atualizado com userId`);
          
          stackUser.user = dbUser;
        } else {
          logger.error(`   ❌ Sem email, não é possível criar User`);
          continue;
        }
      }
      
      const userId = stackUser.user.id;
      logger.info(`   User ID: ${userId}`);
      
      // Verificar bot_settings
      let botSettings = await prisma.botSettings.findUnique({
        where: { userId }
      });
      
      if (!botSettings) {
        logger.warn(`   ⚠️ BotSettings não encontrado, criando...`);
        botSettings = await prisma.botSettings.create({
          data: {
            userId,
            botName: 'Assistente',
            storeType: 'restaurant',
            contextLimit: 10,
            lineLimit: 5,
            isActive: true
          }
        });
        logger.success(`   ✅ BotSettings criado!`);
      } else {
        logger.info(`   ✅ BotSettings encontrado:`);
        logger.info(`      - botName: ${botSettings.botName}`);
        logger.info(`      - storeType: ${botSettings.storeType}`);
        logger.info(`      - isActive: ${botSettings.isActive}`);
        logger.info(`      - contextLimit: ${botSettings.contextLimit}`);
        
        if (!botSettings.isActive) {
          logger.warn(`   ⚠️ Bot está INATIVO! Ativando...`);
          await prisma.botSettings.update({
            where: { userId },
            data: { isActive: true }
          });
          logger.success(`   ✅ Bot ativado!`);
        }
      }
      
      // Verificar WhatsAppBot
      const whatsappBot = await prisma.whatsAppBot.findFirst({
        where: { userId: stackUser.id }
      });
      
      if (whatsappBot) {
        logger.info(`   📱 WhatsAppBot encontrado:`);
        logger.info(`      - slot: ${whatsappBot.slot}`);
        logger.info(`      - isConnected: ${whatsappBot.isConnected}`);
        logger.info(`      - connectedNumber: ${whatsappBot.connectedNumber || '(não conectado)'}`);
      } else {
        logger.info(`   📱 WhatsAppBot não encontrado (será criado ao conectar)`);
      }
    }
    
    logger.success(`\n✅ Verificação concluída!`);
    
  } catch (error) {
    logger.error('❌ Erro ao verificar bot_settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBotSettings();

