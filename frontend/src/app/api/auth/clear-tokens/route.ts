/**
 * API Route: POST /api/auth/clear-tokens
 * Remove os cookies de autenticação (logout).
 */
import { NextResponse } from 'next/server';

export async function POST() {
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
