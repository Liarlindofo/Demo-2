/**
 * Scheduler de tarefas — módulo de integração bot ↔ Plateful.
 *
 * Três jobs (timezone America/Sao_Paulo):
 *
 *  1. "0 12 * * *"  — Digest diário: lista do dia por funcionário (12h00)
 *  2. "* * * * *"   — Pendentes: dispara tarefas cujo horário chegou (a cada minuto)
 *  3. "55 23 * * *" — Fechamento: expira sessões abertas → NAO_CONCLUIDA (23h55)
 *
 * Cada worker PM2 conhece seu próprio userId, portanto filtra apenas as
 * tarefas do seu tenant antes de enviar mensagens. Isso evita envios
 * duplicados em setups multi-tenant.
 */

import cron from 'node-cron';
import logger from '../utils/logger.js';
import { getDigest, getPendentes, patchStatus } from './platefulApi.js';
import { criarSessao, expirarSessoesAntigas } from './tarefaHandler.js';

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Formata uma data UTC para "HH:MM" no horário de Brasília.
 */
function formatarHorario(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour:     '2-digit',
    minute:   '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

/**
 * Data de hoje em "YYYY-MM-DD" (horário de Brasília).
 */
function dataHojeBrasilia() {
  return new Date()
    .toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year:  'numeric',
      month: '2-digit',
      day:   '2-digit',
    })
    .split('/')
    .reverse()
    .join('-');
}

/**
 * Normaliza um número de telefone brasileiro para o formato WPP "@c.us".
 *
 * Exemplos:
 *   "41996420791"       → "5541996420791@c.us"   (11 dígitos sem DDI → prefixo 55)
 *   "(41) 99642-0791"   → "5541996420791@c.us"   (formatação removida, DDI adicionado)
 *   "5541996420791"     → "5541996420791@c.us"   (DDI já presente, mantido)
 *   "4199642079"        → "55419964207@c.us"     (10 dígitos sem DDI → prefixo 55)
 *   "123"               → null                   (tamanho inválido)
 *
 * @param {string|null|undefined} telefone
 * @returns {string|null}
 */
function paraWpp(telefone) {
  if (!telefone) return null;
  const digits = String(telefone).replace(/\D/g, '');
  if (!digits) return null;

  // 10–11 dígitos: DDD + número sem DDI → adiciona "55"
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}@c.us`;
  }

  // 12–13 dígitos iniciando com "55": formato completo já correto
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return `${digits}@c.us`;
  }

  // Tamanho inesperado → retorna null para que o chamador possa logar
  return null;
}

/**
 * Remove não-dígitos de um número de telefone.
 */
function apenasDigitos(telefone) {
  return String(telefone || '').replace(/\D/g, '');
}

/**
 * Resolve o JID correto de um destinatário via checkNumberStatus.
 *
 * Problema: JIDs montados manualmente ("55...@c.us") falham com "No LID for user"
 * porque o WhatsApp usa o sistema LID e o número pode estar registrado sem o nono
 * dígito. checkNumberStatus retorna o JID resolvido pelo próprio WhatsApp.
 *
 * Estratégia:
 *   1. Normaliza os dígitos (mesma lógica de paraWpp, sem o "@c.us").
 *   2. Tenta checkNumberStatus com o número completo.
 *   3. Se falhar e for 13 dígitos com 9º dígito após o DDD, tenta sem o 9
 *      (números antigos cadastrados com 8 dígitos).
 *   4. Retorna result.id._serialized (JID real) ou null.
 *
 * @param {object}            client    Cliente WPPConnect ativo
 * @param {string|null}       telefone  Telefone bruto do funcionário
 * @returns {Promise<string|null>}      JID resolvido ou null se não localizado
 */
async function resolverDestino(client, telefone) {
  if (!telefone) return null;
  const raw = String(telefone).replace(/\D/g, '');
  if (!raw) return null;

  // Normaliza para 12–13 dígitos com prefixo 55 (mesma lógica de paraWpp)
  let digits;
  if (raw.length === 10 || raw.length === 11) {
    digits = `55${raw}`;
  } else if ((raw.length === 12 || raw.length === 13) && raw.startsWith('55')) {
    digits = raw;
  } else {
    return null; // tamanho inesperado
  }

  // Tentativa 1: número como está
  try {
    const result = await client.checkNumberStatus(`${digits}@c.us`);
    if ((result?.numberExists || result?.canReceiveMessage) && result?.id?._serialized) {
      return result.id._serialized;
    }
  } catch { /* segue para fallback */ }

  // Tentativa 2: 13 dígitos (55 + DDD + 9 + 8 dígitos) → remove o nono dígito
  // ex: "5541996420791" → "554196420791"
  if (digits.length === 13 && digits.startsWith('55') && digits[4] === '9') {
    const semNono = digits.slice(0, 4) + digits.slice(5);
    try {
      const result = await client.checkNumberStatus(`${semNono}@c.us`);
      if ((result?.numberExists || result?.canReceiveMessage) && result?.id?._serialized) {
        return result.id._serialized;
      }
    } catch { /* número não localizado */ }
  }

  return null; // WhatsApp não reconheceu o número em nenhuma forma
}

/**
 * Pausa entre envios (3–8 s aleatório) para evitar padrão de disparo em massa.
 */
function delayAleatorio() {
  const ms = 3000 + Math.floor(Math.random() * 5000);
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Monta a instrução de envio de evidências para a mensagem de cobrança.
 */
function instrucaoEvidencias(evidencias) {
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

  if (!evidencias.length) return '';
  const partes = evidencias.map((t) => `${ICONE[t]} ${DESCRICAO[t]}`);
  if (partes.length === 1) return `Me manda ${partes[0]}.`;
  const ultimo = partes.pop();
  return `Me manda ${partes.join(', ')} e ${ultimo}.`;
}

// ─── Job 1: Digest diário às 12h ──────────────────────────────────────────

async function jobDigest(userId, getClient) {
  logger.info('[scheduler:digest] ▶ Iniciando digest diário...');

  try {
    const hoje    = dataHojeBrasilia();
    const grupos  = await getDigest(hoje);

    if (!Array.isArray(grupos) || grupos.length === 0) {
      logger.info('[scheduler:digest] Nenhuma tarefa agendada para hoje.');
      return;
    }

    // NOTA: O filtro de tenant por userId foi removido.
    // O userId recebido pelo bot é o UUID de sessão WPPConnect, enquanto
    // os registros da API usam o cuid da tabela stack_users — domínios
    // incompatíveis que nunca batem. Todos os grupos retornados pela API
    // já pertencem ao tenant autenticado via BOT_SECRET.
    // Se o setup virar multi-tenant, a API deverá retornar o ID de sessão do bot.
    const meusGrupos = grupos;
    logger.info(`[scheduler:digest] ${meusGrupos.length} funcionário(s) com tarefas hoje.`);

    for (const grupo of meusGrupos) {
      try {
        const { funcionario, tarefas } = grupo;

        const client = getClient();
        if (!client) {
          logger.warn('[scheduler:digest] Cliente WPP não conectado, abortando digest.');
          break;
        }

        const destino = await resolverDestino(client, funcionario?.telefone);
        if (!destino) {
          logger.warn(
            `[scheduler:digest] Funcionário ${funcionario.nome} — telefone não localizado no WhatsApp (valor: "${funcionario?.telefone}").`,
          );
          continue;
        }

        const linhas = tarefas.map((t, i) =>
          `${i + 1}. *${t.titulo}* — ⏰ ${formatarHorario(t.horario)}`,
        );

        const mensagem =
          `📋 Boa tarde, ${funcionario.nome}! Suas tarefas de hoje:\n\n` +
          linhas.join('\n') +
          `\n\nNo horário de cada uma eu te aviso por aqui. 👊`;

        await client.sendText(destino, mensagem);
        logger.info(`[scheduler:digest] ✅ Digest enviado para ${funcionario.nome} (${destino})`);

        await delayAleatorio(); // 3–8 s entre funcionários
      } catch (err) {
        logger.error(
          `[scheduler:digest] Erro ao enviar para ${grupo.funcionario?.nome}:`,
          err?.stack || JSON.stringify(err),
        );
      }
    }
  } catch (err) {
    logger.error('[scheduler:digest] Erro geral:', err?.message);
  }
}

// ─── Job 2: Disparo de pendentes (a cada 1 minuto) ────────────────────────

/**
 * Evita disparos duplos: rastreia IDs já processados nesta execução do processo.
 * O patchStatus(ENVIADA) no servidor é a barreira definitiva (transição inválida
 * se já foi enviada por outro worker).
 */
const jaDisparados = new Set();

async function jobPendentes(userId, getClient) {
  try {
    const pendentes = await getPendentes();
    if (!Array.isArray(pendentes) || pendentes.length === 0) return;

    logger.info(`[scheduler:pendentes] API retornou ${pendentes.length} pendente(s).`);

    // NOTA: O filtro de tenant por userId foi removido.
    // O userId recebido pelo bot é o UUID de sessão WPPConnect; os registros
    // da API usam o cuid da tabela stack_users — domínios incompatíveis.
    // A API já filtra pelo tenant autenticado via BOT_SECRET.
    // Se o setup virar multi-tenant, a API deverá expor o ID de sessão do bot.
    const minhas = pendentes.filter((t) => {
      if (jaDisparados.has(t.id)) {
        logger.warn(`[scheduler:pendentes] Tarefa ${t.id} já disparada neste processo, pulando.`);
        return false;
      }
      return true;
    });

    if (minhas.length === 0) return;

    logger.info(`[scheduler:pendentes] ${minhas.length} tarefa(s) para disparar.`);

    for (const tarefa of minhas) {
      try {
        const { funcionario, template } = tarefa;

        const client = getClient();
        if (!client) {
          logger.warn('[scheduler:pendentes] Cliente WPP não conectado, abortando ciclo.');
          break;
        }

        const destino = await resolverDestino(client, funcionario?.telefone);
        if (!destino) {
          logger.warn(
            `[scheduler:pendentes] Tarefa ${tarefa.id} (${template?.titulo}) — telefone não localizado no WhatsApp (valor: "${funcionario?.telefone}").`,
          );
          continue;
        }

        // Montar lista de evidências exigidas
        const evidenciasExigidas = [];
        if (template?.exigeFoto)              evidenciasExigidas.push('FOTO');
        if (template?.exigeConfirmacaoTexto)  evidenciasExigidas.push('CONFIRMACAO_TEXTO');
        if (template?.exigeLocalizacao)       evidenciasExigidas.push('LOCALIZACAO');
        if (template?.exigeArquivo)           evidenciasExigidas.push('ARQUIVO');

        const instrucao = instrucaoEvidencias(evidenciasExigidas);
        const mensagem  =
          `⏰ Hora da tarefa: *${template?.titulo}*\n\n` +
          `${template?.descricao}\n` +
          (instrucao ? `\n${instrucao}` : '');

        // 1. Enviar mensagem
        await client.sendText(destino, mensagem.trim());

        const agora = new Date();

        // 2. Sinalizar ENVIADA no Plateful (transição atômica — rejeita duplicatas)
        await patchStatus(tarefa.id, {
          status:    'ENVIADA',
          enviadaEm: agora.toISOString(),
        });

        // 3. Criar sessão local de evidências (inclui config IA para validação de fotos)
        await criarSessao(
          tarefa.id,
          apenasDigitos(funcionario.telefone),
          evidenciasExigidas,
          agora,
          template?.descricao ?? '',
          template?.validacaoIA ?? null,
        );

        jaDisparados.add(tarefa.id);

        logger.info(
          `[scheduler:pendentes] ✅ "${template?.titulo}" → ${funcionario?.nome} (${destino})`,
        );
      } catch (err) {
        // Transição inválida (409) = tarefa já foi enviada por outro meio → ignorar
        if (err?.message?.includes('409') || err?.message?.includes('Transição inválida')) {
          logger.warn(`[scheduler:pendentes] Tarefa ${tarefa.id} já foi enviada, pulando.`);
          jaDisparados.add(tarefa.id);
        } else {
          logger.error(`[scheduler:pendentes] Erro na tarefa ${tarefa.id}:`, err?.stack || JSON.stringify(err));
        }
      }
    }
  } catch (err) {
    if (err?.message?.includes('HTTP')) {
      // API indisponível temporariamente → ignorar, tentar no próximo minuto
      logger.warn('[scheduler:pendentes] API Plateful indisponível, tentará no próximo ciclo.');
    } else {
      logger.error('[scheduler:pendentes] Erro geral:', err?.message);
    }
  }
}

// ─── Job 3: Fechamento às 23h55 ───────────────────────────────────────────

async function jobFechamento() {
  logger.info('[scheduler:fechamento] ▶ Expirando sessões abertas do dia...');
  try {
    const n = await expirarSessoesAntigas();
    logger.info(`[scheduler:fechamento] ${n} sessão(ões) marcada(s) como NAO_CONCLUIDA.`);
  } catch (err) {
    logger.error('[scheduler:fechamento] Erro:', err?.message);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────

/**
 * Inicializa os três jobs do scheduler de tarefas.
 *
 * @param {string}            userId    ID do tenant (worker PM2)
 * @param {() => object|null} getClient Função que retorna o cliente WPPConnect ativo (ou null)
 */
export function initScheduler(userId, getClient) {
  logger.info(`[scheduler] Inicializando para userId="${userId}" (timezone: America/Sao_Paulo)`);

  // Job 1 — Digest diário às 12h
  cron.schedule(
    '0 12 * * *',
    () => jobDigest(userId, getClient),
    { timezone: 'America/Sao_Paulo' },
  );

  // Job 2 — Pendentes a cada minuto
  cron.schedule(
    '* * * * *',
    () => jobPendentes(userId, getClient),
    { timezone: 'America/Sao_Paulo' },
  );

  // Job 3 — Fechamento às 23h55
  cron.schedule(
    '55 23 * * *',
    () => jobFechamento(),
    { timezone: 'America/Sao_Paulo' },
  );

  logger.info('[scheduler] ✅ 3 jobs agendados: digest (12h), pendentes (*/1min), fechamento (23h55).');
}
