import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRhPermission } from '@/lib/rh-auth';
import { P } from '@/lib/rh-permissions';
import { Decimal } from '@prisma/client/runtime/library';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min — muitas chamadas sequenciais

// ─── Secullum Auth ───────────────────────────────────────────────────────────

async function obterTokenSecullum(): Promise<{ token: string; bancoid: string }> {
  const user = process.env.SECULLUM_API_USER ?? process.env.SECULLUM_USER ?? '';
  const pass = process.env.SECULLUM_API_PASS ?? process.env.SECULLUM_PASS ?? '';
  const bancoid = process.env.SECULLUM_BANCO_ID ?? '';

  if (!user || !pass) throw new Error('SECULLUM_API_USER/SECULLUM_API_PASS não configuradas');

  const body = new URLSearchParams({
    grant_type: 'password',
    username: user,
    password: pass,
  });

  const res = await fetch('https://autenticador.secullum.com.br/Token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Falha ao autenticar no Secullum (${res.status}): ${txt}`);
  }

  const data = await res.json();
  const token = data.access_token as string;
  if (!token) throw new Error('Token não encontrado na resposta do Secullum');

  return { token, bancoid };
}

// ─── Calcular por PIS ────────────────────────────────────────────────────────

interface SecullumCalcResult {
  ex60: string;
  ex100: string;
  en60: string;
  en100: string;
  atraso: string;
  faltas: string;
  faltaDsr: string;
}

/** Nomes parciais de coluna para cada campo (busca case-insensitive, primeiro match). */
const COLUNA_MAP: Record<keyof SecullumCalcResult, string[]> = {
  ex60:     ['ex 60', 'ex60', 'he 60% diurna', 'he60% diurna', 'he 60'],
  ex100:    ['ex 100', 'ex100', 'he 100% diurna', 'he100% diurna', 'he 100'],
  en60:     ['en 60', 'en60', 'he 60% noturna', 'he60% noturna', 'en60% noturna'],
  en100:    ['en 100', 'en100', 'he 100% noturna', 'he100% noturna', 'en100% noturna'],
  atraso:   ['atras', 'atraso'],
  faltas:   ['faltas', 'horas faltas', 'falta hora'],
  faltaDsr: ['dsr', 'falta dsr', 'horas falta dsr'],
};

function encontrarIndice(colunas: string[], termos: string[]): number {
  for (let i = 0; i < colunas.length; i++) {
    const col = colunas[i].toLowerCase().trim();
    for (const t of termos) {
      if (col.includes(t.toLowerCase())) return i;
    }
  }
  return -1;
}

async function calcularFuncionario(
  token: string,
  bancoid: string,
  pis: string,
  dataInicial: string,
  dataFinal: string,
): Promise<SecullumCalcResult> {
  const res = await fetch(
    'https://pontowebintegracaoexterna.secullum.com.br/IntegracaoExterna/Calcular',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        secullumidbancoselecionado: bancoid,
      },
      body: JSON.stringify({
        FuncionarioPis: pis,
        DataInicial: dataInicial,
        DataFinal: dataFinal,
      }),
    },
  );

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();
  const colunas: string[] = data.Colunas ?? [];
  const totais: string[] = data.Totais ?? [];

  const get = (campo: keyof SecullumCalcResult): string => {
    const idx = encontrarIndice(colunas, COLUNA_MAP[campo]);
    if (idx === -1) return '';
    return (totais[idx] ?? '').toString().trim();
  };

  return {
    ex60: get('ex60'),
    ex100: get('ex100'),
    en60: get('en60'),
    en100: get('en100'),
    atraso: get('atraso'),
    faltas: get('faltas'),
    faltaDsr: get('faltaDsr'),
  };
}

// ─── Handler ─────────────────────────────────────────────────────────────────

const BATCH_SIZE = 90; // respeita limite de 100/hora do Secullum
const BATCH_DELAY_MS = 65_000; // 65 segundos entre lotes

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireRhPermission(P.EMPLOYEES_VIEW);
  if (error) return error;

  let body: { mes?: number; ano?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
  }

  const mes = Number(body.mes);
  const ano = Number(body.ano);
  if (!mes || mes < 1 || mes > 12 || !ano || ano < 2000) {
    return NextResponse.json({ error: 'mes (1-12) e ano são obrigatórios e devem ser válidos' }, { status: 400 });
  }

  // Primeiro e último dia do mês
  const dataInicial = `${ano}-${String(mes).padStart(2, '0')}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dataFinal = `${ano}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

  // Cria ou reaproveita FechamentoMensal
  const fechamento = await prisma.fechamentoMensal.upsert({
    where: { mes_ano: { mes, ano } },
    create: { mes, ano, status: 'rascunho' },
    update: { updatedAt: new Date() },
  });

  // Busca funcionários com numeroFolha E pisSecullum preenchidos do tenant correto
  const funcionarios = await prisma.rhFuncionario.findMany({
    where: {
      userId: ctx.userId,
      ativo: true,
      numeroFolha: { not: null },
      pisSecullum: { not: null },
    },
    select: {
      id: true,
      nome: true,
      pisSecullum: true,
      valorVT: true,
    },
  });

  // Funcionários sem PIS (para retornar no resumo)
  const semPis = await prisma.rhFuncionario.findMany({
    where: { userId: ctx.userId, ativo: true, numeroFolha: { not: null }, pisSecullum: null },
    select: { id: true, nome: true },
  });

  let processados = 0;
  let comErro = 0;

  // Autentica no Secullum
  let token = '';
  let bancoid = '';
  try {
    const auth = await obterTokenSecullum();
    token = auth.token;
    bancoid = auth.bancoid;
  } catch (authErr: any) {
    return NextResponse.json(
      { error: `Falha na autenticação Secullum: ${authErr.message}` },
      { status: 502 },
    );
  }

  // Processa em lotes para respeitar limite da API
  for (let i = 0; i < funcionarios.length; i += BATCH_SIZE) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }

    const lote = funcionarios.slice(i, i + BATCH_SIZE);

    for (const func of lote) {
      let campos: Partial<SecullumCalcResult> = {};
      let origemErro: string | null = null;

      try {
        campos = await calcularFuncionario(token, bancoid, func.pisSecullum!, dataInicial, dataFinal);
        processados++;
      } catch (calcErr: any) {
        origemErro = calcErr.message ?? 'Erro desconhecido';
        comErro++;
      }

      await prisma.fechamentoLinha.upsert({
        where: { fechamentoId_funcionarioId: { fechamentoId: fechamento.id, funcionarioId: func.id } },
        create: {
          fechamentoId: fechamento.id,
          funcionarioId: func.id,
          ...campos,
          valeTransporte: func.valorVT ? new Decimal(func.valorVT) : null,
          status: 'pendente',
          origemErro,
        },
        update: {
          ...campos,
          valeTransporte: func.valorVT ? new Decimal(func.valorVT) : null,
          status: 'pendente',
          origemErro,
          observacao: null,
        },
      });
    }
  }

  return NextResponse.json({
    fechamentoId: fechamento.id,
    processados,
    comErro,
    funcionariosSemPis: semPis.length,
    semPis,
  });
}
