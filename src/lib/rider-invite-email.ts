const FROM = 'Platefull <noreply@send.platefull.com.br>';

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://platefull.com.br';
}

export function buildInviteLink(token: string): string {
  return `${getAppUrl()}/rider/setup?token=${token}`;
}

export function buildWhatsAppLink(phone: string | null | undefined, inviteLink: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  const number = digits.startsWith('55') ? digits : `55${digits}`;
  const msg = encodeURIComponent(
    `Olá! Você foi cadastrado(a) como motoboy na plataforma Drin.\n\nClique no link abaixo para criar sua senha e acessar o portal:\n${inviteLink}\n\nO link é válido por 30 dias.`
  );
  return `https://wa.me/${number}?text=${msg}`;
}

export async function sendInviteEmail(params: {
  to: string;
  riderName: string;
  lojaNome: string;
  inviteLink: string;
}): Promise<void> {
  const { to, riderName, lojaNome, inviteLink } = params;

  if (!process.env.RESEND_API_KEY) {
    console.warn('[rider-invite-email] RESEND_API_KEY não configurado — e-mail não enviado');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:#0a0a0a;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#f97316;">Platefull</p>
          <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">Portal do Motoboy</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;">Olá, <strong>${riderName}</strong>!</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Você foi cadastrado(a) como motoboy na loja <strong>${lojaNome}</strong>.
            Para acessar o portal e visualizar suas quinzenas e documentos, você precisa criar sua senha.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;">Clique no botão abaixo para criar sua senha:</p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
            <tr><td style="background:#f97316;border-radius:8px;">
              <a href="${inviteLink}" target="_blank"
                style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#000000;text-decoration:none;">
                Criar minha senha
              </a>
            </td></tr>
          </table>

          <!-- Link alternativo -->
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Ou copie e cole este link no seu navegador:</p>
          <p style="margin:0 0 24px;font-size:12px;color:#f97316;word-break:break-all;">${inviteLink}</p>

          <p style="margin:0;font-size:13px;color:#9ca3af;">
            ⏳ Este link é válido por <strong>30 dias</strong>. Após acessar, você poderá entrar sempre em:
            <br><a href="${getAppUrl()}/rider/login" style="color:#f97316;">${getAppUrl()}/rider/login</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Se você não esperava este e-mail, pode ignorá-lo com segurança.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: `Bem-vindo(a) ao portal do motoboy — ${lojaNome}`,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend retornou ${response.status}: ${body}`);
  }
}
