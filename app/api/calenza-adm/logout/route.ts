import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession, createAuditLog, getClientIp, getUserAgent } from '@/lib/auth/adminAuth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request);
    const ip = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Invalidar sessão no banco
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (token) {
      await prisma.adminSession.deleteMany({
        where: { token },
      });
    }

    // Log de logout
    if (session) {
      await createAuditLog({
        userId: session.userId,
        action: 'logout',
        ipAddress: ip,
        userAgent,
      });
    }

    // Remover cookie
    cookieStore.delete('admin_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
