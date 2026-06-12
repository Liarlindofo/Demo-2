export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const loja = await prisma.rhLoja.findFirst({ where: { id, userId: rh!.userId } });
    if (!loja) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

    const body = await req.json();
    const { nome, cnpj, endereco, ativo } = body;

    const updated = await prisma.rhLoja.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome: nome.trim() }),
        ...(cnpj !== undefined && { cnpj: cnpj || null }),
        ...(endereco !== undefined && { endereco: endereco || null }),
        ...(ativo !== undefined && { ativo }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/rh/lojas/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const loja = await prisma.rhLoja.findFirst({ where: { id, userId: rh!.userId } });
    if (!loja) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

    // Verificar se há funcionários vinculados
    const funcionarios = await prisma.rhFuncionario.count({ where: { lojaId: id, ativo: true } });
    if (funcionarios > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir: ${funcionarios} funcionário(s) ativo(s) vinculado(s) a esta loja.` },
        { status: 409 },
      );
    }

    await prisma.rhLoja.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/rh/lojas/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
