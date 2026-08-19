import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { funcionarioEstaDeFolga } from '@/lib/rh-folga';
import {
  gerarDatas,
  isSerieAberta,
  validarRecorrenciaMensal,
  type SlotInput,
} from '@/lib/tarefas-recorrencia';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const data = searchParams.get('data');
    const lojaId = searchParams.get('lojaId');

    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return NextResponse.json({ error: 'Parâmetro data é obrigatório (YYYY-MM-DD).' }, { status: 400 });
    }

    const inicio = new Date(`${data}T00:00:00-03:00`);
    const fim = new Date(`${data}T23:59:59.999-03:00`);

    const atribuicoes = await prisma.tarefaAtribuida.findMany({
      where: {
        userId: rh.userId,
        dataAgendada: { gte: inicio, lte: fim },
        ...(lojaId ? { lojaId } : {}),
      },
      include: {
        template: { select: { id: true, titulo: true } },
        funcionario: {
          select: {
            id: true,
            nome: true,
            cargo: { select: { id: true, nome: true } },
          },
        },
        loja: { select: { id: true, nome: true } },
      },
      orderBy: [{ lojaId: 'asc' }, { funcionarioId: 'asc' }, { dataAgendada: 'asc' }],
    });

    return NextResponse.json(atribuicoes);
  } catch (err) {
    console.error('[GET /api/tarefas/atribuicoes]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { funcionarioId, lojaId, slots, grupoIds } = body as {
      funcionarioId: string;
      lojaId: string;
      slots: SlotInput[];
      grupoIds?: string[];
    };

    if (!funcionarioId || !lojaId || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    if (!Array.isArray(grupoIds) || grupoIds.length === 0) {
      return NextResponse.json(
        { error: 'Atribua pelo menos um grupo de tarefas.' },
        { status: 400 },
      );
    }

    const [func, loja] = await Promise.all([
      prisma.rhFuncionario.findFirst({
        where: { id: funcionarioId, userId: rh.userId },
        select: {
          id: true,
          ativo: true,
          diasFolga: true,
          domingoFolga: true,
          statusFerias: true,
        },
      }),
      prisma.rhLoja.findFirst({ where: { id: lojaId, userId: rh.userId } }),
    ]);
    if (!func) return NextResponse.json({ error: 'Funcionário não encontrado.' }, { status: 404 });
    if (!loja) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });

    const uniqueGrupoIds = [...new Set(grupoIds.filter((id) => typeof id === 'string' && id))];
    const grupos = await prisma.tarefaGrupo.findMany({
      where: { id: { in: uniqueGrupoIds }, userId: rh.userId, ativo: true },
      include: { itens: { select: { templateId: true } } },
    });
    if (grupos.length !== uniqueGrupoIds.length) {
      return NextResponse.json(
        { error: 'Um ou mais grupos são inválidos ou inativos.' },
        { status: 400 },
      );
    }
    const templatesDosGrupos = new Set(
      grupos.flatMap((g) => g.itens.map((i) => i.templateId)),
    );

    const lojaExecucaoIds = [...new Set(
      slots.map((s) => s.lojaExecucaoId).filter((id): id is string => !!id && id !== lojaId),
    )];
    if (lojaExecucaoIds.length > 0) {
      const lojasExec = await prisma.rhLoja.findMany({
        where: { id: { in: lojaExecucaoIds }, userId: rh.userId },
        select: { id: true },
      });
      const encontradas = new Set(lojasExec.map((l) => l.id));
      for (const id of lojaExecucaoIds) {
        if (!encontradas.has(id)) {
          return NextResponse.json({ error: `Loja de execução não encontrada: ${id}` }, { status: 404 });
        }
      }
    }

    const agora = new Date();
    const limitePassado = new Date(agora.getTime() - 60_000);
    const registros: Array<{
      userId: string;
      templateId: string;
      funcionarioId: string;
      lojaId: string;
      serieId: string | null;
      dataAgendada: Date;
    }> = [];

    for (const slot of slots) {
      if (!slot.templateId || !slot.dataBase || !slot.horario) {
        return NextResponse.json({ error: 'Slot com campos obrigatórios ausentes.' }, { status: 400 });
      }
      if (!/^\d{2}:\d{2}$/.test(slot.horario)) {
        return NextResponse.json({ error: `Horário inválido: ${slot.horario}` }, { status: 400 });
      }

      const template = await prisma.tarefaTemplate.findFirst({
        where: { id: slot.templateId, userId: rh.userId, ativo: true },
      });
      if (!template) {
        return NextResponse.json(
          { error: `Template não encontrado ou inativo: ${slot.templateId}` },
          { status: 404 },
        );
      }
      if (!templatesDosGrupos.has(slot.templateId)) {
        return NextResponse.json(
          { error: 'Só é possível atribuir tarefas que fazem parte dos grupos selecionados.' },
          { status: 400 },
        );
      }

      const erroMensal = validarRecorrenciaMensal(slot);
      if (erroMensal) {
        return NextResponse.json({ error: erroMensal }, { status: 400 });
      }

      const datas = gerarDatas(slot).filter((d) => !funcionarioEstaDeFolga(func, d));
      if (datas.length === 0) {
        return NextResponse.json(
          {
            error:
              'Nenhuma data gerada: os dias escolhidos coincidem com a folga deste funcionário (ficha de RH). Ajuste os dias do template ou a escala do funcionário.',
          },
          { status: 400 },
        );
      }

      const lojaEfetiva = slot.lojaExecucaoId ?? lojaId;
      const aberta = isSerieAberta(slot.recorrencia);
      let serieId: string | null = null;

      if (aberta) {
        const rec = slot.recorrencia!;
        const serie = await prisma.tarefaSerie.upsert({
          where: {
            templateId_funcionarioId_lojaId: {
              templateId: slot.templateId,
              funcionarioId,
              lojaId: lojaEfetiva,
            },
          },
          create: {
            userId: rh.userId,
            templateId: slot.templateId,
            funcionarioId,
            lojaId: lojaEfetiva,
            horario: slot.horario,
            tipo: rec.tipo ?? 'semanal',
            diasSemana: rec.diasSemana ?? [],
            mensalModo: rec.mensalModo ?? null,
            diaDoMes: rec.diaDoMes ?? null,
            nth: rec.nth ?? null,
            weekday: rec.weekday ?? null,
            renovarAuto: true,
            ativo: true,
          },
          update: {
            horario: slot.horario,
            tipo: rec.tipo ?? 'semanal',
            diasSemana: rec.diasSemana ?? [],
            mensalModo: rec.mensalModo ?? null,
            diaDoMes: rec.diaDoMes ?? null,
            nth: rec.nth ?? null,
            weekday: rec.weekday ?? null,
            renovarAuto: true,
            ativo: true,
          },
        });
        serieId = serie.id;
      } else {
        await prisma.tarefaSerie.updateMany({
          where: {
            templateId: slot.templateId,
            funcionarioId,
            lojaId: lojaEfetiva,
          },
          data: { renovarAuto: false, ativo: false },
        });
      }

      for (const d of datas) {
        if (d <= limitePassado) {
          return NextResponse.json(
            {
              error: `A data/hora ${d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} está no passado. Ajuste o horário ou a data de início.`,
            },
            { status: 400 },
          );
        }
        registros.push({
          userId: rh.userId,
          templateId: slot.templateId,
          funcionarioId,
          lojaId: lojaEfetiva,
          serieId,
          dataAgendada: d,
        });
      }
    }

    if (registros.length === 0) {
      return NextResponse.json({ error: 'Nenhuma atribuição gerada.' }, { status: 400 });
    }

    const { count } = await prisma.tarefaAtribuida.createMany({ data: registros });
    return NextResponse.json({ count }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tarefas/atribuicoes]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
