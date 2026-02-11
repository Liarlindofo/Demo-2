import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';

// ⚙️ Configuração - Aumentar limite de body para 50MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

// Limite máximo do body (50MB em bytes)
export const maxDuration = 60; // 60 segundos de timeout
export const dynamic = 'force-dynamic';

// 🎯 POST - Salvar/Atualizar rascunho do checklist
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser({ or: 'return-null' });
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const evaluation = data.evaluation;

    if (!evaluation) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Calcular estatísticas do rascunho
    let totalItems = 0;
    let totalPhotos = 0;
    let totalComments = 0;

    if (evaluation.topics && Array.isArray(evaluation.topics)) {
      evaluation.topics.forEach((topic: any) => {
        if (topic.items && Array.isArray(topic.items)) {
          topic.items.forEach((item: any) => {
            // Contar apenas itens realmente avaliados
            if (item.status && item.status !== 'FORA DO PADRÃO' || item.observations || item.photoUrls?.length) {
              totalItems++;
            }
            
            // Contar fotos
            if (item.photoUrls && Array.isArray(item.photoUrls)) {
              totalPhotos += item.photoUrls.length;
            }
            
            // Contar comentários
            if (item.observations && item.observations.trim() !== '') {
              totalComments++;
            }
          });
        }
        
        // Contar observações de tópicos
        if (topic.observations && topic.observations.trim() !== '') {
          totalComments++;
        }
      });
    }

    // Calcular data de expiração (2 dias a partir de agora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2);

    // Buscar draft mais recente do usuário (para mesma loja ou temp)
    const storeKey = evaluation.storeId || 'temp';
    
    const existingDraft = await prisma.checklistDraft.findFirst({
      where: {
        userId: user.id,
        storeId: storeKey,
      },
      orderBy: {
        lastSaved: 'desc'
      }
    });

    let draft;

    if (existingDraft) {
      // Atualizar draft existente
      draft = await prisma.checklistDraft.update({
        where: { id: existingDraft.id },
        data: {
          storeName: evaluation.storeName,
          supervisorName: evaluation.supervisorName,
          evaluationDate: evaluation.evaluationDate,
          checklistData: evaluation,
          totalItems,
          totalPhotos,
          totalComments,
          lastSaved: new Date(),
          expiresAt,
        },
      });
      
      console.log('✅ Rascunho atualizado:', draft.id, { totalItems, totalPhotos, totalComments });
    } else {
      // Criar novo draft
      draft = await prisma.checklistDraft.create({
        data: {
          userId: user.id,
          storeId: storeKey,
          storeName: evaluation.storeName,
          supervisorName: evaluation.supervisorName,
          evaluationDate: evaluation.evaluationDate,
          checklistData: evaluation,
          totalItems,
          totalPhotos,
          totalComments,
          expiresAt,
        },
      });
      
      console.log('✅ Novo rascunho criado:', draft.id, { totalItems, totalPhotos, totalComments });
    }

    return NextResponse.json({
      success: true,
      draftId: draft.id,
      lastSaved: draft.lastSaved,
      totalItems,
      totalPhotos,
      totalComments,
    });
  } catch (error) {
    console.error('❌ Erro ao salvar rascunho:', error);
    
    // Log detalhado para debug
    if (error instanceof Error) {
      console.error('Erro detalhado:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao salvar rascunho', 
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        errorType: error instanceof Error ? error.name : 'Unknown'
      },
      { status: 500 }
    );
  }
}

// 🎯 GET - Buscar rascunhos do usuário
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser({ or: 'return-null' });
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar rascunhos não expirados
    const drafts = await prisma.checklistDraft.findMany({
      where: {
        userId: user.id,
        expiresAt: { gte: new Date() },
      },
      orderBy: { lastSaved: 'desc' },
      select: {
        id: true,
        storeId: true,
        storeName: true,
        supervisorName: true,
        evaluationDate: true,
        totalItems: true,
        totalPhotos: true,
        totalComments: true,
        lastSaved: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    console.log(`📋 ${drafts.length} rascunho(s) encontrado(s) para usuário ${user.id}`);

    return NextResponse.json(drafts);
  } catch (error) {
    console.error('❌ Erro ao buscar rascunhos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar rascunhos', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// 🎯 DELETE - Remover rascunhos expirados (executar via cron)
export async function DELETE(request: NextRequest) {
  try {
    // Deletar rascunhos expirados (mais de 2 dias)
    const result = await prisma.checklistDraft.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    console.log(`🗑️ ${result.count} rascunho(s) expirado(s) removido(s)`);

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('❌ Erro ao limpar rascunhos expirados:', error);
    return NextResponse.json(
      { error: 'Erro ao limpar rascunhos', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
