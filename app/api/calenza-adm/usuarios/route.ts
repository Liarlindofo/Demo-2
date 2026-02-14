import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, hasPermission } from '@/lib/auth/adminAuth';
import { SystemTool, Permission } from '@/types/admin';

// GET - Listar todos os usuários
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminAuth(request);
    if (session instanceof NextResponse) return session;

    // Verificar permissão
    if (!(await hasPermission(session, Permission.VIEW_USERS))) {
      return NextResponse.json(
        { error: 'Sem permissão para visualizar usuários' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    if (search) {
      where.OR = [
        { primaryEmail: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Buscar usuários com permissões de ferramentas
    const [users, total] = await Promise.all([
      prisma.stackUser.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              fullName: true,
              password: true,
            },
          },
          toolPermissions: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stackUser.count({ where }),
    ]);

    // Garantir que todos os usuários tenham permissões para todas as ferramentas
    const usersWithPermissions = await Promise.all(
      users.map(async (user) => {
        const tools = Object.values(SystemTool);
        const existingPermissions = user.toolPermissions || [];
        
        // Criar permissões faltantes
        const missingTools = tools.filter(
          (tool) => !existingPermissions.some((p) => p.tool === tool)
        );

        if (missingTools.length > 0) {
          await prisma.userToolPermission.createMany({
            data: missingTools.map((tool) => ({
              stackUserId: user.id,
              tool,
              isEnabled: false, // Por padrão, desabilitado
            })),
            skipDuplicates: true,
          });
        }

        // Buscar permissões atualizadas
        const allPermissions = await prisma.userToolPermission.findMany({
          where: { stackUserId: user.id },
        });

        return {
          ...user,
          toolPermissions: allPermissions,
        };
      })
    );

    return NextResponse.json({
      users: usersWithPermissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao listar usuários', details: error?.message },
      { status: 500 }
    );
  }
}
