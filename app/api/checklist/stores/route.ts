export const dynamic = 'force-dynamic';

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
    let stores;
    try {
      stores = await prisma.store.findMany({
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
    } catch (migrationError: any) {
      // Se der erro de coluna não encontrada, buscar sem os campos novos
      if (migrationError?.message?.includes('Unknown column') || 
          migrationError?.message?.includes('column') || 
          migrationError?.code === 'P2021') {
        console.warn('Campos novos não encontrados, buscando sem eles. Execute a migration!');
        stores = await prisma.store.findMany({
          where: {
            userId: user.id,
            isActive: true
          },
          orderBy: {
            createdAt: 'asc'
          },
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            createdAt: true,
            updatedAt: true
          }
        });
        // Adicionar campos vazios para compatibilidade
        stores = stores.map((store: any) => ({
          ...store,
          managerName: null,
          abbreviation: null,
          displayOrder: 0
        }));
      } else {
        throw migrationError;
      }
    }

    return NextResponse.json(stores);
  } catch (error: any) {
    console.error('Erro ao buscar lojas:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar lojas',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
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

    // Garantir que displayOrder é um número
    const displayOrderNum = displayOrder !== undefined && displayOrder !== null 
      ? parseInt(String(displayOrder), 10) || 0 
      : 0;

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

    // Criar loja - tentar com todos os campos primeiro
    let store;
    try {
      store = await prisma.store.create({
        data: {
          name,
          managerName: managerName || null,
          phone: phone || null,
          address: address || null,
          abbreviation: abbreviation || null,
          displayOrder: displayOrderNum,
          userId: user.id,
          isActive: true
        }
      });
    } catch (migrationError: any) {
      // Se der erro de coluna não encontrada, tentar sem os campos novos
      if (migrationError?.message?.includes('Unknown column') || 
          migrationError?.message?.includes('column') || 
          migrationError?.code === 'P2021' ||
          migrationError?.message?.includes('manager_name') ||
          migrationError?.message?.includes('abbreviation') ||
          migrationError?.message?.includes('display_order')) {
        console.warn('Campos novos não encontrados, criando loja sem eles. Execute a migration!');
        store = await prisma.store.create({
          data: {
            name,
            phone: phone || null,
            address: address || null,
            userId: user.id,
            isActive: true
          }
        });
      } else {
        throw migrationError;
      }
    }

    return NextResponse.json({ success: true, storeId: store.id, store });
  } catch (error: any) {
    console.error('Erro ao criar loja:', error);
    console.error('Detalhes do erro:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta
    });
    
    // Mensagem de erro mais específica
    let errorMessage = 'Erro ao criar loja';
    if (error?.code === 'P2002') {
      errorMessage = 'Já existe uma loja com este nome';
    } else if (error?.message?.includes('Unknown column') || error?.message?.includes('column') || error?.code === 'P2021') {
      errorMessage = 'Erro: Tabela não atualizada. Execute a migration: npx prisma migrate dev';
    } else if (error?.message) {
      errorMessage = `Erro: ${error.message}`;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

