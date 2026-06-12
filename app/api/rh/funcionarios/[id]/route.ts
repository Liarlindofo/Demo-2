import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import {
  enrichFuncionario,
  CAMPOS_COMPOSICAO_HISTORICO,
  formatComposicaoHistorico,
} from '@/lib/rh-funcionario';
import { calcularComposicaoSalarial } from '@/lib/calculos-rh';
import { carregarBonificacoesComposicao } from '@/lib/rh-bonificacoes-composicao';
import { limparCPF, validarCPF, validarDataNascimento } from '@/lib/validacoes';

export const dynamic = 'force-dynamic';


const INCLUDE = {
  cargo: { select: { id: true, nome: true, ratPct: true } },
  loja: { select: { id: true, nome: true, fap: true } },
} as const;

const CAMPOS_HISTORICO = [
  ...CAMPOS_COMPOSICAO_HISTORICO,
  'cargoId',
  'lojaId',
  'escala',
  'turno',
  'ativo',
] as const;
type CampoHistorico = (typeof CAMPOS_HISTORICO)[number];

function valorParaString(
  campo: CampoHistorico,
  valor: unknown,
  existing?: Record<string, unknown>
): string {
  if (valor === null || valor === undefined) return '';
  if (campo === 'cargoResponsabilidade') return valor ? 'Sim' : 'Não';
  if (typeof valor === 'boolean') return valor ? 'Ativo' : 'Inativo';
  if (
    campo === 'salarioBase' ||
    campo === 'bonificacaoAssiduidade' ||
    campo === 'valorAlimentacao' ||
    campo === 'valorVT'
  ) {
    return `R$ ${Number(valor).toFixed(2)}`;
  }
  if (CAMPOS_COMPOSICAO_HISTORICO.includes(campo as (typeof CAMPOS_COMPOSICAO_HISTORICO)[number])) {
    return '';
  }
  return String(valor);
}

function composicaoSnapshot(data: {
  salarioBase: number;
  cargoResponsabilidade: boolean;
  bonificacaoAssiduidade: number;
  valorAlimentacao: number;
  valorVT: number;
}) {
  return formatComposicaoHistorico(calcularComposicaoSalarial(data));
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
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const funcionario = await prisma.rhFuncionario.findFirst({
      where: { id, userId: rh!.userId },
      include: INCLUDE,
    });

    if (!funcionario)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    const bonificacoesComposicao = await carregarBonificacoesComposicao(id);

    return NextResponse.json(
      enrichFuncionario(
        funcionario,
        funcionario.cargo?.ratPct ?? 1.0,
        funcionario.loja?.fap ?? 1.0,
        bonificacoesComposicao
      )
    );
  } catch (err) {
    console.error('[GET /api/rh/funcionarios/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const existing = await prisma.rhFuncionario.findFirst({
      where: { id, userId: rh!.userId },
    });
    if (!existing)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

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
      salarioBase,
      valorAlimentacao,
      valorVT,
      cargoResponsabilidade,
      bonificacaoAssiduidade,
      escala,
      turno,
      horarioEntrada,
      horarioSaida,
      diasFolga,
      domingoFolga,
      observacoes,
      ativo,
      dataGozoFerias,
      statusFerias,
      diasFeriasGozados,
      motivo,
    } = body;

    if (cpfRaw !== undefined) {
      const cpf = limparCPF(String(cpfRaw));
      if (!validarCPF(cpf))
        return NextResponse.json({ error: 'CPF inválido' }, { status: 400 });
      const dup = await prisma.rhFuncionario.findFirst({
        where: { userId: rh!.userId, cpf, ativo: true, id: { not: id } },
      });
      if (dup) return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 });
    }

    if (dataNascimento !== undefined) {
      const nasc = new Date(dataNascimento);
      const errNasc = validarDataNascimento(nasc);
      if (errNasc) return NextResponse.json({ error: errNasc }, { status: 400 });
    }

    if (salarioBase !== undefined && Number(salarioBase) <= 0)
      return NextResponse.json({ error: 'Salário base inválido' }, { status: 400 });

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

    const composicaoAntes = composicaoSnapshot(existing);
    const merged = {
      salarioBase: salarioBase !== undefined ? Number(salarioBase) : existing.salarioBase,
      cargoResponsabilidade:
        cargoResponsabilidade !== undefined
          ? Boolean(cargoResponsabilidade)
          : existing.cargoResponsabilidade,
      bonificacaoAssiduidade:
        bonificacaoAssiduidade !== undefined
          ? Number(bonificacaoAssiduidade)
          : existing.bonificacaoAssiduidade,
      valorAlimentacao:
        valorAlimentacao !== undefined ? Number(valorAlimentacao) : existing.valorAlimentacao,
      valorVT: valorVT !== undefined ? Number(valorVT) : existing.valorVT,
    };
    const composicaoDepois = composicaoSnapshot(merged);
    const composicaoMudou = composicaoAntes !== composicaoDepois;

    const alteracoes: Array<{ campo: string; valorAnterior: string; valorNovo: string }> = [];

    for (const campo of CAMPOS_HISTORICO) {
      if (campo === 'salarioBase' && composicaoMudou) continue;
      if (body[campo] !== undefined) {
        const anterior = valorParaString(campo, existing[campo]);
        const novo = valorParaString(campo, body[campo]);
        if (anterior !== novo) {
          alteracoes.push({ campo, valorAnterior: anterior, valorNovo: novo });
        }
      }
    }
    if (composicaoMudou) {
      alteracoes.push({
        campo: 'composicaoSalarial',
        valorAnterior: composicaoAntes,
        valorNovo: composicaoDepois,
      });
    }

    const alteradoPor = rh!.userId;

    const funcionario = await prisma.$transaction(async (tx) => {
      const updated = await tx.rhFuncionario.update({
        where: { id },
        data: {
          ...(nome !== undefined && { nome: nome.trim() }),
          ...(cpfRaw !== undefined && { cpf: limparCPF(String(cpfRaw)) }),
          ...(email !== undefined && { email: email || null }),
          ...(telefone !== undefined && { telefone: telefone || null }),
          ...(dataNascimento !== undefined && { dataNascimento: new Date(dataNascimento) }),
          ...(dataAdmissao !== undefined && { dataAdmissao: new Date(dataAdmissao) }),
          ...(cargoId !== undefined && { cargoId }),
          ...(lojaId !== undefined && { lojaId }),
          ...(salarioBase !== undefined && { salarioBase: Number(salarioBase) }),
          ...(valorAlimentacao !== undefined && { valorAlimentacao: Number(valorAlimentacao) }),
          ...(valorVT !== undefined && { valorVT: Number(valorVT) }),
          ...(cargoResponsabilidade !== undefined && {
            cargoResponsabilidade: Boolean(cargoResponsabilidade),
          }),
          ...(bonificacaoAssiduidade !== undefined && {
            bonificacaoAssiduidade: Number(bonificacaoAssiduidade),
          }),
          ...(escala !== undefined && { escala }),
          ...(turno !== undefined && { turno }),
          ...(horarioEntrada !== undefined && { horarioEntrada }),
          ...(horarioSaida !== undefined && { horarioSaida }),
          ...(diasFolga !== undefined && { diasFolga }),
          ...(domingoFolga !== undefined && { domingoFolga: domingoFolga || null }),
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

      if (alteracoes.length > 0) {
        await tx.rhHistoricoFuncionario.createMany({
          data: alteracoes.map((a) => ({
            userId: rh!.userId,
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

    const bonificacoesComposicao = await carregarBonificacoesComposicao(id);

    return NextResponse.json(
      enrichFuncionario(
        funcionario,
        funcionario.cargo?.ratPct ?? 1.0,
        funcionario.loja?.fap ?? 1.0,
        bonificacoesComposicao
      )
    );
  } catch (err) {
    console.error('[PATCH /api/rh/funcionarios/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const permanent = req.nextUrl.searchParams.get('permanent') === 'true';

    const existing = await prisma.rhFuncionario.findFirst({
      where: { id, userId: rh!.userId },
    });
    if (!existing)
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });

    if (permanent) {
      // Exclusão definitiva — só permitida para funcionários já inativos
      if (existing.ativo)
        return NextResponse.json(
          { error: 'Desative o funcionário antes de excluir permanentemente' },
          { status: 400 }
        );
      await prisma.rhFuncionario.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    // Soft delete — desativar
    const alteradoPor = rh!.userId;
    await prisma.$transaction(async (tx) => {
      await tx.rhFuncionario.update({ where: { id }, data: { ativo: false } });
      await tx.rhHistoricoFuncionario.create({
        data: {
          userId: rh!.userId,
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
