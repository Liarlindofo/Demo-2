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

// Campos que geram entrada no histórico quando alterados
const CAMPOS_HISTORICO = ['salarioBruto', 'cargoId', 'lojaId', 'escala', 'turno', 'ativo'] as const;
type CampoHistorico = (typeof CAMPOS_HISTORICO)[number];

function valorParaString(campo: CampoHistorico, valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  if (campo === 'salarioBruto') return `R$ ${Number(valor).toFixed(2)}`;
  if (typeof valor === 'boolean') return valor ? 'Ativo' : 'Inativo';
  return String(valor);
}

function calcDatasExperiencia(dataAdmissao: Date) {
  const d1 = new Date(dataAdmissao);
  d1.setDate(d1.getDate() + 45);
  const d2 = new Date(dataAdmissao);
  d2.setDate(d2.getDate() + 90);
  return { dataFimExperiencia1: d1, dataFimExperiencia2: d2 };
}

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
      ativo,
      dataGozoFerias,
      statusFerias,
      diasFeriasGozados,
      motivo,
    } = body;

    // Calcular datas de experiência se admissão mudou
    let experienciaData = {};
    if (dataAdmissao !== undefined) {
      const admissao = new Date(dataAdmissao);
      const { dataFimExperiencia1, dataFimExperiencia2 } = calcDatasExperiencia(admissao);
      experienciaData = {
        dataInicioExperiencia: admissao,
        dataFimExperiencia1,
        dataFimExperiencia2,
        dataInicioFerias: admissao,
      };
    }

    // Detectar alterações nos campos auditados antes de salvar
    const alteracoes: Array<{ campo: string; valorAnterior: string; valorNovo: string }> = [];
    for (const campo of CAMPOS_HISTORICO) {
      if (body[campo] !== undefined) {
        const anterior = valorParaString(campo, existing[campo]);
        const novo = valorParaString(campo, body[campo]);
        if (anterior !== novo) {
          alteracoes.push({ campo, valorAnterior: anterior, valorNovo: novo });
        }
      }
    }

    const alteradoPor = dbUser.fullName || dbUser.email || dbUser.id;

    // Executar update + histórico na mesma transação
    const funcionario = await prisma.$transaction(async (tx) => {
      const updated = await tx.rhFuncionario.update({
        where: { id },
        data: {
          ...(nome !== undefined && { nome: nome.trim() }),
          ...(cpf !== undefined && { cpf: cpf || null }),
          ...(email !== undefined && { email: email || null }),
          ...(telefone !== undefined && { telefone: telefone || null }),
          ...(dataNascimento !== undefined && {
            dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
          }),
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
          ...(dataGozoFerias !== undefined && {
            dataGozoFerias: dataGozoFerias ? new Date(dataGozoFerias) : null,
          }),
          ...(statusFerias !== undefined && { statusFerias }),
          ...(diasFeriasGozados !== undefined && { diasFeriasGozados }),
          ...experienciaData,
        },
        include: INCLUDE,
      });

      // Registrar histórico para cada campo alterado
      if (alteracoes.length > 0) {
        await tx.rhHistoricoFuncionario.createMany({
          data: alteracoes.map((a) => ({
            userId: dbUser.id,
            funcionarioId: id,
            campo: a.campo,
            valorAnterior: a.valorAnterior,
            valorNovo: a.valorNovo,
            alteradoPor,
            motivo: motivo || null,
          })),
        });
      }

      return updated;
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

    const alteradoPor = dbUser.fullName || dbUser.email || dbUser.id;

    await prisma.$transaction(async (tx) => {
      await tx.rhFuncionario.update({ where: { id }, data: { ativo: false } });
      await tx.rhHistoricoFuncionario.create({
        data: {
          userId: dbUser.id,
          funcionarioId: id,
          campo: 'ativo',
          valorAnterior: 'Ativo',
          valorNovo: 'Inativo',
          alteradoPor,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/rh/funcionarios/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
