/**
 * API Route: POST /api/auth/set-tokens
 * Recebe accessToken e refreshToken do cliente e os persiste
 * como cookies HttpOnly, impedindo acesso via JavaScript.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { accessToken, refreshToken } = await request.json();

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: 'Tokens obrigatórios' }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hora (igual ao JWT_EXPIRE_MINUTES)
  });

  response.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias (igual ao JWT_REFRESH_EXPIRE_DAYS)
  });

  return response;
}
