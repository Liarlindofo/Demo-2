export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

// 🧹 ENDPOINT TEMPORÁRIO - Limpar todos os rascunhos do usuário
// Útil para resolver problemas de constraint ou dados corrompidos

export async function POST(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Sincronizar StackUser com User do banco
    const dbUser = await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail || undefined,
      displayName: stackUser.displayName || undefined,
      profileImageUrl: stackUser.profileImageUrl || undefined,
      primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
    });

    // Deletar TODOS os rascunhos do usuário
    const result = await prisma.checklistDraft.deleteMany({
      where: {
        userId: dbUser.id,
      },
    });

    console.log(`🧹 ${result.count} rascunho(s) do usuário ${dbUser.id} foram deletados`);

    return NextResponse.json({
      success: true,
      message: `${result.count} rascunho(s) deletado(s) com sucesso`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('❌ Erro ao limpar rascunhos:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao limpar rascunhos', 
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}
