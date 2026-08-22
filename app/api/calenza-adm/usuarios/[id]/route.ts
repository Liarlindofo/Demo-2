export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, hasPermission, createAuditLog } from '@/lib/auth/adminAuth';
import {
  stackAuthErrorMessage,
  updateStackAuthUserFromAdmin,
} from '@/lib/stack-auth-admin';
import { Permission } from '@/types/admin';

// GET - Buscar usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminAuth(request);
    if (session instanceof NextResponse) return session;

    if (!(await hasPermission(session, Permission.VIEW_USERS))) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar usuários' },
        { status: 403 },
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
        { status: 404 },
      );
    }

    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error('Erro ao buscar usuário:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuário', details },
      { status: 500 },
    );
  }
}

// PATCH - Atualizar usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminAuth(request);
    if (session instanceof NextResponse) return session;

    if (!(await hasPermission(session, Permission.EDIT_USERS))) {
      return NextResponse.json(
        { error: 'Sem permissão para editar usuários' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { primaryEmail, displayName, isActive, userEmail } = body as {
      primaryEmail?: string;
      displayName?: string;
      isActive?: boolean;
      userEmail?: string;
    };

    const existingUser = await prisma.stackUser.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 },
      );
    }

    const normalizedEmail =
      primaryEmail !== undefined ? primaryEmail.trim().toLowerCase() : undefined;
    const normalizedUserEmail =
      userEmail !== undefined ? userEmail.trim().toLowerCase() : undefined;

    if (normalizedEmail) {
      const dup = await prisma.stackUser.findFirst({
        where: {
          primaryEmail: { equals: normalizedEmail, mode: 'insensitive' },
          NOT: { id },
        },
      });
      if (dup) {
        return NextResponse.json(
          { error: 'Já existe um usuário com este email principal' },
          { status: 409 },
        );
      }
    }

    if (normalizedUserEmail) {
      const dupUser = await prisma.user.findFirst({
        where: {
          email: { equals: normalizedUserEmail, mode: 'insensitive' },
          ...(existingUser.userId ? { NOT: { id: existingUser.userId } } : {}),
        },
      });
      if (dupUser) {
        return NextResponse.json(
          { error: 'Já existe um usuário com este email do sistema' },
          { status: 409 },
        );
      }
    }

    // Stack Auth = login real; atualizar primeiro para não divergir do Prisma
    if (
      normalizedEmail !== undefined ||
      displayName !== undefined
    ) {
      try {
        await updateStackAuthUserFromAdmin(id, {
          ...(normalizedEmail !== undefined ? { primaryEmail: normalizedEmail } : {}),
          ...(displayName !== undefined ? { displayName } : {}),
        });
      } catch (stackErr) {
        console.error('Erro ao atualizar Stack Auth:', stackErr);
        return NextResponse.json(
          { error: stackAuthErrorMessage(stackErr) },
          { status: 400 },
        );
      }
    }

    const updateData: {
      primaryEmail?: string;
      displayName?: string;
      isActive?: boolean;
    } = {};
    if (normalizedEmail !== undefined) updateData.primaryEmail = normalizedEmail;
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

    if (updatedUser.userId) {
      const localEmail = normalizedUserEmail ?? normalizedEmail;
      if (localEmail) {
        await prisma.user.update({
          where: { id: updatedUser.userId },
          data: { email: localEmail },
        });
      }
    }

    try {
      await createAuditLog({
        userId: session.userId,
        action: 'user_updated',
        entityType: 'StackUser',
        entityId: id,
        details: { changes: updateData, stackAuthSynced: true },
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          null,
        userAgent: request.headers.get('user-agent') || null,
      });
    } catch (logError) {
      console.error('Erro ao criar log de auditoria:', logError);
    }

    const fresh = await prisma.stackUser.findUnique({
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

    return NextResponse.json(fresh ?? updatedUser);
  } catch (error: unknown) {
    console.error('Erro ao atualizar usuário:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário', details },
      { status: 500 },
    );
  }
}
