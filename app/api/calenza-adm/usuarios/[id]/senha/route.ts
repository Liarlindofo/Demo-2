import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { hashPassword } from '@/lib/auth/password';
import { createAuditLog } from '@/lib/auth/adminAuth';

// PATCH - Alterar senha do usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdminAuth(request);
    if (session instanceof NextResponse) return session;

    const hasPermission = await import('@/lib/auth/adminAuth').then(m => 
      m.checkAdminPermission(session, 'reset_passwords' as any)
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para alterar senhas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Buscar StackUser
    const stackUser = await prisma.stackUser.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!stackUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Se não tem User relacionado, criar
    if (!stackUser.userId) {
      return NextResponse.json(
        { error: 'Usuário não possui conta no sistema principal' },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const passwordHash = await hashPassword(newPassword);

    // Atualizar senha no User
    await prisma.user.update({
      where: { id: stackUser.userId },
      data: { password: passwordHash },
    });

    // Log de auditoria
    try {
      await createAuditLog({
        userId: session.userId,
        action: 'password_reset',
        entityType: 'StackUser',
        entityId: params.id,
        details: { resetBy: session.email },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        userAgent: request.headers.get('user-agent') || null,
      });
    } catch (logError) {
      console.error('Erro ao criar log de auditoria:', logError);
    }

    return NextResponse.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json(
      { error: 'Erro ao alterar senha', details: error?.message },
      { status: 500 }
    );
  }
}
