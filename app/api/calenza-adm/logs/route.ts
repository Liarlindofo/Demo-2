import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, hasPermission } from '@/lib/auth/adminAuth';
import { Permission } from '@/types/admin';

// GET - Listar logs de auditoria
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminAuth(request);
    if (session instanceof NextResponse) return session;

    if (!(await hasPermission(session, Permission.VIEW_LOGS))) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar logs' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.adminAuditLog.count(),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Erro ao listar logs:', error);
    return NextResponse.json(
      { error: 'Erro ao listar logs', details: error?.message },
      { status: 500 }
    );
  }
}
