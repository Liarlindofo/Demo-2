import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

/**
 * GET /api/client/[clientId]/config
 * Busca ou cria configuração do cliente
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;

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

    // Buscar BotSettings do usuário
    let botSettings = await prisma.botSettings.findUnique({
      where: { userId: dbUser.id }
    });

    // Se não existir, criar com defaults
    if (!botSettings) {
      botSettings = await prisma.botSettings.create({
        data: {
          userId: dbUser.id,
          botName: 'Assistente',
          storeType: 'restaurant',
          contextLimit: 10,
          lineLimit: 5,
          isActive: true
        }
      });
    }

    // Converter BotSettings para formato ClientConfig esperado pelo frontend
    const config = {
      id: clientId,
      name: 'WhatsApp Principal',
      botName: botSettings.botName || 'Assistente',
      storeType: botSettings.storeType || 'restaurant',
      basePrompt: botSettings.basePrompt || null,
      forbidden: botSettings.forbidden || null,
      messageLimit: botSettings.contextLimit || 30,
      contextTime: 60, // Valor padrão
      botEnabled: botSettings.isActive ?? true
    };

    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    console.error('Erro ao buscar configuração do cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/client/[clientId]/config
 * Atualiza configuração do cliente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
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
          contextLimit: body.messageLimit || 10,
          lineLimit: 5,
          isActive: body.botEnabled ?? true
        }
      });
    } else {
      // Atualizar BotSettings
      botSettings = await prisma.botSettings.update({
        where: { userId: dbUser.id },
        data: {
          botName: body.botName !== undefined ? body.botName : botSettings.botName,
          storeType: body.storeType !== undefined ? body.storeType : botSettings.storeType,
          basePrompt: body.basePrompt !== undefined ? body.basePrompt : botSettings.basePrompt,
          forbidden: body.forbidden !== undefined ? body.forbidden : botSettings.forbidden,
          contextLimit: body.messageLimit !== undefined ? body.messageLimit : botSettings.contextLimit,
          isActive: body.botEnabled !== undefined ? body.botEnabled : botSettings.isActive
        }
      });
    }

    // Retornar no formato esperado
    const config = {
      id: clientId,
      name: 'WhatsApp Principal',
      botName: botSettings.botName || 'Assistente',
      storeType: botSettings.storeType || 'restaurant',
      basePrompt: botSettings.basePrompt || null,
      forbidden: botSettings.forbidden || null,
      messageLimit: botSettings.contextLimit || 30,
      contextTime: 60,
      botEnabled: botSettings.isActive ?? true
    };

    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    console.error('Erro ao atualizar configuração do cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configuração', message: error.message },
      { status: 500 }
    );
  }
}

