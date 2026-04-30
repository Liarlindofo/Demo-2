import crypto from 'crypto';
import { db } from '@/lib/db';

const ALGORITHM = 'aes-256-cbc';
const BUFFER_MS = 5 * 60 * 1000; // renova 5 min antes de expirar

function getDerivedKey(): Buffer {
  const secret = process.env.ADMIN_JWT_SECRET ?? process.env.ADMIN_SECRET ?? 'ifood-fallback-key-change-in-prod';
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getDerivedKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getDerivedKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function fetchNewToken(): Promise<{ token: string; expiresAt: Date }> {
  const clientId = process.env.IFOOD_CLIENT_ID;
  const clientSecret = process.env.IFOOD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('IFOOD_CLIENT_ID e IFOOD_CLIENT_SECRET não configurados');
  }

  const params = new URLSearchParams({
    grantType: 'client_credentials',
    clientId,
    clientSecret,
  });

  const res = await fetch(
    'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao autenticar com iFood: ${res.status} — ${body}`);
  }

  const data = (await res.json()) as {
    accessToken: string;
    expiresIn: number;
  };

  return {
    token: data.accessToken,
    expiresAt: new Date(Date.now() + data.expiresIn * 1000),
  };
}

/**
 * Retorna um access token iFood válido.
 * Reutiliza o token armazenado se ainda não estiver perto de expirar,
 * caso contrário renova automaticamente.
 */
export async function getValidIfoodToken(): Promise<string> {
  const minExpiry = new Date(Date.now() + BUFFER_MS);

  const stored = await db.ifoodToken.findFirst({
    where: { expiresAt: { gt: minExpiry } },
    orderBy: { createdAt: 'desc' },
  });

  if (stored) {
    return decrypt(stored.accessToken);
  }

  const { token, expiresAt } = await fetchNewToken();

  await db.ifoodToken.deleteMany({});
  await db.ifoodToken.create({
    data: {
      accessToken: encrypt(token),
      expiresAt,
    },
  });

  return token;
}
