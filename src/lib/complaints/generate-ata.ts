/**
 * Gera a ata de reunião (.docx) a partir de ComplaintReviewRun + Comparison.
 * Imagens de evidência são baixadas do bucket privado e embutidas no Word.
 */

import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
} from 'docx';
import { prisma } from '@/lib/prisma';
import {
  getWhatsAppEvidenceSupabase,
  whatsappEvidenceStoragePath,
  WHATSAPP_EVIDENCIAS_BUCKET,
} from '@/lib/whatsapp-evidence-storage';
import { saoPauloYmd } from '@/lib/complaints/period';

const MAX_IMAGE_WIDTH = 480;
const MAX_IMAGE_HEIGHT = 360;
const MAX_IMAGES_PER_COMPLAINT = 6;

type ThemeItem = {
  tema?: unknown;
  detalhe?: unknown;
  contactIds?: unknown;
  contactIdsAtual?: unknown;
  contactIdsAnterior?: unknown;
};

function asThemeList(value: unknown): ThemeItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is ThemeItem => !!x && typeof x === 'object');
}

function str(v: unknown, fallback = '—'): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

function monthYearLabel(d: Date): string {
  const { year, month } = saoPauloYmd(d);
  const name = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  }).format(d);
  const capped = name.charAt(0).toUpperCase() + name.slice(1);
  return `${capped}/${year}`;
}

function formatDatePt(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(d);
}

function heading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
  });
}

function subheading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
  });
}

function body(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 120 },
  });
}

function muted(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, italics: true, color: '666666' })],
    spacing: { after: 80 },
  });
}

function bullet(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

function divider() {
  return new Paragraph({
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC', space: 8 },
    },
    spacing: { before: 80, after: 160 },
  });
}

/** Lê dimensões JPEG/PNG a partir dos primeiros bytes (sem dependência extra). */
function readImageSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24) return null;
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width > 0 && height > 0) return { width, height };
  }
  // JPEG SOF
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        const height = buf.readUInt16BE(i + 5);
        const width = buf.readUInt16BE(i + 7);
        if (width > 0 && height > 0) return { width, height };
        break;
      }
      const len = buf.readUInt16BE(i + 2);
      i += 2 + len;
    }
  }
  return null;
}

function fitSize(width: number, height: number): { width: number; height: number } {
  const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function imageTypeFromPath(path: string): 'jpg' | 'png' | 'gif' | 'bmp' {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.gif')) return 'gif';
  if (lower.endsWith('.bmp')) return 'bmp';
  return 'jpg';
}

async function downloadEvidenceImage(
  mediaUrl: string,
): Promise<{ data: Buffer; type: 'jpg' | 'png' | 'gif' | 'bmp' } | null> {
  const path = whatsappEvidenceStoragePath(mediaUrl);
  if (!path) return null;
  const supabase = getWhatsAppEvidenceSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(WHATSAPP_EVIDENCIAS_BUCKET)
    .download(path);
  if (error || !data) return null;

  const ab = await data.arrayBuffer();
  const buf = Buffer.from(ab);
  if (buf.length < 32) return null;
  return { data: buf, type: imageTypeFromPath(path) };
}

async function evidenceParagraphs(messageIds: string[], userId: string): Promise<Paragraph[]> {
  if (!messageIds.length) return [muted('Sem evidências anexadas.')];

  const messages = await prisma.whatsAppMessage.findMany({
    where: {
      id: { in: messageIds },
      userId,
      messageType: { in: ['image', 'sticker'] },
      mediaUrl: { not: null },
    },
    select: { id: true, mediaUrl: true, messageType: true },
  });

  const byId = new Map(messages.map((m) => [m.id, m]));
  const ordered = messageIds.map((id) => byId.get(id)).filter(Boolean).slice(0, MAX_IMAGES_PER_COMPLAINT);

  if (ordered.length === 0) {
    // Mostra trechos de texto das evidências se não houver imagem
    const texts = await prisma.whatsAppMessage.findMany({
      where: { id: { in: messageIds }, userId },
      select: { textContent: true, messageType: true, direction: true },
      take: 5,
    });
    const lines = texts
      .map((t) => {
        const raw = (t.textContent || '').trim();
        if (!raw || raw.length > 300 || raw.startsWith('/9j/') || raw.startsWith('data:')) {
          return t.messageType !== 'text' ? `[${t.messageType}]` : null;
        }
        return `"${raw}"`;
      })
      .filter(Boolean);
    if (!lines.length) return [muted('Evidências sem mídia visual disponível.')];
    return lines.map((l) => muted(`• ${l}`));
  }

  const out: Paragraph[] = [muted('Evidências (imagens):')];
  for (const msg of ordered) {
    if (!msg?.mediaUrl) continue;
    try {
      const img = await downloadEvidenceImage(msg.mediaUrl);
      if (!img) {
        out.push(muted('(imagem indisponível no storage)'));
        continue;
      }
      const natural = readImageSize(img.data) ?? { width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_HEIGHT };
      const size = fitSize(natural.width, natural.height);
      out.push(
        new Paragraph({
          children: [
            new ImageRun({
              type: img.type,
              data: img.data,
              transformation: size,
              altText: {
                title: 'Evidência',
                description: 'Foto anexada pelo cliente como evidência da reclamação',
                name: msg.id,
              },
            }),
          ],
          spacing: { before: 80, after: 160 },
        }),
      );
    } catch (err) {
      console.warn('[generate-ata] falha ao embutir imagem:', err);
      out.push(muted('(falha ao embutir imagem)'));
    }
  }
  return out;
}

function comparisonSection(
  title: string,
  items: ThemeItem[],
  emptyLabel: string,
): Paragraph[] {
  const paras: Paragraph[] = [subheading(title)];
  if (!items.length) {
    paras.push(muted(emptyLabel));
    return paras;
  }
  for (const item of items) {
    const tema = str(item.tema, 'Tema');
    const detalhe = str(item.detalhe, '');
    paras.push(
      new Paragraph({
        children: [
          new TextRun({ text: tema, bold: true, size: 22 }),
          ...(detalhe && detalhe !== tema
            ? [new TextRun({ text: ` — ${detalhe}`, size: 22 })]
            : []),
        ],
        spacing: { after: 80 },
      }),
    );
  }
  return paras;
}

/**
 * Monta o .docx da ata para um ComplaintReviewRun já CONCLUIDO.
 */
export async function generateComplaintAtaDocx(reviewRunId: string): Promise<Buffer> {
  const run = await prisma.complaintReviewRun.findUnique({
    where: { id: reviewRunId },
    include: {
      user: { select: { name: true, fullName: true, email: true } },
      complaints: { orderBy: { dataOcorrencia: 'asc' } },
      comparison: true,
    },
  });

  if (!run) throw new Error('Review run não encontrado.');

  const empresa =
    run.user.name?.trim() ||
    run.user.fullName?.trim() ||
    run.user.email?.trim() ||
    'Empresa';
  const periodo = monthYearLabel(run.periodStart);
  const geradoEm = formatDatePt(new Date());

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'ATA DE REUNIÃO — RECLAMAÇÕES', bold: true, size: 32 }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: empresa, size: 26, bold: true })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Período: ${periodo}  ·  Gerado em: ${geradoEm}`,
          size: 20,
          color: '555555',
        }),
      ],
      spacing: { after: 200 },
    }),
    divider(),
    heading('1. Resumo'),
    body(
      run.comparison?.resumoTexto?.trim() ||
        'Comparação com o mês anterior ainda não disponível.',
    ),
    heading('2. Reclamações do mês'),
  ];

  if (run.complaints.length === 0) {
    children.push(muted('Nenhuma reclamação registrada neste período.'));
  } else {
    children.push(
      muted(
        `Total: ${run.complaints.length} reclamação(ões) · ${run.totalConversas ?? '—'} conversa(s) analisada(s).`,
      ),
    );

    let idx = 0;
    for (const c of run.complaints) {
      idx += 1;
      const cliente = c.contactName?.trim() || c.contactId;
      children.push(divider());
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx}. ${cliente}`, bold: true, size: 24 }),
          ],
          spacing: { after: 60 },
        }),
      );
      children.push(muted(`Data aproximada: ${formatDatePt(c.dataOcorrencia)}`));
      children.push(body(c.resumo));
      const imgs = await evidenceParagraphs(c.evidenciaMessageIds, run.userId);
      children.push(...imgs);
    }
  }

  children.push(heading('3. Comparação com o mês anterior'));

  if (!run.comparison) {
    children.push(muted('Sem dados de comparação para este run.'));
  } else if (!run.comparison.previousRunId) {
    children.push(
      body(
        run.comparison.resumoTexto ||
          'Primeiro mês com dados coletados, sem histórico anterior para comparação.',
      ),
    );
  } else {
    children.push(
      ...comparisonSection(
        '3.1 Recorrentes',
        asThemeList(run.comparison.recorrentes),
        'Nenhuma reclamação recorrente identificada.',
      ),
      ...comparisonSection(
        '3.2 Novos',
        asThemeList(run.comparison.novos),
        'Nenhuma reclamação nova identificada.',
      ),
      ...comparisonSection(
        '3.3 Resolvidos',
        asThemeList(run.comparison.resolvidos),
        'Nenhum tema resolvido em relação ao mês anterior.',
      ),
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
