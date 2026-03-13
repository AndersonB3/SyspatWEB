'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import LoadingScreen from './LoadingScreen';

const publicRoutes = ['/login', '/change-password'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const checkingRef = useRef(false);

  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));

  const checkAuth = useCallback(async () => {
    // Evitar chamadas paralelas
    if (checkingRef.current) return;
    checkingRef.current = true;

    try {
      if (isPublic) {
        // Rota pública: verificar se já existe sessão válida para redirecionar
        try {
          const tokenRes = await fetch('/api/auth/token');
          const { token } = await tokenRes.json();
          if (!token) {
            setUser(null);
            return;
          }
          const userData = await authService.me();
          setUser(userData);
          if (userData.mustChangePassword) {
            router.replace('/change-password');
          } else {
            router.replace('/modules');
          }
        } catch {
          setUser(null);
        }
        return;
      }

      // Rota protegida: se o store já tem dados, confiar nele
      if (isAuthenticated && user) {
        if (user.mustChangePassword && !pathname.startsWith('/change-password')) {
          router.replace('/change-password');
        }
        return;
      }

      // Store vazio — verificar cookie no servidor
      try {
        const userData = await authService.me();
        setUser(userData);
        if (userData.mustChangePassword && !pathname.startsWith('/change-password')) {
          router.replace('/change-password');
        }
      } catch {
        setUser(null);
        router.replace('/login');
      }
    } finally {
      checkingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Rotas públicas: sempre renderizar children (página de login cuida de si mesma)
  if (isPublic) {
    return <>{children}</>;
  }

  // Rotas protegidas: mostrar loading apenas se o store ainda não tem usuário
  if (!isAuthenticated || !user) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

