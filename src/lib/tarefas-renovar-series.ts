import { prisma } from '@/lib/prisma';
import { funcionarioEstaDeFolga } from '@/lib/rh-folga';
import {
  addDaysYmd,
  gerarDatas,
  HORIZON_DIAS,
  ymdBrasilia,
  type SlotRecorrencia,
} from '@/lib/tarefas-recorrencia';

/** Renova quando restam no máximo estes dias no horizonte já materializado. */
const RENOVAR_QUANDO_RESTA_DIAS = 14;

export async function renovarSeriesTarefas() {
  const series = await prisma.tarefaSerie.findMany({
    where: { ativo: true, renovarAuto: true },
    include: {
      template: { select: { id: true, ativo: true } },
      funcionario: {
        select: {
          id: true,
          ativo: true,
          diasFolga: true,
          domingoFolga: true,
          statusFerias: true,
        },
      },
    },
  });

  const hoje = ymdBrasilia(new Date());
  let seriesRenovadas = 0;
  let criadas = 0;
  let puladas = 0;

  for (const serie of series) {
    if (!serie.template.ativo || !serie.funcionario.ativo) {
      await prisma.tarefaSerie.update({
        where: { id: serie.id },
        data: { ativo: false, renovarAuto: false },
      });
      puladas += 1;
      continue;
    }

    const ultima = await prisma.tarefaAtribuida.findFirst({
      where: { serieId: serie.id },
      orderBy: { dataAgendada: 'desc' },
      select: { dataAgendada: true },
    });

    const ultimaYmd = ultima ? ymdBrasilia(ultima.dataAgendada) : hoje;
    const limiteYmd = addDaysYmd(hoje, RENOVAR_QUANDO_RESTA_DIAS);

    if (ultimaYmd > limiteYmd) {
      puladas += 1;
      continue;
    }

    const dataBase = ultimaYmd < hoje ? hoje : addDaysYmd(ultimaYmd, 1);
    const rec: SlotRecorrencia = {
      tipo: (serie.tipo as SlotRecorrencia['tipo']) || 'semanal',
      diasSemana: serie.diasSemana,
      mensalModo: (serie.mensalModo as SlotRecorrencia['mensalModo']) ?? undefined,
      diaDoMes: serie.diaDoMes ?? undefined,
      nth: (serie.nth as 1 | 2 | 3 | 4 | -1 | null) ?? undefined,
      weekday: serie.weekday ?? undefined,
    };

    const datas = gerarDatas({
      templateId: serie.templateId,
      dataBase,
      horario: serie.horario,
      recorrencia: rec,
    }).filter((d) => !funcionarioEstaDeFolga(serie.funcionario, d));

    if (datas.length === 0) {
      puladas += 1;
      continue;
    }

    const janelaInicio = datas[0];
    const janelaFim = datas[datas.length - 1];
    const existentes = await prisma.tarefaAtribuida.findMany({
      where: {
        templateId: serie.templateId,
        funcionarioId: serie.funcionarioId,
        lojaId: serie.lojaId,
        dataAgendada: { gte: janelaInicio, lte: janelaFim },
      },
      select: { dataAgendada: true },
    });
    const ymdsExistentes = new Set(existentes.map((e) => ymdBrasilia(e.dataAgendada)));

    const novos = datas
      .filter((d) => !ymdsExistentes.has(ymdBrasilia(d)))
      .map((d) => ({
        userId: serie.userId,
        templateId: serie.templateId,
        funcionarioId: serie.funcionarioId,
        lojaId: serie.lojaId,
        serieId: serie.id,
        dataAgendada: d,
      }));

    if (novos.length === 0) {
      puladas += 1;
      continue;
    }

    const result = await prisma.tarefaAtribuida.createMany({ data: novos });
    criadas += result.count;
    seriesRenovadas += 1;
  }

  return {
    horizonDias: HORIZON_DIAS,
    seriesVistas: series.length,
    seriesRenovadas,
    criadas,
    puladas,
  };
}
