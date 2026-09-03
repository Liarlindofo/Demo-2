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
import { formatClientHeading, pickClientContactName } from '@/lib/complaints/contact';
import {
  buildTranscript,
  writeAtaNarrative,
  type ConversationMessage,
} from '@/lib/complaints/classify';
import {
  selectIfoodGroupEvidencePhotoDetailed,
  selectRelevantClientPhotoDetailed,
} from '@/lib/complaints/photo';

const MAX_IMAGE_WIDTH = 480;
const MAX_IMAGE_HEIGHT = 360;

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

type DownloadImageResult =
  | { ok: true; data: Buffer; type: 'jpg' | 'png' | 'gif' | 'bmp'; bytes: number }
  | { ok: false; error: string };

async function downloadEvidenceImage(mediaUrl: string): Promise<DownloadImageResult> {
  const path = whatsappEvidenceStoragePath(mediaUrl);
  if (!path) {
    return { ok: false, error: `path inválido a partir de mediaUrl=${mediaUrl.slice(0, 80)}` };
  }
  const supabase = getWhatsAppEvidenceSupabase();
  if (!supabase) {
    return { ok: false, error: 'Supabase não configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)' };
  }

  const { data, error } = await supabase.storage
    .from(WHATSAPP_EVIDENCIAS_BUCKET)
    .download(path);
  if (error || !data) {
    return {
      ok: false,
      error: `download bucket falhou path=${path}: ${error?.message || 'sem data'}`,
    };
  }

  const ab = await data.arrayBuffer();
  const buf = Buffer.from(ab);
  if (buf.length < 32) {
    return { ok: false, error: `arquivo muito pequeno (${buf.length} bytes) path=${path}` };
  }
  return { ok: true, data: buf, type: imageTypeFromPath(path), bytes: buf.length };
}

type EmbedPhotoResult =
  | { ok: true; paragraph: Paragraph; bytes: number }
  | { ok: false; error: string };

async function embedSinglePhoto(mediaUrl: string): Promise<EmbedPhotoResult> {
  try {
    const img = await downloadEvidenceImage(mediaUrl);
    if (img.ok === false) return { ok: false, error: img.error };
    const natural = readImageSize(img.data) ?? { width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_HEIGHT };
    const size = fitSize(natural.width, natural.height);
    const paragraph = new Paragraph({
      children: [
        new ImageRun({
          type: img.type,
          data: img.data,
          transformation: size,
          altText: {
            title: 'Foto',
            description: 'Foto enviada pelo cliente',
            name: 'foto-reclamacao',
          },
        }),
      ],
      spacing: { before: 80, after: 160 },
    });
    return { ok: true, paragraph, bytes: img.bytes };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `exceção ao embutir ImageRun: ${message}` };
  }
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
 * Monta o .docx da ata para um ComplaintReviewRun (mês em andamento ou concluído).
 */
export async function generateComplaintAtaDocx(reviewRunId: string): Promise<Buffer> {
  const run = await prisma.complaintReviewRun.findUnique({
    where: { id: reviewRunId },
    include: {
      user: { select: { name: true, fullName: true, email: true } },
      complaints: {
        where: { confirmadoPorHumano: true },
        orderBy: { dataOcorrencia: 'asc' },
      },
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
    children.push(
      muted(
        'Nenhuma reclamação confirmada para inclusão nesta ata. Revise as reclamações detectadas e marque "Incluir na ata" antes de gerar.',
      ),
    );
  } else {
    children.push(
      muted(
        `Total: ${run.complaints.length} reclamação(ões) · ${run.totalConversas ?? '—'} conversa(s) analisada(s).`,
      ),
    );

    const contactIds = [...new Set(run.complaints.map((c) => c.contactId))];
    const evidenceIds = [
      ...new Set(run.complaints.flatMap((c) => c.evidenciaMessageIds || [])),
    ];

    const messageSelect = {
      id: true,
      contactId: true,
      contactName: true,
      direction: true,
      messageType: true,
      textContent: true,
      sentByAgent: true,
      mediaUrl: true,
      timestamp: true,
    } as const;

    const periodMessages =
      contactIds.length > 0
        ? await prisma.whatsAppMessage.findMany({
            where: {
              userId: run.userId,
              contactId: { in: contactIds },
              timestamp: { gte: run.periodStart, lte: run.periodEnd },
            },
            select: messageSelect,
            orderBy: { timestamp: 'asc' },
          })
        : [];

    // Evidências podem cair fora da janela do período (fuso / borda do mês).
    const missingEvidenceIds = evidenceIds.filter(
      (id) => !periodMessages.some((m) => m.id === id),
    );
    const extraEvidenceMessages =
      missingEvidenceIds.length > 0
        ? await prisma.whatsAppMessage.findMany({
            where: { userId: run.userId, id: { in: missingEvidenceIds } },
            select: messageSelect,
            orderBy: { timestamp: 'asc' },
          })
        : [];

    type MsgRow = (typeof periodMessages)[number];
    const byContact = new Map<string, MsgRow[]>();
    const clientNameByContact = new Map<string, string>();
    const mergeIntoContact = (row: MsgRow) => {
      const list = byContact.get(row.contactId) ?? [];
      if (!list.some((m) => m.id === row.id)) list.push(row);
      byContact.set(row.contactId, list);
      if (!clientNameByContact.has(row.contactId)) {
        const name = pickClientContactName([
          { direction: row.direction, contactName: row.contactName },
        ]);
        if (name) clientNameByContact.set(row.contactId, name);
      }
    };
    for (const row of periodMessages) mergeIntoContact(row);
    for (const row of extraEvidenceMessages) mergeIntoContact(row);
    for (const list of byContact.values()) {
      list.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    let idx = 0;
    let withPhoto = 0;
    let withoutPhoto = 0;
    for (const c of run.complaints) {
      idx += 1;
      const convRows = byContact.get(c.contactId) ?? [];
      const convMessages: ConversationMessage[] = convRows.map((m) => ({
        id: m.id,
        direction: m.direction,
        messageType: m.messageType,
        textContent: m.textContent,
        sentByAgent: m.sentByAgent,
        timestamp: m.timestamp,
      }));

      const narrative =
        c.origem === 'GRUPO_IFOOD'
          ? { resumo: c.resumo, numeroPedido: c.numeroPedido }
          : await writeAtaNarrative({
              transcript: buildTranscript(convMessages),
              fallbackResumo: c.resumo,
              messages: convMessages,
              fallbackNumeroPedido: c.numeroPedido,
            });

      const selection =
        c.origem === 'GRUPO_IFOOD'
          ? selectIfoodGroupEvidencePhotoDetailed({
              messages: convRows,
              evidenciaMessageIds: c.evidenciaMessageIds,
            })
          : await selectRelevantClientPhotoDetailed({
              messages: convRows,
              evidenciaMessageIds: c.evidenciaMessageIds,
              numeroPedido: narrative.numeroPedido,
            });

      const selectedPhoto = selection.photo;
      const evidenceIdsCount = c.evidenciaMessageIds?.length ?? 0;
      console.info(
        `[generate-ata] reclamacao=${c.id} idx=${idx} origem=${c.origem} ` +
          `evidenciaMessageIds=${evidenceIdsCount} ` +
          `fotoEscolhida=${selectedPhoto?.id ?? 'null'} motivo=${selection.reason}`,
      );

      if (
        c.origem !== 'GRUPO_IFOOD' &&
        (narrative.resumo !== c.resumo || narrative.numeroPedido !== c.numeroPedido)
      ) {
        await prisma.complaint.update({
          where: { id: c.id },
          data: {
            resumo: narrative.resumo,
            numeroPedido: narrative.numeroPedido,
          },
        });
      }

      const cliente =
        c.origem === 'GRUPO_IFOOD'
          ? `iFood — ${c.lojaGrupo || c.contactName || 'loja'}`
          : formatClientHeading(
              clientNameByContact.get(c.contactId) ?? c.contactName,
              c.contactId,
            );
      children.push(divider());
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx}. ${cliente}`, bold: true, size: 24 }),
          ],
          spacing: { after: 60 },
        }),
      );
      if (narrative.numeroPedido) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Pedido ${narrative.numeroPedido}`, size: 22, bold: true }),
            ],
            spacing: { after: 80 },
          }),
        );
      }

      if (selectedPhoto?.mediaUrl) {
        const embedded = await embedSinglePhoto(selectedPhoto.mediaUrl);
        if (embedded.ok === true) {
          children.push(embedded.paragraph);
          withPhoto += 1;
          console.info(
            `[generate-ata] reclamacao=${c.id} foto embutida ok msg=${selectedPhoto.id} bytes=${embedded.bytes}`,
          );
        } else {
          withoutPhoto += 1;
          console.error(
            `[generate-ata] reclamacao=${c.id} SEM FOTO no Word — evidência msg=${selectedPhoto.id} ` +
              `mediaUrl=${selectedPhoto.mediaUrl} falhou: ${embedded.error}`,
          );
        }
      } else {
        withoutPhoto += 1;
        console.warn(
          `[generate-ata] reclamacao=${c.id} SEM FOTO no Word — nenhuma candidata. ${selection.reason}`,
        );
      }

      children.push(body(narrative.resumo));
    }

    console.info(
      `[generate-ata] run=${reviewRunId} resumo fotos: com=${withPhoto} sem=${withoutPhoto} total=${run.complaints.length}`,
    );
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
