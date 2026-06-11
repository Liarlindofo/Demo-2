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

export async function GET(req: NextRequest) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const lojaId = req.nextUrl.searchParams.get('lojaId');
    if (!lojaId) return NextResponse.json({ error: 'lojaId obrigatório' }, { status: 400 });

    // Funcionários ativos da loja com dados reais de folga
    const funcionarios = await prisma.rhFuncionario.findMany({
      where: { userId: dbUser.id, lojaId, ativo: true },
      select: {
        id: true,
        nome: true,
        escala: true,
        turno: true,
        diasFolga: true,
        cargo: { select: { nome: true } },
      },
      orderBy: { nome: 'asc' },
    });

    // Mínimos por turno do Quadro Ideal (se configurado)
    const quadro = await prisma.rhQuadroIdeal.findFirst({
      where: { userId: dbUser.id, lojaId, ativo: true },
      include: {
        setores: {
          where: { ativo: true },
          include: { posicoes: { where: { ativo: true } } },
        },
      },
    });

    const ideaisPorTurno: Record<string, number> = {};
    if (quadro) {
      for (const setor of quadro.setores) {
        for (const pos of setor.posicoes) {
          if (pos.turno) {
            ideaisPorTurno[pos.turno] = (ideaisPorTurno[pos.turno] ?? 0) + pos.quantidadeIdeal;
          }
        }
      }
    }

    return NextResponse.json({
      funcionarios: funcionarios.map((f) => ({
        id: f.id,
        nome: f.nome,
        cargo: f.cargo?.nome ?? '—',
        escala: f.escala,
        turno: f.turno,
        diasFolga: Array.isArray(f.diasFolga) ? (f.diasFolga as string[]) : [],
      })),
      ideais: ideaisPorTurno,
    });
  } catch (err) {
    console.error('[GET /api/rh/simulacao/cobertura]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
