import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';

export const dynamic = 'force-dynamic';

async function getDbUser() {
  const stackUser = await stackServerApp.getUser({ or: 'return-null' });
  if (!stackUser) return null;
  return syncStackAuthUser({
    id: stackUser.id,
    primaryEmail: stackUser.primaryEmail || undefined,
    displayName: stackUser.displayName || undefined,
    profileImageUrl: stackUser.profileImageUrl || undefined,
    primaryEmailVerified: stackUser.primaryEmailVerified ? new Date() : null,
  });
}

const INCLUDE = {
  cargo: { select: { id: true, nome: true, ratPct: true } },
  loja: { select: { id: true, nome: true } },
} as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const funcionario = await prisma.rhFuncionario.findFirst({
      where: { id, userId: dbUser.id },
      include: INCLUDE,
    });

    if (!funcionario)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    return NextResponse.json(funcionario);
  } catch (err) {
    console.error('[GET /api/rh/funcionarios/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const existing = await prisma.rhFuncionario.findFirst({
      where: { id, userId: dbUser.id },
    });
    if (!existing)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const body = await req.json();
    const {
      nome,
      cpf,
      email,
      telefone,
      dataAdmissao,
      cargoId,
      lojaId,
      salarioBruto,
      escala,
      turno,
      horarioEntrada,
      horarioSaida,
      diasFolga,
      observacoes,
      ativo,
    } = body;

    const funcionario = await prisma.rhFuncionario.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome: nome.trim() }),
        ...(cpf !== undefined && { cpf: cpf || null }),
        ...(email !== undefined && { email: email || null }),
        ...(telefone !== undefined && { telefone: telefone || null }),
        ...(dataAdmissao !== undefined && { dataAdmissao: new Date(dataAdmissao) }),
        ...(cargoId !== undefined && { cargoId }),
        ...(lojaId !== undefined && { lojaId }),
        ...(salarioBruto !== undefined && { salarioBruto }),
        ...(escala !== undefined && { escala }),
        ...(turno !== undefined && { turno }),
        ...(horarioEntrada !== undefined && { horarioEntrada }),
        ...(horarioSaida !== undefined && { horarioSaida }),
        ...(diasFolga !== undefined && { diasFolga }),
        ...(observacoes !== undefined && { observacoes: observacoes || null }),
        ...(ativo !== undefined && { ativo }),
      },
      include: INCLUDE,
    });

    return NextResponse.json(funcionario);
  } catch (err) {
    console.error('[PATCH /api/rh/funcionarios/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const existing = await prisma.rhFuncionario.findFirst({
      where: { id, userId: dbUser.id },
    });
    if (!existing)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    await prisma.rhFuncionario.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/rh/funcionarios/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
