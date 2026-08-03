const FROM = 'Platefull <noreply@platefull.com.br>';

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://platefull.com.br';
}

export async function sendPaymentDocumentsEmail(params: {
  to: string;
  riderName: string;
  lojaNome: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  amountCents: number;
  riderId: string;
  nfUrl: string | null;
  boletoUrl: string | null;
}): Promise<void> {
  const { to, riderName, lojaNome, periodLabel, periodStart, periodEnd, amountCents, riderId, nfUrl, boletoUrl } = params;

  if (!process.env.RESEND_API_KEY) {
    console.warn('[rider-payment-email] RESEND_API_KEY não configurado — e-mail não enviado');
    return;
  }

  const reviewUrl = `${getAppUrl()}/rh/motoboys/${riderId}`;

  const formatBRL = (cents: number) =>
    (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Documentos de Pagamento Recebidos</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#0a0a0a;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:24px;font-weight:800;color:#f97316;letter-spacing:-0.5px;">Platefull</p>
            <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">Sistema de Gestão de Motoboys</p>
          </td>
        </tr>

        <!-- Ícone + título -->
        <tr>
          <td style="padding:40px 40px 0;text-align:center;">
            <div style="display:inline-block;background:#f97316;border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center;font-size:26px;">
              📄
            </div>
            <h1 style="margin:16px 0 4px;font-size:22px;font-weight:700;color:#111827;">
              Documentos Recebidos
            </h1>
            <p style="margin:0;font-size:14px;color:#6b7280;">
              Um motoboy enviou os documentos para pagamento
            </p>
          </td>
        </tr>

        <!-- Corpo -->
        <tr>
          <td style="padding:32px 40px;">

            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
              Olá! Os documentos de pagamento da quinzena abaixo foram enviados e estão
              aguardando sua <strong>revisão e aprovação</strong>.
            </p>

            <!-- Card de detalhes -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom:14px;border-bottom:1px solid #e5e7eb;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;">Motoboy</p>
                        <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#111827;">${riderName}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;">Loja</p>
                        <p style="margin:4px 0 0;font-size:15px;color:#374151;">${lojaNome}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;">Quinzena</p>
                        <p style="margin:4px 0 0;font-size:15px;color:#374151;">${periodLabel}</p>
                        <p style="margin:2px 0 0;font-size:13px;color:#9ca3af;">${formatDate(periodStart)} → ${formatDate(periodEnd)}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:14px 0 0;">
                        <p style="margin:0;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.6px;">Valor a Pagar</p>
                        <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#f97316;">${formatBRL(amountCents)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Documentos enviados -->
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">
              Documentos Enviados
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;border-collapse:separate;border-spacing:0;">
              <!-- NF -->
              <tr>
                <td style="padding:14px 16px;background:#ecfdf5;border:1px solid #d1fae5;border-radius:8px 8px 0 0;border-bottom:none;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0;font-size:14px;color:#065f46;">✅ &nbsp;<strong>Nota Fiscal (NF)</strong></p>
                      </td>
                      <td align="right">
                        ${nfUrl
                          ? `<a href="${nfUrl}" target="_blank"
                              style="display:inline-block;background:#059669;color:#ffffff;font-size:12px;font-weight:700;text-decoration:none;padding:6px 14px;border-radius:6px;">
                              ⬇ Baixar NF
                            </a>`
                          : `<span style="font-size:12px;color:#6b7280;">Link indisponível</span>`
                        }
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Boleto -->
              <tr>
                <td style="padding:14px 16px;background:#ecfdf5;border:1px solid #d1fae5;border-radius:0 0 8px 8px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0;font-size:14px;color:#065f46;">✅ &nbsp;<strong>Boleto</strong></p>
                      </td>
                      <td align="right">
                        ${boletoUrl
                          ? `<a href="${boletoUrl}" target="_blank"
                              style="display:inline-block;background:#059669;color:#ffffff;font-size:12px;font-weight:700;text-decoration:none;padding:6px 14px;border-radius:6px;">
                              ⬇ Baixar Boleto
                            </a>`
                          : `<span style="font-size:12px;color:#6b7280;">Link indisponível</span>`
                        }
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- Validade dos links -->
            <p style="margin:-20px 0 28px;font-size:11px;color:#9ca3af;text-align:right;">
              ⏳ Links válidos por 7 dias
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
              <tr>
                <td style="background:#f97316;border-radius:10px;">
                  <a href="${reviewUrl}" target="_blank"
                    style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:700;color:#000000;text-decoration:none;">
                    Revisar e Aprovar Documentos
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
              Ou acesse diretamente:<br>
              <a href="${reviewUrl}" style="color:#f97316;font-size:12px;word-break:break-all;">${reviewUrl}</a>
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Este e-mail foi enviado automaticamente pela plataforma Platefull.<br>
              Você está recebendo porque está configurado como responsável pelo pagamento de motoboys.
            </p>
          </td>
        </tr>

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
      subject: `📄 Documentos de pagamento recebidos — ${riderName} (${lojaNome})`,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend retornou ${response.status}: ${body}`);
  }
}
