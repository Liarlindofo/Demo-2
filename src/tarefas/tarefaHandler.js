/**
 * Máquina de estados por telefone para o módulo de tarefas do bot.
 *
 * Sessões são persistidas no banco (SessaoTarefa) para sobreviver
 * a reinicializações do PM2.
 *
 * Fluxo:
 *   1. Bot envia mensagem de cobrança → scheduler cria SessaoTarefa (AGUARDANDO)
 *   2. Funcionário responde → processarMensagem() rota pelo tipo
 *   3. Cada evidência exigida recebida → postEvidencia() → marca recebida
 *   4. Todas recebidas → calcula atraso → patchStatus(CONCLUIDA|CONCLUIDA_COM_ATRASO) → CONCLUIDA
 *   5. 23h55 sem resposta → scheduler → EXPIRADA / NAO_CONCLUIDA
 */

import prisma from '../db/index.js';
import logger from '../utils/logger.js';
import { patchStatus, postEvidencia } from './platefulApi.js';

// ─── Ícones e textos de evidência ─────────────────────────────────────────

const ICONE = {
  FOTO:                '📷',
  CONFIRMACAO_TEXTO:   '✅',
  LOCALIZACAO:         '📍',
  ARQUIVO:             '📎',
};

const DESCRICAO = {
  FOTO:                'uma foto',
  CONFIRMACAO_TEXTO:   'uma confirmação por texto',
  LOCALIZACAO:         'sua localização',
  ARQUIVO:             'o arquivo/documento',
};

/**
 * Monta a instrução de envio de evidências.
 * @param {string[]} tipos
 */
function instrucaoEvidencias(tipos) {
  if (!tipos.length) return '';
  const partes = tipos.map((t) => `${ICONE[t]} ${DESCRICAO[t]}`);
  if (partes.length === 1) return `Me manda ${partes[0]}.`;
  const ultimo = partes.pop();
  return `Me manda ${partes.join(', ')} e ${ultimo}.`;
}

// ─── Normalização de telefone ──────────────────────────────────────────────

/** Remove tudo que não é dígito: "55 (11) 9999-9999" → "5511999999999" */
function apenasDigitos(phone) {
  return String(phone || '').replace(/\D/g, '');
}

// ─── Tipo de evidência a partir do tipo de mensagem WPP ───────────────────

function tipoEvidenciaDeMsg(message) {
  switch (message.type) {
    case 'image':
      return 'FOTO';
    case 'location':
      return 'LOCALIZACAO';
    case 'document':
    case 'audio':
    case 'video':
    case 'ptt': // push-to-talk (áudio gravado)
      return 'ARQUIVO';
    case 'chat':
    case 'text':
    default:
      return 'CONFIRMACAO_TEXTO';
  }
}

// ─── Acesso ao banco de sessões ────────────────────────────────────────────

/**
 * Retorna TODAS as sessões AGUARDANDO para um telefone,
 * ordenadas da mais antiga para a mais nova.
 */
export async function getSessoesAtivas(telefone) {
  return prisma.sessaoTarefa.findMany({
    where: { telefone: apenasDigitos(telefone), estado: 'AGUARDANDO' },
    orderBy: { criadaEm: 'asc' },
  });
}

/**
 * Retorna a sessão AGUARDANDO mais antiga para o telefone
 * (a que deve receber as próximas evidências).
 */
export async function getSessaoAtiva(telefone) {
  const sessoes = await getSessoesAtivas(telefone);
  return sessoes[0] ?? null;
}

/**
 * Cria uma nova sessão de tarefa no banco.
 */
export async function criarSessao(tarefaId, telefone, evidenciasExigidas, enviadaEm) {
  return prisma.sessaoTarefa.create({
    data: {
      tarefaId,
      telefone: apenasDigitos(telefone),
      evidenciasExigidas,
      evidenciasRecebidas: [],
      estado: 'AGUARDANDO',
      enviadaEm: enviadaEm instanceof Date ? enviadaEm : new Date(enviadaEm),
    },
  });
}

// ─── Download de mídia ────────────────────────────────────────────────────

/**
 * Tenta baixar e decodificar a mídia de uma mensagem WPPConnect.
 * Retorna Buffer ou null em caso de falha.
 */
async function baixarMidia(message, client) {
  try {
    // Tentativa 1: decryptFile (retorna Buffer)
    const buf = await client.decryptFile(message);
    if (Buffer.isBuffer(buf) && buf.length > 0) return buf;
  } catch {}

  try {
    // Tentativa 2: downloadMedia (pode retornar base64 string ou Buffer)
    const resultado = await client.downloadMedia(message);
    if (!resultado) return null;

    if (Buffer.isBuffer(resultado)) return resultado;

    // data:image/jpeg;base64,/9j/...
    if (typeof resultado === 'string') {
      const partes = resultado.split(',');
      const b64 = partes.length > 1 ? partes[1] : partes[0];
      return Buffer.from(b64, 'base64');
    }
  } catch {}

  return null;
}

// ─── Processamento de mensagem ─────────────────────────────────────────────

/**
 * Processa uma mensagem recebida no contexto de uma sessão de tarefa ativa.
 * Deve ser chamado ANTES do fluxo GPT normal.
 *
 * @param {object} message    Objeto de mensagem do WPPConnect
 * @param {object} client     Cliente WPPConnect ativo
 * @param {string} telefone   Telefone em dígitos puros
 * @param {object} sessao     Registro SessaoTarefa do banco
 */
export async function processarMensagem(message, client, telefone, sessao) {
  const wppFrom = message.from;

  try {
    const tipoMsg = tipoEvidenciaDeMsg(message);
    const exigidas = Array.isArray(sessao.evidenciasExigidas) ? sessao.evidenciasExigidas : [];
    const recebidas = Array.isArray(sessao.evidenciasRecebidas) ? sessao.evidenciasRecebidas : [];
    const faltando = exigidas.filter((t) => !recebidas.includes(t));

    logger.info(
      `[tarefaHandler] telefone=${telefone} tipo=${tipoMsg} exigidas=${JSON.stringify(exigidas)} recebidas=${JSON.stringify(recebidas)}`,
    );

    // Tipo não esperado para esta tarefa
    if (!exigidas.includes(tipoMsg)) {
      if (faltando.length > 0) {
        await client.sendText(
          wppFrom,
          `Ainda preciso de ${faltando.map((t) => `${ICONE[t]} ${DESCRICAO[t]}`).join(' e ')} pra concluir essa tarefa. 😊`,
        );
      }
      return;
    }

    // Tipo já recebido (duplicata)
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

    // Construir corpo da evidência
    const evidenciaBody = { tipo: tipoMsg };

    if (tipoMsg === 'LOCALIZACAO') {
      evidenciaBody.latitude  = message.lat  ?? message.location?.lat;
      evidenciaBody.longitude = message.lng   ?? message.location?.lng ?? message.location?.longitude;
    } else if (tipoMsg === 'CONFIRMACAO_TEXTO') {
      evidenciaBody.conteudoTexto = (message.body || message.text || '').trim();
    } else {
      // FOTO ou ARQUIVO — baixar mídia
      const buffer = await baixarMidia(message, client);
      if (buffer && buffer.length > 0) {
        evidenciaBody.arquivoBase64 = buffer.toString('base64');
        evidenciaBody.mimeType = message.mimetype || (tipoMsg === 'FOTO' ? 'image/jpeg' : 'application/octet-stream');
      } else {
        logger.warn('[tarefaHandler] Não foi possível baixar a mídia, continuando sem arquivo.');
      }
    }

    // Enviar evidência para o Plateful
    await postEvidencia(sessao.tarefaId, evidenciaBody);

    // Atualizar sessão no banco
    const novasRecebidas = [...recebidas, tipoMsg];
    await prisma.sessaoTarefa.update({
      where: { id: sessao.id },
      data: { evidenciasRecebidas: novasRecebidas },
    });

    const todasRecebidas = exigidas.every((t) => novasRecebidas.includes(t));

    if (todasRecebidas) {
      // Calcular atraso: prazo = enviadaEm + 5 min
      const agora = new Date();
      const prazo = new Date(new Date(sessao.enviadaEm).getTime() + 5 * 60 * 1000);
      const minutosAtraso = Math.max(0, Math.round((agora.getTime() - prazo.getTime()) / 60_000));
      const statusFinal = minutosAtraso > 0 ? 'CONCLUIDA_COM_ATRASO' : 'CONCLUIDA';

      await patchStatus(sessao.tarefaId, {
        status: statusFinal,
        concluidaEm: agora.toISOString(),
        minutosAtraso,
      });

      await prisma.sessaoTarefa.update({
        where: { id: sessao.id },
        data: { estado: 'CONCLUIDA' },
      });

      const msgConcluida = minutosAtraso > 0
        ? `✅ Tarefa registrada, obrigado! _(${minutosAtraso} min de atraso)_`
        : '✅ Tarefa registrada, obrigado!';

      await client.sendText(wppFrom, msgConcluida);
      logger.info(`[tarefaHandler] ✅ Sessão ${sessao.id} concluída (atraso: ${minutosAtraso}min)`);

      // Verificar se há outra tarefa pendente para este telefone
      setTimeout(async () => {
        try {
          const proximas = await getSessoesAtivas(telefone);
          if (proximas.length > 0) {
            const proxima = proximas[0];
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
      // Informar o que ainda falta
      const agora = novasRecebidas;
      const ainda = exigidas.filter((t) => !agora.includes(t));
      await client.sendText(
        wppFrom,
        `Recebi! Ainda preciso de ${ainda.map((t) => `${ICONE[t]} ${DESCRICAO[t]}`).join(' e ')}. 😊`,
      );
    }
  } catch (err) {
    logger.error('[tarefaHandler] Erro ao processar evidência:', err?.message);
    try {
      await client.sendText(
        wppFrom,
        'Ops, tive um problema ao registrar. Tenta de novo em instantes! 🙏',
      );
    } catch {}
  }
}

// ─── Expiração de fim de dia ───────────────────────────────────────────────

/**
 * Marca como EXPIRADA toda sessão AGUARDANDO criada hoje (≥ 00h00).
 * Chamado pelo job 55 23 * * * antes de marcar NAO_CONCLUIDA no Plateful.
 */
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
