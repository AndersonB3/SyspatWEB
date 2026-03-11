/**
 * Middleware Next.js — Proteção de rotas no servidor.
 * Verifica a presença E a validade do cookie access_token antes de servir
 * qualquer rota protegida, sem expor o token ao JavaScript da página.
 */
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/set-tokens',
  '/api/auth/clear-tokens',
  '/api/auth/refresh-token',
  '/api/auth/silent-refresh',
  '/api/auth/token',
];

/** Verifica se o JWT (sem validar assinatura — feito no backend) está expirado. */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    if (!payload.exp) return true;
    // Considera expirado se faltar menos de 10 segundos (margem de clock skew)
    return Date.now() / 1000 >= payload.exp - 10;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rotas públicas, arquivos estáticos e internos do Next.js
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  // Sem token de acesso
  if (!token || isTokenExpired(token)) {
    // Se tiver refresh token válido, redirecionar para uma rota que fará o refresh
    if (refreshToken && !isTokenExpired(refreshToken)) {
      const refreshUrl = new URL('/api/auth/silent-refresh', request.url);
      refreshUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(refreshUrl);
    }
    // Sem tokens válidos: vai para login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
