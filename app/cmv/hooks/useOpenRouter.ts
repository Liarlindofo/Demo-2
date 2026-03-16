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
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Resposta vazia da API');
      }

      // Tentar extrair JSON da resposta
      let parsed: OpenRouterResponse;
      try {
        // Remover markdown code blocks se existirem
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (parseError) {
        // Se não conseguir parsear, criar resposta de erro
        throw new Error('Resposta da IA não está em formato JSON válido');
      }

      return parsed;
    } catch (error) {
      console.error('Erro ao chamar OpenRouter:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendMessage, isLoading };
};
