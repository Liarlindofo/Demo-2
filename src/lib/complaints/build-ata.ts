import { prisma } from '@/lib/prisma';
import { generateComplaintAtaDocx } from '@/lib/complaints/generate-ata';
import {
  ataStoragePath,
  ensureAtasBucket,
  uploadAtaDocx,
} from '@/lib/complaints/ata-storage';

/**
 * Gera o .docx da ata, sobe no bucket privado e grava ataStoragePath no run.
 * Não falha o run de classificação se a ata der erro — retorna null + log.
 */
export async function buildAndSaveAta(params: {
  userId: string;
  reviewRunId: string;
}): Promise<{ ataStoragePath: string } | { error: string }> {
  const { userId, reviewRunId } = params;

  try {
    await ensureAtasBucket();
    const bytes = await generateComplaintAtaDocx(reviewRunId);
    const path = ataStoragePath(userId, reviewRunId);
    const uploaded = await uploadAtaDocx(path, bytes);
    if ('error' in uploaded) {
      console.error('[complaints/ata] upload falhou:', uploaded.error);
      return { error: uploaded.error };
    }

    await prisma.complaintReviewRun.update({
      where: { id: reviewRunId },
      data: { ataStoragePath: path },
    });

    return { ataStoragePath: path };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[complaints/ata] geração falhou:', message);
    return { error: message };
  }
}
