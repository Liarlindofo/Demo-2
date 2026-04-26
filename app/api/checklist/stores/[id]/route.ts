export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';

// GET /api/checklist/stores/[id] - Buscar loja específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;

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

    // Buscar loja
    const store = await prisma.store.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error('Erro ao buscar loja:', error);
    return NextResponse.json({ error: 'Erro ao buscar loja' }, { status: 500 });
  }
}

// PUT /api/checklist/stores/[id] - Atualizar loja
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, managerName, phone, address, abbreviation, displayOrder } = body;

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

    // Verificar se a loja pertence ao usuário
    const existingStore = await prisma.store.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existingStore) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Atualizar loja
    const store = await prisma.store.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(managerName !== undefined && { managerName }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(abbreviation !== undefined && { abbreviation }),
        ...(displayOrder !== undefined && { displayOrder })
      }
    });

    return NextResponse.json({ success: true, store });
  } catch (error) {
    console.error('Erro ao atualizar loja:', error);
    return NextResponse.json({ error: 'Erro ao atualizar loja' }, { status: 500 });
  }
}

// DELETE /api/checklist/stores/[id] - Deletar loja
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;

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

    // Verificar se a loja pertence ao usuário
    const existingStore = await prisma.store.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existingStore) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Deletar avaliações relacionadas primeiro (cascata)
    await prisma.evaluation.deleteMany({
      where: { storeId: id }
    });

    // Deletar loja
    await prisma.store.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar loja:', error);
    return NextResponse.json({ error: 'Erro ao deletar loja' }, { status: 500 });
  }
}

