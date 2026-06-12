import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { limparCPF, validarCPF } from '@/lib/validacoes';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

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
        userId: rh!.userId,
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
