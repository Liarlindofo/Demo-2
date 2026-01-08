import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';

// GET /api/checklist/stores - Listar todas as lojas do usuário
export async function GET() {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar usuário no banco
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { stackUserId: stackUser.id },
          { email: stackUser.primaryEmail || undefined }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Buscar lojas do usuário
    const stores = await prisma.store.findMany({
      where: {
        userId: user.id,
        isActive: true
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        managerName: true,
        abbreviation: true,
        displayOrder: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json(stores);
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    return NextResponse.json({ error: 'Erro ao buscar lojas' }, { status: 500 });
  }
}

// POST /api/checklist/stores - Criar nova loja
export async function POST(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, managerName, phone, address, abbreviation, displayOrder } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome da loja é obrigatório' }, { status: 400 });
    }

    // Buscar usuário no banco
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { stackUserId: stackUser.id },
          { email: stackUser.primaryEmail || undefined }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Criar loja
    const store = await prisma.store.create({
      data: {
        name,
        managerName: managerName || null,
        phone: phone || null,
        address: address || null,
        abbreviation: abbreviation || null,
        displayOrder: displayOrder || 0,
        userId: user.id,
        isActive: true
      }
    });

    return NextResponse.json({ success: true, storeId: store.id, store });
  } catch (error) {
    console.error('Erro ao criar loja:', error);
    return NextResponse.json({ error: 'Erro ao criar loja' }, { status: 500 });
  }
}

