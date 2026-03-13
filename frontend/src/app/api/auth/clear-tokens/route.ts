/**
 * API Route: POST /api/auth/clear-tokens
 * Revoga o refresh token no backend e remove os cookies de autenticação (logout).
 */
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  // Revogar o refresh token no backend (melhor esforço — ignora falhas)
  if (refreshToken) {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Backend indisponível — continua o logout local normalmente
    }
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set('access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
