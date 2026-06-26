import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const RIDER_COOKIE = 'rider_token';

async function getRiderSession(request: NextRequest) {
  try {
    const token = request.cookies.get(RIDER_COOKIE)?.value;
    if (!token) return null;
    const secret = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as { riderId: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ── Proteção de /rh/usuarios — apenas usuários Stack Auth autenticados ─────
  // A verificação de role Admin é feita no server-side (API retorna 403 para membros RH)
  if (pathname.startsWith('/rh/usuarios')) {
    // Stack Auth usa cookies — verificação granular fica no server component/API
    // Aqui apenas garantimos que a rota existe no matcher
  }

  // ── Proteção do portal /rider ──────────────────────────────────────────────
  if (pathname.startsWith('/rider')) {
    const publicRiderPaths = ['/rider/login', '/rider/setup'];
    const isPublic = publicRiderPaths.some((p) => pathname.startsWith(p));

    if (!isPublic) {
      const session = await getRiderSession(request);
      if (!session) {
        return NextResponse.redirect(new URL('/rider/login', request.url));
      }
    }
  }

  // Limpar parâmetros de URL após autenticação OAuth
  if (pathname.startsWith('/handler')) {
    const code = searchParams.get('code');
    const afterAuthReturnTo = searchParams.get('after_auth_return_to');
    if (code || afterAuthReturnTo) {
      return NextResponse.next();
    }
  }

  // Limpar parâmetros do dashboard
  if (pathname.startsWith('/dashboard')) {
    const code = searchParams.get('code');
    if (code) {
      const url = request.nextUrl.clone();
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/handler/:path*',
    '/dashboard/:path*',
    '/rider/:path*',
    '/rh/usuarios/:path*',
  ],
};

