// Serviço de Autenticação

import { api } from './api';
import { AuthResponse, User, LoginRequest, ChangePasswordRequest } from '@/types/auth';

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
    // 1. Limpar cache do token (sem tocar no Zustand store!)
    // IMPORTANTE: não chamar useAuthStore.getState().logout() aqui —
    // isso causaria re-render do AuthProvider que mostraria <LoadingScreen />
    // antes do redirect acontecer, travando a tela.
    api.invalidateTokenCache();

    // 2. Limpar cookies e revogar tokens no backend (com timeout de 3s)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      await fetch('/api/auth/clear-tokens', {
        method: 'POST',
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch {
      // Falha ou timeout — continua com o redirect
    }

    // 3. Hard redirect — o reload do browser limpa o Zustand automaticamente
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
