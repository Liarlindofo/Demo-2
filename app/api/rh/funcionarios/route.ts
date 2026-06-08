import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stackServerApp } from '@/stack';
import { syncStackAuthUser } from '@/lib/stack-auth-sync';
import { enrichFuncionario, enrichFuncionarios } from '@/lib/rh-funcionario';
import { limparCPF, validarCPF, validarDataNascimento } from '@/lib/validacoes';

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

function parseComposicaoBody(body: Record<string, unknown>) {
  const salarioBase = Number(body.salarioBase);
  return {
    salarioBase,
    valorAlimentacao: Number(body.valorAlimentacao ?? 0) || 0,
    valorVT: Number(body.valorVT ?? 0) || 0,
    cargoResponsabilidade: Boolean(body.cargoResponsabilidade),
    bonificacaoAssiduidade: Number(body.bonificacaoAssiduidade ?? 0) || 0,
  };
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
        { cpf: { contains: search.replace(/\D/g, '') } },
      ];
    }

    const funcionarios = await prisma.rhFuncionario.findMany({
      where,
      include: {
        cargo: { select: { id: true, nome: true, ratPct: true } },
        loja: { select: { id: true, nome: true, fap: true } },
      },
      orderBy: { nome: 'asc' },
    });

    const fapMap = Object.fromEntries(
      funcionarios
        .filter((f) => f.loja)
        .map((f) => [f.loja!.id, f.loja!.fap ?? 1])
    );

    return NextResponse.json(
      enrichFuncionarios(funcionarios, fapMap).map((f) => {
        const { loja, ...rest } = f;
        return { ...rest, loja: loja ? { id: loja.id, nome: loja.nome } : null };
      })
    );
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
      cpf: cpfRaw,
      email,
      telefone,
      dataNascimento,
      dataAdmissao,
      cargoId,
      lojaId,
      escala,
      turno,
      horarioEntrada,
      horarioSaida,
      diasFolga,
      domingoFolga,
      observacoes,
    } = body;

    const composicao = parseComposicaoBody(body);
    const cpf = cpfRaw ? limparCPF(String(cpfRaw)) : null;

    // Único campo verdadeiramente obrigatório
    if (!nome?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

    if (cpf && !validarCPF(cpf))
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
    if (dataNascimento) {
      const errNasc = validarDataNascimento(new Date(dataNascimento));
      if (errNasc) return NextResponse.json({ error: errNasc }, { status: 400 });
    }
    if (cpf) {
      const cpfExistente = await prisma.rhFuncionario.findFirst({
        where: { userId: dbUser.id, cpf, ativo: true },
      });
      if (cpfExistente)
        return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 });
    }

    // Cargo e Loja opcionais — valida apenas se informados
    const [cargo, loja] = await Promise.all([
      cargoId ? prisma.rhCargo.findFirst({ where: { id: cargoId, userId: dbUser.id } }) : null,
      lojaId  ? prisma.rhLoja.findFirst({ where: { id: lojaId,  userId: dbUser.id } }) : null,
    ]);
    if (cargoId && !cargo) return NextResponse.json({ error: 'Cargo não encontrado' }, { status: 404 });
    if (lojaId  && !loja)  return NextResponse.json({ error: 'Loja não encontrada' },  { status: 404 });

    // Data de admissão default = hoje
    const admissao = dataAdmissao ? new Date(dataAdmissao) : new Date();
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
        cargoId: cargoId || null,
        lojaId: lojaId || null,
        ...composicao,
        escala: escala ?? '6x1',
        turno: turno ?? 'manhã',
        horarioEntrada: horarioEntrada ?? '08:00',
        horarioSaida: horarioSaida ?? '17:00',
        diasFolga: diasFolga ?? [],
        domingoFolga: domingoFolga ?? null,
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

    return NextResponse.json(
      enrichFuncionario(funcionario, cargo?.ratPct ?? 1.0, loja?.fap ?? 1.0),
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/rh/funcionarios]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
