'use client';

import { useState } from 'react';
import type { StoreState, StoreId, ChatMessage, OpenRouterResponse } from '../types';
import {
  OPENROUTER_ENDPOINT,
  OPENROUTER_MODEL,
  OPENROUTER_API_KEY,
  STORES,
} from '../constants';

export const useOpenRouter = (storeId: StoreId, currentState: StoreState) => {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (
    userMessage: string,
    chatHistory: ChatMessage[]
  ): Promise<OpenRouterResponse> => {
    setIsLoading(true);

    try {
      const systemPrompt = `Você é o assistente de CMV da pizzaria Calenzano, unidade ${STORES[storeId]}.
Seu papel é ajudar a cadastrar insumos e fichas técnicas de produtos conversacionalmente,
em português brasileiro, com linguagem direta e prática.

ESTADO ATUAL DA LOJA:
${JSON.stringify(currentState, null, 2)}

REGRAS DE RESPOSTA:
- Responda SEMPRE em JSON válido, sem markdown, sem texto fora do JSON
- Preserve todos os dados existentes no estado, apenas adicione ou atualize
- IDs: insumos usam prefixo "ins_" + número sequencial, fichas usam "fic_" + número sequencial
- Converta preços sempre para a unidade base:
  - Se informado em kg: divida por 1000 para obter preço por grama
  - Se informado em litro: divida por 1000 para obter preço por ml
- Quando o usuário atualizar o preço de um insumo, recalcule automaticamente
  o custo de todas as fichas que usam esse insumo
- Se o usuário perguntar sobre CMV de um produto, calcule na hora:
  CMV% = (soma dos custos dos ingredientes / preço de venda) * 100
- Semáforo: verde < 35%, amarelo 35–37%, vermelho >= 37%

FORMATO OBRIGATÓRIO DA RESPOSTA:
{
  "message": "resposta amigável em português",
  "state": {
    "insumos": [
      {
        "id": "ins_001",
        "nome": "Muçarela",
        "unidade": "g",
        "precoPorUnidade": 0.038
      }
    ],
    "fichas": [
      {
        "id": "fic_001",
        "produto": "Pizza Calabresa G",
        "precoVenda": 59.90,
        "ingredientes": [
          { "insumoId": "ins_001", "quantidade": 150 }
        ]
      }
    ]
  }
}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const response = await fetch(OPENROUTER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://plateful.com.br',
          'X-Title': 'Calenzano CMV',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Verificar se a API retornou erro no corpo (mesmo com status 200)
      if (data.error) {
        throw new Error(
          typeof data.error === 'object'
            ? (data.error.message ?? 'Erro na API')
            : String(data.error)
        );
      }

      const rawContent = data.choices?.[0]?.message?.content;

      if (!rawContent) {
        throw new Error('Resposta vazia da API');
      }

      // Normalizar: content pode ser string ou array de partes (Gemini thinking)
      const contentStr: string =
        typeof rawContent === 'string'
          ? rawContent
          : Array.isArray(rawContent)
          ? rawContent
              .map((part: any) =>
                typeof part === 'string' ? part : (part?.text ?? '')
              )
              .join('')
          : String(rawContent);

      // Tentar extrair JSON da resposta (remover markdown e texto extra)
      let parsed: OpenRouterResponse;
      try {
        // Remover markdown code blocks se existirem
        let cleaned = contentStr
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();

        // Se houver texto antes do JSON, extrair só o bloco JSON
        const jsonStart = cleaned.indexOf('{');
        const jsonEnd = cleaned.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
        }

        parsed = JSON.parse(cleaned);
      } catch (parseError) {
        throw new Error('Resposta da IA não está em formato JSON válido');
      }

      // Garantir que message seja sempre uma string
      const rawMessage = parsed.message;
      const safeMessage: string =
        typeof rawMessage === 'string'
          ? rawMessage
          : rawMessage != null
          ? JSON.stringify(rawMessage)
          : 'Resposta processada.';

      // Garantir que state seja sempre um objeto válido
      const safeState: StoreState =
        parsed.state &&
        Array.isArray(parsed.state.insumos) &&
        Array.isArray(parsed.state.fichas)
          ? parsed.state
          : currentState;

      return { message: safeMessage, state: safeState };
    } catch (error) {
      console.error('Erro ao chamar OpenRouter:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading };
};
