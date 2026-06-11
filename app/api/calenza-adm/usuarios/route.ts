export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth, hasPermission, createAuditLog } from '@/lib/auth/adminAuth';
import { SystemTool, Permission } from '@/types/admin';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

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

// POST - Criar novo usuário/empresa
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminAuth(request);
    if (session instanceof NextResponse) return session;

    if (!(await hasPermission(session, Permission.EDIT_USERS))) {
      return NextResponse.json(
        { error: 'Sem permissão para criar usuários' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, displayName, password, tools } = body as {
      email: string;
      displayName?: string;
      password: string;
      tools?: string[];
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se email já existe no banco
    const existingStackUser = await prisma.stackUser.findFirst({
      where: { primaryEmail: { equals: email, mode: 'insensitive' } },
    });
    if (existingStackUser) {
      return NextResponse.json(
        { error: 'Já existe um usuário com este email' },
        { status: 409 }
      );
    }

    // Criar usuário no Stack Auth
    const stackUser = await stackServerApp.createUser({
      primaryEmail: email,
      primaryEmailAuthEnabled: true,
      password,
      displayName: displayName || undefined,
      primaryEmailVerified: true,
    });

    // Sincronizar com banco local (cria StackUser + User no Prisma)
    await syncStackAuthUser({
      id: stackUser.id,
      primaryEmail: stackUser.primaryEmail,
      displayName: stackUser.displayName,
      profileImageUrl: null,
      primaryEmailVerified: new Date(),
    });

    // Buscar o StackUser criado no banco
    const dbStackUser = await prisma.stackUser.findUnique({
      where: { id: stackUser.id },
    });
    if (!dbStackUser) {
      return NextResponse.json(
        { error: 'Erro ao sincronizar usuário com banco de dados' },
        { status: 500 }
      );
    }

    // Criar permissões de ferramentas para o novo usuário
    const allTools = Object.values(SystemTool);
    const enabledTools = new Set(tools || []);
    await prisma.userToolPermission.createMany({
      data: allTools.map((tool) => ({
        stackUserId: dbStackUser.id,
        tool,
        isEnabled: enabledTools.has(tool),
      })),
      skipDuplicates: true,
    });

    // Log de auditoria
    try {
      await createAuditLog({
        userId: session.userId,
        action: 'user_created',
        entityType: 'StackUser',
        entityId: dbStackUser.id,
        details: { email, displayName, createdBy: session.email },
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          null,
        userAgent: request.headers.get('user-agent') || null,
      });
    } catch (logError) {
      console.error('Erro ao criar log de auditoria:', logError);
    }

    return NextResponse.json({ success: true, userId: dbStackUser.id }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);

    const msg: string = error?.message || '';
    if (msg.includes('already exists') || msg.includes('já existe')) {
      return NextResponse.json(
        { error: 'Já existe um usuário com este email' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar usuário', details: msg },
      { status: 500 }
    );
  }
}
