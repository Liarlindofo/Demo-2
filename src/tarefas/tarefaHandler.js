/**
 * Máquina de estados por telefone para o módulo de tarefas do bot.
 *
 * Sessões são persistidas no banco (SessaoTarefa) para sobreviver
 * a reinicializações do PM2.
 *
 * Fluxo:
 *   1. Bot envia mensagem de cobrança → scheduler cria SessaoTarefa (AGUARDANDO)
 *   2. Funcionário responde → processarMensagem() rota pelo tipo
 *   3. Cada evidência exigida recebida → validação por IA (se FOTO) → postEvidencia()
 *   4. Todas recebidas → calcula atraso → patchStatus(CONCLUIDA|CONCLUIDA_COM_ATRASO)
 *   5. 23h55 sem resposta → scheduler → EXPIRADA / NAO_CONCLUIDA
 *
 * REGRA CRÍTICA: o bot nunca comenta divergências com o funcionário.
 * A mensagem de conclusão é sempre "✅ Tarefa registrada, obrigado!" — ponto final.
 */

import prisma from '../db/index.js';
import logger from '../utils/logger.js';
import { patchStatus, postEvidencia } from './platefulApi.js';
import { validarFoto } from './validacaoIA.js';

// ─── Constantes de UI ──────────────────────────────────────────────────────

const ICONE = {
  FOTO:              '📷',
  CONFIRMACAO_TEXTO: '✅',
  LOCALIZACAO:       '📍',
  ARQUIVO:           '📎',
};

const DESCRICAO = {
  FOTO:              'uma foto',
  CONFIRMACAO_TEXTO: 'uma confirmação por texto',
  LOCALIZACAO:       'sua localização',
  ARQUIVO:           'o arquivo/documento',
};

function instrucaoEvidencias(tipos) {
  if (!tipos.length) return '';
  const partes = tipos.map((t) => `${ICONE[t]} ${DESCRICAO[t]}`);
  if (partes.length === 1) return `Me manda ${partes[0]}.`;
  const ultimo = partes.pop();
  return `Me manda ${partes.join(', ')} e ${ultimo}.`;
}

// ─── Geolocalização — fórmula de Haversine ────────────────────────────────

/**
 * Calcula a distância em metros entre dois pontos geográficos.
 * Usa a fórmula de Haversine (precisão suficiente para raios < 50 km).
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distância em metros
 */
function haversineMetros(lat1, lng1, lat2, lng2) {
  const R    = 6_371_000; // raio médio da Terra em metros
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat  = toRad(lat2 - lat1);
  const dLng  = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Normalização de telefone ──────────────────────────────────────────────

function apenasDigitos(phone) {
  return String(phone || '').replace(/\D/g, '');
}

/**
 * Canonicaliza um número de telefone BR para DDD + 8 dígitos (10 dígitos).
 *
 * Problema resolvido: gravação usa telefone do cadastro RH (sem DDI 55) e
 * consulta usa JID do WhatsApp (com DDI 55, podendo ter ou não o nono dígito).
 * A forma canônica elimina as duas fontes de variação.
 *
 * Exemplos — todos produzem "4196420791":
 *   "5541996420791"   → remove 55 → "41996420791" → remove 9 → "4196420791"
 *   "41996420791"     → sem 55 → remove 9 → "4196420791"
 *   "554196420791"    → remove 55 → "4196420791"  (sem 9 a remover)
 *   "(41) 99642-0791" → remove não-dígitos → "41996420791" → remove 9 → "4196420791"
 *
 * @param {string|null|undefined} telefone
 * @returns {string}  10 dígitos canônicos (DDD + 8 dígitos) ou string de dígitos bruta como fallback
 */
export function canonicalizarTelefone(telefone) {
  let d = apenasDigitos(telefone);
  if (!d) return d;

  // Remove o prefixo DDI "55" se resultar em 10 ou 11 dígitos úteis
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) {
    d = d.slice(2);
  }

  // Remove o nono dígito: 11 dígitos com "9" na posição 2 (logo após o DDD de 2 dígitos)
  // Ex: "41 9 96420791" → "41 96420791"
  if (d.length === 11 && d[2] === '9') {
    d = d.slice(0, 2) + d.slice(3);
  }

  return d; // forma canônica: DDD(2) + número(8) = 10 dígitos
}

// ─── Tipo de evidência ─────────────────────────────────────────────────────

function tipoEvidenciaDeMsg(message) {
  switch (message.type) {
    case 'image':
      return 'FOTO';
    case 'location':
      return 'LOCALIZACAO';
    case 'document':
    case 'audio':
    case 'video':
    case 'ptt':
      return 'ARQUIVO';
    case 'chat':
    case 'text':
    default:
      return 'CONFIRMACAO_TEXTO';
  }
}

// ─── Acesso ao banco de sessões ────────────────────────────────────────────

/**
 * Retorna sessões AGUARDANDO que correspondam ao telefone canonicalizado
 * OU ao LID gravado no momento do envio (match por qualquer um dos dois).
 *
 * Só considera sessões criadas nas últimas 12 horas (janela de validade).
 * Ordem: mais recente primeiro (DESC) — a sessão relevante é sempre a nova.
 *
 * @param {string|null}  telefone   Telefone bruto (será canonicalizado internamente)
 * @param {string|null}  [lidDigits] Dígitos do LID (sem "@lid"), opcional
 */
export async function getSessoesAtivas(telefone, lidDigits) {
  const telefoneCanon = telefone ? canonicalizarTelefone(telefone) : null;

  const orFiltros = [];
  if (telefoneCanon) orFiltros.push({ telefone: telefoneCanon });
  if (lidDigits)     orFiltros.push({ lid: lidDigits });

  if (orFiltros.length === 0) return [];

  const janela12h = new Date(Date.now() - 12 * 60 * 60 * 1000);

  return prisma.sessaoTarefa.findMany({
    where: {
      estado:    'AGUARDANDO',
      criadaEm:  { gte: janela12h },
      // Se apenas um filtro, evita OR desnecessário; se dois, usa OR
      ...(orFiltros.length === 1 ? orFiltros[0] : { OR: orFiltros }),
    },
    orderBy: { criadaEm: 'desc' },
  });
}

/**
 * Higiene contínua: expira (AGUARDANDO → EXPIRADA) todas as sessões do
 * mesmo telefone/lid que já ultrapassaram 12 horas de idade.
 * Executada a cada chamada de getSessaoAtiva, sem depender de cron.
 *
 * @param {string|null} telefone  já canonicalizado
 * @param {string|null} lidDigits
 */
async function _expirarSessoesVelhas(telefone, lidDigits) {
  const telefoneCanon = telefone ? canonicalizarTelefone(telefone) : null;

  const orFiltros = [];
  if (telefoneCanon) orFiltros.push({ telefone: telefoneCanon });
  if (lidDigits)     orFiltros.push({ lid: lidDigits });

  if (orFiltros.length === 0) return;

  const limite = new Date(Date.now() - 12 * 60 * 60 * 1000);

  const { count } = await prisma.sessaoTarefa.updateMany({
    where: {
      estado:    'AGUARDANDO',
      criadaEm:  { lt: limite },
      ...(orFiltros.length === 1 ? orFiltros[0] : { OR: orFiltros }),
    },
    data: { estado: 'EXPIRADA' },
  });

  if (count > 0) {
    logger.info(
      `[tarefaHandler] ${count} sessão(ões) obsoleta(s) expirada(s) automaticamente (tel=${telefoneCanon ?? lidDigits ?? '?'})`,
    );
  }
}

/**
 * @param {string|null}  telefone
 * @param {string|null}  [lidDigits]
 */
export async function getSessaoAtiva(telefone, lidDigits) {
  // Higiene contínua antes de consultar: descarta sessões fora da janela de 12h
  try {
    await _expirarSessoesVelhas(telefone, lidDigits);
  } catch (err) {
    logger.warn(`[tarefaHandler] Erro ao expirar sessões velhas: ${err?.message}`);
  }

  const sessoes = await getSessoesAtivas(telefone, lidDigits);
  return sessoes[0] ?? null;
}

/**
 * Cria uma nova sessão de tarefa.
 *
 * @param {string}      tarefaId
 * @param {string}      telefone            Será canonicalizado internamente
 * @param {string[]}    evidenciasExigidas  Ex: ['FOTO', 'CONFIRMACAO_TEXTO']
 * @param {Date}        enviadaEm
 * @param {string}      [descricaoTarefa]   Descrição do template (para prompt IA)
 * @param {object|null} [validacaoIA]       Config de validação IA do template
 * @param {string|null} [lid]               Dígitos do LID capturado no envio (sem "@lid")
 */
export async function criarSessao(
  tarefaId,
  telefone,
  evidenciasExigidas,
  enviadaEm,
  descricaoTarefa = '',
  validacaoIA = null,
  lid = null,
) {
  const telefoneCanon = canonicalizarTelefone(telefone);

  // Unicidade: garante no máximo uma sessão AGUARDANDO por funcionário.
  // Expira qualquer sessão anterior antes de abrir a nova.
  const { count: expiradas } = await prisma.sessaoTarefa.updateMany({
    where: { telefone: telefoneCanon, estado: 'AGUARDANDO' },
    data:  { estado: 'EXPIRADA' },
  });
  if (expiradas > 0) {
    logger.info(
      `[tarefaHandler/criarSessao] ${expiradas} sessão(ões) anterior(es) expirada(s) para tel=${telefoneCanon}`,
    );
  }

  return prisma.sessaoTarefa.create({
    data: {
      tarefaId,
      telefone:            telefoneCanon,
      lid:                 lid ?? null,
      evidenciasExigidas,
      evidenciasRecebidas: [],
      estado:              'AGUARDANDO',
      enviadaEm:           enviadaEm instanceof Date ? enviadaEm : new Date(enviadaEm),
      descricaoTarefa:     descricaoTarefa || null,
      validacaoIA:         validacaoIA || null,
      tentativasFoto:      0,
    },
  });
}

// ─── Download de mídia ────────────────────────────────────────────────────

const TIMEOUT_MIDIA_MS = 30_000;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${label} ${ms / 1000}s`)), ms)),
  ]);
}

async function baixarMidia(message, client) {
  try {
    const buf = await withTimeout(client.decryptFile(message), TIMEOUT_MIDIA_MS, 'decryptFile');
    if (Buffer.isBuffer(buf) && buf.length > 0) return buf;
  } catch (err) {
    logger.warn(`[tarefaHandler/baixarMidia] decryptFile falhou: ${err?.message}`);
  }

  try {
    const resultado = await withTimeout(client.downloadMedia(message), TIMEOUT_MIDIA_MS, 'downloadMedia');
    if (!resultado) return null;
    if (Buffer.isBuffer(resultado)) return resultado;
    if (typeof resultado === 'string') {
      const partes = resultado.split(',');
      const b64    = partes.length > 1 ? partes[1] : partes[0];
      return Buffer.from(b64, 'base64');
    }
  } catch (err) {
    logger.warn(`[tarefaHandler/baixarMidia] downloadMedia falhou: ${err?.message}`);
  }

  return null;
}

// ─── Validação por IA para fotos ──────────────────────────────────────────

/**
 * Processa um FOTO evidence com validação por IA (se sessao.validacaoIA estiver configurado).
 *
 * @returns {object|null}
 *   null   → foto recusada, bot pediu nova foto (return early na chamadora)
 *   object → { evidenciaBody, emRevisaoAdm } → seguir com postEvidencia
 */
async function processarFoto(message, client, wppFrom, sessao, buffer) {
  const base64 = buffer.toString('base64');
  const mime   = message.mimetype || 'image/jpeg';

  const evidenciaBody = {
    tipo:         'FOTO',
    arquivoBase64: base64,
    mimeType:      mime,
  };

  // Sem validacaoIA no template → aceita foto sem análise
  if (!sessao.validacaoIA) {
    return { evidenciaBody, emRevisaoAdm: false };
  }

  // Chamar validação por IA
  const textoFuncionario = (message.caption || message.body || '').trim();
  const tentativaAtual   = sessao.tentativasFoto ?? 0;

  let resultado;
  try {
    resultado = await validarFoto({
      imagemBase64:      base64,
      mimeType:          mime,
      descricaoTarefa:   sessao.descricaoTarefa ?? '',
      validacaoIA:       sessao.validacaoIA,
      textoFuncionario,
      tarefaId:          sessao.tarefaId,
      tentativaAnterior: tentativaAtual,
    });
  } catch (err) {
    logger.error('[tarefaHandler/foto] Erro inesperado em validarFoto:', err?.message);
    // Aceitar foto sem análise, marcar para revisão manual
    evidenciaBody.analiseIA = {
      divergencia: true,
      observacao:  'Erro interno na validação por IA. Revisão manual necessária.',
    };
    return { evidenciaBody, emRevisaoAdm: true };
  }

  // ── Parse falhou completamente ────────────────────────────────────────────
  if (resultado.erro) {
    logger.warn(`[tarefaHandler/foto] Análise IA falhou (tarefa=${sessao.tarefaId}), aceitando foto com flag de revisão.`);
    evidenciaBody.analiseIA = {
      divergencia: true,
      observacao:  'Análise por IA falhou após tentativas. Revisão manual necessária.',
    };
    return { evidenciaBody, emRevisaoAdm: true };
  }

  // ── Foto ilegível / confiança baixa ───────────────────────────────────────
  if (resultado.precisaNovaFoto) {
    if (tentativaAtual < 2) {
      // Pedir nova foto (1ª ou 2ª vez)
      await prisma.sessaoTarefa.update({
        where: { id: sessao.id },
        data:  { tentativasFoto: tentativaAtual + 1 },
      });

      await client.sendText(
        wppFrom,
        'Não consegui ver direito, consegues mandar mais de perto? 📷',
      );

      logger.info(
        `[tarefaHandler/foto] Pedindo nova foto (tentativa ${tentativaAtual + 1}/2) para tarefa=${sessao.tarefaId}`,
      );

      return null; // sinaliza: foto recusada, caller deve retornar
    }

    // 3ª tentativa → aceitar mesmo com qualidade baixa, marcar revisão
    logger.info(
      `[tarefaHandler/foto] 3ª tentativa aceita com baixa qualidade (tarefa=${sessao.tarefaId}).`,
    );

    const analise3a = resultado.analise ?? {};
    analise3a.divergencia = true;
    analise3a.observacao  = analise3a.observacao
      || 'Foto aceita após 3 tentativas: legibilidade ou confiança insuficiente.';

    evidenciaBody.analiseIA = analise3a;
    return { evidenciaBody, emRevisaoAdm: true };
  }

  // ── Foto OK (analisada com sucesso) ───────────────────────────────────────
  // analise pode ter divergencia: true (texto contradiz imagem) ou
  // foraDaFaixa (valor fora do range) — ambos já setados em verificarFaixaEmCodigo.
  // A regra crítica: NÃO comunicar nada disso ao funcionário.
  if (resultado.analise) {
    evidenciaBody.analiseIA = resultado.analise;
  }

  const emRevisaoAdm = resultado.analise?.divergencia === true || resultado.foraDaFaixa;
  return { evidenciaBody, emRevisaoAdm };
}

// ─── Processamento de mensagem (ponto de entrada) ─────────────────────────

/**
 * Processa uma mensagem recebida no contexto de uma sessão de tarefa ativa.
 * Chamado ANTES do fluxo GPT normal em handleIncomingMessage.
 */
export async function processarMensagem(message, client, telefone, sessao) {
  const wppFrom = message.from;
  const sid     = sessao.id;

  try {
    const tipoMsg   = tipoEvidenciaDeMsg(message);
    const exigidas  = Array.isArray(sessao.evidenciasExigidas)  ? sessao.evidenciasExigidas  : [];
    const recebidas = Array.isArray(sessao.evidenciasRecebidas) ? sessao.evidenciasRecebidas : [];
    const faltando  = exigidas.filter((t) => !recebidas.includes(t));

    logger.info(
      `[tarefaHandler] tel=${telefone} tipo=${tipoMsg} exigidas=${JSON.stringify(exigidas)} recebidas=${JSON.stringify(recebidas)}`,
    );

    // ── Tipo não esperado ──────────────────────────────────────────────────
    if (!exigidas.includes(tipoMsg)) {
      if (faltando.length > 0) {
        logger.info(`[tarefaHandler][passo] sendText tipo-nao-esperado — início (sid=${sid})`);
        try {
          await client.sendText(
            wppFrom,
            `Ainda preciso de ${faltando.map((t) => `${ICONE[t]} ${DESCRICAO[t]}`).join(' e ')} pra concluir essa tarefa. 😊`,
          );
          logger.info(`[tarefaHandler][passo] sendText tipo-nao-esperado — ok (sid=${sid})`);
        } catch (err) {
          logger.error(`[tarefaHandler][passo] sendText tipo-nao-esperado — erro (sid=${sid})`, err?.stack);
        }
      }
      return;
    }

    // ── Tipo já recebido (duplicata) ───────────────────────────────────────
    if (recebidas.includes(tipoMsg)) {
      const restante = faltando.filter((t) => t !== tipoMsg);
      if (restante.length > 0) {
        logger.info(`[tarefaHandler][passo] sendText duplicata — início (sid=${sid})`);
        try {
          await client.sendText(
            wppFrom,
            `Já recebi ${ICONE[tipoMsg]} ${DESCRICAO[tipoMsg]}! Ainda preciso de ${restante.map((t) => `${ICONE[t]} ${DESCRICAO[t]}`).join(' e ')}. 😊`,
          );
          logger.info(`[tarefaHandler][passo] sendText duplicata — ok (sid=${sid})`);
        } catch (err) {
          logger.error(`[tarefaHandler][passo] sendText duplicata — erro (sid=${sid})`, err?.stack);
        }
      }
      return;
    }

    // ── Construir corpo da evidência ───────────────────────────────────────
    let evidenciaBody = { tipo: tipoMsg };
    let emRevisaoAdmExtra = false;

    if (tipoMsg === 'LOCALIZACAO') {
      const latFuncionario = message.lat  ?? message.location?.lat;
      const lngFuncionario = message.lng  ?? message.location?.lng ?? message.location?.longitude;

      evidenciaBody.latitude  = latFuncionario;
      evidenciaBody.longitude = lngFuncionario;

      // ── Verificação de distância ────────────────────────────────────────
      // Busca a loja associada à TarefaAtribuida para obter lat/lng/raio.
      // Falha silenciosa: se não encontrar coords configuradas, aceita mesmo assim.
      try {
        const tarefaAtribuida = await prisma.tarefaAtribuida.findUnique({
          where: { id: sessao.tarefaId },
          select: { loja: { select: { nome: true, latitude: true, longitude: true, raioVerificacaoM: true } } },
        });

        const loja = tarefaAtribuida?.loja;

        if (loja?.latitude != null && loja?.longitude != null && latFuncionario != null && lngFuncionario != null) {
          const distanciaM = Math.round(haversineMetros(latFuncionario, lngFuncionario, loja.latitude, loja.longitude));
          const raio       = loja.raioVerificacaoM ?? 300;
          const foraDoRaio = distanciaM > raio;

          logger.info(
            `[tarefaHandler/localizacao] Distância da loja "${loja.nome}": ${distanciaM} m (raio=${raio} m) — ${foraDoRaio ? '⚠️ FORA DO RAIO' : '✅ dentro do raio'} (sid=${sid})`,
          );

          // Gravar resultado geográfico em analiseIA da evidência.
          // Quando divergencia = true, a API /evidencias seta emRevisaoAdm = true
          // automaticamente — sem nenhuma mensagem ao funcionário (regra crítica).
          evidenciaBody.analiseIA = {
            distanciaM,
            raioM:       raio,
            foraDoRaio,
            nomeLoja:    loja.nome,
            divergencia: foraDoRaio,
            observacao:  foraDoRaio
              ? `Localização a ${distanciaM} m da loja "${loja.nome}" (raio permitido: ${raio} m). Requer revisão.`
              : `Localização dentro do raio de ${raio} m da loja "${loja.nome}".`,
          };

          if (foraDoRaio) {
            emRevisaoAdmExtra = true; // atualiza flag local para o log de conclusão
            logger.warn(
              `[tarefaHandler/localizacao] Fora do raio — emRevisaoAdm será ativado pelo servidor (sid=${sid})`,
            );
          }
        } else if (loja && (loja.latitude == null || loja.longitude == null)) {
          logger.warn(
            `[tarefaHandler/localizacao] Loja "${loja?.nome}" sem coordenadas configuradas — aceitando sem verificação (sid=${sid})`,
          );
        }
      } catch (geoErr) {
        logger.error(`[tarefaHandler/localizacao] Erro na verificação de distância (sid=${sid}):`, geoErr?.message);
        // Aceita mesmo assim — não bloquear o funcionário por erro interno
      }

    } else if (tipoMsg === 'CONFIRMACAO_TEXTO') {
      evidenciaBody.conteudoTexto = (message.body || message.text || '').trim();

    } else if (tipoMsg === 'FOTO') {
      // FOTO: baixar mídia + validação por IA
      logger.info(`[tarefaHandler][passo] decryptFile/downloadMedia (FOTO) — início (sid=${sid})`);
      let buffer;
      try {
        buffer = await baixarMidia(message, client);
        logger.info(`[tarefaHandler][passo] decryptFile/downloadMedia (FOTO) — ok, bytes=${buffer?.length ?? 0} (sid=${sid})`);
      } catch (err) {
        logger.error(`[tarefaHandler][passo] decryptFile/downloadMedia (FOTO) — erro (sid=${sid})`, err?.stack);
        buffer = null;
      }

      if (!buffer || buffer.length === 0) {
        logger.warn(`[tarefaHandler][passo] decryptFile/downloadMedia (FOTO) — sem buffer, pedindo reenvio (sid=${sid})`);
        try {
          await client.sendText(wppFrom, 'Não consegui baixar a foto, envia de novo? 😊');
        } catch (err) {
          logger.error(`[tarefaHandler][passo] sendText sem-foto — erro (sid=${sid})`, err?.stack);
        }
        return;
      }

      logger.info(`[tarefaHandler][passo] validação IA (FOTO) — início (sid=${sid})`);
      let resultadoFoto;
      try {
        resultadoFoto = await processarFoto(message, client, wppFrom, sessao, buffer);
        logger.info(`[tarefaHandler][passo] validação IA (FOTO) — ok, resultado=${resultadoFoto === null ? 'recusada' : 'aceita'} (sid=${sid})`);
      } catch (err) {
        logger.error(`[tarefaHandler][passo] validação IA (FOTO) — erro (sid=${sid})`, err?.stack);
        // Aceitar com flag de revisão para não perder a evidência
        resultadoFoto = {
          evidenciaBody: {
            tipo:          'FOTO',
            arquivoBase64: buffer.toString('base64'),
            mimeType:      message.mimetype || 'image/jpeg',
            analiseIA:     { divergencia: true, observacao: 'Erro interno na validação por IA.' },
          },
          emRevisaoAdm: true,
        };
      }

      if (resultadoFoto === null) {
        // Foto recusada por baixa qualidade — pedimos nova foto; saímos sem marcar
        return;
      }

      evidenciaBody     = resultadoFoto.evidenciaBody;
      emRevisaoAdmExtra = resultadoFoto.emRevisaoAdm;

    } else {
      // ARQUIVO (document/audio/video/ptt)
      logger.info(`[tarefaHandler][passo] decryptFile/downloadMedia (ARQUIVO) — início (sid=${sid})`);
      let buffer;
      try {
        buffer = await baixarMidia(message, client);
        logger.info(`[tarefaHandler][passo] decryptFile/downloadMedia (ARQUIVO) — ok, bytes=${buffer?.length ?? 0} (sid=${sid})`);
      } catch (err) {
        logger.error(`[tarefaHandler][passo] decryptFile/downloadMedia (ARQUIVO) — erro (sid=${sid})`, err?.stack);
        buffer = null;
      }

      if (buffer && buffer.length > 0) {
        evidenciaBody.arquivoBase64 = buffer.toString('base64');
        evidenciaBody.mimeType = message.mimetype || 'application/octet-stream';
      } else {
        logger.warn(`[tarefaHandler][passo] decryptFile/downloadMedia (ARQUIVO) — sem buffer, continuando sem ele (sid=${sid})`);
      }
    }

    // ── Enviar evidência para o Plateful ───────────────────────────────────
    logger.info(`[tarefaHandler][passo] postEvidencia — início (sid=${sid})`);
    try {
      await postEvidencia(sessao.tarefaId, evidenciaBody);
      logger.info(`[tarefaHandler][passo] postEvidencia — ok (sid=${sid})`);
    } catch (err) {
      logger.error(`[tarefaHandler][passo] postEvidencia — erro (sid=${sid})`, err?.stack);
      throw err;
    }

    // ── Transição ENVIADA → AGUARDANDO_EVIDENCIA na primeira evidência ─────
    // A máquina de estados do servidor exige essa passagem antes de CONCLUIDA.
    // Feito aqui, após postEvidencia; falha NÃO interrompe o restante do fluxo.
    if (recebidas.length === 0) {
      logger.info(`[tarefaHandler][passo] patchStatus AGUARDANDO_EVIDENCIA — início (sid=${sid})`);
      try {
        await patchStatus(sessao.tarefaId, { status: 'AGUARDANDO_EVIDENCIA' });
        logger.info(`[tarefaHandler][passo] patchStatus AGUARDANDO_EVIDENCIA — ok (sid=${sid})`);
      } catch (transErr) {
        if (transErr?.message?.includes('409')) {
          logger.info(`[tarefaHandler][passo] patchStatus AGUARDANDO_EVIDENCIA — 409 já estava, seguindo (sid=${sid})`);
        } else {
          logger.error(`[tarefaHandler][passo] patchStatus AGUARDANDO_EVIDENCIA — erro (sid=${sid}): ${transErr?.message}`, transErr?.stack);
          // não relança: persistência e resposta ao funcionário continuam
        }
      }
    }

    // ── Atualizar evidenciasRecebidas ──────────────────────────────────────
    const novasRecebidas = [...recebidas, tipoMsg];
    logger.info(`[tarefaHandler][passo] persistência banco evidenciasRecebidas — início (sid=${sid})`);
    try {
      await prisma.sessaoTarefa.update({
        where: { id: sessao.id },
        data:  { evidenciasRecebidas: novasRecebidas },
      });
      logger.info(`[tarefaHandler][passo] persistência banco evidenciasRecebidas — ok (sid=${sid})`);
    } catch (err) {
      logger.error(`[tarefaHandler][passo] persistência banco evidenciasRecebidas — erro (sid=${sid})`, err?.stack);
      throw err;
    }

    const todasRecebidas = exigidas.every((t) => novasRecebidas.includes(t));

    if (todasRecebidas) {
      // ── Calcular atraso ──────────────────────────────────────────────────
      const agora         = new Date();
      const prazo         = new Date(new Date(sessao.enviadaEm).getTime() + 5 * 60 * 1000);
      const minutosAtraso = Math.max(0, Math.round((agora.getTime() - prazo.getTime()) / 60_000));
      const statusFinal   = minutosAtraso > 0 ? 'CONCLUIDA_COM_ATRASO' : 'CONCLUIDA';

      // ── Patch final com rede de segurança para sessões presas em ENVIADA ──
      // Manter emRevisaoAdm = true se alguma evidência sinalizou revisão.
      // O servidor só reseta se emRevisaoAdm for explicitamente false.
      // Não enviamos nada aqui para não sobrescrever o flag setado pelo postEvidencia.
      const patchFinalPayload = {
        status:      statusFinal,
        concluidaEm: agora.toISOString(),
        minutosAtraso,
      };

      logger.info(`[tarefaHandler][passo] patch final ${statusFinal} — início (sid=${sid})`);
      try {
        await patchStatus(sessao.tarefaId, patchFinalPayload);
        logger.info(`[tarefaHandler][passo] patch final ${statusFinal} — ok (sid=${sid})`);
      } catch (patchErr) {
        if (patchErr?.message?.includes('409') && patchErr?.message?.includes('ENVIADA')) {
          // Sessão antiga ficou presa em ENVIADA (sem AGUARDANDO_EVIDENCIA).
          // Força a transição intermediária e repete o patch final uma vez.
          logger.warn(`[tarefaHandler][passo] patch final — sessão presa em ENVIADA, forçando transição (sid=${sid})`);
          await patchStatus(sessao.tarefaId, { status: 'AGUARDANDO_EVIDENCIA' });
          await patchStatus(sessao.tarefaId, patchFinalPayload);
          logger.info(`[tarefaHandler][passo] patch final ${statusFinal} — ok após forçar transição (sid=${sid})`);
        } else {
          logger.error(`[tarefaHandler][passo] patch final — erro (sid=${sid})`, patchErr?.stack);
          throw patchErr; // outer catch → mensagem de erro ao funcionário
        }
      }

      logger.info(`[tarefaHandler][passo] persistência banco estado=CONCLUIDA — início (sid=${sid})`);
      try {
        await prisma.sessaoTarefa.update({
          where: { id: sessao.id },
          data:  { estado: 'CONCLUIDA' },
        });
        logger.info(`[tarefaHandler][passo] persistência banco estado=CONCLUIDA — ok (sid=${sid})`);
      } catch (err) {
        logger.error(`[tarefaHandler][passo] persistência banco estado=CONCLUIDA — erro (sid=${sid})`, err?.stack);
        throw err;
      }

      // ── REGRA CRÍTICA: mensagem ao funcionário é sempre a mesma ──────────
      // Divergência, faixas, emRevisaoAdm → NUNCA mencionado aqui.
      // Enviado APENAS após confirmação do patch final com sucesso.
      const msgConcluida = minutosAtraso > 0
        ? `✅ Tarefa registrada, obrigado! _(${minutosAtraso} min de atraso)_`
        : '✅ Tarefa registrada, obrigado!';

      logger.info(`[tarefaHandler][passo] sendText conclusão — início (sid=${sid})`);
      try {
        await client.sendText(wppFrom, msgConcluida);
        logger.info(`[tarefaHandler][passo] sendText conclusão — ok (sid=${sid})`);
      } catch (err) {
        logger.error(`[tarefaHandler][passo] sendText conclusão — erro (sid=${sid})`, err?.stack);
      }

      logger.info(
        `[tarefaHandler] ✅ Sessão ${sessao.id} concluída | atraso=${minutosAtraso}min | emRevisao=${emRevisaoAdmExtra}`,
      );

      // Notificar próxima tarefa pendente (delay de 2,5 s)
      setTimeout(async () => {
        try {
          const proximas = await getSessoesAtivas(telefone);
          if (proximas.length > 0) {
            const proxima    = proximas[0];
            const prFaltando = (proxima.evidenciasExigidas || []).filter(
              (t) => !(proxima.evidenciasRecebidas || []).includes(t),
            );
            await client.sendText(
              wppFrom,
              `📋 Você ainda tem outra tarefa pendente!\n\n${instrucaoEvidencias(prFaltando)}`,
            );
          }
        } catch (e) {
          logger.warn('[tarefaHandler] Erro ao notificar próxima tarefa:', e?.message);
        }
      }, 2500);

    } else {
      // Ainda faltam evidências — informar o que falta
      const ainda = exigidas.filter((t) => !novasRecebidas.includes(t));
      logger.info(`[tarefaHandler][passo] sendText falta-evidencias — início (sid=${sid})`);
      try {
        await client.sendText(
          wppFrom,
          `Recebi! Ainda preciso de ${ainda.map((t) => `${ICONE[t]} ${DESCRICAO[t]}`).join(' e ')}. 😊`,
        );
        logger.info(`[tarefaHandler][passo] sendText falta-evidencias — ok (sid=${sid})`);
      } catch (err) {
        logger.error(`[tarefaHandler][passo] sendText falta-evidencias — erro (sid=${sid})`, err?.stack);
      }
    }

  } catch (err) {
    logger.error('[tarefaHandler] Erro ao processar evidência:', err?.message, err?.stack);
    try {
      await client.sendText(wppFrom, 'Ops, tive um problema ao registrar. Tenta de novo em instantes! 🙏');
    } catch {}
  }
}

// ─── Vinculação de LID pelo eco da mensagem enviada ───────────────────────

/**
 * Vincula um LID à sessão AGUARDANDO mais recente que ainda não tem LID.
 *
 * Chamado quando o onAnyMessage recebe o eco (fromMe=true) da mensagem de
 * cobrança de tarefa e o destino termina em "@lid". A janela de 90 s cobre
 * o tempo entre criarSessao() e a chegada do eco no listener.
 *
 * @param {string} lidDigits  Dígitos do LID (sem "@lid")
 */
export async function vincularLidASessaoRecente(lidDigits) {
  const limite = new Date(Date.now() - 90_000); // agora - 90 s

  async function tentarVincular(retentativa = false) {
    const sessao = await prisma.sessaoTarefa.findFirst({
      where: {
        estado:   'AGUARDANDO',
        lid:      null,
        criadaEm: { gte: limite },
      },
      orderBy: { criadaEm: 'desc' },
    });

    if (!sessao) return false;

    await prisma.sessaoTarefa.update({
      where: { id: sessao.id },
      data:  { lid: lidDigits },
    });

    if (retentativa) {
      logger.info(`[TAREFA] LID ${lidDigits} vinculado na retentativa à sessão ${sessao.id}`);
    } else {
      logger.info(`[TAREFA] LID ${lidDigits} vinculado à sessão ${sessao.id}`);
    }
    return true;
  }

  const vinculado = await tentarVincular(false);
  if (!vinculado) {
    logger.info(`[TAREFA] LID ${lidDigits} — nenhuma sessão recente sem LID encontrada.`);
    // Rede de segurança: eco pode chegar antes de criarSessao concluir.
    // Agenda UMA retentativa fire-and-forget após 3 s.
    setTimeout(() => {
      tentarVincular(true)
        .then((ok) => {
          if (!ok) logger.warn(`[TAREFA] LID ${lidDigits} — retentativa sem sessão encontrada; desistindo.`);
        })
        .catch((err) => {
          logger.warn(`[TAREFA] LID ${lidDigits} — erro na retentativa: ${err?.message}`);
        });
    }, 3000);
  }
}

/**
 * Marca uma sessão como EXPIRADA pelo seu id.
 * Usada pelo scheduler para rollback quando o envio falha após criarSessao.
 *
 * @param {string} id  ID da SessaoTarefa
 */
export async function marcarSessaoExpirada(id) {
  await prisma.sessaoTarefa.update({
    where: { id },
    data:  { estado: 'EXPIRADA' },
  });
}

// ─── Expiração de fim de dia ───────────────────────────────────────────────

export async function expirarSessoesAntigas() {
  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  const abertas = await prisma.sessaoTarefa.findMany({
    where: { estado: 'AGUARDANDO', criadaEm: { gte: inicioDoDia } },
  });

  let expiradas = 0;

  for (const s of abertas) {
    try {
      await patchStatus(s.tarefaId, { status: 'NAO_CONCLUIDA' });
      await prisma.sessaoTarefa.update({ where: { id: s.id }, data: { estado: 'EXPIRADA' } });
      expiradas++;
    } catch (err) {
      logger.error(`[tarefaHandler] Erro ao expirar sessão ${s.id}:`, err?.message);
    }
  }

  return expiradas;
}
