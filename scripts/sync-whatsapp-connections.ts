/**
 * Script para sincronizar conexões WhatsApp existentes para user_apis
 * 
 * Este script busca todos os WhatsAppBots conectados e cria/atualiza
 * as entradas correspondentes na tabela user_apis
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncWhatsAppConnections() {
  console.log('🔄 Iniciando sincronização de conexões WhatsApp...\n');

  try {
    // Buscar todos os WhatsAppBots conectados
    const connectedBots = await prisma.whatsappBot.findMany({
      where: {
        isConnected: true
      },
      include: {
        stackUser: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`📱 Encontrados ${connectedBots.length} bots conectados\n`);

    if (connectedBots.length === 0) {
      console.log('✅ Nenhum bot conectado encontrado. Nada para sincronizar.');
      return;
    }

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const bot of connectedBots) {
      try {
        const stackUserId = bot.userId;
        const slot = bot.slot;
        const connectedNumber = bot.connectedNumber;

        // Verificar se StackUser tem User associado
        if (!bot.stackUser || !bot.stackUser.user) {
          console.log(`⚠️  Bot [${stackUserId}:${slot}] não tem User associado. Tentando criar...`);

          // Tentar criar User se não existir
          if (bot.stackUser.primaryEmail) {
            let dbUser = await prisma.user.findUnique({
              where: { email: bot.stackUser.primaryEmail }
            });

            if (!dbUser) {
              dbUser = await prisma.user.create({
                data: {
                  email: bot.stackUser.primaryEmail,
                  username: bot.stackUser.primaryEmail.split('@')[0] + '_' + Date.now().toString(36),
                  fullName: bot.stackUser.displayName || '',
                  stackUserId: stackUserId
                }
              });

              // Atualizar StackUser com referência ao User
              await prisma.stackUser.update({
                where: { id: stackUserId },
                data: { userId: dbUser.id }
              });

              console.log(`✅ User criado e associado: ${dbUser.id}`);
            } else if (!dbUser.stackUserId) {
              // Associar User existente ao StackUser
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { stackUserId: stackUserId }
              });
              await prisma.stackUser.update({
                where: { id: stackUserId },
                data: { userId: dbUser.id }
              });

              console.log(`✅ User existente associado: ${dbUser.id}`);
            }

            // Recarregar bot com User atualizado
            const updatedBot = await prisma.whatsappBot.findUnique({
              where: { id: bot.id },
              include: {
                stackUser: {
                  include: {
                    user: true
                  }
                }
              }
            });

            if (!updatedBot?.stackUser?.user) {
              console.error(`❌ Não foi possível criar/associar User para bot [${stackUserId}:${slot}]`);
              errors++;
              continue;
            }

            // Continuar com o bot atualizado
            const dbUserId = updatedBot.stackUser.user.id;
            const storeId = stackUserId;
            const name = connectedNumber 
              ? `WhatsApp ${connectedNumber}` 
              : `WhatsApp Slot ${slot}`;

            // Verificar se já existe
            const existing = await prisma.userAPI.findFirst({
              where: {
                userId: dbUserId,
                type: 'whatsapp',
                storeId: storeId
              }
            });

            if (existing) {
              await prisma.userAPI.update({
                where: { id: existing.id },
                data: {
                  status: 'connected',
                  name: name,
                  updatedAt: new Date()
                }
              });
              updated++;
              console.log(`✅ Atualizado: ${name} [${stackUserId}:${slot}]`);
            } else {
              await prisma.userAPI.create({
                data: {
                  userId: dbUserId,
                  name: name,
                  type: 'whatsapp',
                  storeId: storeId,
                  apiKey: '',
                  baseUrl: '',
                  status: 'connected'
                }
              });
              created++;
              console.log(`✅ Criado: ${name} [${stackUserId}:${slot}]`);
            }
          } else {
            console.error(`❌ Bot [${stackUserId}:${slot}] não tem email no StackUser`);
            errors++;
          }
          continue;
        }

        // StackUser tem User associado, prosseguir normalmente
        const dbUserId = bot.stackUser.user.id;
        const storeId = stackUserId;
        const name = connectedNumber 
          ? `WhatsApp ${connectedNumber}` 
          : `WhatsApp Slot ${slot}`;

        // Verificar se já existe
        const existing = await prisma.userAPI.findFirst({
          where: {
            userId: dbUserId,
            type: 'whatsapp',
            storeId: storeId
          }
        });

        if (existing) {
          await prisma.userAPI.update({
            where: { id: existing.id },
            data: {
              status: 'connected',
              name: name,
              updatedAt: new Date()
            }
          });
          updated++;
          console.log(`✅ Atualizado: ${name} [${stackUserId}:${slot}]`);
        } else {
          await prisma.userAPI.create({
            data: {
              userId: dbUserId,
              name: name,
              type: 'whatsapp',
              storeId: storeId,
              apiKey: '',
              baseUrl: '',
              status: 'connected'
            }
          });
          created++;
          console.log(`✅ Criado: ${name} [${stackUserId}:${slot}]`);
        }
      } catch (error: any) {
        console.error(`❌ Erro ao processar bot [${bot.userId}:${bot.slot}]:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Resumo da sincronização:');
    console.log(`   ✅ Criadas: ${created}`);
    console.log(`   🔄 Atualizadas: ${updated}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log(`\n✅ Sincronização concluída!`);

  } catch (error: any) {
    console.error('❌ Erro fatal na sincronização:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
syncWhatsAppConnections()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });

