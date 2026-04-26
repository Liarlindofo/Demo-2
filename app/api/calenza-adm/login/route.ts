export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createAdminSession, createAuditLog, getClientIp, getUserAgent } from '@/lib/auth/adminAuth';
import { cookies } from 'next/headers';

// Rate limiting simples (em produção, usar Redis ou serviço dedicado)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);

  if (!attempt || attempt.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (attempt.count >= MAX_ATTEMPTS) {
    return false;
  }

  attempt.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Rate limiting
    if (!checkRateLimit(ip)) {
      await createAuditLog({
        userId: null,
        action: 'login_rate_limit_exceeded',
        details: { ip },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário (tentar exato primeiro, depois lowercase)
    const emailTrimmed = email.trim();
    let user = await prisma.adminUser.findUnique({
      where: { email: emailTrimmed },
      include: {
        permissions: true,
      },
    });

    // Se não encontrar, tentar lowercase
    if (!user) {
      user = await prisma.adminUser.findUnique({
        where: { email: emailTrimmed.toLowerCase() },
        include: {
          permissions: true,
        },
      });
    }

    if (!user) {
      await createAuditLog({
        userId: null,
        action: 'login_failed',
        details: { email, reason: 'user_not_found' },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      await createAuditLog({
        userId: user.id,
        action: 'login_blocked',
        details: { email, reason: 'user_inactive' },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Usuário bloqueado. Entre em contato com o administrador.' },
        { status: 403 }
      );
    }

    // Verificar senha
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      await createAuditLog({
        userId: user.id,
        action: 'login_failed',
        details: { email, reason: 'invalid_password' },
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Criar sessão
    let token: string;
    try {
      console.log('🔄 Criando sessão para usuário:', user.email);
      console.log('🔑 ADMIN_JWT_SECRET configurado:', process.env.ADMIN_JWT_SECRET ? 'Sim (' + process.env.ADMIN_JWT_SECRET.substring(0, 10) + '...)' : 'NÃO');
      
      token = await createAdminSession({
        id: user.id,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
        permissions: user.permissions,
      });
      
      console.log('✅ Sessão criada com sucesso');
    } catch (sessionError: any) {
      console.error('❌ Erro ao criar sessão:', sessionError);
      console.error('Detalhes do erro:', {
        message: sessionError?.message,
        name: sessionError?.name,
        stack: sessionError?.stack,
      });
      
      const errorMessage = sessionError?.message || 'Erro ao criar sessão';
      return NextResponse.json(
        { 
          error: errorMessage,
          hint: errorMessage.includes('ADMIN_JWT_SECRET') 
            ? 'Configure ADMIN_JWT_SECRET nas variáveis de ambiente da Vercel e faça redeploy'
            : 'Verifique os logs do servidor para mais detalhes'
        },
        { status: 500 }
      );
    }

    // Atualizar último login
    try {
      await prisma.adminUser.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    } catch (updateError) {
      console.error('Erro ao atualizar último login:', updateError);
      // Não bloquear o login por isso, apenas logar
    }

    // Log de sucesso (não bloquear se falhar)
    try {
      await createAuditLog({
        userId: user.id,
        action: 'login_success',
        details: { email },
        ipAddress: ip,
        userAgent,
      });
    } catch (logError) {
      console.error('Erro ao criar log de auditoria:', logError);
      // Não bloquear o login por isso
    }

    // Definir cookie
    try {
      const cookieStore = await cookies();
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 2 * 60 * 60, // 2 horas
        path: '/',
      });
    } catch (cookieError) {
      console.error('Erro ao definir cookie:', cookieError);
      // Retornar token no body como fallback
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token, // Enviar token no body se cookie falhar
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Erro no login:', error);
    console.error('Stack:', error?.stack);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
