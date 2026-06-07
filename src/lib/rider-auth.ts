import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export const RIDER_COOKIE = 'rider_token';
const SESSION_DURATION = 8 * 60 * 60; // 8 horas

export interface RiderSession {
  riderId: string;
  userId: string; // userId do RH que gerencia o rider
  email: string;
  name: string;
  lojaId: string;
}

function getSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('JWT secret não configurado');
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createRiderToken(session: RiderSession): string {
  return jwt.sign(session, getSecret(), { expiresIn: SESSION_DURATION });
}

export async function getRiderSession(): Promise<RiderSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(RIDER_COOKIE)?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, getSecret()) as RiderSession & { exp?: number };
    if (decoded.exp && decoded.exp < Date.now() / 1000) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function requireRiderSession(
  req: NextRequest
): Promise<RiderSession | NextResponse> {
  try {
    const token = req.cookies.get(RIDER_COOKIE)?.value;
    if (!token) return NextResponse.redirect(new URL('/rider/login', req.url));
    const decoded = jwt.verify(token, getSecret()) as RiderSession & { exp?: number };
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return NextResponse.redirect(new URL('/rider/login', req.url));
    }
    return decoded;
  } catch {
    return NextResponse.redirect(new URL('/rider/login', req.url));
  }
}

export function generateInviteToken(): string {
  return crypto.randomUUID();
}
