export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth/adminAuth';
import { UserRole } from '@/types/admin';

// Chaves de configuração gerenciadas por esta rota
const ALLOWED_KEYS = ['rh_ia_system_prompt'] as const;
type ConfigKey = (typeof ALLOWED_KEYS)[number];

const DEFAULT_VALUES: Record<ConfigKey, string> = {
  rh_ia_system_prompt: `Você é um especialista em direito trabalhista brasileiro e gestão de RH para pequenas e médias empresas do setor de alimentação (CNAE 5611-2/01 — Restaurantes e similares).

Responda SEMPRE com base na legislação vigente atual, citando:
- Artigos da CLT
- Portarias do Ministério do Trabalho e Emprego (MTE)
- Tabelas de INSS, IRRF e FGTS com suas datas de vigência
- Reforma Trabalhista (Lei 13.467/2017) quando relevante

Quando mencionar alíquotas, valores ou datas de vigência, busque sempre os dados mais recentes disponíveis e informe explicitamente a data de vigência.

Formate as respostas de forma clara:
- Use valores em Reais (R$) com formatação brasileira
- Use percentuais precisos
- Cite sempre a fonte legal (lei, portaria, resolução)
- Organize respostas longas com tópicos ou tabelas
- Mencione sempre se alguma informação pode ter sido atualizada recentemente`,
};

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminAuth(request);
    if (session instanceof NextResponse) return session;

    if (session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Acesso restrito a super admins' }, { status: 403 });
    }

    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: [...ALLOWED_KEYS] } },
    });

    // Montar objeto com defaults para chaves ainda não salvas
    const result: Record<string, { value: string; label: string; updatedAt: string | null }> = {};
    for (const key of ALLOWED_KEYS) {
      const stored = configs.find((c) => c.key === key);
      result[key] = {
        value: stored?.value ?? DEFAULT_VALUES[key],
        label: stored?.label ?? labelFor(key),
        updatedAt: stored?.updatedAt ? stored.updatedAt.toISOString() : null,
      };
    }

    return NextResponse.json({ configs: result });
  } catch (error: any) {
    console.error('[admin configuracoes GET]', error.message);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminAuth(request);
    if (session instanceof NextResponse) return session;

    if (session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Acesso restrito a super admins' }, { status: 403 });
    }

    const body = await request.json();

    // Validar e salvar apenas chaves permitidas
    const updates: { key: string; value: string }[] = [];
    for (const key of ALLOWED_KEYS) {
      if (typeof body[key] === 'string') {
        updates.push({ key, value: body[key] });
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 });
    }

    await Promise.all(
      updates.map(({ key, value }) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value, label: labelFor(key as ConfigKey) },
          create: { key, value, label: labelFor(key as ConfigKey) },
        }),
      ),
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[admin configuracoes PUT]', error.message);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}

function labelFor(key: ConfigKey): string {
  const labels: Record<ConfigKey, string> = {
    rh_ia_system_prompt: 'Prompt do Sistema — IA Trabalhista (RH)',
  };
  return labels[key];
}
