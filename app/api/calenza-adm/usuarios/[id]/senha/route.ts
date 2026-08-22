export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, hasPermission, createAuditLog } from '@/lib/auth/adminAuth';
import { hashPassword } from '@/lib/auth/password';
import {
  stackAuthErrorMessage,
  updateStackAuthUserFromAdmin,
} from '@/lib/stack-auth-admin';
import { Permission } from '@/types/admin';

// PATCH - Alterar senha do usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminAuth(request);
    if (session instanceof NextResponse) return session;

    const canReset =
      (await hasPermission(session, Permission.RESET_PASSWORDS)) ||
      (await hasPermission(session, Permission.EDIT_USERS));

    if (!canReset) {
      return NextResponse.json(
        { error: 'Sem permissão para alterar senhas' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { newPassword } = body as { newPassword?: string };

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 },
      );
    }

    const stackUser = await prisma.stackUser.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!stackUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 },
      );
    }

    // Login usa Stack Auth — senha precisa ser alterada lá, não só no Prisma
    try {
      await updateStackAuthUserFromAdmin(id, { password: newPassword });
    } catch (stackErr) {
      console.error('Erro ao alterar senha no Stack Auth:', stackErr);
      return NextResponse.json(
        { error: stackAuthErrorMessage(stackErr) },
        { status: 400 },
      );
    }

    // Mantém cópia local (legado / integrações que ainda leem User.password)
    if (stackUser.userId) {
      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: stackUser.userId },
        data: { password: passwordHash },
      });
    }

    try {
      await createAuditLog({
        userId: session.userId,
        action: 'password_reset',
        entityType: 'StackUser',
        entityId: id,
        details: { resetBy: session.email, stackAuthSynced: true },
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          null,
        userAgent: request.headers.get('user-agent') || null,
      });
    } catch (logError) {
      console.error('Erro ao criar log de auditoria:', logError);
    }

    return NextResponse.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error: unknown) {
    console.error('Erro ao alterar senha:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Erro ao alterar senha', details },
      { status: 500 },
    );
  }
}
