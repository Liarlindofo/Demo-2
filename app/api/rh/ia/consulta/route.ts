export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { prisma } from '@/lib/prisma';
import { RH_TOOLS, RH_BONIFICACOES_PROMPT, executeRhTool } from '@/lib/rh-ia-tools';

const DEFAULT_SYSTEM_PROMPT = `Você é um especialista em direito trabalhista brasileiro e gestão de RH para pequenas e médias empresas do setor de alimentação (CNAE 5611-2/01 — Restaurantes e similares).

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
- Mencione sempre se alguma informação pode ter sido atualizada recentemente

Você também tem acesso ao módulo de RH da plataforma e pode realizar ações como consultar funcionários, alterar escalas, gerenciar folgas e cadastrar novos colaboradores. Quando o usuário pedir uma alteração, execute-a usando as ferramentas disponíveis e confirme o que foi feito.

${RH_BONIFICACOES_PROMPT}`;

async function getSystemPrompt(): Promise<string> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'rh_ia_system_prompt' },
    });
    return config?.value?.trim() || DEFAULT_SYSTEM_PROMPT;
  } catch {
    return DEFAULT_SYSTEM_PROMPT;
  }
}

// Chama a IA via OpenRouter com suporte a tool calling
async function callOpenRouter(
  apiKey: string,
  messages: any[],
  withTools: boolean,
): Promise<any> {
  const body: Record<string, any> = {
    model: process.env.RH_IA_MODEL || 'openai/gpt-4o-mini',
    messages,
    temperature: 0.2,
  };
  if (withTools) {
    body.tools = RH_TOOLS;
    body.tool_choice = 'auto';
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://platefull.com.br',
      'X-Title': 'Platefull RH - IA Trabalhista',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${err}`);
  }
  return res.json();
}

// Chama a IA via Perplexity (sem tool calling — apenas knowledge)
async function callPerplexity(apiKey: string, messages: any[]): Promise<any> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
  return res.json();
}

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
    const openrouterKey = process.env.RH_OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY;

    if (!perplexityKey && !openrouterKey) {
      return NextResponse.json(
        { error: 'Nenhuma chave de API configurada. Adicione RH_OPENROUTER_API_KEY nas variáveis de ambiente.' },
        { status: 500 },
      );
    }

    const systemPrompt = await getSystemPrompt();

    // Construir mensagens base
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...historico.slice(-10),
      { role: 'user', content: pergunta.trim() },
    ];

    let resposta: string;
    let citacoes: string[] = [];
    const acoesExecutadas: string[] = [];

    // ── Rota com tool calling (OpenRouter) ───────────────────────────────────
    if (openrouterKey) {
      let currentMessages = [...messages];
      const MAX_ITERATIONS = 6;

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const data = await callOpenRouter(openrouterKey, currentMessages, true);
        const choice = data.choices[0];
        const message = choice.message;

        // Sem tool calls — resposta final
        if (!message.tool_calls || message.tool_calls.length === 0) {
          resposta = message.content || '';
          break;
        }

        // Adicionar mensagem do assistente com tool_calls ao contexto
        currentMessages.push(message);

        // Executar cada tool call
        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;
          let toolArgs: Record<string, any> = {};
          try {
            toolArgs = JSON.parse(toolCall.function.arguments || '{}');
          } catch {
            toolArgs = {};
          }

          const toolResult = await executeRhTool(toolName, toolArgs, user.id);

          // Adicionar resultado ao contexto
          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolResult,
          });

          // Registrar ação para retornar ao frontend
          try {
            const parsed = JSON.parse(toolResult);
            if (parsed.sucesso && parsed.mensagem) {
              acoesExecutadas.push(parsed.mensagem);
            }
          } catch {
            // ignorar
          }
        }

        // Se última iteração sem resposta, forçar resposta
        if (i === MAX_ITERATIONS - 1) {
          const finalData = await callOpenRouter(openrouterKey, currentMessages, false);
          resposta = finalData.choices[0].message.content || 'Operação concluída.';
        }
      }

      resposta = resposta! || 'Operação concluída.';
    }
    // ── Rota sem tool calling (Perplexity) ───────────────────────────────────
    else {
      const data = await callPerplexity(perplexityKey!, messages);
      resposta = data.choices[0].message.content;
      citacoes = data.citations || [];
    }

    // ── Persistir no banco ────────────────────────────────────────────────────
    let idConversa = conversaId as string | undefined;

    if (!idConversa) {
      const titulo = pergunta.trim().slice(0, 80);
      const novaConversa = await prisma.rhIaConversa.create({
        data: { userId: user.id, titulo },
      });
      idConversa = novaConversa.id;
    } else {
      await prisma.rhIaConversa.update({
        where: { id: idConversa },
        data: { updatedAt: new Date() },
      });
    }

    await prisma.rhIaMensagem.createMany({
      data: [
        { conversaId: idConversa, role: 'user', content: pergunta.trim(), citacoes: [], isError: false },
        { conversaId: idConversa, role: 'assistant', content: resposta, citacoes, isError: false },
      ],
    });

    return NextResponse.json({ resposta, citacoes, conversaId: idConversa, acoesExecutadas });
  } catch (error: any) {
    console.error('[RH IA] Erro:', error.message);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar consulta' },
      { status: 500 },
    );
  }
}
