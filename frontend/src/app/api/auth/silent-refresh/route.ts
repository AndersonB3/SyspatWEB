/**
 * API Route: GET /api/auth/silent-refresh
 * Chamada pelo middleware quando o access_token está expirado mas
 * ainda há um refresh_token válido. Renova os tokens e redireciona
 * o usuário para a rota original.
 */
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8080/api';

export async function GET(request: NextRequest) {
  const redirect = request.nextUrl.searchParams.get('redirect') || '/';
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!backendRes.ok) {
      // Refresh falhou: limpar cookies e ir para login
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
      response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
      return response;
    }

    const data = await backendRes.json();
    const response = NextResponse.redirect(new URL(redirect, request.url));

    response.cookies.set('access_token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    if (data.refreshToken) {
      response.cookies.set('refresh_token', data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
    response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
    return response;
  }
}
