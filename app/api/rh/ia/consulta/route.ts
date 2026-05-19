export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';

const SYSTEM_PROMPT = `Você é um especialista em direito trabalhista brasileiro e gestão de RH para pequenas e médias empresas do setor de alimentação (CNAE 5611-2/01 — Restaurantes e similares).

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
- Mencione sempre se alguma informação pode ter sido atualizada recentemente`;

export async function POST(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ where: { stackUserId: stackUser.id } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { pergunta, historico = [], conversaId } = body;

    if (!pergunta || typeof pergunta !== 'string' || !pergunta.trim()) {
      return NextResponse.json({ error: 'Pergunta inválida' }, { status: 400 });
    }

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    const openrouterKey =
      process.env.RH_OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY;

    if (!perplexityKey && !openrouterKey) {
      return NextResponse.json(
        {
          error:
            'Nenhuma chave de API configurada. Adicione RH_OPENROUTER_API_KEY (ou PERPLEXITY_API_KEY) nas variáveis de ambiente.',
        },
        { status: 500 },
      );
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historico.slice(-10),
      { role: 'user', content: pergunta.trim() },
    ];

    let resposta: string;
    let citacoes: string[] = [];

    // ── Opção 1: Perplexity API direta (melhor — retorna citações) ────────────
    if (perplexityKey) {
      const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          messages,
          return_citations: true,
          search_recency_filter: 'month',
          temperature: 0.1,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Perplexity API error ${res.status}: ${err}`);
      }

      const data = await res.json();
      resposta = data.choices[0].message.content;
      citacoes = data.citations || [];
    }
    // ── Opção 2: OpenRouter com modelo Perplexity Sonar ──────────────────────
    else {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://platefull.com.br',
          'X-Title': 'Platefull RH - IA Trabalhista',
        },
        body: JSON.stringify({
          model: 'perplexity/sonar',
          messages,
          temperature: 0.1,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter API error ${res.status}: ${err}`);
      }

      const data = await res.json();
      resposta = data.choices[0].message.content;
      citacoes = [];
    }

    // ── Persistir no banco ────────────────────────────────────────────────────
    let idConversa = conversaId as string | undefined;

    if (!idConversa) {
      // Criar nova conversa com o título baseado na primeira pergunta
      const titulo = pergunta.trim().slice(0, 80);
      const novaConversa = await prisma.rhIaConversa.create({
        data: { userId: user.id, titulo },
      });
      idConversa = novaConversa.id;
    } else {
      // Atualizar updatedAt da conversa existente
      await prisma.rhIaConversa.update({
        where: { id: idConversa },
        data: { updatedAt: new Date() },
      });
    }

    // Salvar mensagem do usuário e resposta da IA
    await prisma.rhIaMensagem.createMany({
      data: [
        {
          conversaId: idConversa,
          role: 'user',
          content: pergunta.trim(),
          citacoes: [],
          isError: false,
        },
        {
          conversaId: idConversa,
          role: 'assistant',
          content: resposta,
          citacoes: citacoes,
          isError: false,
        },
      ],
    });

    return NextResponse.json({ resposta, citacoes, conversaId: idConversa });
  } catch (error: any) {
    console.error('[RH IA] Erro:', error.message);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar consulta' },
      { status: 500 },
    );
  }
}
