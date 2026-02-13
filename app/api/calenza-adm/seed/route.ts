import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { UserRole } from '@/types/admin';

export async function POST(request: NextRequest) {
  try {
    // Verificar se já existe admin master
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: 'plateclz' },
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Usuário admin master já existe',
      });
    }

    // Criar senha hash
    const passwordHash = await hashPassword('word5785');

    // Criar admin master
    const admin = await prisma.adminUser.create({
      data: {
        email: 'plateclz', // Manter exatamente como está (sem lowercase)
        passwordHash,
        name: 'Admin Master',
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
    });

    console.log('✅ Admin master criado:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    return NextResponse.json({
      success: true,
      message: 'Admin master criado com sucesso',
      userId: admin.id,
    });
  } catch (error: any) {
    console.error('Erro ao criar admin master:', error);
    console.error('Stack:', error?.stack);
    return NextResponse.json(
      { 
        error: 'Erro ao criar admin master',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        code: error?.code
      },
      { status: 500 }
    );
  }
}
