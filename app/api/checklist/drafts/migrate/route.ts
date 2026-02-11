import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🔧 ENDPOINT DE MIGRAÇÃO - Atualizar schema do banco
// Remove constraint UNIQUE de checklist_drafts
// Executa UMA VEZ após deploy

export async function POST(request: NextRequest) {
  try {
    // Verificar se já foi executado
    const checkIndex = await prisma.$queryRaw<any[]>`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'checklist_drafts' 
      AND indexname LIKE '%user_store_draft%'
    `;

    if (checkIndex.length > 0) {
      console.log('⚠️ Constraint UNIQUE ainda existe, removendo...');
      
      // Remover constraint UNIQUE
      await prisma.$executeRaw`
        DROP INDEX IF EXISTS "checklist_drafts_userId_storeId_key"
      `;
      
      console.log('✅ Constraint UNIQUE removido!');
    } else {
      console.log('✅ Constraint já foi removido anteriormente');
    }

    // Criar índice simples se não existir
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "checklist_drafts_userId_storeId_idx" 
      ON "checklist_drafts"("userId", "store_id")
    `;

    console.log('✅ Índice criado com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Migração executada com sucesso! Constraint UNIQUE removido.',
    });
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao executar migração', 
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}
