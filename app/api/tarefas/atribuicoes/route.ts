import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rhGetUser } from '@/lib/rh-auth';

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
    tipo?: 'unica' | 'diaria' | 'semanal';
    diasSemana?: number[];
    dataFim?: string; // "YYYY-MM-DD"
  };
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

export async function POST(req: Request) {
  try {
    const rh = await rhGetUser();
    if (!rh) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { funcionarioId, lojaId, slots } = body as {
      funcionarioId: string;
      lojaId: string;
      slots: SlotInput[];
    };

    if (!funcionarioId || !lojaId || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
    }

    // Verificar funcionário e loja pertencem ao tenant
    const [func, loja] = await Promise.all([
      prisma.rhFuncionario.findFirst({ where: { id: funcionarioId, userId: rh.userId } }),
      prisma.rhLoja.findFirst({ where: { id: lojaId, userId: rh.userId } }),
    ]);
    if (!func) return NextResponse.json({ error: 'Funcionário não encontrado.' }, { status: 404 });
    if (!loja) return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });

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

      const datas = gerarDatas(slot);
      if (datas.length === 0) {
        return NextResponse.json(
          { error: 'Nenhuma data gerada para o slot. Verifique os parâmetros de recorrência.' },
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
