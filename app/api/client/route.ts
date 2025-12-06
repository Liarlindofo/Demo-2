import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

/**
 * POST /api/client
 * Cria nova configuração de cliente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verificar autenticação
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Sincronizar usuário
    const dbUser = await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail,
      displayName: stackUser.displayName,
      profileImageUrl: stackUser.profileImageUrl,
      primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
    });

    // Buscar ou criar BotSettings
    let botSettings = await prisma.botSettings.findUnique({
      where: { userId: dbUser.id }
    });

    if (!botSettings) {
      botSettings = await prisma.botSettings.create({
        data: {
          userId: dbUser.id,
          botName: body.botName || 'Assistente',
          storeType: body.storeType || 'restaurant',
          basePrompt: body.basePrompt || null,
          forbidden: body.forbidden || null,
          contextLimit: body.messageLimit || 30,
          lineLimit: 5,
          isActive: body.botEnabled ?? true
        }
      });
    } else {
      // Atualizar se já existir
      botSettings = await prisma.botSettings.update({
        where: { userId: dbUser.id },
        data: {
          botName: body.botName || botSettings.botName,
          storeType: body.storeType || botSettings.storeType,
          basePrompt: body.basePrompt !== undefined ? body.basePrompt : botSettings.basePrompt,
          forbidden: body.forbidden !== undefined ? body.forbidden : botSettings.forbidden,
          contextLimit: body.messageLimit || botSettings.contextLimit,
          isActive: body.botEnabled !== undefined ? body.botEnabled : botSettings.isActive
        }
      });
    }

    // Retornar no formato esperado
    const config = {
      id: body.id || dbUser.id,
      name: body.name || 'WhatsApp Principal',
      botName: botSettings.botName || 'Assistente',
      storeType: botSettings.storeType || 'restaurant',
      basePrompt: botSettings.basePrompt || null,
      forbidden: botSettings.forbidden || null,
      messageLimit: botSettings.contextLimit || 30,
      contextTime: body.contextTime || 60,
      botEnabled: botSettings.isActive ?? true
    };

    return NextResponse.json({
      success: true,
      data: config
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cliente', message: error.message },
      { status: 500 }
    );
  }
}

