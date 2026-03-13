// Serviço de Autenticação

import { api } from './api';
import { AuthResponse, User, LoginRequest, ChangePasswordRequest } from '@/types/auth';
import { useAuthStore } from '@/store/authStore';

/**
 * Persiste os tokens como cookies HttpOnly via API Route interna.
 * Após a chamada, invalida o cache do ApiClient para que o novo
 * token seja lido na próxima requisição.
 */
async function persistTokens(accessToken: string, refreshToken: string) {
  await fetch('/api/auth/set-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, refreshToken }),
  });
  api.invalidateTokenCache();
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    await persistTokens(response.accessToken, response.refreshToken);
    return response;
  },

  async me(): Promise<User> {
    return api.get<User>('/auth/me');
  },

  async changePassword(data: ChangePasswordRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/change-password', data);
    if (response.accessToken && response.refreshToken) {
      await persistTokens(response.accessToken, response.refreshToken);
    }
    return response;
  },

  async resetUsers(userIds: string[]): Promise<{ message: string }> {
    return api.post('/auth/reset-users', { user_ids: userIds });
  },

  async logout() {
    // 1. Limpar store imediatamente (antes de qualquer redirect)
    useAuthStore.getState().logout();
    // 2. Limpar cache do token
    api.invalidateTokenCache();
    // 3. Revogar tokens no backend e limpar cookies
    await fetch('/api/auth/clear-tokens', { method: 'POST' });
    // 4. Hard redirect para garantir reset completo do estado React
    window.location.href = '/login';
  },

  /** @deprecated Tokens agora são cookies HttpOnly — não use localStorage diretamente. */
  getToken(): string | null {
    return null;
  },

  isAuthenticated(): boolean {
    return false;
  },
};
