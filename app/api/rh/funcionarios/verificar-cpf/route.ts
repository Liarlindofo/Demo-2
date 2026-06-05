import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';
import { limparCPF, validarCPF } from '@/lib/validacoes';

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

export async function GET(req: NextRequest) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const cpfParam = req.nextUrl.searchParams.get('cpf') ?? '';
    const excludeId = req.nextUrl.searchParams.get('excludeId');
    const cpf = limparCPF(cpfParam);

    if (cpf.length < 11) {
      return NextResponse.json({ valido: false, disponivel: false, motivo: 'incompleto' });
    }

    if (!validarCPF(cpf)) {
      return NextResponse.json({ valido: false, disponivel: false, motivo: 'invalido' });
    }

    const existente = await prisma.rhFuncionario.findFirst({
      where: {
        userId: dbUser.id,
        cpf,
        ativo: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    return NextResponse.json({
      valido: true,
      disponivel: !existente,
      motivo: existente ? 'duplicado' : null,
    });
  } catch (err) {
    console.error('[GET /api/rh/funcionarios/verificar-cpf]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
