import { prisma } from '@/lib/prisma';
import { funcionarioEstaDeFolga } from '@/lib/rh-folga';
import { gerarDatas, ymdBrasilia } from '@/lib/tarefas-recorrencia';

export type PropagacaoResultado = {
  funcionarios: number;
  criadas: number;
};

function chave(funcionarioId: string, lojaId: string) {
  return `${funcionarioId}::${lojaId}`;
}

/**
 * Quando um template entra num grupo que já está atribuído,
 * materializa a série (90 dias) para cada funcionário que já tem
 * outro template daquele grupo.
 */
export async function propagarTemplateNoGrupo(
  userId: string,
  grupoId: string,
  templateId: string,
): Promise<PropagacaoResultado> {
  const vazio: PropagacaoResultado = { funcionarios: 0, criadas: 0 };

  const template = await prisma.tarefaTemplate.findFirst({
    where: { id: templateId, userId, ativo: true },
    select: {
      id: true,
      lojaId: true,
      cargoId: true,
      diasSemana: true,
      horarioPadrao: true,
    },
  });
  if (!template || template.diasSemana.length === 0 || !template.horarioPadrao) {
    return vazio;
  }

  const itens = await prisma.tarefaGrupoItem.findMany({
    where: { grupoId },
    select: { templateId: true },
  });
  const outrosIds = itens.map((i) => i.templateId).filter((id) => id !== templateId);
  if (outrosIds.length === 0) return vazio;

  const inicioHoje = new Date(`${ymdBrasilia(new Date())}T00:00:00-03:00`);

  const [seriesOutros, atribuicoesOutros] = await Promise.all([
    prisma.tarefaSerie.findMany({
      where: { userId, templateId: { in: outrosIds }, ativo: true },
      select: { funcionarioId: true, lojaId: true },
    }),
    prisma.tarefaAtribuida.findMany({
      where: {
        userId,
        templateId: { in: outrosIds },
        dataAgendada: { gte: inicioHoje },
      },
      select: { funcionarioId: true, lojaId: true },
      distinct: ['funcionarioId', 'lojaId'],
    }),
  ]);

  const alvos = new Map<string, { funcionarioId: string; lojaId: string }>();
  for (const row of [...seriesOutros, ...atribuicoesOutros]) {
    alvos.set(chave(row.funcionarioId, row.lojaId), row);
  }
  if (alvos.size === 0) return vazio;

  const hoje = ymdBrasilia(new Date());
  const agora = new Date();
  let funcionarios = 0;
  let criadas = 0;

  for (const { funcionarioId, lojaId } of alvos.values()) {
    const func = await prisma.rhFuncionario.findFirst({
      where: { id: funcionarioId, userId },
      select: {
        id: true,
        ativo: true,
        cargoId: true,
        lojaId: true,
        diasFolga: true,
        domingoFolga: true,
        statusFerias: true,
      },
    });
    if (!func?.ativo) continue;
    if (template.cargoId && func.cargoId && template.cargoId !== func.cargoId) continue;
    if (template.lojaId && template.lojaId !== lojaId && template.lojaId !== func.lojaId) continue;

    const jaTem = await prisma.tarefaAtribuida.findFirst({
      where: {
        templateId,
        funcionarioId,
        lojaId,
        dataAgendada: { gte: inicioHoje },
      },
      select: { id: true },
    });
    if (jaTem) continue;

    const datas = gerarDatas({
      templateId,
      dataBase: hoje,
      horario: template.horarioPadrao,
      recorrencia: { tipo: 'semanal', diasSemana: template.diasSemana },
    }).filter((d) => d > agora && !funcionarioEstaDeFolga(func, d));

    if (datas.length === 0) continue;

    const serie = await prisma.tarefaSerie.upsert({
      where: {
        templateId_funcionarioId_lojaId: { templateId, funcionarioId, lojaId },
      },
      create: {
        userId,
        templateId,
        funcionarioId,
        lojaId,
        horario: template.horarioPadrao,
        tipo: 'semanal',
        diasSemana: template.diasSemana,
        renovarAuto: true,
        ativo: true,
      },
      update: {
        horario: template.horarioPadrao,
        tipo: 'semanal',
        diasSemana: template.diasSemana,
        renovarAuto: true,
        ativo: true,
      },
    });

    const existentes = await prisma.tarefaAtribuida.findMany({
      where: {
        templateId,
        funcionarioId,
        lojaId,
        dataAgendada: { gte: datas[0], lte: datas[datas.length - 1] },
      },
      select: { dataAgendada: true },
    });
    const ymds = new Set(existentes.map((e) => ymdBrasilia(e.dataAgendada)));
    const novos = datas
      .filter((d) => !ymds.has(ymdBrasilia(d)))
      .map((d) => ({
        userId,
        templateId,
        funcionarioId,
        lojaId,
        serieId: serie.id,
        dataAgendada: d,
      }));

    if (novos.length === 0) continue;

    const result = await prisma.tarefaAtribuida.createMany({ data: novos });
    criadas += result.count;
    funcionarios += 1;
  }

  return { funcionarios, criadas };
}

export async function propagarTemplatesNovosNoGrupo(
  userId: string,
  grupoId: string,
  templateIdsNovos: string[],
): Promise<PropagacaoResultado> {
  const total: PropagacaoResultado = { funcionarios: 0, criadas: 0 };
  for (const templateId of templateIdsNovos) {
    const r = await propagarTemplateNoGrupo(userId, grupoId, templateId);
    total.funcionarios += r.funcionarios;
    total.criadas += r.criadas;
  }
  return total;
}
