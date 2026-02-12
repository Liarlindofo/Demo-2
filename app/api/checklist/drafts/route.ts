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

    // Validar e garantir campos obrigatórios do schema (não podem ser vazios)
    const validatedStoreName = (evaluation.storeName && typeof evaluation.storeName === 'string' && evaluation.storeName.trim() !== '') 
      ? evaluation.storeName.trim() 
      : 'Sem loja selecionada';
    
    const validatedSupervisorName = (evaluation.supervisorName && typeof evaluation.supervisorName === 'string' && evaluation.supervisorName.trim() !== '') 
      ? evaluation.supervisorName.trim() 
      : 'Não informado';
    
    const validatedEvaluationDate = (evaluation.evaluationDate && typeof evaluation.evaluationDate === 'string' && evaluation.evaluationDate.trim() !== '') 
      ? evaluation.evaluationDate.trim() 
      : new Date().toISOString().split('T')[0];
    
    // Atualizar evaluation com valores validados
    evaluation.storeName = validatedStoreName;
    evaluation.supervisorName = validatedSupervisorName;
    evaluation.evaluationDate = validatedEvaluationDate;

    // Garantir que storeId seja null ou string válida (não 'temp')
    const storeId = evaluation.storeId && evaluation.storeId !== 'temp' ? evaluation.storeId : null;

    // Validar que checklistData seja um objeto válido
    if (!evaluation || typeof evaluation !== 'object') {
      return NextResponse.json({ error: 'Dados do checklist inválidos' }, { status: 400 });
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

    // Buscar draft mais recente do usuário (para mesma loja ou null)
    // Se storeId for null, busca drafts sem loja (storeId IS NULL)
    const existingDraft = await prisma.checklistDraft.findFirst({
      where: storeId 
        ? {
            userId: user.id,
            storeId: storeId,
          }
        : {
            userId: user.id,
            storeId: null,
          },
      orderBy: {
        lastSaved: 'desc'
      }
    });

    let draft;

    // Preparar dados para salvar
    const draftData = {
      storeId: storeId,
      storeName: validatedStoreName,
      supervisorName: validatedSupervisorName,
      evaluationDate: validatedEvaluationDate,
      checklistData: evaluation as any, // Prisma Json type
      totalItems,
      totalPhotos,
      totalComments,
      expiresAt,
    };

    if (existingDraft) {
      // Atualizar draft existente
      draft = await prisma.checklistDraft.update({
        where: { id: existingDraft.id },
        data: {
          ...draftData,
          lastSaved: new Date(),
        },
      });
      
      console.log('✅ Rascunho atualizado:', draft.id, { totalItems, totalPhotos, totalComments });
    } else {
      // Criar novo draft
      draft = await prisma.checklistDraft.create({
        data: {
          userId: user.id,
          ...draftData,
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
    let errorDetails = 'Erro desconhecido';
    let errorType = 'Unknown';
    
    if (error instanceof Error) {
      errorType = error.name;
      errorDetails = error.message;
      
      // Log completo do erro
      console.error('Erro detalhado:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // Se for erro do Prisma, logar mais detalhes
      if ('code' in error) {
        console.error('Código do erro Prisma:', (error as any).code);
        console.error('Meta do erro:', (error as any).meta);
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao salvar rascunho', 
        details: errorDetails,
        errorType: errorType,
        // Incluir código do Prisma se disponível
        ...(error && typeof error === 'object' && 'code' in error ? { prismaCode: (error as any).code } : {})
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
