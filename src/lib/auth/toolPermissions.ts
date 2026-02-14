import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SystemTool } from '@/types/admin';
import { stackServerApp } from '@/stack';

/**
 * Verifica se o usuário atual (StackUser) tem permissão para acessar uma ferramenta específica
 * @param stackUserId - ID do StackUser
 * @param tool - Ferramenta que precisa ser verificada
 * @returns true se tem permissão, false caso contrário
 */
export async function checkToolPermission(
  stackUserId: string,
  tool: SystemTool
): Promise<boolean> {
  try {
    if (!stackUserId) {
      return false;
    }

    // Buscar StackUser com permissões
    const stackUser = await prisma.stackUser.findUnique({
      where: { id: stackUserId },
      include: {
        toolPermissions: true,
      },
    });

    if (!stackUser) {
      return false;
    }

    // Verificar se o usuário está ativo
    if (!stackUser.isActive) {
      return false;
    }

    // Verificar se a ferramenta está habilitada para este usuário
    const permission = stackUser.toolPermissions.find(
      (p) => p.tool === tool && p.isEnabled === true
    );

    return !!permission;
  } catch (error) {
    console.error('Erro ao verificar permissão de ferramenta:', error);
    return false;
  }
}

/**
 * Middleware para proteger rotas de ferramentas usando Stack Auth
 * @param tool - Ferramenta que precisa ser verificada
 * @returns NextResponse com erro 403 se não tiver permissão, ou null se tiver
 */
export async function requireToolPermission(
  tool: SystemTool
): Promise<NextResponse | null> {
  try {
    // Obter usuário do Stack Auth
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    
    if (!stackUser) {
      return NextResponse.json(
        {
          error: 'Não autenticado',
          message: 'Você precisa estar logado para acessar esta ferramenta',
        },
        { status: 401 }
      );
    }

    // Verificar permissão
    const hasPermission = await checkToolPermission(stackUser.id, tool);

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: 'Acesso negado',
          message: `Você não tem permissão para acessar a ferramenta: ${tool}. Entre em contato com o administrador.`,
        },
        { status: 403 }
      );
    }

    return null;
  } catch (error) {
    console.error('Erro ao verificar permissão de ferramenta:', error);
    return NextResponse.json(
      {
        error: 'Erro ao verificar permissão',
        message: 'Ocorreu um erro ao verificar suas permissões',
      },
      { status: 500 }
    );
  }
}

/**
 * Verifica permissão de ferramenta para um StackUser específico
 * @param stackUserId - ID do StackUser
 * @param tool - Ferramenta a verificar
 * @returns true se tem permissão, false caso contrário
 */
export async function checkUserToolPermission(
  stackUserId: string,
  tool: SystemTool
): Promise<boolean> {
  try {
    const permission = await prisma.userToolPermission.findUnique({
      where: {
        stackUserId_tool: {
          stackUserId,
          tool,
        },
      },
    });

    return permission?.isEnabled === true;
  } catch (error) {
    console.error('Erro ao verificar permissão de ferramenta do usuário:', error);
    return false;
  }
}
