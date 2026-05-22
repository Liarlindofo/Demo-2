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

function calcDatasExperiencia(dataAdmissao: Date) {
  const d1 = new Date(dataAdmissao);
  d1.setDate(d1.getDate() + 45);
  const d2 = new Date(dataAdmissao);
  d2.setDate(d2.getDate() + 90);
  return { dataFimExperiencia1: d1, dataFimExperiencia2: d2 };
}

export async function GET(req: NextRequest) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const lojaId = searchParams.get('lojaId');
    const cargoId = searchParams.get('cargoId');
    const escala = searchParams.get('escala');
    const turno = searchParams.get('turno');
    const ativoParam = searchParams.get('ativo');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = { userId: dbUser.id };

    if (lojaId) where.lojaId = lojaId;
    if (cargoId) where.cargoId = cargoId;
    if (escala) where.escala = escala;
    if (turno) where.turno = turno;
    if (ativoParam !== null && ativoParam !== '') where.ativo = ativoParam === 'true';
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: search } },
      ];
    }

    const funcionarios = await prisma.rhFuncionario.findMany({
      where,
      include: {
        cargo: { select: { id: true, nome: true, ratPct: true } },
        loja: { select: { id: true, nome: true } },
      },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json(funcionarios);
  } catch (err) {
    console.error('[GET /api/rh/funcionarios]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const {
      nome,
      cpf,
      email,
      telefone,
      dataNascimento,
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
    } = body;

    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    if (!cargoId) return NextResponse.json({ error: 'Cargo é obrigatório' }, { status: 400 });
    if (!lojaId) return NextResponse.json({ error: 'Loja é obrigatória' }, { status: 400 });
    if (!salarioBruto || salarioBruto <= 0)
      return NextResponse.json({ error: 'Salário inválido' }, { status: 400 });

    const [cargo, loja] = await Promise.all([
      prisma.rhCargo.findFirst({ where: { id: cargoId, userId: dbUser.id } }),
      prisma.rhLoja.findFirst({ where: { id: lojaId, userId: dbUser.id } }),
    ]);
    if (!cargo) return NextResponse.json({ error: 'Cargo não encontrado' }, { status: 404 });
    if (!loja) return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });

    const admissao = new Date(dataAdmissao);
    const { dataFimExperiencia1, dataFimExperiencia2 } = calcDatasExperiencia(admissao);

    const funcionario = await prisma.rhFuncionario.create({
      data: {
        userId: dbUser.id,
        nome: nome.trim(),
        cpf: cpf || null,
        email: email || null,
        telefone: telefone || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        dataAdmissao: admissao,
        cargoId,
        lojaId,
        salarioBruto,
        escala: escala ?? '6x1',
        turno: turno ?? 'manhã',
        horarioEntrada: horarioEntrada ?? '08:00',
        horarioSaida: horarioSaida ?? '17:00',
        diasFolga: diasFolga ?? [],
        observacoes: observacoes || null,
        dataInicioExperiencia: admissao,
        dataFimExperiencia1,
        dataFimExperiencia2,
        dataInicioFerias: admissao,
        statusFerias: 'a_gozar',
        diasFeriasGozados: 0,
      },
      include: {
        cargo: { select: { id: true, nome: true, ratPct: true } },
        loja: { select: { id: true, nome: true } },
      },
    });

    return NextResponse.json(funcionario, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rh/funcionarios]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
