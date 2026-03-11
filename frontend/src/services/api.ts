// Cliente HTTP para comunicação com o backend Python

import { API_CONFIG } from '@/config/constants';

class ApiClient {
  private baseURL: string;
  /** Cache em memória do access token para evitar uma fetch a cada requisição. */
  private cachedToken: string | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  /**
   * Obtém o access token do cookie HttpOnly via API Route interna.
   * O resultado é cacheado em memória até ser invalidado.
   */
  private async getToken(): Promise<string | null> {
    if (this.cachedToken) return this.cachedToken;
    if (typeof window === 'undefined') return null;
    try {
      const res = await fetch('/api/auth/token');
      if (!res.ok) return null;
      const data = await res.json();
      this.cachedToken = data.token ?? null;
      return this.cachedToken;
    } catch {
      return null;
    }
  }

  /** Invalida o cache do token (após login, logout ou refresh). */
  invalidateTokenCache() {
    this.cachedToken = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Tentar refresh token via API Route (cookie HttpOnly)
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.cachedToken}`;
        const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({}));
          throw new Error(error.detail || 'Erro na requisição');
        }
        return retryResponse.json();
      }
      // Se falhou o refresh, limpar cookies e redirecionar para login
      if (typeof window !== 'undefined') {
        await fetch('/api/auth/clear-tokens', { method: 'POST' });
        this.invalidateTokenCache();
        window.location.href = '/login';
      }
      throw new Error('Sessão expirada');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Erro ${response.status}`);
    }

    // Para respostas sem conteúdo (204)
    if (response.status === 204) return {} as T;

    return response.json();
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      // A API Route interna lê o refresh_token do cookie e faz o refresh
      const response = await fetch('/api/auth/refresh-token', { method: 'POST' });
      if (!response.ok) return false;
      // Invalida cache para que o novo token seja buscado na próxima requisição
      this.invalidateTokenCache();
      return true;
    } catch {
      return false;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
