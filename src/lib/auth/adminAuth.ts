import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserRole, Permission, AdminSession } from '@/types/admin';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change-this-secret-in-production-min-32-chars';
const SESSION_DURATION = 2 * 60 * 60; // 2 horas em segundos

export function hasMinimumRole(userRole: UserRole, minRole: UserRole): boolean {
  const hierarchy = {
    [UserRole.SUPER_ADMIN]: 3,
    [UserRole.ADMIN]: 2,
    [UserRole.USER]: 1,
  };
  
  return hierarchy[userRole] >= hierarchy[minRole];
}

export async function createAdminSession(user: {
  id: string;
  email: string;
  role: string;
  clientId: string | null;
  permissions: { permission: string }[];
}): Promise<string> {
  const permissions = user.permissions.map(p => p.permission as Permission);
  
  // Buscar nome do usuário
  const userWithName = await prisma.adminUser.findUnique({
    where: { id: user.id },
    select: { name: true },
  });

  const session: AdminSession = {
    userId: user.id,
    email: user.email,
    name: userWithName?.name,
    role: user.role as UserRole,
    clientId: user.clientId || undefined,
    permissions,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION,
  };

  const token = jwt.sign(session, JWT_SECRET, {
    expiresIn: SESSION_DURATION,
  });

  // Salvar sessão no banco
  await prisma.adminSession.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + SESSION_DURATION * 1000),
    },
  });

  return token;
}

export async function verifyAdminSession(
  request: NextRequest
): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return null;
    }

    // Verificar JWT
    const decoded = jwt.verify(token, JWT_SECRET) as AdminSession;

    // Verificar se sessão expirou
    if (decoded.exp < Date.now() / 1000) {
      return null;
    }

    // Verificar se sessão existe no banco e não expirou
    const session = await prisma.adminSession.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!session || !session.user || !session.user.isActive) {
      return null;
    }

    // Atualizar permissões do token com as do banco
    const permissions = session.user.permissions.map(p => p.permission as Permission);
    
    return {
      ...decoded,
      permissions,
    };
  } catch (error) {
    return null;
  }
}

export async function requireAdminAuth(
  request: NextRequest,
  minRole: UserRole = UserRole.ADMIN
): Promise<AdminSession | NextResponse> {
  const session = await verifyAdminSession(request);

  if (!session) {
    return NextResponse.redirect(new URL('/calenza-adm/login', request.url));
  }

  // Verificar role mínima
  if (!hasMinimumRole(session.role, minRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return session;
}

export async function hasPermission(
  session: AdminSession,
  permission: Permission
): Promise<boolean> {
  // Super admin tem todas as permissões
  if (session.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  return session.permissions.includes(permission);
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.adminSession.deleteMany({
    where: {
      userId,
    },
  });
}

export async function createAuditLog(data: {
  userId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await prisma.adminAuditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      entityType: data.entityType || null,
      entityId: data.entityId || null,
      details: data.details || {},
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    },
  });
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}
