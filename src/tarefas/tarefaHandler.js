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

export async function getSessoesAtivas(telefone) {
  return prisma.sessaoTarefa.findMany({
    where: { telefone: canonicalizarTelefone(telefone), estado: 'AGUARDANDO' },
    orderBy: { criadaEm: 'asc' },
  });
}

export async function getSessaoAtiva(telefone) {
  const sessoes = await getSessoesAtivas(telefone);
  return sessoes[0] ?? null;
}

/**
 * Cria uma nova sessão de tarefa.
 *
 * @param {string}      tarefaId
 * @param {string}      telefone            Será normalizado para dígitos puros
 * @param {string[]}    evidenciasExigidas  Ex: ['FOTO', 'CONFIRMACAO_TEXTO']
 * @param {Date}        enviadaEm
 * @param {string}      [descricaoTarefa]   Descrição do template (para prompt IA)
 * @param {object|null} [validacaoIA]       Config de validação IA do template
 */
export async function criarSessao(
  tarefaId,
  telefone,
  evidenciasExigidas,
  enviadaEm,
  descricaoTarefa = '',
  validacaoIA = null,
) {
  return prisma.sessaoTarefa.create({
    data: {
      tarefaId,
      telefone:           canonicalizarTelefone(telefone),
      evidenciasExigidas,
      evidenciasRecebidas: [],
      estado:             'AGUARDANDO',
      enviadaEm:          enviadaEm instanceof Date ? enviadaEm : new Date(enviadaEm),
      descricaoTarefa:    descricaoTarefa || null,
      validacaoIA:        validacaoIA || null,
      tentativasFoto:     0,
    },
  });
}

// ─── Download de mídia ────────────────────────────────────────────────────

async function baixarMidia(message, client) {
  try {
    const buf = await client.decryptFile(message);
    if (Buffer.isBuffer(buf) && buf.length > 0) return buf;
  } catch {}

  try {
    const resultado = await client.downloadMedia(message);
    if (!resultado) return null;
    if (Buffer.isBuffer(resultado)) return resultado;
    if (typeof resultado === 'string') {
      const partes = resultado.split(',');
      const b64    = partes.length > 1 ? partes[1] : partes[0];
      return Buffer.from(b64, 'base64');
    }
  } catch {}

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
        await client.sendText(
          wppFrom,
          `Ainda preciso de ${faltando.map((t) => `${ICONE[t]} ${DESCRICAO[t]}`).join(' e ')} pra concluir essa tarefa. 😊`,
        );
      }
      return;
    }

    // ── Tipo já recebido (duplicata) ───────────────────────────────────────
    if (recebidas.includes(tipoMsg)) {
      const restante = faltando.filter((t) => t !== tipoMsg);
      if (restante.length > 0) {
        await client.sendText(
          wppFrom,
          `Já recebi ${ICONE[tipoMsg]} ${DESCRICAO[tipoMsg]}! Ainda preciso de ${restante.map((t) => `${ICONE[t]} ${DESCRICAO[t]}`).join(' e ')}. 😊`,
        );
      }
      return;
    }

    // ── Construir corpo da evidência ───────────────────────────────────────
    let evidenciaBody = { tipo: tipoMsg };
    let emRevisaoAdmExtra = false;

    if (tipoMsg === 'LOCALIZACAO') {
      evidenciaBody.latitude  = message.lat  ?? message.location?.lat;
      evidenciaBody.longitude = message.lng   ?? message.location?.lng ?? message.location?.longitude;

    } else if (tipoMsg === 'CONFIRMACAO_TEXTO') {
      evidenciaBody.conteudoTexto = (message.body || message.text || '').trim();

    } else if (tipoMsg === 'FOTO') {
      // FOTO: baixar mídia + validação por IA
      const buffer = await baixarMidia(message, client);
      if (!buffer || buffer.length === 0) {
        logger.warn('[tarefaHandler] Não foi possível baixar a foto.');
        await client.sendText(wppFrom, 'Não consegui receber a foto, tenta mandar de novo? 😊');
        return;
      }

      const resultadoFoto = await processarFoto(message, client, wppFrom, sessao, buffer);

      if (resultadoFoto === null) {
        // Foto recusada por baixa qualidade — pedimos nova foto; saímos sem marcar
        return;
      }

      evidenciaBody     = resultadoFoto.evidenciaBody;
      emRevisaoAdmExtra = resultadoFoto.emRevisaoAdm;

    } else {
      // ARQUIVO (document/audio/video/ptt)
      const buffer = await baixarMidia(message, client);
      if (buffer && buffer.length > 0) {
        evidenciaBody.arquivoBase64 = buffer.toString('base64');
        evidenciaBody.mimeType = message.mimetype || 'application/octet-stream';
      } else {
        logger.warn('[tarefaHandler] Não foi possível baixar o arquivo, continuando sem ele.');
      }
    }

    // ── Enviar evidência para o Plateful ───────────────────────────────────
    await postEvidencia(sessao.tarefaId, evidenciaBody);

    // ── Atualizar evidenciasRecebidas ──────────────────────────────────────
    const novasRecebidas = [...recebidas, tipoMsg];
    await prisma.sessaoTarefa.update({
      where: { id: sessao.id },
      data:  { evidenciasRecebidas: novasRecebidas },
    });

    const todasRecebidas = exigidas.every((t) => novasRecebidas.includes(t));

    if (todasRecebidas) {
      // ── Calcular atraso ──────────────────────────────────────────────────
      const agora        = new Date();
      const prazo        = new Date(new Date(sessao.enviadaEm).getTime() + 5 * 60 * 1000);
      const minutosAtraso = Math.max(0, Math.round((agora.getTime() - prazo.getTime()) / 60_000));
      const statusFinal  = minutosAtraso > 0 ? 'CONCLUIDA_COM_ATRASO' : 'CONCLUIDA';

      await patchStatus(sessao.tarefaId, {
        status:     statusFinal,
        concluidaEm: agora.toISOString(),
        minutosAtraso,
        // Manter emRevisaoAdm = true se alguma evidência sinalizou revisão.
        // O servidor só reseta se emRevisaoAdm for explicitamente false.
        // Não enviamos nada aqui para não sobrescrever o flag setado pelo postEvidencia.
      });

      await prisma.sessaoTarefa.update({
        where: { id: sessao.id },
        data:  { estado: 'CONCLUIDA' },
      });

      // ── REGRA CRÍTICA: mensagem ao funcionário é sempre a mesma ──────────
      // Divergência, faixas, emRevisaoAdm → NUNCA mencionado aqui.
      const msgConcluida = minutosAtraso > 0
        ? `✅ Tarefa registrada, obrigado! _(${minutosAtraso} min de atraso)_`
        : '✅ Tarefa registrada, obrigado!';

      await client.sendText(wppFrom, msgConcluida);
      logger.info(
        `[tarefaHandler] ✅ Sessão ${sessao.id} concluída | atraso=${minutosAtraso}min | emRevisao=${emRevisaoAdmExtra}`,
      );

      // Notificar próxima tarefa pendente (delay de 2,5 s)
      setTimeout(async () => {
        try {
          const proximas = await getSessoesAtivas(telefone);
          if (proximas.length > 0) {
            const proxima   = proximas[0];
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
      await client.sendText(
        wppFrom,
        `Recebi! Ainda preciso de ${ainda.map((t) => `${ICONE[t]} ${DESCRICAO[t]}`).join(' e ')}. 😊`,
      );
    }

  } catch (err) {
    logger.error('[tarefaHandler] Erro ao processar evidência:', err?.message, err?.stack);
    try {
      await client.sendText(wppFrom, 'Ops, tive um problema ao registrar. Tenta de novo em instantes! 🙏');
    } catch {}
  }
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
