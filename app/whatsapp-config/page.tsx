import { redirect } from 'next/navigation';

/** Legado: mock de agendamento. A Central de Relatórios vive em /relatorios. */
export default function WhatsAppConfigRedirect() {
  redirect('/relatorios');
}
