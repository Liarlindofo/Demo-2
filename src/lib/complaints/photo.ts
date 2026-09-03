/**
 * Escolha da foto de prova da reclamação: evidências classificadas + proximidade + visão.
 */

import { callComplaintsOpenRouter, extractJsonObject } from '@/lib/complaints/openrouter';
import {
  getWhatsAppEvidenceSupabase,
  whatsappEvidenceStoragePath,
  WHATSAPP_EVIDENCIAS_BUCKET,
} from '@/lib/whatsapp-evidence-storage';

const PROXIMITY_MS = 20 * 60 * 1000;
/** Janela ampliada quando a de 20 min não acha candidata. */
const PROXIMITY_FALLBACK_MS = 2 * 60 * 60 * 1000;
const MAX_VISION_BYTES = 3.5 * 1024 * 1024;
const MAX_VISION_CANDIDATES = 4;

export type PhotoCandidate = {
  id: string;
  direction: string;
  messageType: string;
  textContent: string | null;
  mediaUrl: string | null;
  timestamp: Date;
};

export type SelectedPhoto = {
  id: string;
  mediaUrl: string;
};

export type PhotoSelectionResult = {
  photo: SelectedPhoto | null;
  /** Motivo legível para log da ata. */
  reason: string;
};

function isClientPhoto(m: PhotoCandidate): m is PhotoCandidate & { mediaUrl: string } {
  return (
    m.direction === 'IN' &&
    (m.messageType === 'image' || m.messageType === 'sticker') &&
    typeof m.mediaUrl === 'string' &&
    m.mediaUrl.length > 0
  );
}

function isAnyPhoto(m: PhotoCandidate): m is PhotoCandidate & { mediaUrl: string } {
  return (
    (m.messageType === 'image' || m.messageType === 'sticker') &&
    typeof m.mediaUrl === 'string' &&
    m.mediaUrl.length > 0
  );
}

function imageTypeFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

export async function downloadEvidenceBuffer(
  mediaUrl: string,
): Promise<{ data: Buffer; mime: string } | null> {
  const path = whatsappEvidenceStoragePath(mediaUrl);
  if (!path) return null;
  const supabase = getWhatsAppEvidenceSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(WHATSAPP_EVIDENCIAS_BUCKET)
    .download(path);
  if (error || !data) return null;

  const buf = Buffer.from(await data.arrayBuffer());
  if (buf.length < 32) return null;
  return { data: buf, mime: imageTypeFromPath(path) };
}

function complaintAnchorTimes(
  messages: PhotoCandidate[],
  evidenciaMessageIds: string[],
  numeroPedido: string | null,
): number[] {
  const evidence = new Set(evidenciaMessageIds);
  const times: number[] = [];
  for (const m of messages) {
    if (m.direction !== 'IN') continue;
    const text = (m.textContent || '').trim();
    const t = m.timestamp.getTime();
    if (evidence.has(m.id)) times.push(t);
    if (numeroPedido && text.includes(numeroPedido)) times.push(t);
    if (/pedido\s*#?\s*\d{1,8}/i.test(text)) times.push(t);
    if (
      /(reclam|insatisfeit|faltou|errado|atrasad|esfriou|frio|cru|queimad|estrag|sem queijo|não pedi|nao pedi|cabelo|inseto|devol)/i.test(
        text,
      )
    ) {
      times.push(t);
    }
  }
  return times;
}

function minDistanceMs(photoAt: number, anchors: number[]): number {
  if (!anchors.length) return Number.POSITIVE_INFINITY;
  return Math.min(...anchors.map((a) => Math.abs(photoAt - a)));
}

async function isProductPhoto(mediaUrl: string): Promise<boolean | null> {
  const downloaded = await downloadEvidenceBuffer(mediaUrl);
  if (!downloaded) return null;
  if (downloaded.data.length > MAX_VISION_BYTES) return null;

  const dataUrl = `data:${downloaded.mime};base64,${downloaded.data.toString('base64')}`;
  try {
    const content = await callComplaintsOpenRouter({
      system: `Você classifica uma imagem enviada pelo cliente no WhatsApp de um restaurante/delivery.

Responda APENAS JSON:
{"produtoRecebido":true|false,"tipo":"comida"|"comprovante"|"print"|"documento"|"outro"}

produtoRecebido=true SOMENTE se a foto mostra o alimento/produto que o cliente recebeu (pizza, marmita, bebida, embalagem com comida, item do pedido).
produtoRecebido=false para comprovante de Pix/pagamento, print de tela, cardápio, documento, selfie sem comida, print de log, ou qualquer coisa que não seja a comida/produto.`,
      user: 'Essa imagem mostra o produto que o cliente recebeu, ou é outra coisa (comprovante, print, etc)?',
      imageDataUrl: dataUrl,
      maxTokens: 120,
      temperature: 0,
    });
    const parsed = extractJsonObject(content) as {
      produtoRecebido?: unknown;
      tipo?: unknown;
    };
    if (parsed.produtoRecebido !== true) return false;
    if (typeof parsed.tipo === 'string' && parsed.tipo !== 'comida') return false;
    return true;
  } catch (err) {
    console.warn('[complaints/photo] visão falhou:', err);
    return null;
  }
}

/**
 * Fotos IN já apontadas em evidenciaMessageIds (classificação) — prioridade máxima.
 */
function evidenceClientPhotos(
  messages: PhotoCandidate[],
  evidenciaMessageIds: string[],
): Array<PhotoCandidate & { mediaUrl: string }> {
  const evidence = new Set(evidenciaMessageIds);
  return messages
    .filter((m) => evidence.has(m.id) && isClientPhoto(m))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

async function pickFirstProductPhoto(
  candidates: Array<PhotoCandidate & { mediaUrl: string }>,
  opts: { acceptOnVisionNull: boolean },
): Promise<{ photo: SelectedPhoto | null; rejected: number; visionNull: number }> {
  let rejected = 0;
  let visionNull = 0;
  for (const p of candidates.slice(0, MAX_VISION_CANDIDATES)) {
    const ok = await isProductPhoto(p.mediaUrl);
    if (ok === true) {
      return { photo: { id: p.id, mediaUrl: p.mediaUrl }, rejected, visionNull };
    }
    if (ok === false) {
      rejected += 1;
      continue;
    }
    visionNull += 1;
    if (opts.acceptOnVisionNull) {
      return { photo: { id: p.id, mediaUrl: p.mediaUrl }, rejected, visionNull };
    }
  }
  return { photo: null, rejected, visionNull };
}

/**
 * Escolhe no máximo UMA foto IN de produto, perto do pedido/problema.
 * Prioriza imagens já listadas em evidenciaMessageIds; não cai na "primeira da conversa".
 */
export async function selectRelevantClientPhoto(params: {
  messages: PhotoCandidate[];
  evidenciaMessageIds: string[];
  numeroPedido: string | null;
}): Promise<SelectedPhoto | null> {
  const result = await selectRelevantClientPhotoDetailed(params);
  return result.photo;
}

export async function selectRelevantClientPhotoDetailed(params: {
  messages: PhotoCandidate[];
  evidenciaMessageIds: string[];
  numeroPedido: string | null;
}): Promise<PhotoSelectionResult> {
  const photos = params.messages.filter(isClientPhoto);
  if (!photos.length) {
    return {
      photo: null,
      reason:
        'nenhuma mensagem IN image/sticker com mediaUrl na conversa carregada (download na captura pode ter falhado)',
    };
  }

  // 1) Preferir fotos já marcadas como evidência na classificação
  const fromEvidence = evidenceClientPhotos(params.messages, params.evidenciaMessageIds);
  if (fromEvidence.length > 0) {
    const picked = await pickFirstProductPhoto(fromEvidence, { acceptOnVisionNull: true });
    if (picked.photo) {
      return {
        photo: picked.photo,
        reason: `foto de evidenciaMessageIds (msg=${picked.photo.id}; rejeitadasVisao=${picked.rejected}; visaoNullAceita=${picked.visionNull > 0})`,
      };
    }
  }

  const anchors = complaintAnchorTimes(
    params.messages,
    params.evidenciaMessageIds,
    params.numeroPedido,
  );

  const ranked = photos
    .map((p) => ({ p, dist: minDistanceMs(p.timestamp.getTime(), anchors) }))
    .sort((a, b) => a.dist - b.dist);

  const near20 = ranked.filter((x) => Number.isFinite(x.dist) && x.dist <= PROXIMITY_MS);
  const near2h = ranked.filter(
    (x) => Number.isFinite(x.dist) && x.dist <= PROXIMITY_FALLBACK_MS,
  );

  const queueSource =
    near20.length > 0
      ? near20
      : near2h.length > 0
        ? near2h
        : ranked.slice(0, 3);

  const queue = queueSource.slice(0, MAX_VISION_CANDIDATES).map((x) => x.p);
  const picked = await pickFirstProductPhoto(queue, { acceptOnVisionNull: false });

  if (picked.photo) {
    return {
      photo: picked.photo,
      reason: `foto por proximidade (msg=${picked.photo.id}; janela=${near20.length > 0 ? '20min' : near2h.length > 0 ? '2h' : 'top3'}; rejeitadasVisao=${picked.rejected})`,
    };
  }

  // Último recurso: evidência classificada mesmo se visão rejeitou todas as próximas
  if (fromEvidence[0]) {
    return {
      photo: { id: fromEvidence[0].id, mediaUrl: fromEvidence[0].mediaUrl },
      reason: `fallback evidenciaMessageIds sem visão positiva (msg=${fromEvidence[0].id}; rejeitadasVisao=${picked.rejected})`,
    };
  }

  return {
    photo: null,
    reason: `candidatas=${photos.length}; evidenciaComFoto=${fromEvidence.length}; anchors=${anchors.length}; rejeitadasVisao=${picked.rejected}; visaoNull=${picked.visionNull} (heurística anti-Pix/print ou falha de visão)`,
  };
}

/**
 * Para origem=GRUPO_IFOOD: a foto anexada na evidência já é a prova.
 * Pega a primeira imagem entre evidenciaMessageIds (qualquer direction).
 */
export function selectIfoodGroupEvidencePhoto(params: {
  messages: PhotoCandidate[];
  evidenciaMessageIds: string[];
}): SelectedPhoto | null {
  return selectIfoodGroupEvidencePhotoDetailed(params).photo;
}

export function selectIfoodGroupEvidencePhotoDetailed(params: {
  messages: PhotoCandidate[];
  evidenciaMessageIds: string[];
}): PhotoSelectionResult {
  const evidence = new Set(params.evidenciaMessageIds);
  const photos = params.messages
    .filter((m) => evidence.has(m.id) && isAnyPhoto(m))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const first = photos[0];
  if (!first) {
    const evidenceCount = params.evidenciaMessageIds.length;
    const anyImage = params.messages.filter(isAnyPhoto).length;
    return {
      photo: null,
      reason: `iFood: nenhuma imagem com mediaUrl entre evidenciaMessageIds (ids=${evidenceCount}; imagensNaConversa=${anyImage})`,
    };
  }
  return {
    photo: { id: first.id, mediaUrl: first.mediaUrl },
    reason: `iFood: primeira mídia das evidências (msg=${first.id})`,
  };
}
