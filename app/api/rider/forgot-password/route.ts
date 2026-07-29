import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInviteToken } from '@/lib/rider-auth';
import { buildInviteLink } from '@/lib/rider-invite-email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://platefull.com.br';
const FROM = 'Platefull <noreply@platefull.com.br>';

/** Template dedicado para redefinição de senha — assunto e CTA distintos do convite inicial */
async function sendResetEmail(params: { to: string; riderName: string; link: string }) {
  const { to, riderName, link } = params;

  if (!process.env.RESEND_API_KEY) {
    console.warn('[forgot-password] RESEND_API_KEY não configurado — e-mail não enviado');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0a0a0a;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#f97316;">Platefull</p>
          <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">Portal do Motoboy</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 16px;font-size:16px;color:#111827;">Olá, <strong>${riderName}</strong>!</p>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            Recebemos um pedido para <strong>redefinir sua senha</strong> no Portal do Motoboy.
            Clique no botão abaixo para criar uma nova senha:
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
            <tr><td style="background:#f97316;border-radius:8px;">
              <a href="${link}" target="_blank"
                style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#000000;text-decoration:none;">
                Redefinir minha senha
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Ou copie e cole este link no seu navegador:</p>
          <p style="margin:0 0 24px;font-size:12px;color:#f97316;word-break:break-all;">${link}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">⏳ Este link expira em <strong>2 horas</strong>.</p>
          <p style="margin:0;font-size:13px;color:#9ca3af;">
            Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha continua a mesma.
          </p>
        </td></tr>
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Acesse sempre em: <a href="${APP_URL}/rider/login" style="color:#f97316;">${APP_URL}/rider/login</a>
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
      subject: '🔑 Redefinição de senha — Portal do Motoboy',
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend retornou ${response.status}: ${body}`);
  }
}

export const dynamic = 'force-dynamic';

const RESET_HOURS = 2; // link expira em 2 horas

/**
 * POST /api/rider/forgot-password
 *
 * Rota pública — o próprio motoboy solicita redefinição de senha.
 * Para evitar enumeração de e-mails, sempre retorna 200 (mesmo se não encontrar).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string };
    const email = (body.email ?? '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 });
    }

    // Busca case-insensitive: e-mail no banco pode ter capitalização diferente
    const rider = await prisma.deliveryRider.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, status: 'active' },
      include: { loja: { select: { nome: true } } },
    });

    // Sempre retorna ok para não revelar se o e-mail existe
    if (!rider) {
      console.info(`[forgot-password] e-mail "${email}" não encontrado (rider inativo ou inexistente)`);
      return NextResponse.json({ ok: true });
    }

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + RESET_HOURS * 60 * 60 * 1000);

    await prisma.deliveryRider.update({
      where: { id: rider.id },
      data: { inviteToken: token, inviteTokenExpiresAt: expiresAt },
    });

    const link = buildInviteLink(token);
    console.info(`[forgot-password] enviando reset para ${rider.email} (rider ${rider.id})`);

    // Await do envio para garantir que erros apareçam nos logs da Vercel
    try {
      await sendResetEmail({ to: rider.email, riderName: rider.name, link });
      console.info(`[forgot-password] e-mail enviado com sucesso para ${rider.email}`);
    } catch (mailErr) {
      console.error('[forgot-password] falha ao enviar e-mail:', mailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/rider/forgot-password]', err);
    // Retorna 200 mesmo em erro para não revelar informação
    return NextResponse.json({ ok: true });
  }
}
