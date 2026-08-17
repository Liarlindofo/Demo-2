import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const STATUS_ABERTOS = ['ENVIADA', 'AGUARDANDO_EVIDENCIA'] as const;

type EvidenciasTemplate = {
  exigeFoto: boolean;
  exigeConfirmacaoTexto: boolean;
  exigeLocalizacao: boolean;
  exigeArquivo: boolean;
};

export function evidenciasExigidasFromTemplate(t: EvidenciasTemplate): string[] {
  const out: string[] = [];
  if (t.exigeFoto) out.push('FOTO');
  if (t.exigeConfirmacaoTexto) out.push('CONFIRMACAO_TEXTO');
  if (t.exigeLocalizacao) out.push('LOCALIZACAO');
  if (t.exigeArquivo) out.push('ARQUIVO');
  return out;
}

/** Atualiza sessões WhatsApp em aberto para refletir o template editado. */
export async function syncSessoesAbertasDoTemplate(
  templateId: string,
  template: EvidenciasTemplate & {
    descricao: string;
    validacaoIA: Prisma.JsonValue | null;
  },
) {
  const atribuicoes = await prisma.tarefaAtribuida.findMany({
    where: { templateId, status: { in: [...STATUS_ABERTOS] } },
    select: { id: true },
  });
  if (atribuicoes.length === 0) return;

  await prisma.sessaoTarefa.updateMany({
    where: {
      tarefaId: { in: atribuicoes.map((a) => a.id) },
      estado: 'AGUARDANDO',
    },
    data: {
      descricaoTarefa: template.descricao,
      validacaoIA: template.validacaoIA === null ? Prisma.JsonNull : template.validacaoIA,
      evidenciasExigidas: evidenciasExigidasFromTemplate(template),
    },
  });
}

/**
 * Remove atribuições do template (pendentes e histórico), expira sessões
 * WhatsApp e apaga o template. Itens de grupo caem por cascade.
 */
export async function excluirTemplateEAtribuicoes(templateId: string, userId: string) {
  const atribuicoes = await prisma.tarefaAtribuida.findMany({
    where: { templateId, userId },
    select: { id: true },
  });
  const ids = atribuicoes.map((a) => a.id);

  await prisma.$transaction(async (tx) => {
    if (ids.length > 0) {
      await tx.sessaoTarefa.updateMany({
        where: { tarefaId: { in: ids }, estado: 'AGUARDANDO' },
        data: { estado: 'EXPIRADA' },
      });
      await tx.tarefaAtribuida.deleteMany({ where: { id: { in: ids } } });
    }
    await tx.tarefaTemplate.delete({ where: { id: templateId } });
  });
}
