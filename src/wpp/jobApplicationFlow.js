// jobApplicationFlow.js
// Fluxo de captação de candidatos para o RH - Calenzano Pizzarias
// Suporte a envio de currículo (PDF ou imagem)

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────

const HR_NUMBER = '5541991870441@c.us';

const FLOW_STEPS = [
  { key: 'nome',      question: '👤 Qual é o seu *nome completo*?' },
  { key: 'idade',     question: '🎂 Qual é a sua *idade*?' },
  { key: 'endereco',  question: '📍 Qual é o seu *bairro*?' },
  { key: 'telefone',  question: '📱 Qual é o seu *telefone* para contato?' },
  { key: 'cargo',     question: '💼 Qual *cargo ou área* você tem interesse?\n\n_(Ex: atendente, pizzaiolo, caixa, entregador...)_' },
  { key: 'curriculo', question: '📄 Por último: você tem um *currículo* para enviar?\n\nPode mandar em *PDF* ou como *foto*. Se não tiver, responda *"não"* e tudo bem! 😊', isMedia: true },
];

const INTENT_KEYWORDS = [
  'vaga', 'emprego', 'trabalhar', 'trabalho', 'currículo', 'curriculo',
  'contratação', 'contratacao', 'oportunidade', 'seleção', 'selecao',
  'estágio', 'estagio', 'me candidatar', 'quero trabalhar',
];

// Tipos de mensagem aceitos como currículo
const MEDIA_TYPES = ['document', 'image'];

// ─── STATE IN-MEMORY ─────────────────────────────────────────────────────────

const jobSessions = new Map();

// ─── FUNÇÕES AUXILIARES ───────────────────────────────────────────────────────

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function detectJobIntent(messageText) {
  const normalized = normalize(messageText);
  return INTENT_KEYWORDS.some(kw => normalized.includes(normalize(kw)));
}

function isSkipResponse(text) {
  const n = normalize(text);
  return ['nao', 'não', 'n', 'no', 'sem curriculo', 'sem currículo', 'nao tenho', 'não tenho'].some(s => n.includes(s));
}

function isMediaMessage(message) {
  return MEDIA_TYPES.includes(message.type);
}

function buildHRSummary(data, contactId, hasCurriculo) {
  const rawNumber = contactId.replace('@c.us', '');
  const waLink = `wa.me/${rawNumber}`;
  const curriculoStatus = hasCurriculo ? '✅ Enviado (arquivo abaixo)' : '❌ Não enviado';

  return (
    `📋 *NOVA CANDIDATURA — Calenzano Pizzarias*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Nome:* ${data.nome}\n` +
    `🎂 *Idade:* ${data.idade}\n` +
    `📍 *Endereço:* ${data.endereco}\n` +
    `📱 *Telefone:* ${data.telefone}\n` +
    `💼 *Cargo/Área:* ${data.cargo}\n` +
    `📄 *Currículo:* ${curriculoStatus}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `_Cadastro recebido automaticamente pela CalenZap_`
  );
}

// ─── FINALIZAÇÃO DO FLUXO ─────────────────────────────────────────────────────

async function finishFlow(client, contactId, session, curriculoMessage = null) {
  const hasCurriculo = !!curriculoMessage;

  await delay(800);
  await client.sendText(
    contactId,
    `✅ *Pronto!* Seu cadastro foi enviado para o nosso RH com sucesso!\n\n` +
    `Caso surja uma oportunidade alinhada ao seu perfil, entraremos em contato. ` +
    `Muito obrigado pelo interesse na *Calenzano Pizzarias*! 🍕`
  );

  try {
    const status = await client.checkNumberStatus(HR_NUMBER.replace('@c.us', ''));
    const hrJid = status?.id?._serialized;
    if (!hrJid) throw new Error(`Número do RH não encontrado: ${HR_NUMBER}`);

    const summary = buildHRSummary(session.data, contactId, hasCurriculo);
    await client.sendText(hrJid, summary);

    if (hasCurriculo) {
      const mediaData = await client.downloadMedia(curriculoMessage);
      const mimeType = curriculoMessage.mimetype || 'application/octet-stream';
      const filename = curriculoMessage.filename || 'curriculo';
      await client.sendFile(hrJid, mediaData, filename, `📄 Currículo de ${session.data.nome}`);
      console.log(`[JobFlow] Currículo de ${contactId} enviado ao RH.`);
    }

    console.log(`[JobFlow] Candidatura de ${contactId} enviada ao RH com sucesso.`);
  } catch (err) {
    console.error(`[JobFlow] Erro ao enviar candidatura ao RH:`, err);
  }

  jobSessions.delete(contactId);
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────

/**
 * Processa a mensagem verificando se faz parte de um fluxo de candidatura.
 
*
 * @param {object} client  - Instância do WPPConnect
 * @param {object} message - Objeto de mensagem recebido
 * @returns {boolean} true se a mensagem foi tratada por este fluxo, false caso contrário
 */
async function handleJobFlow(client, message, humanSessions) {
  if (message.isGroupMsg) return false;

  const contactId = message.from;
  const text = message.body?.trim() || '';

  // ✅ NOVO: se há atendente humano ativo, encerrar sessão e sair
  if (humanSessions.has(contactId)) {
    if (jobSessions.has(contactId)) {
      jobSessions.delete(contactId);
      console.log(`[JobFlow] Sessão de candidatura encerrada por atendimento humano: ${contactId}`);
    }
    return false;
  }

  // ── Sem sessão ativa: verificar intenção ──────────────────────────────────
  if (!jobSessions.has(contactId)) {
    if (!detectJobIntent(text)) return false;

    jobSessions.set(contactId, { step: 0, data: {} });

    await client.sendText(
      contactId,
      `Que ótimo que você tem interesse em fazer parte da nossa equipe! 🍕\n\n` +
      `Vou coletar algumas informações para encaminhar seu cadastro diretamente ao nosso RH. ` +
      `São só algumas perguntinhas rápidas! 😊`
    );

    await delay(800);
    await client.sendText(contactId, FLOW_STEPS[0].question);
    return true;
  }

  // ── Sessão ativa ──────────────────────────────────────────────────────────
  const session = jobSessions.get(contactId);
  const currentStep = FLOW_STEPS[session.step];

  // ── Passo do currículo (mídia ou texto) ───────────────────────────────────
  if (currentStep.isMedia) {
    if (isMediaMessage(message)) {
      // Recebeu arquivo — encaminhar pro RH
      await finishFlow(client, contactId, session, message);
    } else if (isSkipResponse(text)) {
      // Candidato não tem currículo — tudo bem
      await finishFlow(client, contactId, session, null);
    } else {
      // Resposta inválida: orientar novamente
      await client.sendText(
        contactId,
        `Não consegui identificar o arquivo. 😅\n\n` +
        `Por favor, envie o currículo em *PDF* ou como *foto*.\n` +
        `Se não tiver, responda *"não"* para pular essa etapa.`
      );
    }
    return true;
  }

  // ── Passos normais (texto) ────────────────────────────────────────────────
  if (!text) return true; // mensagem vazia no meio do fluxo, ignorar

  session.data[currentStep.key] = text;
  session.step++;

  await delay(600);
  await client.sendText(contactId, FLOW_STEPS[session.step].question);

  return true;
}

// ─── UTILITÁRIO ───────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { handleJobFlow };
