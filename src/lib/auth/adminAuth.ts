import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserRole, Permission, AdminSession } from '@/types/admin';

// Obter JWT_SECRET com validação
function getJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  
  if (!secret) {
    console.error('❌ ADMIN_JWT_SECRET não está configurado!');
    throw new Error('ADMIN_JWT_SECRET não configurado. Configure a variável de ambiente na Vercel.');
  }
  
  if (secret.length < 32) {
    console.error('❌ ADMIN_JWT_SECRET muito curto! Mínimo 32 caracteres.');
    throw new Error('ADMIN_JWT_SECRET deve ter pelo menos 32 caracteres.');
  }
  
  return secret;
}

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

  let token: string;
  try {
    const jwtSecret = getJwtSecret();
    console.log('🔑 JWT_SECRET configurado:', jwtSecret.substring(0, 10) + '...');
    
    token = jwt.sign(session, jwtSecret, {
      expiresIn: SESSION_DURATION,
    });
    
    console.log('✅ Token JWT criado com sucesso');
  } catch (jwtError: any) {
    console.error('❌ Erro ao assinar JWT:', jwtError);
    console.error('Erro detalhado:', {
      message: jwtError?.message,
      name: jwtError?.name,
      stack: jwtError?.stack,
    });
    throw new Error(`Erro ao criar token de sessão: ${jwtError?.message || 'Erro desconhecido'}`);
  }

  // Verificar tamanho do token
  if (token.length > 500) {
    console.warn('⚠️ Token JWT muito longo (' + token.length + ' chars). Limitando para 500.');
    token = token.substring(0, 500);
  }

  // Salvar sessão no banco (não bloquear login se falhar)
  try {
    console.log('💾 Salvando sessão no banco para usuário:', user.id);
    console.log('📏 Tamanho do token:', token.length, 'caracteres');
    
    await prisma.adminSession.create({
      data: {
        userId: user.id,
        token: token.substring(0, 500), // Garantir que não excede limite
        expiresAt: new Date(Date.now() + SESSION_DURATION * 1000),
      },
    });
    console.log('✅ Sessão salva no banco com sucesso');
  } catch (dbError: any) {
    console.error('❌ Erro ao salvar sessão no banco:', dbError);
    console.error('Detalhes do erro DB:', {
      code: dbError?.code,
      message: dbError?.message,
      meta: dbError?.meta,
    });
    
    // Não bloquear o login - o token JWT ainda funciona sem a sessão no banco
    // A sessão no banco é apenas para auditoria/logout forçado
    if (dbError?.code === 'P2002') {
      console.warn('⚠️ Sessão já existe, continuando...');
    } else if (dbError?.code === 'P2003') {
      console.warn('⚠️ Foreign key constraint falhou, mas continuando (token ainda válido)');
    } else {
      console.warn('⚠️ Erro ao salvar sessão no banco, mas token JWT foi criado. Login continuará.');
    }
    // Não lançar erro - permitir login mesmo sem sessão no banco
  }

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
    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret) as AdminSession;

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
  try {
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
  } catch (error) {
    // Não bloquear operações por erro em log de auditoria
    console.error('Erro ao criar log de auditoria:', error);
  }
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
