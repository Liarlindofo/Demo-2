import { NextResponse } from 'next/server';
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

function diffDias(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const funcionarios = await prisma.rhFuncionario.findMany({
      where: { userId: dbUser.id, ativo: true },
      include: {
        cargo: { select: { id: true, nome: true } },
        loja: { select: { id: true, nome: true } },
      },
      orderBy: { nome: 'asc' },
    });

    // Alertas de experiência — vencendo nos próximos 15 dias
    const alertasExperiencia = funcionarios
      .filter((f) => f.dataFimExperiencia1 || f.dataFimExperiencia2)
      .map((f) => {
        const venc1 = f.dataFimExperiencia1 ? diffDias(hoje, f.dataFimExperiencia1) : null;
        const venc2 = f.dataFimExperiencia2 ? diffDias(hoje, f.dataFimExperiencia2) : null;
        return { f, venc1, venc2 };
      })
      .filter(({ venc1, venc2 }) => {
        const relevante1 = venc1 !== null && venc1 >= 0 && venc1 <= 15;
        const relevante2 = venc2 !== null && venc2 >= 0 && venc2 <= 15;
        return relevante1 || relevante2;
      })
      .map(({ f, venc1, venc2 }) => ({
        funcionario: { id: f.id, nome: f.nome, loja: f.loja, cargo: f.cargo },
        dataAdmissao: f.dataAdmissao,
        dataFimExperiencia1: f.dataFimExperiencia1,
        dataFimExperiencia2: f.dataFimExperiencia2,
        diasParaVenc1: venc1,
        diasParaVenc2: venc2,
        urgencia: (venc1 !== null && venc1 <= 7) || (venc2 !== null && venc2 <= 7)
          ? 'critico'
          : 'atencao',
      }));

    // Alertas de férias — vencimento em 60 dias ou já vencido
    const alertasFerias = funcionarios
      .filter((f) => f.dataInicioFerias)
      .map((f) => {
        const inicioAquisitivo = f.dataInicioFerias!;
        const vencimentoAquisitivo = new Date(inicioAquisitivo);
        vencimentoAquisitivo.setFullYear(vencimentoAquisitivo.getFullYear() + 1);
        const diasParaVencimento = diffDias(hoje, vencimentoAquisitivo);
        return { f, vencimentoAquisitivo, diasParaVencimento };
      })
      .filter(({ diasParaVencimento }) => diasParaVencimento <= 60)
      .map(({ f, vencimentoAquisitivo, diasParaVencimento }) => ({
        funcionario: { id: f.id, nome: f.nome, loja: f.loja, cargo: f.cargo },
        dataInicioFerias: f.dataInicioFerias,
        dataGozoFerias: f.dataGozoFerias,
        vencimentoAquisitivo,
        diasParaVencimento,
        statusFerias: f.statusFerias,
        diasFeriasGozados: f.diasFeriasGozados,
        urgencia: diasParaVencimento < 0 ? 'vencido' : diasParaVencimento <= 30 ? 'critico' : 'atencao',
      }));

    // Aniversários do mês atual (dataNascimento obrigatório)
    const mesAtual = hoje.getMonth() + 1;
    const aniversariantesRaw = await prisma.$queryRaw<
      { id: string; nome: string; dataNascimento: Date; lojaId: string; cargoId: string }[]
    >`
      SELECT f.id, f.nome, f."dataNascimento", f."lojaId", f."cargoId"
      FROM "rh_funcionarios" f
      WHERE f."userId" = ${dbUser.id}
        AND f.ativo = true
        AND EXTRACT(MONTH FROM f."dataNascimento") = ${mesAtual}
      ORDER BY EXTRACT(DAY FROM f."dataNascimento")
    `;

    const aniversariantesMes = aniversariantesRaw.map((row) => {
      const f = funcionarios.find((x) => x.id === row.id);
      const nascimento = new Date(row.dataNascimento);
      const diaAniversario = nascimento.getUTCDate();
      const anoAtual = hoje.getFullYear();
      const dataAniversarioEsteAno = new Date(anoAtual, mesAtual - 1, diaAniversario);
      const idade = anoAtual - nascimento.getUTCFullYear();
      return {
        funcionario: {
          id: row.id,
          nome: row.nome,
          loja: f?.loja ?? { id: row.lojaId, nome: '' },
          cargo: f?.cargo ?? { id: row.cargoId, nome: '' },
        },
        dataNascimento: row.dataNascimento,
        diaAniversario,
        idade,
        jaPassou: dataAniversarioEsteAno < hoje,
      };
    });

    // Resumo
    const totalCriticos = alertasExperiencia.filter(a => a.urgencia === 'critico').length
      + alertasFerias.filter(a => a.urgencia === 'critico').length;
    const totalFeriasVencidas = alertasFerias.filter(a => a.urgencia === 'vencido').length;
    const totalExperienciaMes = alertasExperiencia.length;

    return NextResponse.json({
      resumo: { totalCriticos, totalFeriasVencidas, totalExperienciaMes },
      alertasExperiencia,
      alertasFerias,
      aniversariantesMes,
    });
  } catch (err) {
    console.error('[GET /api/rh/alertas]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
