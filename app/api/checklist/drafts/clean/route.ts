import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';

// 🧹 ENDPOINT TEMPORÁRIO - Limpar todos os rascunhos do usuário
// Útil para resolver problemas de constraint ou dados corrompidos

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser({ or: 'return-null' });
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Deletar TODOS os rascunhos do usuário
    const result = await prisma.checklistDraft.deleteMany({
      where: {
        userId: user.id,
      },
    });

    console.log(`🧹 ${result.count} rascunho(s) do usuário ${user.id} foram deletados`);

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
