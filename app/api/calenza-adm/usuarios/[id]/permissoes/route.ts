import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, hasPermission, createAuditLog } from '@/lib/auth/adminAuth';
import { SystemTool, Permission } from '@/types/admin';

// GET - Buscar permissões do usuário
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminAuth(request);
    if (session instanceof NextResponse) return session;

    if (!(await hasPermission(session, Permission.VIEW_USERS))) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar permissões' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const permissions = await prisma.userToolPermission.findMany({
      where: { stackUserId: id },
    });

    return NextResponse.json(permissions);
  } catch (error: any) {
    console.error('Erro ao buscar permissões:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar permissões', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar permissões de ferramentas
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminAuth(request);
    if (session instanceof NextResponse) return session;

    if (!(await hasPermission(session, Permission.EDIT_USERS))) {
      return NextResponse.json(
        { error: 'Sem permissão para editar permissões' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { permissions } = body; // Array de { tool: SystemTool, isEnabled: boolean }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissões devem ser um array' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const stackUser = await prisma.stackUser.findUnique({
      where: { id },
    });

    if (!stackUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar ou criar permissões
    const updatedPermissions = await Promise.all(
      permissions.map(async ({ tool, isEnabled }: { tool: string; isEnabled: boolean }) => {
        // Validar tool
        if (!Object.values(SystemTool).includes(tool as SystemTool)) {
          throw new Error(`Ferramenta inválida: ${tool}`);
        }

        return prisma.userToolPermission.upsert({
          where: {
            stackUserId_tool: {
              stackUserId: id,
              tool: tool as SystemTool,
            },
          },
          update: { isEnabled },
          create: {
            stackUserId: id,
            tool: tool as SystemTool,
            isEnabled,
          },
        });
      })
    );

    // Log de auditoria
    try {
      await createAuditLog({
        userId: session.userId,
        action: 'tool_permissions_updated',
        entityType: 'StackUser',
        entityId: id,
        details: { permissions },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      });
    } catch (logError) {
      console.error('Erro ao criar log de auditoria:', logError);
    }

    return NextResponse.json({
      success: true,
      permissions: updatedPermissions,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar permissões:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar permissões', details: error?.message },
      { status: 500 }
    );
  }
}
