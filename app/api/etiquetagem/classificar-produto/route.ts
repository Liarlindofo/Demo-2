import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';

// Lista de categorias padrão para sugestão
const CATEGORIAS_CONHECIDAS = [
  'Carnes e Aves',
  'Peixes e Frutos do Mar',
  'Laticínios',
  'Vegetais',
  'Frutas',
  'Grãos e Cereais',
  'Massas',
  'Congelados',
  'Processados',
  'Bebidas',
  'Temperos e Condimentos',
  'Panificação'
];

export async function POST(request: NextRequest) {
  try {
    const stackUser = await stackServerApp.getUser({ or: 'return-null' });
    if (!stackUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { nomeProduto } = await request.json();

    if (!nomeProduto || typeof nomeProduto !== 'string') {
      return NextResponse.json(
        { error: 'Nome do produto é obrigatório' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key não configurada' },
        { status: 500 }
      );
    }

    // Chamada para OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Platefull - Etiquetagem',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em classificação de alimentos. Sua tarefa é classificar produtos alimentícios em categorias.

Categorias disponíveis:
${CATEGORIAS_CONHECIDAS.join(', ')}

Responda APENAS com o nome da categoria mais apropriada. Não adicione explicações ou texto extra.
Se o produto não se encaixar perfeitamente em nenhuma categoria, escolha a mais próxima.`
          },
          {
            role: 'user',
            content: `Classifique este produto: ${nomeProduto}`
          }
        ],
        temperature: 0.3,
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro na API OpenRouter:', error);
      return NextResponse.json(
        { error: 'Erro ao classificar produto' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const categoriaSugerida = data.choices[0]?.message?.content?.trim() || '';

    // Sugerir também peso e armazenamento
    const sugestaoCompleta = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Platefull - Etiquetagem',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em produtos alimentícios. Analise o produto e sugira:
1. Peso padrão típico (apenas o número)
2. Unidade de medida (kg, g, L ou un)
3. Tipo de armazenamento (RESFRIADO, CONGELADO ou TEMPERATURA AMBIENTE)

Responda APENAS em formato JSON:
{"peso": 1.0, "unidade": "kg", "armazenamento": "CONGELADO"}`
          },
          {
            role: 'user',
            content: `Produto: ${nomeProduto}`
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      }),
    });

    let sugestoes = {
      peso: 1.0,
      unidade: 'kg',
      armazenamento: ''
    };

    if (sugestaoCompleta.ok) {
      const sugestaoData = await sugestaoCompleta.json();
      const sugestaoTexto = sugestaoData.choices[0]?.message?.content?.trim() || '{}';
      
      try {
        // Extrair JSON do texto
        const jsonMatch = sugestaoTexto.match(/\{[^}]+\}/);
        if (jsonMatch) {
          sugestoes = { ...sugestoes, ...JSON.parse(jsonMatch[0]) };
        }
      } catch (e) {
        console.error('Erro ao parsear sugestões:', e);
      }
    }

    return NextResponse.json({
      categoria: categoriaSugerida,
      peso: sugestoes.peso,
      unidade: sugestoes.unidade,
      armazenamento: sugestoes.armazenamento,
      confianca: 0.95
    });

  } catch (error) {
    console.error('Erro ao classificar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno ao classificar produto' },
      { status: 500 }
    );
  }
}
