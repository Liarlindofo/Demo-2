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

    const inicio = new Date(`${data}T00:00:00`);
    const fim = new Date(`${data}T23:59:59.999`);

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
  recorrencia?: {
    tipo?: 'unica' | 'diaria' | 'semanal';
    diasSemana?: number[];
    dataFim?: string; // "YYYY-MM-DD"
  };
}

function gerarDatas(slot: SlotInput): Date[] {
  const [hh, mm] = slot.horario.split(':').map(Number);
  const tipo = slot.recorrencia?.tipo ?? 'unica';
  const dataInicio = new Date(`${slot.dataBase}T00:00:00`);

  if (tipo === 'unica') {
    const d = new Date(dataInicio);
    d.setHours(hh, mm, 0, 0);
    return [d];
  }

  const dataFimStr = slot.recorrencia?.dataFim;
  const dataFimBase = dataFimStr ? new Date(`${dataFimStr}T23:59:59`) : null;
  const maxDataFim = new Date(dataInicio.getTime() + 90 * 24 * 60 * 60 * 1000);
  const efetiveFim = dataFimBase && dataFimBase < maxDataFim ? dataFimBase : maxDataFim;
  const diasSemana = slot.recorrencia?.diasSemana ?? [];

  const datas: Date[] = [];
  const current = new Date(dataInicio);

  while (current <= efetiveFim) {
    const dow = current.getDay();
    if (tipo === 'diaria' || (tipo === 'semanal' && diasSemana.includes(dow))) {
      const d = new Date(current);
      d.setHours(hh, mm, 0, 0);
      datas.push(d);
    }
    current.setDate(current.getDate() + 1);
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

    const agora = new Date();
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
        if (d <= agora) {
          return NextResponse.json(
            {
              error: `A data/hora ${d.toLocaleString('pt-BR')} está no passado. Ajuste o horário ou a data de início.`,
            },
            { status: 400 },
          );
        }
        registros.push({
          userId: rh.userId,
          templateId: slot.templateId,
          funcionarioId,
          lojaId,
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
