/**
 * Identidade do cliente em reclamações: sempre a partir de mensagens IN.
 */

export function pickClientContactName(
  rows: Array<{ direction: string; contactName: string | null }>,
): string | null {
  for (const row of rows) {
    if (row.direction !== 'IN') continue;
    const name = row.contactName?.trim();
    if (name) return name;
  }
  return null;
}

/** Formata contactId (dígitos) como telefone BR quando possível. */
export function formatContactPhone(contactId: string): string {
  const raw = String(contactId || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw || '—';

  if (digits.length === 13 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    return `+55 ${ddd} ${rest.slice(0, 5)}-${rest.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    return `+55 ${ddd} ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  if (digits.length === 11) {
    return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+55 ${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.startsWith('55') && digits.length >= 12) {
    return `+${digits}`;
  }
  return raw;
}

/** "Gisele — +55 41 99999-9999" (sempre inclui o número). */
export function formatClientHeading(
  contactName: string | null | undefined,
  contactId: string,
): string {
  const phone = formatContactPhone(contactId);
  const name = contactName?.trim();
  if (name && name !== phone && name !== contactId) {
    return `${name} — ${phone}`;
  }
  return phone;
}

export function messageSnippet(text: string | null, messageType: string): string {
  const raw = text?.trim() || '';
  if (raw.length > 0 && raw.length <= 400 && !raw.startsWith('/9j/') && !raw.startsWith('data:')) {
    return raw;
  }
  if (messageType !== 'text') return `[${messageType}]`;
  if (raw.length > 400) return `${raw.slice(0, 400)}…`;
  return raw || '[sem texto]';
}

export function speakerFromMessage(
  direction: string,
  sentByAgent: boolean,
): 'CLIENTE' | 'ATENDENTE' | 'IA' {
  if (direction === 'IN') return 'CLIENTE';
  if (sentByAgent) return 'ATENDENTE';
  return 'IA';
}
