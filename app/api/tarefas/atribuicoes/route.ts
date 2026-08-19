import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';
import { funcionarioEstaDeFolga } from '@/lib/rh-folga';

export const dynamic = 'force-dynamic';

// ── GET — lista atribuições de um dia ────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const data = searchParams.get('data'); // "YYYY-MM-DD"
    const lojaId = searchParams.get('lojaId');

    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return NextResponse.json({ error: 'Parâmetro data é obrigatório (YYYY-MM-DD).' }, { status: 400 });
    }

    // Interpreta como meia-noite e fim do dia em America/Sao_Paulo (UTC-3 fixo)
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

// ── POST — cria atribuições (com recorrência materializada) ──────────────

interface SlotInput {
  templateId: string;
  dataBase: string; // "YYYY-MM-DD"
  horario: string;  // "HH:mm"
  /** Loja onde a tarefa será realizada. Se omitido, usa lojaId do funcionário. */
  lojaExecucaoId?: string;
  recorrencia?: {
    tipo?: 'unica' | 'diaria' | 'semanal' | 'mensal';
    diasSemana?: number[];
    dataFim?: string; // "YYYY-MM-DD"
    mensalModo?: 'dia_do_mes' | 'nth_weekday';
    diaDoMes?: number; // 1–31
    nth?: 1 | 2 | 3 | 4 | -1;
    weekday?: number; // 0–6 (Dom–Sáb)
  };
}

/** Último dia do mês (ano/mês 1-indexado). */
function ultimoDiaDoMes(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Dia do mês com clamp: se dia 31 não existir, usa o último dia. */
function diaDoMesNoMes(year: number, month: number, diaDoMes: number): string {
  const last = ultimoDiaDoMes(year, month);
  const day = Math.min(Math.max(1, diaDoMes), last);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * N-ésimo weekday do mês (nth=1..4 ou -1 = última).
 * weekday: 0=Dom … 6=Sáb.
 */
function nthWeekdayNoMes(
  year: number,
  month: number,
  nth: number,
  weekday: number,
): string | null {
  if (nth === -1) {
    const lastDay = ultimoDiaDoMes(year, month);
    for (let day = lastDay; day >= 1; day--) {
      const d = new Date(Date.UTC(year, month - 1, day));
      if (d.getUTCDay() === weekday) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    return null;
  }

  let count = 0;
  const lastDay = ultimoDiaDoMes(year, month);
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCDay() === weekday) {
      count++;
      if (count === nth) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  return null;
}

function parseYm(dateStr: string): { year: number; month: number } {
  const [y, m] = dateStr.split('-').map(Number);
  return { year: y, month: m };
}

function addMonthsYm(year: number, month: number, n: number): { year: number; month: number } {
  const total = year * 12 + (month - 1) + n;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

/**
 * Gera os instantes UTC para cada ocorrência do slot.
 * dataBase e horario são interpretados como America/Sao_Paulo (UTC-3 fixo;
 * Brasil aboliu horário de verão em 2019, portanto o offset é constante).
 */
function gerarDatas(slot: SlotInput): Date[] {
  const tipo = slot.recorrencia?.tipo ?? 'unica';

  if (tipo === 'unica') {
    // Converte diretamente: "YYYY-MM-DDTHH:mm:00-03:00" → UTC correto
    return [new Date(`${slot.dataBase}T${slot.horario}:00-03:00`)];
  }

  // Meia-noite BRT do dia de início em UTC
  const dataInicioMs = new Date(`${slot.dataBase}T00:00:00-03:00`).getTime();

  const dataFimStr = slot.recorrencia?.dataFim;
  const dataFimBaseMs = dataFimStr
    ? new Date(`${dataFimStr}T23:59:59.999-03:00`).getTime()
    : null;
  const maxMs = dataInicioMs + 90 * 24 * 60 * 60 * 1000;
  const efetiveFimMs = dataFimBaseMs !== null && dataFimBaseMs < maxMs
    ? dataFimBaseMs
    : maxMs;

  if (tipo === 'mensal') {
    const modo = slot.recorrencia?.mensalModo ?? 'dia_do_mes';
    const datas: Date[] = [];
    let { year, month } = parseYm(slot.dataBase);
    const fimDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(efetiveFimMs));
    const fimYm = parseYm(fimDateStr);

    while (
      year < fimYm.year ||
      (year === fimYm.year && month <= fimYm.month)
    ) {
      let dateStr: string | null = null;
      if (modo === 'dia_do_mes') {
        const dia = slot.recorrencia?.diaDoMes ?? 1;
        dateStr = diaDoMesNoMes(year, month, dia);
      } else {
        const nth = slot.recorrencia?.nth ?? 1;
        const weekday = slot.recorrencia?.weekday ?? 1;
        dateStr = nthWeekdayNoMes(year, month, nth, weekday);
      }

      if (dateStr) {
        const d = new Date(`${dateStr}T${slot.horario}:00-03:00`);
        const ms = d.getTime();
        if (ms >= dataInicioMs && ms <= efetiveFimMs) {
          datas.push(d);
        }
      }

      ({ year, month } = addMonthsYm(year, month, 1));
    }

    return datas;
  }

  const diasSemana = slot.recorrencia?.diasSemana ?? [];
  const datas: Date[] = [];

  // Itera adicionando 24h exatas por dia (sem DST → seguro)
  let currentMs = dataInicioMs;
  while (currentMs <= efetiveFimMs) {
    // Obtém a string de data no fuso BRT a partir do timestamp UTC
    // (currentMs está em meia-noite BRT = 03:00 UTC, então slice(0,10) dá a data BRT)
    const dateStrBRT = new Date(currentMs).toISOString().slice(0, 10);
    // Monta o instante exato no fuso BRT
    const d = new Date(`${dateStrBRT}T${slot.horario}:00-03:00`);
    // getDay() em UTC no servidor retorna o dia da data BRT
    // porque currentMs está em T03:00Z, que é T00:00 BRT do mesmo dia
    const dow = d.getUTCDay(); // dia da semana da data BRT (sem ambiguidade)
    if (tipo === 'diaria' || (tipo === 'semanal' && diasSemana.includes(dow))) {
      datas.push(d);
    }
    currentMs += 24 * 60 * 60 * 1000;
  }

  return datas;
}

function validarRecorrenciaMensal(slot: SlotInput): string | null {
  const rec = slot.recorrencia;
  if (!rec || rec.tipo !== 'mensal') return null;

  const modo = rec.mensalModo ?? 'dia_do_mes';
  if (modo === 'dia_do_mes') {
    const dia = rec.diaDoMes;
    if (typeof dia !== 'number' || !Number.isInteger(dia) || dia < 1 || dia > 31) {
      return 'Informe um dia do mês válido (1–31) para a recorrência mensal.';
    }
    return null;
  }

  if (modo === 'nth_weekday') {
    const nth = rec.nth;
    const weekday = rec.weekday;
    if (nth !== 1 && nth !== 2 && nth !== 3 && nth !== 4 && nth !== -1) {
      return 'Informe a ocorrência do mês (1ª–4ª ou última).';
    }
    if (typeof weekday !== 'number' || !Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return 'Selecione o dia da semana para a recorrência mensal.';
    }
    return null;
  }

  return 'Modo de recorrência mensal inválido.';
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

    // Verificar funcionário e loja pertencem ao tenant
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

    // Pré-validar lojaExecucaoId distintas (evita busca repetida por loja no loop)
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
    // Tolerância de 60s para acomodar latência entre browser e servidor
    const limitePassado = new Date(agora.getTime() - 60_000);
    const registros: Array<{
      userId: string;
      templateId: string;
      funcionarioId: string;
      lojaId: string;
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

      for (const d of datas) {
        if (d <= limitePassado) {
          return NextResponse.json(
            {
              error: `A data/hora ${d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} está no passado. Ajuste o horário ou a data de início.`,
            },
            { status: 400 },
          );
        }
        // Usa lojaExecucaoId se informado; caso contrário, usa a loja do funcionário
        const lojaEfetiva = slot.lojaExecucaoId ?? lojaId;
        registros.push({
          userId: rh.userId,
          templateId: slot.templateId,
          funcionarioId,
          lojaId: lojaEfetiva,
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
