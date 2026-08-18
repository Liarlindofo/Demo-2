/**
 * Escolha da foto de prova da reclamação: proximidade na conversa + visão.
 */

import { callComplaintsOpenRouter, extractJsonObject } from '@/lib/complaints/openrouter';
import {
  getWhatsAppEvidenceSupabase,
  whatsappEvidenceStoragePath,
  WHATSAPP_EVIDENCIAS_BUCKET,
} from '@/lib/whatsapp-evidence-storage';

const PROXIMITY_MS = 20 * 60 * 1000;
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

function isClientPhoto(m: PhotoCandidate): m is PhotoCandidate & { mediaUrl: string } {
  return (
    m.direction === 'IN' &&
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
 * Escolhe no máximo UMA foto IN de produto, perto do pedido/problema.
 * Nunca cai no "primeira imagem da conversa" (evita comprovante de Pix).
 */
export async function selectRelevantClientPhoto(params: {
  messages: PhotoCandidate[];
  evidenciaMessageIds: string[];
  numeroPedido: string | null;
}): Promise<SelectedPhoto | null> {
  const photos = params.messages.filter(isClientPhoto);
  if (!photos.length) return null;

  const anchors = complaintAnchorTimes(
    params.messages,
    params.evidenciaMessageIds,
    params.numeroPedido,
  );

  const ranked = photos
    .map((p) => ({ p, dist: minDistanceMs(p.timestamp.getTime(), anchors) }))
    .sort((a, b) => a.dist - b.dist);

  const near = ranked.filter((x) => Number.isFinite(x.dist) && x.dist <= PROXIMITY_MS);
  const queue = (near.length > 0 ? near : ranked.slice(0, 3)).slice(0, MAX_VISION_CANDIDATES);

  for (const { p } of queue) {
    const ok = await isProductPhoto(p.mediaUrl);
    if (ok === true) {
      return { id: p.id, mediaUrl: p.mediaUrl };
    }
  }

  return null;
}
