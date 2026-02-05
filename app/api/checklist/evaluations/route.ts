import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';

// GET /api/checklist/evaluations - Listar todas as avaliações do usuário
export async function GET(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar usuário no banco
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { stackUserId: stackUser.id },
          { email: stackUser.primaryEmail || undefined }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar avaliações do usuário
    const evaluations = await prisma.evaluation.findMany({
      where: {
        userId: user.id
      },
      orderBy: [
        { evaluationDate: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        topicScores: true,
        itemScores: true
      }
    });

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    return NextResponse.json({ error: 'Erro ao buscar avaliações' }, { status: 500 });
  }
}

// POST /api/checklist/evaluations - Criar nova avaliação
export async function POST(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      storeId,
      storeName,
      supervisorName,
      evaluationDate,
      topics,
      totalScore,
      maxTotalScore,
      maintenanceList,
      improvementSuggestions,
      lastOvenMaintenance,
      lastRefrigeratorMaintenance,
      lastPestControl
    } = body;

    // Validações
    if (!storeName || !supervisorName || !evaluationDate) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: storeName, supervisorName, evaluationDate' },
        { status: 400 }
      );
    }

    // Buscar usuário no banco
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { stackUserId: stackUser.id },
          { email: stackUser.primaryEmail || undefined }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Atualizar datas de manutenção na loja, se fornecidas
    if (storeId && (lastOvenMaintenance || lastRefrigeratorMaintenance || lastPestControl)) {
      const updateData: any = {};
      
      if (lastOvenMaintenance) {
        updateData.lastOvenMaintenance = new Date(lastOvenMaintenance);
      }
      if (lastRefrigeratorMaintenance) {
        updateData.lastRefrigeratorMaintenance = new Date(lastRefrigeratorMaintenance);
      }
      if (lastPestControl) {
        updateData.lastPestControl = new Date(lastPestControl);
      }

      await prisma.store.update({
        where: { id: storeId },
        data: updateData
      });
    }

    // Criar avaliação
    const evaluation = await prisma.evaluation.create({
      data: {
        userId: user.id,
        storeId: storeId || null,
        storeName,
        supervisorName,
        evaluationDate: new Date(evaluationDate),
        totalScore,
        maxTotalScore,
        status: 'completed',
        maintenanceList: maintenanceList || null,
        improvementSuggestions: improvementSuggestions || null,
        topicScores: {
          create: topics.map((topic: any) => ({
            topicName: topic.topicName,
            topicScore: topic.score || 0,
            maxScore: topic.maxScore || null,
            observations: topic.observations || null
          }))
        },
        itemScores: {
          create: topics.flatMap((topic: any) =>
            (topic.items || []).map((item: any) => ({
              topicName: topic.topicName,
              itemName: item.itemName || '',
              itemScore: item.score || 0,
              maxScore: item.maxScore || 0,
              status: item.status || 'FORA DO PADRÃO',
              observations: item.observations || null,
              photoUrls: item.photoUrls || []
            }))
          )
        }
      },
      include: {
        topicScores: true,
        itemScores: true
      }
    });

    return NextResponse.json({ success: true, evaluationId: evaluation.id, evaluation });
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    return NextResponse.json({ error: 'Erro ao criar avaliação' }, { status: 500 });
  }
}

