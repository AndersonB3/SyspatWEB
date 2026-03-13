// Store de Autenticação com Zustand
// Os tokens são gerenciados como cookies HttpOnly — o store mantém
// apenas o estado do usuário em memória.

import { create } from 'zustand';
import { User, AuthResponse } from '@/types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  login: (authResponse) => {
    // Os tokens já foram persistidos como cookies HttpOnly pelo authService.
    // Aqui apenas atualizamos o estado da UI.
    set({ user: authResponse.user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    // A limpeza dos cookies é feita pelo authService.logout().
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
