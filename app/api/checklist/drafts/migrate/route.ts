export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🔧 ENDPOINT DE MIGRAÇÃO - Atualizar schema do banco
// Remove constraint UNIQUE de checklist_drafts
// Pode executar múltiplas vezes (idempotente)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Iniciando migração do banco...');
    
    // 1. Verificar se a tabela existe
    const tableExists = await prisma.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'checklist_drafts'
      )
    `;
    
    if (!tableExists[0]?.exists) {
      console.log('⚠️ Tabela checklist_drafts não existe ainda');
      return NextResponse.json({
        success: false,
        message: 'Tabela checklist_drafts não existe. Execute: npx prisma db push',
      });
    }

    // 2. Verificar constraint UNIQUE existente
    const uniqueConstraint = await prisma.$queryRaw<any[]>`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'checklist_drafts'::regclass 
      AND contype = 'u'
      AND conname LIKE '%userId%storeId%'
    `;

    if (uniqueConstraint.length > 0) {
      console.log('⚠️ Constraint UNIQUE encontrado, removendo...');
      
      // Remover constraint UNIQUE
      for (const constraint of uniqueConstraint) {
        await prisma.$executeRaw`
          ALTER TABLE "checklist_drafts" 
          DROP CONSTRAINT IF EXISTS "${constraint.conname}"
        `;
        console.log(`✅ Constraint ${constraint.conname} removido!`);
      }
    } else {
      console.log('✅ Nenhum constraint UNIQUE problemático encontrado');
    }

    // 3. Remover índice UNIQUE se existir
    await prisma.$executeRaw`
      DROP INDEX IF EXISTS "checklist_drafts_userId_storeId_key"
    `;

    // 4. Criar índices simples (não-únicos) se não existirem
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "checklist_drafts_userId_idx" 
      ON "checklist_drafts"("userId")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "checklist_drafts_expiresAt_idx" 
      ON "checklist_drafts"("expiresAt")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "checklist_drafts_userId_storeId_idx" 
      ON "checklist_drafts"("userId", "store_id")
    `;

    console.log('✅ Migração concluída com sucesso!');

    return NextResponse.json({
      success: true,
      message: 'Migração executada com sucesso! Banco atualizado.',
      removedConstraints: uniqueConstraint.length,
    });
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    
    // Log detalhado
    if (error instanceof Error) {
      console.error('Erro detalhado:', {
        message: error.message,
        stack: error.stack,
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao executar migração', 
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}

// GET também executa a migração (para facilitar teste no navegador)
export async function GET(request: NextRequest) {
  return POST(request);
}
