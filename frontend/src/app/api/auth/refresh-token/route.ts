/**
 * API Route: POST /api/auth/refresh-token
 * Realiza o refresh usando o refresh_token do cookie HttpOnly
 * e persiste os novos tokens como cookies.
 */
import { NextRequest, NextResponse } from 'next/server';

// BACKEND_API_URL é privada (sem NEXT_PUBLIC_) — nunca exposta no bundle do cliente
const BACKEND_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8080/api';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'Refresh token ausente' }, { status: 401 });
  }

  const backendRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!backendRes.ok) {
    const error = await backendRes.json().catch(() => ({}));
    return NextResponse.json(error, { status: backendRes.status });
  }

  const data = await backendRes.json();
  const response = NextResponse.json(data);

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
}
