import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { hashPassword } from '@/lib/auth/password';
import { createAuditLog } from '@/lib/auth/adminAuth';

// GET - Buscar usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminAuth(request);
    if (session instanceof NextResponse) return session;

    const hasPermission = await import('@/lib/auth/adminAuth').then(m => 
      m.checkAdminPermission(session, 'view_users' as any)
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar usuários' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const user = await prisma.stackUser.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
          },
        },
        toolPermissions: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminAuth(request);
    if (session instanceof NextResponse) return session;

    const hasPermission = await import('@/lib/auth/adminAuth').then(m => 
      m.checkAdminPermission(session, 'edit_users' as any)
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para editar usuários' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { primaryEmail, displayName, isActive } = body;

    // Verificar se usuário existe
    const existingUser = await prisma.stackUser.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar StackUser
    const updateData: any = {};
    if (primaryEmail !== undefined) updateData.primaryEmail = primaryEmail;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await prisma.stackUser.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
          },
        },
        toolPermissions: true,
      },
    });

    // Atualizar User relacionado se existir
    if (updatedUser.userId && body.userEmail) {
      await prisma.user.update({
        where: { id: updatedUser.userId },
        data: { email: body.userEmail },
      });
    }

    // Log de auditoria
    try {
      await createAuditLog({
        userId: session.userId,
        action: 'user_updated',
        entityType: 'StackUser',
        entityId: id,
        details: { changes: updateData },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      });
    } catch (logError) {
      console.error('Erro ao criar log de auditoria:', logError);
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário', details: error?.message },
      { status: 500 }
    );
  }
}
