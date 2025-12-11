/**
 * Script para corrigir storeId truncados na tabela user_apis
 * Garante que cada conexão WhatsApp tenha o storeId completo do stack_users
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixStoreIds() {
  console.log('🔧 Iniciando correção de storeId para conexões WhatsApp...\n');

  try {
    // Buscar todas as conexões WhatsApp
    const whatsappAPIs = await prisma.userAPI.findMany({
      where: {
        type: 'whatsapp'
      },
      include: {
        user: {
          include: {
            stackUser: true
          }
        }
      }
    });

    console.log(`📱 Encontradas ${whatsappAPIs.length} conexões WhatsApp\n`);

    if (whatsappAPIs.length === 0) {
      console.log('✅ Nenhuma conexão WhatsApp encontrada. Nada para corrigir.');
      return;
    }

    let fixed = 0;
    let errors = 0;

    for (const api of whatsappAPIs) {
      try {
        // Buscar o stackUserId correto
        let correctStackUserId: string | null = null;

        // Opção 1: Se o user tem stackUser associado
        if (api.user?.stackUser) {
          correctStackUserId = api.user.stackUser.id;
        } else {
          // Opção 2: Buscar pelo userId na tabela stack_users
          const stackUser = await prisma.stackUser.findFirst({
            where: {
              userId: api.userId
            }
          });
          
          if (stackUser) {
            correctStackUserId = stackUser.id;
          } else {
            // Opção 3: Tentar encontrar pelo storeId atual (mesmo que truncado)
            // Se o storeId começa com um UUID conhecido, tentar encontrar o stackUser completo
            if (api.storeId && api.storeId.length < 36) {
              // storeId truncado - tentar encontrar o stackUser que começa com esse prefixo
              const allStackUsers = await prisma.stackUser.findMany({
                where: {
                  id: {
                    startsWith: api.storeId.split('-')[0] // Primeira parte do UUID
                  }
                }
              });

              if (allStackUsers.length === 1) {
                correctStackUserId = allStackUsers[0].id;
              } else if (allStackUsers.length > 1) {
                // Múltiplos matches - usar o que tem userId correspondente
                const match = allStackUsers.find(su => su.userId === api.userId);
                if (match) {
                  correctStackUserId = match.id;
                }
              }
            }
          }
        }

        if (!correctStackUserId) {
          console.error(`❌ Não foi possível encontrar stackUserId para API ${api.id} (storeId atual: ${api.storeId})`);
          errors++;
          continue;
        }

        // Verificar se precisa corrigir
        if (api.storeId === correctStackUserId) {
          console.log(`✅ API ${api.id} já tem storeId correto: ${api.storeId}`);
          continue;
        }

        // Atualizar com o storeId correto
        await prisma.userAPI.update({
          where: { id: api.id },
          data: {
            storeId: correctStackUserId
          }
        });

        console.log(`✅ Corrigido: API ${api.id}`);
        console.log(`   Antes: ${api.storeId}`);
        console.log(`   Depois: ${correctStackUserId}\n`);
        fixed++;

      } catch (error: any) {
        console.error(`❌ Erro ao processar API ${api.id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Resumo da correção:');
    console.log(`   ✅ Corrigidas: ${fixed}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log(`\n✅ Correção concluída!`);

  } catch (error: any) {
    console.error('❌ Erro fatal na correção:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
fixStoreIds()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro ao executar script:', error);
    process.exit(1);
  });

