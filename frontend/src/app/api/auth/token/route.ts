/**
 * API Route: GET /api/auth/token
 * Lê o access_token do cookie HttpOnly e o repassa ao cliente
 * para ser usado no header Authorization.
 * O cookie em si permanece inacessível ao JavaScript externo.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value ?? null;
  return NextResponse.json({ token });
}
