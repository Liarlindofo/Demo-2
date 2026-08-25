export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionDbUser } from '@/lib/rh-api-auth';

const DEFAULT_SYSTEM_PROMPT = `Você é um assistente de chat útil, direto e amigável da plataforma Platefull.
Responda em português do Brasil, de forma clara e objetiva.
Se não souber algo, diga com honestidade.`;

const DEFAULT_MODEL = 'cognitivecomputations/dolphin-mistral-24b-venice-edition';

async function getSystemPrompt(): Promise<string> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'chat_system_prompt' },
    });
    return config?.value?.trim() || DEFAULT_SYSTEM_PROMPT;
  } catch {
    return DEFAULT_SYSTEM_PROMPT;
  }
}

async function callOpenRouter(apiKey: string, messages: unknown[]) {
  const model = process.env.CHAT_OPENROUTER_MODEL || DEFAULT_MODEL;
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://platefull.com.br',
      'X-Title': 'Platefull Chat',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    const dbUser = await getSessionDbUser();
    if (!dbUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { pergunta, historico = [], conversaId } = body as {
      pergunta?: string;
      historico?: { role: string; content: string }[];
      conversaId?: string;
    };

    if (!pergunta || typeof pergunta !== 'string' || !pergunta.trim()) {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 });
    }

    const openrouterKey =
      process.env.CHAT_OPENROUTER_API_KEY ??
      process.env.RH_OPENROUTER_API_KEY ??
      process.env.OPENROUTER_API_KEY;

    if (!openrouterKey) {
      return NextResponse.json(
        {
          error:
            'Chave OpenRouter não configurada. Adicione CHAT_OPENROUTER_API_KEY ou OPENROUTER_API_KEY.',
        },
        { status: 500 },
      );
    }

    const systemPrompt = await getSystemPrompt();
    const messages = [
      { role: 'system', content: systemPrompt },
      ...historico.slice(-20),
      { role: 'user', content: pergunta.trim() },
    ];

    const data = await callOpenRouter(openrouterKey, messages);
    const resposta: string = data.choices?.[0]?.message?.content || '';

    if (!resposta) {
      return NextResponse.json(
        { error: 'A IA não retornou conteúdo. Tente novamente.' },
        { status: 502 },
      );
    }

    let idConversa = conversaId;

    if (!idConversa) {
      const titulo = pergunta.trim().slice(0, 80);
      const nova = await prisma.chatConversa.create({
        data: { userId: dbUser.id, titulo },
      });
      idConversa = nova.id;
    } else {
      const existing = await prisma.chatConversa.findFirst({
        where: { id: idConversa, userId: dbUser.id },
        select: { id: true },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
      }
      await prisma.chatConversa.update({
        where: { id: idConversa },
        data: { updatedAt: new Date() },
      });
    }

    await prisma.chatMensagem.createMany({
      data: [
        { conversaId: idConversa, role: 'user', content: pergunta.trim(), isError: false },
        { conversaId: idConversa, role: 'assistant', content: resposta, isError: false },
      ],
    });

    return NextResponse.json({ resposta, conversaId: idConversa });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao processar mensagem';
    console.error('[Chat] Erro:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
