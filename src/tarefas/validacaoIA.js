/**
 * Validação de evidências fotográficas via GPT-4o-mini Vision.
 *
 * Regras críticas:
 *  - O bot NUNCA comenta divergências com o funcionário.
 *  - O resultado da IA é apenas para analiseIA da evidência (admin verá na revisão).
 *  - Verificação de faixa de valores (min/max) feita NO CÓDIGO, não se confia só na LLM.
 *  - Parse falhou? → { erro: true } → evidência salva sem análise, emRevisaoAdm = true.
 *  - Foto ilegível? → pede nova (máx 2 pedidos); na 3ª tentativa aceita e marca revisão.
 *
 * Env: OPENROUTER_API_KEY
 */

import logger from '../utils/logger.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL          = 'openai/gpt-4o-mini';
const MAX_TOKENS  = 350;

// ─── System prompt ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT =
  'Você valida evidências fotográficas de tarefas operacionais de uma pizzaria. ' +
  'Responda APENAS com JSON válido, sem markdown, no formato: ' +
  '{"objeto_identificado": string, "corresponde_ao_esperado": boolean, ' +
  '"valor_lido": number|null, "legivel": boolean, "confianca": number, ' +
  '"observacao": string, "divergencia": boolean}';

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Monta o texto do usuário para o prompt de validação.
 */
function construirUserText(descricaoTarefa, validacaoIA, textoFuncionario) {
  // Suporta chaves com ou sem prefixo "ia_"
  const objeto  = validacaoIA?.objeto_esperado ?? validacaoIA?.ia_objeto  ?? '';
  const extrair = validacaoIA?.extrair          ?? validacaoIA?.ia_extrair ?? '';

  const partes = [
    `Tarefa: ${descricaoTarefa}.`,
    objeto  ? `Objeto esperado: ${objeto}.`  : '',
    extrair ? `Extrair da imagem: ${extrair}.` : '',
    textoFuncionario
      ? `O funcionário escreveu: '${textoFuncionario}'.`
      : '',
    'Verifique se a imagem corresponde à tarefa descrita e se o que o funcionário ' +
    'escreveu bate com o que a imagem mostra.',
    'Se o texto do funcionário contradisser a imagem, marque divergencia: true e ' +
    'explique na observacao.',
    "A observacao deve ser uma frase curta em português pronta para relatório, " +
    "ex: 'Forno a 280°C às 17h03, abaixo da faixa ideal (300–350°C)'.",
  ];

  return partes.filter(Boolean).join(' ');
}

/**
 * Chama a API OpenAI com a imagem e retorna texto bruto + metadados de uso.
 */
async function chamarOpenRouter(imagemBase64, mimeType, userText) {
  const inicio = Date.now();

  const res = await fetch(OPENROUTER_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY?.trim()}`,
      'HTTP-Referer':  'https://platefull.com.br',
      'X-Title':       'Platefull WhatsApp Bot',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role:    'user',
          content: [
            {
              type:      'image_url',
              image_url: {
                url:    `data:${mimeType};base64,${imagemBase64}`,
                detail: 'low', // menor custo; suficiente para leitura de displays/documentos
              },
            },
            { type: 'text', text: userText },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const corpo = await res.text().catch(() => '');
    throw new Error(`OpenRouter HTTP ${res.status}: ${corpo}`);
  }

  const data   = await res.json();
  const latMs  = Date.now() - inicio;
  const tokens = data.usage?.total_tokens ?? 0;
  const texto  = data.choices?.[0]?.message?.content ?? '';

  return { texto, tokens, latMs };
}

/**
 * Tenta parsear o JSON retornado pela LLM.
 * Remove blocos markdown caso presentes.
 */
function tentarParseJSON(texto) {
  try {
    const limpo = texto.replace(/```json?\s*|\s*```/g, '').trim();
    return JSON.parse(limpo);
  } catch {
    return null;
  }
}

/**
 * Verifica se o valor lido está fora da faixa esperada.
 * Sempre feito no código — nunca confia só na LLM para o veredito final.
 *
 * @param {object} analise   Objeto analiseIA mutável
 * @param {object} validacaoIA  Config do template
 * @returns {boolean} true se fora da faixa
 */
function verificarFaixaEmCodigo(analise, validacaoIA) {
  if (!validacaoIA) return false;

  // Suporta chaves com ou sem prefixo "ia_"
  const min     = validacaoIA.faixa_ok?.min     ?? validacaoIA.ia_min;
  const max     = validacaoIA.faixa_ok?.max     ?? validacaoIA.ia_max;
  const unidade = validacaoIA.faixa_ok?.unidade ?? validacaoIA.ia_unidade ?? '';

  if (min === undefined || max === undefined) return false;

  const valorLido = analise.valor_lido;
  if (valorLido === null || valorLido === undefined || typeof valorLido !== 'number') return false;

  const foraDaFaixa = valorLido < min || valorLido > max;

  if (foraDaFaixa) {
    analise.divergencia = true;
    analise.observacao = (
      `Valor lido: ${valorLido}${unidade ? ` ${unidade}` : ''}, ` +
      `fora da faixa aceitável (${min}–${max}${unidade ? ` ${unidade}` : ''}).`
    );
  }

  return foraDaFaixa;
}

// ─── Função pública ────────────────────────────────────────────────────────

/**
 * Valida uma foto usando GPT-4o-mini Vision.
 *
 * @param {object} params
 * @param {string}      params.imagemBase64      Imagem em base64
 * @param {string}      params.mimeType          MIME da imagem (ex: "image/jpeg")
 * @param {string}      params.descricaoTarefa   Descrição da tarefa (texto longo)
 * @param {object|null} params.validacaoIA       Config do template ({ objeto_esperado, extrair, ia_min, ia_max, ia_unidade })
 * @param {string}      [params.textoFuncionario] Texto de confirmação enviado junto com a foto
 * @param {string}      [params.tarefaId]        Para logging
 * @param {number}      [params.tentativaAnterior] Número de tentativas anteriores (0-based)
 *
 * @returns {Promise<{
 *   analise: object|null,
 *   foraDaFaixa: boolean,
 *   precisaNovaFoto: boolean,
 *   erro: boolean
 * }>}
 */
export async function validarFoto({
  imagemBase64,
  mimeType,
  descricaoTarefa,
  validacaoIA,
  textoFuncionario = '',
  tarefaId = '',
  tentativaAnterior = 0,
}) {
  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    logger.warn('[validacaoIA] OPENROUTER_API_KEY não configurada — pulando validação por IA.');
    return { analise: null, foraDaFaixa: false, precisaNovaFoto: false, erro: false };
  }

  const userText = construirUserText(descricaoTarefa, validacaoIA, textoFuncionario);

  let totalTokens = 0;
  let totalLatMs  = 0;
  let analise     = null;

  // ── Tentativa 1 ──────────────────────────────────────────────────────────
  try {
    const r1 = await chamarOpenRouter(imagemBase64, mimeType, userText);
    totalTokens += r1.tokens;
    totalLatMs  += r1.latMs;
    analise      = tentarParseJSON(r1.texto);

    if (!analise) {
      logger.warn(`[validacaoIA] Parse JSON falhou na 1ª tentativa (tarefa=${tarefaId}), texto="${r1.texto.slice(0, 120)}"`);
    }
  } catch (err) {
    logger.error(`[validacaoIA] Erro na chamada OpenRouter (tarefa=${tarefaId}):`, err?.message);
    return { analise: null, foraDaFaixa: false, precisaNovaFoto: false, erro: true };
  }

  // ── Retry se parse falhou ─────────────────────────────────────────────────
  if (!analise) {
    try {
      const userTextRetry = userText + '\n\nATENÇÃO: responda APENAS o JSON válido, sem markdown nem texto extra.';
      const r2 = await chamarOpenRouter(imagemBase64, mimeType, userTextRetry);
      totalTokens += r2.tokens;
      totalLatMs  += r2.latMs;
      analise      = tentarParseJSON(r2.texto);

      if (!analise) {
        logger.error(`[validacaoIA] Parse JSON falhou após retry (tarefa=${tarefaId}), texto="${r2.texto.slice(0, 120)}"`);
      }
    } catch (err) {
      logger.error(`[validacaoIA] Erro no retry OpenRouter (tarefa=${tarefaId}):`, err?.message);
    }
  }

  // Log de custo/latência
  logger.info(
    `[validacaoIA] tarefaId=${tarefaId} tokens=${totalTokens} latência=${totalLatMs}ms model=${MODEL}`,
  );

  // Parse completamente falhou
  if (!analise) {
    return { analise: null, foraDaFaixa: false, precisaNovaFoto: false, erro: true };
  }

  // ── Pós-processamento no código ────────────────────────────────────────────

  // 1. Verificar faixa de valores (sobrescreve/complementa a observação da LLM)
  const foraDaFaixa = verificarFaixaEmCodigo(analise, validacaoIA);

  // 2. Avaliar legibilidade/confiança
  const baixaConfianca  = typeof analise.confianca === 'number' && analise.confianca < 0.6;
  const ilegivel        = analise.legivel === false;
  const precisaNovaFoto = ilegivel || baixaConfianca;

  logger.info(
    `[validacaoIA] tarefaId=${tarefaId} legivel=${analise.legivel} confianca=${analise.confianca} divergencia=${analise.divergencia} foraDaFaixa=${foraDaFaixa} precisaNovaFoto=${precisaNovaFoto}`,
  );

  return { analise, foraDaFaixa, precisaNovaFoto, erro: false };
}
